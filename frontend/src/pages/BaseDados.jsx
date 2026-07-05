import { useEffect, useRef, useState } from 'react';
import { api } from '../api';

export default function BaseDados() {
  const [dados, setDados] = useState(null);
  const [msg, setMsg] = useState('');
  const [erro, setErro] = useState('');
  const timer = useRef(null);

  async function carregar() {
    try { setDados(await api('/importacao/status')); } catch { /* mantém última */ }
  }

  useEffect(() => {
    carregar();
    timer.current = setInterval(carregar, 5000);
    return () => clearInterval(timer.current);
  }, []);

  async function iniciar() {
    setMsg(''); setErro('');
    if (!window.confirm('Iniciar a importação da Receita Federal agora?\n\nO processo baixa e processa os dados oficiais de RJ, MG e ES. Pode levar algumas horas — você pode fechar esta tela, ele continua sozinho.')) return;
    try {
      const r = await api('/importacao/iniciar', { method: 'POST' });
      setMsg(r.mensagem);
      carregar();
    } catch (e) { setErro(e.message); }
  }

  const st = dados?.status;
  const rodando = dados?.emAndamento;
  const dataFmt = (iso) => iso ? new Date(iso).toLocaleString('pt-BR') : '—';

  return (
    <div>
      <header className="pagina-cabecalho">
        <div>
          <h2>Base de Dados</h2>
          <p>Empresas ativas da Receita Federal — RJ · MG · ES. Atualização automática mensal.</p>
        </div>
      </header>

      <div className="grade-cartoes">
        <div className="cartao">
          <span className="cartao-rotulo">Empresas na base</span>
          <strong className="cartao-valor">{dados ? dados.totalNaBase.toLocaleString('pt-BR') : '—'}</strong>
          <span className="cartao-nota">CNPJs ativos importados</span>
        </div>
        <div className="cartao">
          <span className="cartao-rotulo">Última atualização completa</span>
          <strong className="cartao-valor" style={{ fontSize: 20 }}>{dataFmt(st?.ultimaConclusao)}</strong>
          <span className="cartao-nota">{st?.mesReferencia ? `Dados de referência: ${st.mesReferencia}` : 'Nenhuma importação concluída ainda'}</span>
        </div>
        <div className="cartao">
          <span className="cartao-rotulo">Situação</span>
          <strong className="cartao-valor" style={{ fontSize: 20 }}>
            {rodando ? '🔄 Importando…' : st?.estado === 'concluido' ? '✅ Em dia' : st?.estado === 'erro' ? '⚠️ Erro na última tentativa' : '⏳ Aguardando 1ª importação'}
          </strong>
          <span className="cartao-nota">Verificação automática a cada 12h</span>
        </div>
      </div>

      {rodando && st && (
        <div className="cartao" style={{ marginBottom: 20 }}>
          <h3>Progresso em tempo real</h3>
          <p style={{ margin: '10px 0 6px' }}>{st.etapa}</p>
          <p className="texto-suave">
            Empresas importadas até agora: <strong>{(st.empresasImportadas || 0).toLocaleString('pt-BR')}</strong>
            {' · '}Arquivos concluídos: <strong>{(st.arquivosConcluidos || []).length} de 21</strong>
          </p>
          <p className="texto-suave" style={{ marginTop: 8 }}>
            Pode fechar esta tela ou desligar o computador — a importação roda no servidor e continua sozinha.
          </p>
        </div>
      )}

      {st?.estado === 'erro' && !rodando && (
        <div className="alerta-erro" style={{ marginBottom: 20 }}>
          A última importação parou com erro: {st.erro}. Clique em "Atualizar base agora" para retomar — ela continua de onde parou.
        </div>
      )}

      {msg && <div className="alerta-ok" style={{ marginBottom: 20 }}>{msg}</div>}
      {erro && <div className="alerta-erro" style={{ marginBottom: 20 }}>{erro}</div>}

      <button className="botao-principal" onClick={iniciar} disabled={rodando}>
        {rodando ? 'Importação em andamento…' : 'Atualizar base agora'}
      </button>
    </div>
  );
}
