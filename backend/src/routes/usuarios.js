const express = require('express');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { autenticar, somenteAdmin } = require('../middleware/auth');

const prisma = new PrismaClient();
const router = express.Router();

router.use(autenticar, somenteAdmin);

router.get('/', async (req, res) => {
  const usuarios = await prisma.usuario.findMany({
    select: { id: true, nome: true, email: true, role: true, ativo: true, criadoEm: true },
    orderBy: [{ role: 'asc' }, { nome: 'asc' }],
  });
  res.json({ usuarios });
});

router.post('/', async (req, res) => {
  const { nome, email, senha, role } = req.body || {};
  if (!nome || !email || !senha || String(senha).length < 8) {
    return res.status(400).json({ erro: 'Preencha nome, e-mail e senha (mínimo 8 caracteres).' });
  }
  const emailLimpo = String(email).toLowerCase().trim();
  const existe = await prisma.usuario.findUnique({ where: { email: emailLimpo } });
  if (existe) return res.status(409).json({ erro: 'Já existe um usuário com esse e-mail.' });

  const usuario = await prisma.usuario.create({
    data: {
      nome: String(nome).trim(),
      email: emailLimpo,
      senhaHash: await bcrypt.hash(senha, 10),
      role: role === 'ADMIN' ? 'ADMIN' : 'VENDEDOR',
    },
    select: { id: true, nome: true, email: true, role: true, ativo: true },
  });
  res.status(201).json({ usuario });
});

router.patch('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { nome, role, ativo, novaSenha } = req.body || {};
  const data = {};
  if (nome) data.nome = String(nome).trim();
  if (role) data.role = role === 'ADMIN' ? 'ADMIN' : 'VENDEDOR';
  if (typeof ativo === 'boolean') data.ativo = ativo;
  if (novaSenha) {
    if (String(novaSenha).length < 8) return res.status(400).json({ erro: 'Senha precisa ter pelo menos 8 caracteres.' });
    data.senhaHash = await bcrypt.hash(novaSenha, 10);
  }
  if (id === req.usuario.id && data.ativo === false) {
    return res.status(400).json({ erro: 'Você não pode desativar a própria conta.' });
  }
  const usuario = await prisma.usuario.update({
    where: { id },
    data,
    select: { id: true, nome: true, email: true, role: true, ativo: true },
  });
  res.json({ usuario });
});

module.exports = router;
