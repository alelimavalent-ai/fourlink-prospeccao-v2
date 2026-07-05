import { useEffect, useState } from 'react';
import { api } from '../api';

export default function Configuracoes() {
  const [limite, setLimite] = useState('');
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [msg, setMsg] = useState({});

  useEffect(() => {
    api('/config').then((d) => setLimite(d.config.limite_extracao || '200')).catch(() => {});
  }, []);

  async function salvarLimite(e) {
    e.preventDefault();
    setMsg({});
    try {
      await api('/config', { method: 'PUT', body: { limite_extracao: limite } });
      setMsg({ limiteOk: 'Limite salvo.' });
    } catch (err) { setMsg({ limiteErro: err.message }); }
  }

  async function trocarSenha(e) {
    e.preventDefault();
    setMsg({});
    try {
      await api('/auth/trocar-senha', { method: 'POST', body: { senhaAtual, novaSenha } });
      setSenhaAtual(''); setNovaSenha('');
      setMsg({ senhaOk: 'Senha alterada com sucesso.' });
    } catch (err) { setMsg({ senhaErro: err.message }); }
  }

  return (
    <div>
      <header className="pagina-cabecalho">
        <div>
          <h2>Configurações</h2>
          <p>Regras do sistema e segurança da sua conta.</p>
        </div>
      </header>

      <div className="duas-colunas">
        <form className="cartao formulario" onSubmit={salvarLimite}>
          <h3>Limite por extração</h3>
          <p className="texto-suave">Quantidade máxima de leads que um vendedor pode puxar por vez.</p>
          <label>Leads por lote<input type="number" min="1" max="100000" value={limite} onChange={(e) => setLimite(e.target.value)} /></label>
          {msg.limiteErro && <div className="alerta-erro">{msg.limiteErro}</div>}
          {msg.limiteOk && <div className="alerta-ok">{msg.limiteOk}</div>}
          <button className="botao-principal">Salvar limite</button>
        </form>

        <form className="cartao formulario" onSubmit={trocarSenha}>
          <h3>Trocar minha senha</h3>
          <label>Senha atual<input type="password" value={senhaAtual} onChange={(e) => setSenhaAtual(e.target.value)} required /></label>
          <label>Nova senha<input type="password" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} minLength={8} required /></label>
          {msg.senhaErro && <div className="alerta-erro">{msg.senhaErro}</div>}
          {msg.senhaOk && <div className="alerta-ok">{msg.senhaOk}</div>}
          <button className="botao-principal">Alterar senha</button>
        </form>
      </div>
    </div>
  );
}
