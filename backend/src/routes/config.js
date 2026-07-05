const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { autenticar, somenteAdmin } = require('../middleware/auth');

const prisma = new PrismaClient();
const router = express.Router();

router.get('/', autenticar, async (req, res) => {
  const configs = await prisma.config.findMany();
  const mapa = Object.fromEntries(configs.map((c) => [c.chave, c.valor]));
  res.json({ config: mapa });
});

router.put('/', autenticar, somenteAdmin, async (req, res) => {
  const { limite_extracao } = req.body || {};
  const limite = parseInt(limite_extracao, 10);
  if (!Number.isFinite(limite) || limite < 1 || limite > 100000) {
    return res.status(400).json({ erro: 'Limite de extração deve ser um número entre 1 e 100.000.' });
  }
  await prisma.config.upsert({
    where: { chave: 'limite_extracao' },
    update: { valor: String(limite) },
    create: { chave: 'limite_extracao', valor: String(limite) },
  });
  res.json({ ok: true });
});

module.exports = router;
