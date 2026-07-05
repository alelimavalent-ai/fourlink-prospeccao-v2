// ============================================================
// Fourlink Prospector — Módulo 2
// Importador dos Dados Abertos do CNPJ (Receita Federal)
// Filtra RJ / MG / ES, só empresas ATIVAS, direto no PostgreSQL.
// Baixa arquivo por arquivo em /tmp, processa em streaming e apaga.
// Progresso salvo no banco: se o serviço reiniciar, retoma de onde parou.
// ============================================================
const fs = require('fs');
const path = require('path');
const os = require('os');
const { pipeline } = require('stream/promises');
const unzipper = require('unzipper');
const { parse } = require('csv-parse');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const UFS = new Set(['RJ', 'MG', 'ES']);
const BASE_URL =
  process.env.RECEITA_BASE_URL ||
  'https://arquivos.receitafederal.gov.br/dados/cnpj/dados_abertos_cnpj';

const PORTES = { '00': 'Não informado', '01': 'Micro empresa', '03': 'Pequeno porte', '05': 'Demais' };

let executando = false;

// ---------- status persistido ----------
async function lerStatus() {
  const c = await prisma.config.findUnique({ where: { chave: 'importacao_status' } });
  if (!c) return null;
  try { return JSON.parse(c.valor); } catch { return null; }
}

async function salvarStatus(status) {
  const valor = JSON.stringify(status);
  await prisma.config.upsert({
    where: { chave: 'importacao_status' },
    update: { valor },
    create: { chave: 'importacao_status', valor },
  });
}

// ---------- utilidades ----------
function esc(v) {
  if (v === null || v === undefined || v === '') return 'NULL';
  return "'" + String(v).replace(/\\/g, '\\\\').replace(/'/g, "''") + "'";
}

function limpar(v) {
  if (!v) return null;
  const t = String(v).trim();
  return t === '' ? null : t;
}

function fmtData(v) {
  const t = limpar(v);
  if (!t || t.length !== 8 || t === '00000000') return null;
  return `${t.slice(6, 8)}/${t.slice(4, 6)}/${t.slice(0, 4)}`;
}

function fmtTelefone(ddd, numero) {
  const d = (ddd || '').replace(/\D/g, '');
  const n = (numero || '').replace(/\D/g, '');
  if (!n || n.length < 8) return null;
  return d ? d + n : n;
}

async function baixarArquivo(url, destino, aoProgredir, cabecalhos) {
  const res = await fetch(url, { headers: cabecalhos || {} });
  if (!res.ok) { const e = new Error(`HTTP ${res.status} em ${url}`); e.httpStatus = res.status; throw e; }
  const total = Number(res.headers.get('content-length') || 0);
  let baixado = 0;
  const arquivo = fs.createWriteStream(destino);
  const reader = res.body.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    baixado += value.length;
    if (aoProgredir && total) aoProgredir(Math.round((baixado / total) * 100));
    if (!arquivo.write(Buffer.from(value))) {
      await new Promise((r) => arquivo.once('drain', r));
    }
  }
  await new Promise((r, j) => arquivo.end((err) => (err ? j(err) : r())));
}

// ---------- Compartilhamento público da Receita (SERPRO / Nextcloud) ----------
// Desde 2026 os dados ficam em arquivos.receitafederal.gov.br/index.php/s/<código>
// Esse tipo de site é listado via WebDAV (PROPFIND), não via HTML comum.
const SHARE_URL = process.env.RECEITA_SHARE_URL || 'https://arquivos.receitafederal.gov.br/index.php/s/gn672Ad4CF8N6TK';

function dadosDoShare() {
  const m = SHARE_URL.match(/^(https?:\/\/[^/]+).*\/s\/([A-Za-z0-9]+)/);
  if (!m) return null;
  return { origem: m[1], token: m[2] };
}

function cabecalhoShare(token) {
  return { Authorization: 'Basic ' + Buffer.from(token + ':').toString('base64'), 'User-Agent': 'Mozilla/5.0 (FourlinkProspector)' };
}

