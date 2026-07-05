const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'dev-secret-trocar-em-producao';

function autenticar(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ erro: 'Faça login para continuar.' });
  try {
    req.usuario = jwt.verify(token, SECRET);
    next();
  } catch {
    return res.status(401).json({ erro: 'Sessão expirada. Faça login novamente.' });
  }
}

function somenteAdmin(req, res, next) {
  if (req.usuario?.role !== 'ADMIN') {
    return res.status(403).json({ erro: 'Apenas administradores podem fazer isso.' });
  }
  next();
}

module.exports = { autenticar, somenteAdmin, SECRET };
