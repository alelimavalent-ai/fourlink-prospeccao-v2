const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { autenticar, SECRET } = require('../middleware/auth');

const prisma = new PrismaClient();
const router = express.Router();

router.post('/login', async (req, res) => {
  const { email, senha } = req.body || {};
  if (!email || !senha) return res.status(400).json({ erro: 'Informe e-mail e senha.' });

  const usuario = await prisma.usuario.findUnique({ where: { email: String(email).toLowerCase().trim() } });
  if (!usuario || !usuario.ativo) return res.status(401).json({ erro: 'E-mail ou senha incorretos.' });

  const ok = await bcrypt.compare(senha, usuario.senhaHash);
  if (!ok) return res.status(401).json({ erro: 'E-mail ou senha incorretos.' });

  const token = jwt.sign(
    { id: usuario.id, nome: usuario.nome, email: usuario.email, role: usuario.role },
    SECRET,
    { expiresIn: '12h' }
  );
  res.json({ token, usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, role: usuario.role } });
});

router.get('/me', autenticar, async (req, res) => {
  res.json({ usuario: req.usuario });
});

router.post('/trocar-senha', autenticar, async (req, res) => {
  const { senhaAtual, novaSenha } = req.body || {};
  if (!senhaAtual || !novaSenha || String(novaSenha).length < 8) {
    return res.status(400).json({ erro: 'Nova senha precisa ter pelo menos 8 caracteres.' });
  }
  const usuario = await prisma.usuario.findUnique({ where: { id: req.usuario.id } });
  const ok = await bcrypt.compare(senhaAtual, usuario.senhaHash);
  if (!ok) return res.status(401).json({ erro: 'Senha atual incorreta.' });

  await prisma.usuario.update({
    where: { id: usuario.id },
    data: { senhaHash: await bcrypt.hash(novaSenha, 10) },
  });
  res.json({ ok: true });
});

module.exports = router;
