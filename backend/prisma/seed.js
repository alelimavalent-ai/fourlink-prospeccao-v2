// Cria os admins e configuracoes iniciais (roda em todo start; so insere se nao existir)
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const admins = [
    { nome: 'Valentim', email: 'valentim@fourlinkempresas.com.br' },
    { nome: 'Lene Silva', email: 'lene@fourlinkempresas.com.br' },
  ];
  const senhaInicial = process.env.ADMIN_SENHA_INICIAL || 'Fourlink@2026!';

  for (const a of admins) {
    const existe = await prisma.usuario.findUnique({ where: { email: a.email } });
    if (!existe) {
      await prisma.usuario.create({
        data: {
          nome: a.nome,
          email: a.email,
          senhaHash: await bcrypt.hash(senhaInicial, 10),
          role: 'ADMIN',
        },
      });
      console.log('Admin criado: ' + a.email);
    }
  }

  const limite = await prisma.config.findUnique({ where: { chave: 'limite_extracao' } });
  if (!limite) {
    await prisma.config.create({ data: { chave: 'limite_extracao', valor: '200' } });
    console.log('Config limite_extracao = 200');
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