// Lista uma pasta do compartilhamento via WebDAV. Devolve {pastas:[], arquivos:[]} com caminhos relativos.
async function listarWebdav(share, caminho) {
  const url = `${share.origem}/public.php/webdav${caminho}`;
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 45000);
  try {
    const r = await fetch(url, {
      method: 'PROPFIND',
      headers: { ...cabecalhoShare(share.token), Depth: '1' },
      signal: c.signal,
    });
    if (!r.ok && r.status !== 207) return { status: r.status, pastas: [], arquivos: [] };
    const xml = await r.text();
    const hrefs = [...xml.matchAll(/<d:href>([^<]+)<\/d:href>/gi)].map((m) => decodeURIComponent(m[1]));
    const prefixo = '/public.php/webdav';
    const pastas = [];
    const arquivos = [];
    for (const h of hrefs) {
      if (!h.startsWith(prefixo)) continue;
      const rel = h.slice(prefixo.length);
      if (rel === caminho || rel === caminho + '/') continue; // a própria pasta
      if (rel.endsWith('/')) pastas.push(rel.replace(/\/$/, ''));
      else arquivos.push(rel);
    }
    return { status: 207, pastas, arquivos };
  } catch (e) {
    return { status: e.name === 'AbortError' ? 'tempo esgotado' : `falha: ${e.cause?.code || e.message}`, pastas: [], arquivos: [] };
  } finally {
    clearTimeout(t);
  }
}

// Navega pelo compartilhamento da Receita e encontra a pasta com os arquivos do CNPJ
async function descobrirMes(aoStatus) {
  const share = dadosDoShare();
  if (!share) throw new Error('RECEITA_SHARE_URL inválida. Use o link de compartilhamento (…/index.php/s/CÓDIGO).');

  const diagnostico = [];
  const visitadas = new Set();
  const fila = [{ caminho: '', prof: 0 }];

  while (fila.length) {
    const pontos = (c) => (/\d{4}-\d{2}/.test(c) ? 2 : /cnpj/i.test(c) ? 1 : 0);
    fila.sort((a, b) => pontos(b.caminho) - pontos(a.caminho) || a.prof - b.prof || b.caminho.localeCompare(a.caminho));
    const { caminho, prof } = fila.shift();
    if (visitadas.has(caminho) || prof > 5) continue;
    visitadas.add(caminho);

    aoStatus && (await aoStatus(`Procurando os arquivos do CNPJ no repositório da Receita… (${visitadas.size} pastas verificadas)`));
    const { status, pastas, arquivos } = await listarWebdav(share, caminho);
    console.log(`[Receita] ${caminho || '/'} -> ${status} (${pastas.length} pastas, ${arquivos.length} arquivos)`);
    if (!pastas.length && !arquivos.length) { diagnostico.push(`${caminho || '/'}: ${status}`); continue; }

    const temCnaes = arquivos.some((a) => /cnaes\.zip$/i.test(a));
    const temEstab = arquivos.some((a) => /estabelecimentos/i.test(a));
    if (temCnaes && temEstab) {
      const mes = (caminho.match(/(\d{4}-\d{2})/) || [null, 'atual'])[1];
      console.log(`[Receita] Fonte encontrada: ${caminho}`);
      return { modo: 'webdav', share, pasta: caminho, mes, arquivos };
    }

    // Explora TODAS as subpastas (sem filtrar por nome), com limite de segurança.
    for (const psub of pastas) {
      if (visitadas.size + fila.length < 500) fila.push({ caminho: psub, prof: prof + 1 });
    }
    diagnostico.push(`${caminho || '/'}: ${pastas.length}p/${arquivos.length}a`);
  }

  throw new Error(`Não encontrei a pasta do CNPJ no repositório da Receita. Pastas visitadas: ${diagnostico.slice(0, 12).join(' | ') || 'nada respondeu'}. Confira RECEITA_SHARE_URL.`);
}

// Processa um ZIP da Receita em streaming: baixa -> descompacta -> lê CSV -> callback por linha
async function processarZip(fonte, nomeArquivo, porLinha, aoStatus) {
  const achado = (fonte.arquivos || []).find((a) => a.toLowerCase().endsWith('/' + nomeArquivo.toLowerCase()));
  if (!achado && fonte.modo === 'webdav') {
    console.log(`[Receita] ${nomeArquivo} não existe nesta pasta — pulando.`);
    return false;
  }
  const url = `${fonte.share.origem}/public.php/webdav${achado || fonte.pasta + '/' + nomeArquivo}`;
  const cabecalhos = cabecalhoShare(fonte.share.token);
  const tmp = path.join(os.tmpdir(), nomeArquivo);
  try {
    aoStatus && (await aoStatus(`Baixando ${nomeArquivo}…`, 0));
    let ultimo = -1;
    await baixarArquivo(url, tmp, (pct) => {
      if (pct !== ultimo && pct % 10 === 0) { ultimo = pct; aoStatus && aoStatus(`Baixando ${nomeArquivo}… ${pct}%`, pct); }
    }, cabecalhos);

    aoStatus && (await aoStatus(`Processando ${nomeArquivo}…`, 100));
    const directory = await unzipper.Open.file(tmp);
    for (const entrada of directory.files) {
      if (entrada.type !== 'File') continue;
      const parser = parse({
        delimiter: ';',
        quote: '"',
        relax_quotes: true,
        relax_column_count: true,
        encoding: 'latin1',
      });
      const leitura = entrada.stream();
      const consumo = (async () => {
        for await (const linha of parser) {
          await porLinha(linha);
        }
      })();
      leitura.pipe(parser);
      await consumo;
    }
    return true;
  } finally {
    try { fs.unlinkSync(tmp); } catch { /* ok */ }
  }
}

