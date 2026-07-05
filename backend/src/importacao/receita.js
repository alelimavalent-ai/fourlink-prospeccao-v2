// ============================================================
// Fourlink Prospector — Importador Receita Federal / CNPJ
// Corrigido para usar o espelho público Casa dos Dados
// ============================================================

const fs = require('fs');
const path = require('path');
const os = require('os');
const unzipper = require('unzipper');
const { parse } = require('csv-parse');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const UFS = new Set(['RJ', 'MG', 'ES']);

const BASE_URL = (
  process.env.RECEITA_BASE_URL ||
  'https://dados-abertos-rf-cnpj.casadosdados.com.br/arquivos'
).replace(/\/+$/, '');

const PORTES = {
  '00': 'Não informado',
  '01': 'Micro empresa',
  '03': 'Pequeno porte',
  '05': 'Demais',
};

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (FourlinkProspector)',
  Accept: '*/*',
};

let executando = false;

// ---------- status ----------
async function lerStatus() {
  const c = await prisma.config.findUnique({
    where: { chave: 'importacao_status' },
  });

  if (!c) return null;

  try {
    return JSON.parse(c.valor);
  } catch {
    return null;
  }
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

function nomeArquivoDoHref(href) {
  const limpo = decodeURIComponent(String(href || '').split('?')[0]).replace(/\/+$/, '');
  return limpo.substring(limpo.lastIndexOf('/') + 1);
}

function montarUrl(base, nome) {
  return `${String(base).replace(/\/+$/, '')}/${encodeURIComponent(nome)}`;
}

async function fetchComTimeout(url, opcoes = {}, timeoutMs = 120000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...opcoes,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

async function baixarArquivo(url, destino, aoProgredir) {
  const res = await fetchComTimeout(url, { headers: HEADERS }, 120000);

  if (!res.ok) {
    const e = new Error(`HTTP ${res.status} em ${url}`);
    e.httpStatus = res.status;
    throw e;
  }

  const total = Number(res.headers.get('content-length') || 0);
  let baixado = 0;

  const arquivo = fs.createWriteStream(destino);
  const reader = res.body.getReader();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    baixado += value.length;

    if (aoProgredir && total) {
      aoProgredir(Math.round((baixado / total) * 100));
    }

    if (!arquivo.write(Buffer.from(value))) {
      await new Promise((r) => arquivo.once('drain', r));
    }
  }

  await new Promise((r, j) => arquivo.end((err) => (err ? j(err) : r())));
}

// ---------- índice Casa dos Dados ----------
async function listarIndiceHttp(url) {
  const res = await fetchComTimeout(url, { headers: HEADERS }, 60000);

  if (!res.ok) {
    throw new Error(`Não consegui abrir ${url}. HTTP ${res.status}`);
  }

  const html = await res.text();

  return [
    ...new Set(
      [...html.matchAll(/href=["']([^"']+)["']/gi)]
        .map((m) => nomeArquivoDoHref(m[1]))
        .filter(Boolean)
        .filter((n) => n !== '.' && n !== '..')
    ),
  ];
}

function dataDaPasta(nome) {
  const n = String(nome || '').replace(/\/+$/, '');

  let m = n.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;

  m = n.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;

  return null;
}

function contemArquivosObrigatorios(arquivos) {
  const set = new Set(arquivos.map((a) => String(a).toLowerCase()));

  return [
    'cnaes.zip',
    'municipios.zip',
    'simples.zip',
    'empresas0.zip',
    'estabelecimentos0.zip',
  ].every((a) => set.has(a));
}

async function descobrirMes(aoStatus) {
  await aoStatus?.('Abrindo espelho dos Dados Abertos do CNPJ…');

  const pastas = await listarIndiceHttp(`${BASE_URL}/`);

  const candidatas = pastas
    .map((nome) => ({
      nome: String(nome).replace(/\/+$/, ''),
      data: dataDaPasta(nome),
    }))
    .filter((p) => p.data)
    .sort((a, b) => String(b.data).localeCompare(String(a.data)));

  if (!candidatas.length) {
    throw new Error(`Não encontrei pastas de data em ${BASE_URL}/`);
  }

  const tentadas = [];

  for (const pasta of candidatas) {
    const pastaUrl = `${BASE_URL}/${encodeURIComponent(pasta.nome)}`;
    await aoStatus?.(`Verificando pasta ${pasta.nome}…`);

    try {
      const arquivos = await listarIndiceHttp(`${pastaUrl}/`);
      tentadas.push(`${pasta.nome}: ${arquivos.length} arquivos`);

      if (contemArquivosObrigatorios(arquivos)) {
        console.log(`[Receita] Fonte encontrada: ${pastaUrl}/`);

        return {
          modo: 'http-index',
          mes: pasta.nome,
          baseUrl: `${pastaUrl}/`,
          arquivos,
        };
      }
    } catch (erro) {
      tentadas.push(`${pasta.nome}: ${erro.message}`);
    }
  }

  throw new Error(
    `Encontrei pastas, mas nenhuma tinha os ZIPs obrigatórios. ${tentadas
      .slice(0, 10)
      .join(' | ')}`
  );
}

// ---------- processar ZIP ----------
async function processarZip(fonte, nomeArquivo, porLinha, aoStatus) {
  const existe = (fonte.arquivos || []).some(
    (a) => String(a).toLowerCase() === String(nomeArquivo).toLowerCase()
  );

  if (!existe) {
    console.log(`[Receita] ${nomeArquivo} não existe nesta pasta — pulando.`);
    return false;
  }

  const url = montarUrl(fonte.baseUrl, nomeArquivo);
  const tmp = path.join(os.tmpdir(), nomeArquivo);

  try {
    aoStatus && (await aoStatus(`Baixando ${nomeArquivo}…`, 0));

    let ultimo = -1;

    await baixarArquivo(url, tmp, (pct) => {
      if (pct !== ultimo && pct % 10 === 0) {
        ultimo = pct;
        aoStatus && aoStatus(`Baixando ${nomeArquivo}… ${pct}%`, pct);
      }
    });

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
    try {
      fs.unlinkSync(tmp);
    } catch {}
  }
}

// ---------- banco ----------
async function inserirLote(lote) {
  if (!lote.length) return;

  const valores = lote
    .map(
      (e) =>
        `(${esc(e.cnpj)},${esc(e.cnpjBasico)},${esc(e.razaoSocial)},${esc(
          e.nomeFantasia
        )},${esc(e.cnae)},${esc(e.cnaeDescricao)},${esc(e.uf)},${esc(
          e.municipio
        )},${esc(e.bairro)},${esc(e.cep)},${esc(e.logradouro)},${esc(
          e.numero
        )},${esc(e.telefone1)},${esc(e.telefone2)},${esc(e.email)},${esc(
          e.situacao
        )},${esc(e.dataAbertura)})`
    )
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

async function atualizarEmpresasLote(lote) {
  if (!lote.length) return;

  const valores = lote
    .map((e) => `(${esc(e.basico)},${esc(e.razao)},${esc(e.porte)})`)
    .join(',');

  await prisma.$executeRawUnsafe(`
    UPDATE "Empresa" AS emp SET "razaoSocial" = dados.razao, "porte" = dados.porte
    FROM (VALUES ${valores}) AS dados(basico, razao, porte)
    WHERE emp."cnpjBasico" = dados.basico
  `);
}

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
    await marcar('Localizando dados mais recentes do CNPJ…');

    const fonte = await descobrirMes(marcar);

    status.mesReferencia = fonte.mes;
    status.fonteUrl = fonte.baseUrl;
    await salvarStatus(status);

    const cnaes = new Map();
    const municipios = new Map();

    await processarZip(
      fonte,
      'Cnaes.zip',
      async (l) => {
        cnaes.set(limpar(l[0]), limpar(l[1]));
      },
      marcar
    );

    await processarZip(
      fonte,
      'Municipios.zip',
      async (l) => {
        municipios.set(limpar(l[0]), limpar(l[1]));
      },
      marcar
    );

    for (let i = 0; i <= 9; i++) {
      const nome = `Estabelecimentos${i}.zip`;

      if (status.arquivosConcluidos.includes(nome)) continue;

      let lote = [];

      await processarZip(
        fonte,
        nome,
        async (l) => {
          const uf = limpar(l[19]);
          if (!UFS.has(uf)) return;

          if (limpar(l[5]) !== '02') return;

          const basico = limpar(l[0]);
          const cnpj = `${basico}${limpar(l[1]) || ''}${limpar(l[2]) || ''}`;

          if (!basico || cnpj.length !== 14) return;

          const logradouro = [limpar(l[13]), limpar(l[14])].filter(Boolean).join(' ');

          lote.push({
            cnpj,
            cnpjBasico: basico,
            razaoSocial: limpar(l[4]) || 'Empresa',
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

          if (lote.length >= 1000) {
            const b = lote;
            lote = [];

            await inserirLote(b);

            status.empresasImportadas += b.length;

            if (status.empresasImportadas % 20000 === 0) {
              await marcar(
                `Importando empresas (${nome}) — ${status.empresasImportadas.toLocaleString(
                  'pt-BR'
                )} registros…`
              );
            }
          }
        },
        marcar
      );

      await inserirLote(lote);
      status.empresasImportadas += lote.length;

      status.arquivosConcluidos.push(nome);

      await marcar(`${nome} concluído — ${status.empresasImportadas.toLocaleString('pt-BR')} empresas.`);
    }

    for (let i = 0; i <= 9; i++) {
      const nome = `Empresas${i}.zip`;

      if (status.arquivosConcluidos.includes(nome)) continue;

      let lote = [];

      await processarZip(
        fonte,
        nome,
        async (l) => {
          const basico = limpar(l[0]);
          if (!basico) return;

          lote.push({
            basico,
            razao: limpar(l[1]) || 'Empresa',
            porte: PORTES[limpar(l[5])] || null,
          });

          if (lote.length >= 3000) {
            const b = lote;
            lote = [];
            await atualizarEmpresasLote(b);
          }
        },
        marcar
      );

      await atualizarEmpresasLote(lote);

      status.arquivosConcluidos.push(nome);

      await marcar(`${nome} concluído (razões sociais e porte).`);
    }

    if (!status.arquivosConcluidos.includes('Simples.zip')) {
      let lote = [];

      await processarZip(
        fonte,
        'Simples.zip',
        async (l) => {
          if (limpar(l[4]) !== 'S') return;

          const basico = limpar(l[0]);
          if (!basico) return;

          lote.push(basico);

          if (lote.length >= 3000) {
            const b = lote;
            lote = [];
            await atualizarMeiLote(b);
          }
        },
        marcar
      );

      await atualizarMeiLote(lote);

      status.arquivosConcluidos.push('Simples.zip');

      await marcar('Simples.zip concluído (marcação de MEI).');
    }

    const total = await prisma.empresa.count();

    status.estado = 'concluido';
    status.ultimaConclusao = new Date().toISOString();
    status.totalNaBase = total;

    await marcar(
      `Importação concluída! ${total.toLocaleString('pt-BR')} empresas ativas na base (RJ · MG · ES).`,
      100
    );
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

module.exports = {
  executarImportacao,
  lerStatus,
  importacaoEmAndamento,
};
