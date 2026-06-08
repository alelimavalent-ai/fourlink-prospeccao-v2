# 🚀 Fourlink — Máquina de Prospecção B2B

Dashboard de prospecção B2B para a **Fourlink Telecom** (parceira TIM Empresas, MG/RJ/ES).

---

## ⚡ Rodar localmente

### Pré-requisitos
- Node.js 18+ instalado ([nodejs.org](https://nodejs.org))

### Passos

```bash
# 1. Instalar dependências
npm install

# 2. Iniciar servidor de desenvolvimento
npm run dev
```

Abra http://localhost:5173 no navegador.

---

## 🌐 Deploy na Vercel (gratuito)

### Opção 1 — Via GitHub (recomendado)

1. Faça upload desta pasta para um repositório GitHub (público ou privado)
2. Acesse [vercel.com](https://vercel.com) e clique em **Add New Project**
3. Importe o repositório
4. Configurações automáticas:
   - **Framework:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Clique em **Deploy** ✅

### Opção 2 — Via Vercel CLI

```bash
# Instalar Vercel CLI
npm install -g vercel

# Na pasta do projeto:
vercel

# Seguir as instruções no terminal
# Na primeira vez: vercel --prod para publicar em produção
```

---

## 📁 Estrutura do projeto

```
fourlink-prospeccao/
├── index.html              # HTML raiz
├── vite.config.js          # Config Vite
├── tailwind.config.js      # Config Tailwind CSS
├── postcss.config.js       # PostCSS
├── vercel.json             # Config deploy Vercel (SPA routing)
├── package.json
└── src/
    ├── main.jsx            # Entry point React
    ├── App.jsx             # Componente raiz + estado global
    ├── index.css           # Estilos globais + Tailwind
    ├── data.js             # Dados, constantes, prospects iniciais
    ├── scripts.js          # Scripts CRM por nicho
    └── components/
        ├── Dashboard.jsx       # Tab Dashboard (KPIs, pipeline, top5)
        ├── ProspectsTable.jsx  # Tab Prospects (filtros + tabela)
        ├── ProspectModal.jsx   # Modal edição/cadastro + Script CRM
        ├── NichoCard.jsx       # Card distribuição por nicho
        ├── ScoreBadge.jsx      # Badge colorido de score
        └── Toast.jsx           # Notificação temporária
```

---

## ✨ Funcionalidades

| Feature | Descrição |
|---|---|
| 📊 Dashboard | KPIs, distribuição por nicho, pipeline e top 5 |
| 🎯 Prospects | Tabela com busca, filtros e ordenação |
| ➕ Novo Prospect | Cadastro completo com todos os campos |
| ✏️ Editar | Clique em qualquer linha para editar |
| 🗑️ Deletar | Remove prospect com confirmação via toast |
| 📤 Exportar CSV | Exporta lista filtrada para Excel |
| 📲 Script CRM | WhatsApp + e-mail por nicho, com botão Copiar |

---

## 🎨 Personalização

Para trocar os dados de exemplo, edite `src/data.js` → array `INITIAL_PROSPECTS`.

Para adicionar/editar scripts CRM, edite `src/scripts.js`.

---

**Fourlink Telecom** · contato@fourlinktim.com.br · (21) 98768-1233