// Insere lote de estabelecimentos (upsert por CNPJ)
async function inserirLote(lote) {
  if (!lote.length) return;
  const valores = lote
    .map((e) => `(${esc(e.cnpj)},${esc(e.cnpjBasico)},${esc(e.razaoSocial)},${esc(e.nomeFantasia)},${esc(e.cnae)},${esc(e.cnaeDescricao)},${esc(e.uf)},${esc(e.municipio)},${esc(e.bairro)},${esc(e.cep)},${esc(e.logradouro)},${esc(e.numero)},${esc(e.telefone1)},${esc(e.telefone2)},${esc(e.email)},${esc(e.situacao)},${esc(e.dataAbertura)})`)
    .join(',');
  await prisma.$executeRawUnsafe(`
    INSERT INTO "Empresa" ("cnpj","cnpjBasico","razaoSocial","nomeFantasia","cnae","cnaeDescricao","uf","municipio","bairro","cep","logradouro","numero","telefone1","telefone2","email","situacao","dataAbertura")
    VALUES ${valores}
    ON CONFLICT ("cnpj") DO UPDATE SET
      "cnpjBasico"=EXCLUDED."cnpjBasico",
      "nomeFantasia"=EXCLUDED."nomeFantasia",
      "cnae"=EXCLUDED."cnae",
      "cnaeDescricao"=EXCLUDED."cnaeDescricao",
      "uf"=EXCLUDED."uf",
      "municipio"=EXCLUDED."municipio",
      "bairro"=EXCLUDED."bairro",
      "cep"=EXCLUDED."cep",
      "logradouro"=EXCLUDED."logradouro",
      "numero"=EXCLUDED."numero",
      "telefone1"=EXCLUDED."telefone1",
      "telefone2"=EXCLUDED."telefone2",
      "email"=EXCLUDED."email",
      "situacao"=EXCLUDED."situacao",
      "dataAbertura"=EXCLUDED."dataAbertura"
  `);
}

// Atualiza em lote a razão social/porte (arquivo Empresas) — só afeta CNPJs já importados
async function atualizarEmpresasLote(lote) {
  if (!lote.length) return;
  const valores = lote.map((e) => `(${esc(e.basico)},${esc(e.razao)},${esc(e.porte)})`).join(',');
  await prisma.$executeRawUnsafe(`
    UPDATE "Empresa" AS emp SET "razaoSocial" = dados.razao, "porte" = dados.porte
    FROM (VALUES ${valores}) AS dados(basico, razao, porte)
    WHERE emp."cnpjBasico" = dados.basico
  `);
}

// Marca MEI em lote (arquivo Simples)
async function atualizarMeiLote(basicos) {
  if (!basicos.length) return;
  const valores = basicos.map((b) => `(${esc(b)})`).join(',');
  await prisma.$executeRawUnsafe(`
    UPDATE "Empresa" AS emp SET "mei" = true
    FROM (VALUES ${valores}) AS dados(basico)
    WHERE emp."cnpjBasico" = dados.basico
  `);
}

