import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { auth } from '../api';

const elos = (
  <svg viewBox="0 0 40 40" width="30" height="30" aria-hidden="true">
    <g fill="none" stroke="currentColor" strokeWidth="5" strokeLinejoin="round">
      <rect x="15" y="3" width="12" height="12" rx="3" transform="rotate(45 21 9)" />
      <rect x="27" y="15" width="12" height="12" rx="3" transform="rotate(45 33 21)" />
      <rect x="15" y="27" width="12" height="12" rx="3" transform="rotate(45 21 33)" />
      <rect x="3" y="15" width="12" height="12" rx="3" transform="rotate(45 9 21)" />
    </g>
  </svg>
);

export default function Layout() {
  const usuario = auth.usuario();
  const navigate = useNavigate();
  const admin = usuario?.role === 'ADMIN';

  function sair() {
    auth.sair();
    navigate('/');
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="marca">
          <span className="marca-elos">{elos}</span>
          <div>
            <strong>Fourlink</strong>
            <span className="marca-sub">PROSPECTOR</span>
          </div>
        </div>

        <nav>
          <NavLink to="/painel">Painel</NavLink>
          <NavLink to="/prospeccao">Prospecção</NavLink>
          {admin && <NavLink to="/base-de-dados">Base de Dados</NavLink>}
          {admin && <NavLink to="/viabilidade">Viabilidade</NavLink>}
          {admin && <NavLink to="/usuarios">Usuários</NavLink>}
          {admin && <NavLink to="/configuracoes">Configurações</NavLink>}
        </nav>

        <div className="sidebar-rodape">
          <div className="usuario-chip">
            <span className="usuario-avatar">{(usuario?.nome || '?')[0]}</span>
            <div>
              <strong>{usuario?.nome}</strong>
              <span>{admin ? 'Administrador' : 'Vendedor'}</span>
            </div>
          </div>
          <button className="botao-sair" onClick={sair}>Sair</button>
        </div>
      </aside>

      <main className="conteudo">
        <Outlet />
      </main>
    </div>
  );
}
