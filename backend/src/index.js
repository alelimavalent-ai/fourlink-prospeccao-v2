const express = require('express');
const cors = require('cors');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const authRoutes = require('./routes/auth');
const usuariosRoutes = require('./routes/usuarios');
const configRoutes = require('./routes/config');
const importacaoRoutes = require('./routes/importacao');

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true, sistema: 'Fourlink Prospector', modulo: 2 }));

// Números do painel inicial
const { autenticar } = require('./middleware/auth');
app.get('/api/resumo', autenticar, async (req, res) => {
  const [empresas, viaveis, usuarios, meusLeads] = await Promise.all([
    prisma.empresa.count(),
    prisma.empresa.count({ where: { viabilidade: { not: 'NENHUMA' } } }),
    prisma.usuario.count({ where: { ativo: true } }),
    prisma.empresa.count({ where: { atribuidoAId: req.usuario.id } }),
  ]);
  res.json({ empresas, viaveis, usuarios, meusLeads });
});

app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/config', configRoutes);
app.use('/api/importacao', importacaoRoutes);

// Serve o frontend buildado (produção / Railway)
const dist = path.join(__dirname, '..', '..', 'frontend', 'dist');
app.use(express.static(dist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(dist, 'index.html'), (err) => { if (err) next(); });
});

// Atualização mensal automática: verifica a cada 12h; se a última importação
// concluída tiver mais de 31 dias, inicia uma nova sozinho (desligue com AUTO_IMPORT=false)
const { executarImportacao, lerStatus, importacaoEmAndamento } = require('./importacao/receita');
setInterval(async () => {
  try {
    if (process.env.AUTO_IMPORT === 'false' || importacaoEmAndamento()) return;
    const st = await lerStatus();
    if (!st || !st.ultimaConclusao) return; // só automatiza depois da 1ª importação manual
    const dias = (Date.now() - new Date(st.ultimaConclusao).getTime()) / 86400000;
    if (dias > 31) {
      console.log('Base com mais de 31 dias — iniciando atualização automática da Receita.');
      executarImportacao().catch((e) => console.error('Atualização automática falhou:', e.message));
    }
  } catch (e) { console.error('Agendador:', e.message); }
}, 12 * 60 * 60 * 1000);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Fourlink Prospector rodando na porta ${PORT}`));
