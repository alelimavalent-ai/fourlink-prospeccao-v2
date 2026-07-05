import { useEffect, useState } from 'react';
import { api } from '../api';

const NOVO = { nome: '', email: '', senha: '', role: 'VENDEDOR' };

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [form, setForm] = useState(NOVO);
  const [erro, setErro] = useState('');
  const [ok, setOk] = useState('');

  async function carregar() {
    const dados = await api('/usuarios');
    setUsuarios(dados.usuarios);
  }
  useEffect(() => { carregar().catch(() => {}); }, []);

  async function criar(e) {
    e.preventDefault();
    setErro(''); setOk('');
    try {
      await api('/usuarios', { method: 'POST', body: form });
      setForm(NOVO);
      setOk('Usuário criado com sucesso.');
      carregar();
    } catch (err) { setErro(err.message); }
  }

  async function alternarAtivo(u) {
    setErro(''); setOk('');
    try {
      await api(`/usuarios/${u.id}`, { method: 'PATCH', body: { ativo: !u.ativo } });
      carregar();
    } catch (err) { setErro(err.message); }
  }

  async function redefinirSenha(u) {
    const novaSenha = window.prompt(`Nova senha para ${u.nome} (mínimo 8 caracteres):`);
    if (!novaSenha) return;
    setErro(''); setOk('');
    try {
      await api(`/usuarios/${u.id}`, { method: 'PATCH', body: { novaSenha } });
      setOk(`Senha de ${u.nome} redefinida.`);
    } catch (err) { setErro(err.message); }
  }

  return (
    <div>
      <header className="pagina-cabecalho">
        <div>
          <h2>Usuários</h2>
          <p>Crie e gerencie o acesso da equipe ao Prospector.</p>
        </div>
      </header>

      <div className="duas-colunas">
        <form className="cartao formulario" onSubmit={criar}>
          <h3>Novo usuário</h3>
          <label>Nome<input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required /></label>
          <label>E-mail<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></label>
          <label>Senha inicial<input type="text" value={form.senha} onChange={(e) => setForm({ ...form, senha: e.target.value })} minLength={8} required /></label>
          <label>Nível
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="VENDEDOR">Vendedor</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </label>
          {erro && <div className="alerta-erro">{erro}</div>}
          {ok && <div className="alerta-ok">{ok}</div>}
          <button className="botao-principal">Criar usuário</button>
        </form>

        <div className="cartao">
          <h3>Equipe</h3>
          <table className="tabela">
            <thead>
              <tr><th>Nome</th><th>E-mail</th><th>Nível</th><th>Status</th><th>Ações</th></tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id} className={u.ativo ? '' : 'linha-inativa'}>
                  <td>{u.nome}</td>
                  <td>{u.email}</td>
                  <td>{u.role === 'ADMIN' ? 'Admin' : 'Vendedor'}</td>
                  <td>{u.ativo ? 'Ativo' : 'Desativado'}</td>
                  <td className="acoes">
                    <button onClick={() => redefinirSenha(u)}>Redefinir senha</button>
                    <button onClick={() => alternarAtivo(u)}>{u.ativo ? 'Desativar' : 'Reativar'}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