// ---------- fluxo principal ----------
async function executarImportacao() {
  if (executando) throw new Error('Já existe uma importação em andamento.');
  executando = true;

  const anterior = (await lerStatus()) || {};
  const status = {
    estado: 'executando',
    etapa: 'Preparando…',
    progresso: 0,
    arquivosConcluidos: anterior.estado === 'erro' ? anterior.arquivosConcluidos || [] : [],
    empresasImportadas: 0,
    iniciadoEm: new Date().toISOString(),
    atualizadoEm: new Date().toISOString(),
    erro: null,
    ultimaConclusao: anterior.ultimaConclusao || null,
  };

  const marcar = async (etapa, progresso) => {
    status.etapa = etapa;
    if (progresso !== undefined) status.progresso = progresso;
    status.atualizadoEm = new Date().toISOString();
    await salvarStatus(status);
  };

  try {
    await marcar('Localizando dados mais recentes da Receita…');
    const fonte = await descobrirMes(marcar);
    status.mesReferencia = fonte.mes;
    status.fonteUrl = fonte.base;

    // ---- 1) Tabelas auxiliares (CNAEs e municípios) ----
    const cnaes = new Map();
    const municipios = new Map();
    await processarZip(fonte, 'Cnaes.zip', async (l) => { cnaes.set(limpar(l[0]), limpar(l[1])); }, marcar);
    await processarZip(fonte, 'Municipios.zip', async (l) => { municipios.set(limpar(l[0]), limpar(l[1])); }, marcar);

    // ---- 2) Estabelecimentos (0 a 9) — endereços, contatos, CNAE ----
    for (let i = 0; i <= 9; i++) {
      const nome = `Estabelecimentos${i}.zip`;
      if (status.arquivosConcluidos.includes(nome)) continue;
      let lote = [];
      await processarZip(fonte, nome, async (l) => {
        const uf = limpar(l[19]);
        if (!UFS.has(uf)) return;
        if (limpar(l[5]) !== '02') return; // 02 = ATIVA
        const basico = limpar(l[0]);
        const cnpj = `${basico}${limpar(l[1]) || ''}${limpar(l[2]) || ''}`;
        if (!basico || cnpj.length !== 14) return;
        const logradouro = [limpar(l[13]), limpar(l[14])].filter(Boolean).join(' ');
        lote.push({
          cnpj,
          cnpjBasico: basico,
          razaoSocial: limpar(l[4]) || 'Empresa', // provisório; arquivo Empresas corrige depois
          nomeFantasia: limpar(l[4]),
          cnae: limpar(l[11]),
          cnaeDescricao: cnaes.get(limpar(l[11])) || null,
          uf,
          municipio: municipios.get(limpar(l[20])) || limpar(l[20]) || '',
          bairro: limpar(l[17]),
          cep: (limpar(l[18]) || '').replace(/\D/g, '') || null,
          logradouro: logradouro || null,
          numero: limpar(l[15]),
          telefone1: fmtTelefone(l[21], l[22]),
          telefone2: fmtTelefone(l[23], l[24]),
          email: limpar(l[27]) ? String(l[27]).trim().toLowerCase() : null,
          situacao: 'ATIVA',
          dataAbertura: fmtData(l[10]),
        });
        if (lote.length >= 1000) { const b = lote; lote = []; await inserirLote(b); status.empresasImportadas += b.length; if (status.empresasImportadas % 20000 === 0) await marcar(`Importando empresas (${nome}) — ${status.empresasImportadas.toLocaleString('pt-BR')} registros…`); }
      }, marcar);
      await inserirLote(lote);
      status.empresasImportadas += lote.length;
      status.arquivosConcluidos.push(nome);
      await marcar(`${nome} concluído — ${status.empresasImportadas.toLocaleString('pt-BR')} empresas.`);
    }

    // ---- 3) Empresas (0 a 9) — razão social e porte ----
    for (let i = 0; i <= 9; i++) {
      const nome = `Empresas${i}.zip`;
      if (status.arquivosConcluidos.includes(nome)) continue;
      let lote = [];
      await processarZip(fonte, nome, async (l) => {
        const basico = limpar(l[0]);
        if (!basico) return;
        lote.push({ basico, razao: limpar(l[1]) || 'Empresa', porte: PORTES[limpar(l[5])] || null });
        if (lote.length >= 3000) { const b = lote; lote = []; await atualizarEmpresasLote(b); }
      }, marcar);
      await atualizarEmpresasLote(lote);
      status.arquivosConcluidos.push(nome);
      await marcar(`${nome} concluído (razões sociais e porte).`);
    }

    // ---- 4) Simples — flag MEI ----
    if (!status.arquivosConcluidos.includes('Simples.zip')) {
      let lote = [];
      await processarZip(fonte, 'Simples.zip', async (l) => {
        if (limpar(l[4]) !== 'S') return; // opção MEI
        const basico = limpar(l[0]);
        if (!basico) return;
        lote.push(basico);
        if (lote.length >= 3000) { const b = lote; lote = []; await atualizarMeiLote(b); }
      }, marcar);
      await atualizarMeiLote(lote);
      status.arquivosConcluidos.push('Simples.zip');
      await marcar('Simples.zip concluído (marcação de MEI).');
    }

    const total = await prisma.empresa.count();
    status.estado = 'concluido';
    status.ultimaConclusao = new Date().toISOString();
    status.totalNaBase = total;
    await marcar(`Importação concluída! ${total.toLocaleString('pt-BR')} empresas ativas na base (RJ · MG · ES).`, 100);
  } catch (erro) {
    status.estado = 'erro';
    status.erro = erro.message;
    await marcar(`Erro: ${erro.message}`);
    throw erro;
  } finally {
    executando = false;
  }
}

function importacaoEmAndamento() {
  return executando;
}

module.exports = { executarImportacao, lerStatus, importacaoEmAndamento };
