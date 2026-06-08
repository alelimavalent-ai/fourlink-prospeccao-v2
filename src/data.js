export const NICHOS_LIST = [
  "Advocacia","Clínicas & Estética","Consultoria Empresarial",
  "Vendas B2B / Distribuidora","Contabilidade","Imobiliárias",
  "Logística & Transporte","Tecnologia & TI","Educação Corporativa","Construção Civil"
];
export const NICHOS = ["Todos os nichos", ...NICHOS_LIST];
export const STATUS_OPTIONS = ["Novo","Contato Feito","Proposta Enviada","Negociando","Convertido","Sem Interesse"];
export const PRIORIDADE_OPTIONS = ["Alta","Média","Baixa"];
export const UF_OPTIONS = ["MG","RJ","ES"];

export const STATUS_COLORS = {
  "Novo":            { bg:"bg-blue-500/20",   text:"text-blue-300",   dot:"bg-blue-400"   },
  "Contato Feito":   { bg:"bg-yellow-500/20", text:"text-yellow-300", dot:"bg-yellow-400" },
  "Proposta Enviada":{ bg:"bg-purple-500/20", text:"text-purple-300", dot:"bg-purple-400" },
  "Negociando":      { bg:"bg-orange-500/20", text:"text-orange-300", dot:"bg-orange-400" },
  "Convertido":      { bg:"bg-green-500/20",  text:"text-green-300",  dot:"bg-green-400"  },
  "Sem Interesse":   { bg:"bg-gray-500/20",   text:"text-gray-400",   dot:"bg-gray-500"   },
};

export const PRIORIDADE_COLORS = {
  "Alta":  { text:"text-red-400",    bg:"bg-red-500/20",    label:"🔴" },
  "Média": { text:"text-yellow-400", bg:"bg-yellow-500/20", label:"🟡" },
  "Baixa": { text:"text-gray-400",   bg:"bg-gray-500/20",   label:"⚪" },
};

export const NICHO_BAR_COLORS = [
  "bg-red-500","bg-purple-500","bg-blue-500",
  "bg-yellow-500","bg-green-500","bg-pink-500"
];

export const EMPTY_FORM = {
  empresa:"", contato:"", telefone:"", cidade:"", uf:"MG",
  nicho: NICHOS_LIST[0], funcionarios:"1-5",
  status:"Novo", prioridade:"Alta", score:7, observacao:"", cnpj:""
};

export const INITIAL_PROSPECTS = [
  { id:1,  empresa:"Escritório Advocacia Mendes",   contato:"Dr. Carlos Mendes",  telefone:"(21) 99999-0001", cidade:"Rio de Janeiro",  uf:"RJ", nicho:"Advocacia",                funcionarios:"20-40",  status:"Novo",             prioridade:"Alta",  score:9,  observacao:"Usa Vivo, contrato vence em agosto",              cnpj:"12.345.678/0001-90" },
  { id:2,  empresa:"Clínica Estética Bella",        contato:"Dra. Ana Paula",     telefone:"(31) 98888-0002", cidade:"Belo Horizonte",  uf:"MG", nicho:"Clínicas & Estética",      funcionarios:"5-10",   status:"Contato Feito",    prioridade:"Alta",  score:8,  observacao:"Interessada em plano para 5 chips",               cnpj:"98.765.432/0001-10" },
  { id:3,  empresa:"Consultor Empresarial BH",      contato:"Marcos Lima",        telefone:"(31) 97777-0003", cidade:"Belo Horizonte",  uf:"MG", nicho:"Consultoria Empresarial",  funcionarios:"1-5",    status:"Proposta Enviada", prioridade:"Alta",  score:8,  observacao:"Aguardando aprovação do gestor",                  cnpj:"11.222.333/0001-44" },
  { id:4,  empresa:"Distribuidora JK Alimentos",   contato:"João Kleber",        telefone:"(27) 96666-0004", cidade:"Vitória",         uf:"ES", nicho:"Vendas B2B / Distribuidora",funcionarios:"40-80",  status:"Negociando",       prioridade:"Alta",  score:9,  observacao:"Quer portabilidade de 15 linhas Claro",           cnpj:"44.555.666/0001-77" },
  { id:5,  empresa:"Contabilidade Souza & Cia",    contato:"Fernanda Souza",     telefone:"(21) 95555-0005", cidade:"Niterói",         uf:"RJ", nicho:"Contabilidade",             funcionarios:"10-20",  status:"Novo",             prioridade:"Média", score:6,  observacao:"Indicação de cliente ativo",                      cnpj:"77.888.999/0001-11" },
  { id:6,  empresa:"Imobiliária Costa RJ",         contato:"Paulo Costa",        telefone:"(21) 94444-0006", cidade:"Rio de Janeiro",  uf:"RJ", nicho:"Imobiliárias",              funcionarios:"20-40",  status:"Contato Feito",    prioridade:"Média", score:5,  observacao:"Ligação feita, aguardando retorno",               cnpj:"55.666.777/0001-22" },
  { id:7,  empresa:"LogisTrans Vitória",           contato:"Renato Vieira",      telefone:"(27) 93333-0007", cidade:"Vila Velha",      uf:"ES", nicho:"Logística & Transporte",    funcionarios:"40-80",  status:"Novo",             prioridade:"Alta",  score:8,  observacao:"Frota com 30 motoristas sem plano corporativo",   cnpj:"33.444.555/0001-66" },
  { id:8,  empresa:"Tech Solutions MG",            contato:"Rodrigo Alves",      telefone:"(31) 92222-0008", cidade:"Contagem",        uf:"MG", nicho:"Tecnologia & TI",           funcionarios:"10-20",  status:"Proposta Enviada", prioridade:"Alta",  score:9,  observacao:"Precisa de chip + fibra ultrafibra CNPJ",         cnpj:"88.999.000/0001-33" },
  { id:9,  empresa:"Escola Corp Saber",            contato:"Marina Torres",      telefone:"(21) 91111-0009", cidade:"Rio de Janeiro",  uf:"RJ", nicho:"Educação Corporativa",       funcionarios:"20-40",  status:"Sem Interesse",    prioridade:"Baixa", score:3,  observacao:"Contrato longo com Oi, retornar em 2027",         cnpj:"22.333.444/0001-55" },
  { id:10, empresa:"Construtora Horizonte ES",     contato:"Fábio Horizonte",    telefone:"(27) 90000-0010", cidade:"Cachoeiro",       uf:"ES", nicho:"Construção Civil",           funcionarios:"80-200", status:"Negociando",       prioridade:"Alta",  score:10, observacao:"Operação grande, 50+ linhas, prazo urgente",      cnpj:"66.777.888/0001-99" },
  { id:11, empresa:"Advocacia Pereira & Filhos",   contato:"Dra. Luísa Pereira", telefone:"(31) 99111-1111", cidade:"Uberlândia",      uf:"MG", nicho:"Advocacia",                funcionarios:"10-20",  status:"Novo",             prioridade:"Média", score:6,  observacao:"Encontrada no Google Maps",                       cnpj:"13.246.579/0001-80" },
  { id:12, empresa:"Farmácia Popular BH",          contato:"Carlos Eduardo",     telefone:"(31) 98222-2222", cidade:"Belo Horizonte",  uf:"MG", nicho:"Clínicas & Estética",      funcionarios:"5-10",   status:"Contato Feito",    prioridade:"Média", score:5,  observacao:"WhatsApp enviado, sem resposta ainda",            cnpj:"14.357.680/0001-71" },
];
