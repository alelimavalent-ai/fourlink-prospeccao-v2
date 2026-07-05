const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { autenticar, somenteAdmin } = require('../middleware/auth');
const { executarImportacao, lerStatus, importacaoEmAndamento } = require('../importacao/receita');

const prisma = new PrismaClient();
const router = express.Router();

router.use(autenticar, somenteAdmin);

router.get('/status', async (req, res) => {
  const status = await lerStatus();
  const total = await prisma.empresa.count();
  res.json({ status, totalNaBase: total, emAndamento: importacaoEmAndamento() });
});

router.post('/iniciar', async (req, res) => {
  if (importacaoEmAndamento()) {
    return res.status(409).json({ erro: 'Já existe uma importação em andamento.' });
  }
  executarImportacao().catch((e) => console.error('Importação falhou:', e.message));
  res.json({ ok: true, mensagem: 'Importação iniciada! Acompanhe o progresso nesta tela.' });
});

module.exports = router;
