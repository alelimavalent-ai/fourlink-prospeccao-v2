const TOKEN_KEY = 'prospector_token';
const USER_KEY = 'prospector_usuario';

export const auth = {
  token: () => localStorage.getItem(TOKEN_KEY),
  usuario: () => {
    try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; }
  },
  salvar: (token, usuario) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(usuario));
  },
  sair: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

export async function api(caminho, opcoes = {}) {
  const res = await fetch(`/api${caminho}`, {
    ...opcoes,
    headers: {
      'Content-Type': 'application/json',
      ...(auth.token() ? { Authorization: `Bearer ${auth.token()}` } : {}),
      ...(opcoes.headers || {}),
    },
    body: opcoes.body ? JSON.stringify(opcoes.body) : undefined,
  });
  const dados = await res.json().catch(() => ({}));
  if (res.status === 401 && auth.token()) {
    auth.sair();
    window.location.href = '/';
  }
  if (!res.ok) throw new Error(dados.erro || 'Erro inesperado. Tente novamente.');
  return dados;
}
