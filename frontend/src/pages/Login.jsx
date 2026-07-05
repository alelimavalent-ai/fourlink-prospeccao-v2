import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, auth } from '../api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const navigate = useNavigate();

  async function entrar(e) {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    try {
      const dados = await api('/auth/login', { method: 'POST', body: { email, senha } });
      auth.salvar(dados.token, dados.usuario);
      navigate('/painel');
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="login-fundo">
      <div className="login-cartao">
        <div className="login-marca">
          <span className="login-elos">
            <svg viewBox="0 0 40 40" width="44" height="44" aria-hidden="true">
              <g fill="none" stroke="currentColor" strokeWidth="5" strokeLinejoin="round">
                <rect x="15" y="3" width="12" height="12" rx="3" transform="rotate(45 21 9)" />
                <rect x="27" y="15" width="12" height="12" rx="3" transform="rotate(45 33 21)" />
                <rect x="15" y="27" width="12" height="12" rx="3" transform="rotate(45 21 33)" />
                <rect x="3" y="15" width="12" height="12" rx="3" transform="rotate(45 9 21)" />
              </g>
            </svg>
          </span>
          <h1>Fourlink <em>Prospector</em></h1>
          <p>Prospecção B2B — RJ · MG · ES</p>
        </div>

        <form onSubmit={entrar}>
          <label>
            E-mail
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@fourlinkempresas.com.br" required autoFocus />
          </label>
          <label>
            Senha
            <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="••••••••" required />
          </label>
          {erro && <div className="alerta-erro">{erro}</div>}
          <button className="botao-principal" disabled={carregando}>
            {carregando ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <footer>Fourlink Telecom · Conectando Empresas</footer>
      </div>
    </div>
  );
}
