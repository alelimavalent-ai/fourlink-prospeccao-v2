# Fourlink Prospector — Módulos 1 e 2

Sistema interno de prospecção B2B da Fourlink Telecom (RJ · MG · ES).

**Módulo 1 entregue:** estrutura do projeto, banco PostgreSQL, login multiusuário (Admin/Vendedor), gestão de usuários, limite de extração configurável e painel inicial.

---

## 🚀 Como colocar no ar (Railway) — passo a passo

### 1. Suba o projeto no GitHub
1. Acesse github.com e crie um repositório novo chamado `fourlink-prospector` (privado).
2. Envie todos os arquivos desta pasta para o repositório (pode arrastar pelo site do GitHub: "uploading an existing file").

### 2. Crie o projeto na Railway
1. Acesse **railway.app** e entre com sua conta do GitHub.
2. Clique em **New Project → Deploy from GitHub repo** e escolha `fourlink-prospector`.
3. No projeto, clique em **+ New → Database → PostgreSQL** (a Railway cria o banco sozinha).

### 3. Configure as variáveis (aba Variables do serviço web)
| Variável | Valor |
|---|---|
| `DATABASE_URL` | clique em "Add Reference" e escolha a do PostgreSQL |
| `JWT_SECRET` | qualquer frase longa e secreta (ex: gerada em 1password) |
| `ADMIN_SENHA_INICIAL` | senha inicial dos admins (opcional; padrão Fourlink@2026!) |

### 4. Deploy
A Railway detecta o Node e roda tudo sozinha: instala, builda o painel e sobe o servidor.
Quando aparecer "Fourlink Prospector rodando", clique em **Settings → Generate Domain** para ter a URL de acesso.

### 5. Domínio próprio (opcional)
Em Settings → Custom Domain, adicione `prospector.fourlinkempresas.com` e crie o CNAME no Cloudflare apontando para o endereço que a Railway mostrar.

---

## 🔑 Primeiro acesso
- **valentim@fourlinkempresas.com.br** / senha inicial
- **lene@fourlinkempresas.com.br** / senha inicial

⚠️ Troquem a senha no primeiro login (menu Configurações → Trocar minha senha).

Depois, criem os vendedores em **Usuários** (nível Vendedor).

---

## 📦 Estrutura
- `backend/` — API Node/Express + Prisma (PostgreSQL)
- `frontend/` — Painel React/Vite (identidade navy + vermelho Fourlink)
- Login JWT com validade de 12h · Usuários Admin e Vendedor
- Banco já preparado para os próximos módulos (empresas da Receita, viabilidade, extrações)

## 📥 Módulo 2 — Importador da Receita Federal
- Menu **Base de Dados** (só admins): botão "Atualizar base agora" + progresso em tempo real
- Baixa os dados abertos oficiais do CNPJ, filtra **RJ, MG e ES** e importa **só empresas ATIVAS**
- Traz: razão social, nome fantasia, CNAE, endereço completo, CEP, telefones, e-mail, porte e MEI
- Se o servidor reiniciar no meio, a importação **retoma de onde parou**
- Depois da 1ª importação, o sistema se atualiza sozinho todo mês (desligue com a variável `AUTO_IMPORT=false`)
- A 1ª importação completa pode levar algumas horas — acompanhe pela tela, ou feche e volte depois

## 🗺️ Próximos módulos
3. Importador das 4 bases de viabilidade + cruzamento por CEP e número
4. Tela de Prospecção: filtros, atribuição de leads, exportação Excel e botão WhatsApp
5. Extras: histórico por vendedor e integração WhatsApp via whatsmeow (QR Code)
