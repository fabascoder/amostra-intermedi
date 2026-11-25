// Dados da tela "Bastidores", tirados dos repositórios da Auvox no GitHub
// (intermedi-front-end, intermedi-app e intermedi-back-end), em 24/11/2026:
// - autoria: linhas adicionadas por pessoa nos arquivos de cada tela (git log --numstat);
// - casos de uso: permissões reais das rotas (services/acesso.service.mjs);
// - classes: tabelas do banco (database/schema.sql);
// - linha do tempo: data do primeiro commit de cada parte.

export type PessoaId = "fabricio" | "matheus" | "miguel" | "gabriel" | "eduardo";

export const PESSOAS: { id: PessoaId; nome: string; cor: string; fez: string; commits: number }[] = [
  { id: "fabricio", nome: "Fabrício", cor: "#1f8a5b", fez: "Plataforma web das farmácias, servidor e banco de dados", commits: 157 },
  { id: "matheus", nome: "Matheus", cor: "#2f6fd6", fez: "Aplicativo do paciente, mapa e rotas", commits: 62 },
  { id: "eduardo", nome: "Eduardo Viana", cor: "#d0573c", fez: "Administração no servidor e cadastro de pacientes", commits: 31 },
  { id: "miguel", nome: "Miguel Basaglia", cor: "#c98712", fez: "Login da equipe e telas do gerente", commits: 28 },
  { id: "gabriel", nome: "Gabriel Ancelmo", cor: "#7a55d4", fez: "Painel do administrador", commits: 50 },
];

export type Plataforma = "web" | "app" | "servidor";
export const PLATAFORMAS: Record<Plataforma, { nome: string; repo: string }> = {
  web: { nome: "Plataforma das farmácias", repo: "intermedi-front-end" },
  app: { nome: "Aplicativo do paciente", repo: "intermedi-app" },
  servidor: { nome: "Servidor", repo: "intermedi-back-end" },
};

export type Tela = { plataforma: Plataforma; tela: string; arquivo: string; linhas: number; autores: [PessoaId, number][] };

export const TELAS: Tela[] = [
  { plataforma: "web", tela: "Login da equipe", arquivo: "src/pages/LoginUser.tsx", linhas: 2851, autores: [["fabricio", 51], ["miguel", 42], ["gabriel", 7]] },
  { plataforma: "web", tela: "Visão geral do gerente", arquivo: "src/pages/Manager.jsx", linhas: 4079, autores: [["fabricio", 87], ["miguel", 10], ["eduardo", 3]] },
  { plataforma: "web", tela: "Remédios e estoque", arquivo: "src/pages/ManagerMedicines.jsx", linhas: 734, autores: [["fabricio", 100]] },
  { plataforma: "web", tela: "Pedidos da rede", arquivo: "src/pages/ManagerNetworkOrders.jsx", linhas: 766, autores: [["fabricio", 100]] },
  { plataforma: "web", tela: "Operação 3D", arquivo: "src/pages/ManagerOperacao.jsx", linhas: 2609, autores: [["fabricio", 100]] },
  { plataforma: "web", tela: "Boas-vindas do gerente", arquivo: "src/components/BoasVindas.jsx", linhas: 560, autores: [["fabricio", 100]] },
  { plataforma: "web", tela: "Tela do funcionário", arquivo: "src/pages/Employee.jsx", linhas: 2532, autores: [["fabricio", 87], ["matheus", 8], ["miguel", 5]] },
  { plataforma: "web", tela: "Painel do administrador", arquivo: "src/pages/AdminDashboard.jsx", linhas: 7227, autores: [["fabricio", 59], ["gabriel", 36], ["miguel", 3], ["matheus", 2]] },
  { plataforma: "web", tela: "Desempenho", arquivo: "src/pages/desempenho/", linhas: 855, autores: [["fabricio", 100]] },
  { plataforma: "app", tela: "Início", arquivo: "src/app/(tabs)/index.tsx", linhas: 417, autores: [["matheus", 80], ["fabricio", 20]] },
  { plataforma: "app", tela: "Remédios", arquivo: "src/app/(tabs)/buscar-medicamentos.tsx", linhas: 1040, autores: [["matheus", 88], ["fabricio", 12]] },
  { plataforma: "app", tela: "Farmácias", arquivo: "src/app/(tabs)/farmacias.tsx", linhas: 375, autores: [["matheus", 88], ["fabricio", 12]] },
  { plataforma: "app", tela: "Mapa e rotas", arquivo: "src/app/rota.tsx", linhas: 5266, autores: [["matheus", 100]] },
  { plataforma: "app", tela: "Broto, o assistente", arquivo: "src/app/(tabs)/broto.tsx", linhas: 190, autores: [["matheus", 100]] },
  { plataforma: "app", tela: "Cadastro e mascote", arquivo: "src/app/(auth)/", linhas: 2667, autores: [["matheus", 78], ["fabricio", 18], ["eduardo", 4]] },
  { plataforma: "app", tela: "Comprimidos e lembretes", arquivo: "src/app/comprimidos.tsx", linhas: 335, autores: [["matheus", 100]] },
  { plataforma: "app", tela: "Meus dados", arquivo: "src/app/meus-dados.tsx", linhas: 1287, autores: [["matheus", 100]] },
  { plataforma: "servidor", tela: "Pedidos e chamados", arquivo: "services/redistribuicao.service.mjs", linhas: 793, autores: [["fabricio", 99], ["matheus", 1]] },
  { plataforma: "servidor", tela: "Administração", arquivo: "services/admin.service.mjs", linhas: 1229, autores: [["eduardo", 56], ["fabricio", 43], ["matheus", 1]] },
  { plataforma: "servidor", tela: "Rotas (Valhalla)", arquivo: "sistema-rota/", linhas: 202, autores: [["matheus", 100]] },
  { plataforma: "servidor", tela: "Foto do remédio (OCR)", arquivo: "sistema-foto/", linhas: 103, autores: [["matheus", 100]] },
  { plataforma: "servidor", tela: "Banco de dados", arquivo: "database/schema.sql", linhas: 5056, autores: [["fabricio", 85], ["matheus", 15]] },
  { plataforma: "servidor", tela: "Acesso e login", arquivo: "services/acesso.service.mjs", linhas: 647, autores: [["fabricio", 100]] },
  { plataforma: "servidor", tela: "Rotas do app", arquivo: "routes/app.routes.mjs", linhas: 420, autores: [["fabricio", 53], ["matheus", 47]] },
];

export type GrupoTecnologia = { titulo: string; itens: { nome: string; uso: string }[] };

export const TECNOLOGIAS: GrupoTecnologia[] = [
  {
    titulo: "Plataforma das farmácias",
    itens: [
      { nome: "React 19", uso: "Todas as telas do gerente, do funcionário e do administrador." },
      { nome: "Vite", uso: "Roda o projeto em desenvolvimento e gera a versão publicada." },
      { nome: "React Router", uso: "Navegação entre visão geral, remédios, pedidos e equipe." },
      { nome: "Three.js e React Three Fiber", uso: "Desenha a Operação 3D: a farmácia, o estoque e os caminhões." },
      { nome: "GSAP", uso: "Animações da página inicial do Intermedi." },
      { nome: "Recharts", uso: "Gráficos do painel de desempenho." },
      { nome: "jsPDF", uso: "Relatórios em PDF para baixar." },
    ],
  },
  {
    titulo: "Aplicativo do paciente",
    itens: [
      { nome: "Expo e React Native", uso: "Um só código para Android, iPhone e web." },
      { nome: "Expo Router", uso: "As abas e as telas do aplicativo." },
      { nome: "MapLibre", uso: "O mapa com as farmácias e o trajeto." },
      { nome: "OpenFreeMap", uso: "Os mapas (Liberty, Dark, 3D e os outros modelos)." },
      { nome: "Expo Location", uso: "A localização do paciente para calcular a rota." },
      { nome: "Reanimated", uso: "Animações do mascote e das telas." },
    ],
  },
  {
    titulo: "Servidor",
    itens: [
      { nome: "Node.js 22", uso: "A API que as duas plataformas usam." },
      { nome: "SQLite (node:sqlite)", uso: "O banco: farmácias, estoque, pedidos, pacientes." },
      { nome: "JWT", uso: "Login e permissão de cada rota por papel (paciente, funcionário, gerente, admin)." },
      { nome: "Valhalla", uso: "Calcula o trajeto pelas ruas a pé, de carro, moto ou bike." },
      { nome: "Tesseract.js", uso: "Lê o nome do remédio na foto da caixa (OCR)." },
      { nome: "Sharp", uso: "Reduz e converte as fotos enviadas." },
      { nome: "Nodemailer", uso: "E-mails de boas-vindas e de senha." },
    ],
  },
  {
    titulo: "Esta amostra",
    itens: [
      { nome: "React, Vite e TypeScript", uso: "As três experiências num lugar só, sem servidor." },
      { nome: "Armazenamento do navegador", uso: "Guarda sua sessão de 3 horas, os pedidos e a rotina." },
      { nome: "Simulação por horário", uso: "Cada pedido passa por aceite, preparo, transporte e entrega em cerca de 20 segundos." },
      { nome: "MapLibre e Valhalla", uso: "O mesmo mapa e as mesmas rotas do aplicativo." },
    ],
  },
];

export type Ator = "paciente" | "funcionario" | "gerente" | "admin";
export const ATORES: { id: Ator; nome: string }[] = [
  { id: "paciente", nome: "Paciente" },
  { id: "funcionario", nome: "Funcionário" },
  { id: "gerente", nome: "Gerente" },
  { id: "admin", nome: "Administrador" },
];

/** Casos de uso com as rotas que os sustentam (quem pode chamar cada uma vem de acesso.service.mjs). */
export const CASOS_DE_USO: { nome: string; atores: Ator[]; rota: string }[] = [
  { nome: "Criar conta no app", atores: ["paciente"], rota: "POST /api/auth/register" },
  { nome: "Buscar remédio", atores: ["paciente"], rota: "GET /remedios" },
  { nome: "Ver farmácias com estoque", atores: ["paciente"], rota: "GET /farmacia/:id" },
  { nome: "Traçar rota até a farmácia", atores: ["paciente"], rota: "POST /rotas" },
  { nome: "Buscar remédio pela foto", atores: ["paciente"], rota: "sistema-foto (OCR)" },
  { nome: "Montar rotina de doses", atores: ["paciente"], rota: "no aparelho (lembretes)" },
  { nome: "Entrar na plataforma", atores: ["funcionario", "gerente", "admin"], rota: "POST /auth/login" },
  { nome: "Registrar atendimento", atores: ["funcionario", "gerente"], rota: "POST /servicos" },
  { nome: "Pedir reposição ao gerente", atores: ["funcionario"], rota: "POST /funcionario/:id/chamado" },
  { nome: "Preparar envio para outra farmácia", atores: ["funcionario"], rota: "POST /redistribuicao/:id/preparar" },
  { nome: "Consultar estoque da rede", atores: ["funcionario", "gerente"], rota: "GET /farmacia/:id/estoque" },
  { nome: "Responder pedido da equipe", atores: ["gerente"], rota: "PUT /chamado/:id/responder" },
  { nome: "Pedir remédio à rede", atores: ["gerente"], rota: "POST /chamado/:id/redistribuir" },
  { nome: "Aceitar ou recusar pedido da rede", atores: ["gerente"], rota: "PUT /redistribuicao/:id/responder" },
  { nome: "Cuidar do estoque", atores: ["gerente"], rota: "POST /gerente/:id/estoque" },
  { nome: "Cadastrar funcionário", atores: ["gerente"], rota: "POST /funcionario" },
  { nome: "Cadastrar farmácia", atores: ["admin"], rota: "POST /farmacia" },
  { nome: "Cadastrar gerente", atores: ["admin"], rota: "POST /gerente" },
  { nome: "Manter o catálogo de remédios", atores: ["admin"], rota: "POST /remedios" },
  { nome: "Desativar e reativar cadastros", atores: ["admin"], rota: "PUT /farmacia/:id/reativar" },
  { nome: "Acompanhar o desempenho", atores: ["admin"], rota: "GET /analytics/rotas" },
];

export type ClasseId =
  | "admin" | "endereco" | "paciente" | "gerente" | "farmacia" | "servico"
  | "funcionario" | "estoque" | "remedio" | "chamado" | "redistribuicao" | "categoria";

export const CLASSES: { id: ClasseId; nome: string; col: number; lin: number; atributos: string[] }[] = [
  { id: "admin", nome: "Admin", col: 0, lin: 0, atributos: ["id_admin", "nome", "email", "matricula"] },
  { id: "endereco", nome: "Endereço", col: 1, lin: 0, atributos: ["id_endereco", "logradouro", "bairro", "cidade", "latitude", "longitude"] },
  { id: "paciente", nome: "Paciente", col: 2, lin: 0, atributos: ["id_paciente", "nome", "cpf", "email", "foto_perfil"] },
  { id: "gerente", nome: "Gerente", col: 0, lin: 1, atributos: ["id_gerente", "nome", "crf", "matricula", "id_farmacia"] },
  { id: "farmacia", nome: "Farmácia", col: 1, lin: 1, atributos: ["id_farmacia", "nome", "cnes", "telefone", "id_endereco", "ativo"] },
  { id: "servico", nome: "Serviço", col: 2, lin: 1, atributos: ["id_servico", "id_funcionario", "id_paciente", "id_farmacia", "data_servico"] },
  { id: "funcionario", nome: "Funcionário", col: 0, lin: 2, atributos: ["id_funcionario", "nome", "cargo", "turno", "id_farmacia"] },
  { id: "estoque", nome: "Estoque", col: 1, lin: 2, atributos: ["id_estoque", "id_remedio", "id_farmacia", "quantidade", "estoque_minimo", "lote", "validade"] },
  { id: "remedio", nome: "Remédio", col: 2, lin: 2, atributos: ["id_remedio", "nome", "dosagem", "tarja", "tipo", "indicacoes"] },
  { id: "chamado", nome: "Chamado", col: 0, lin: 3, atributos: ["id_chamado", "titulo", "status", "prioridade", "id_funcionario"] },
  { id: "redistribuicao", nome: "Redistribuição", col: 1, lin: 3, atributos: ["id_redistribuicao", "id_farmacia_origem", "id_farmacia_destino", "quantidade", "status", "data_recebimento"] },
  { id: "categoria", nome: "Categoria", col: 2, lin: 3, atributos: ["id_categoria", "nome", "descricao"] },
];

/** Relações das chaves estrangeiras, em frases ("uma Farmácia tem vários Gerentes"). */
export const RELACOES: { de: ClasseId; para: ClasseId; card: [string, string]; frase: string }[] = [
  { de: "admin", para: "gerente", card: ["1", "N"], frase: "O admin cadastra os gerentes" },
  { de: "endereco", para: "farmacia", card: ["1", "1"], frase: "Cada farmácia tem um endereço" },
  { de: "endereco", para: "paciente", card: ["1", "N"], frase: "O paciente tem um endereço" },
  { de: "farmacia", para: "gerente", card: ["1", "N"], frase: "Uma farmácia tem um ou mais gerentes" },
  { de: "gerente", para: "funcionario", card: ["1", "N"], frase: "O gerente cadastra os funcionários" },
  { de: "farmacia", para: "estoque", card: ["1", "N"], frase: "Uma farmácia tem várias linhas de estoque" },
  { de: "remedio", para: "estoque", card: ["1", "N"], frase: "Cada linha de estoque é de um remédio" },
  { de: "remedio", para: "categoria", card: ["N", "N"], frase: "Um remédio está em várias categorias" },
  { de: "paciente", para: "servico", card: ["1", "N"], frase: "O paciente é atendido em serviços" },
  { de: "farmacia", para: "servico", card: ["1", "N"], frase: "O serviço acontece numa farmácia" },
  { de: "servico", para: "remedio", card: ["N", "N"], frase: "Um serviço entrega um ou mais remédios" },
  { de: "funcionario", para: "chamado", card: ["1", "N"], frase: "O funcionário abre chamados de reposição" },
  { de: "chamado", para: "redistribuicao", card: ["1", "N"], frase: "Um chamado vira pedidos para outras farmácias" },
  { de: "farmacia", para: "redistribuicao", card: ["2", "N"], frase: "Cada pedido liga a farmácia que envia e a que recebe" },
  { de: "redistribuicao", para: "remedio", card: ["N", "1"], frase: "Cada pedido é de um remédio" },
];

export const LINHA_DO_TEMPO: { data: string; titulo: string; texto: string; quem: PessoaId[] }[] = [
  { data: "2026-07-26", titulo: "Começa o aplicativo do paciente", texto: "Primeiro commit do intermedi-app, em Expo.", quem: ["matheus"] },
  { data: "2026-09-07", titulo: "Começam a plataforma web e o servidor", texto: "Primeiros commits do intermedi-front-end e do intermedi-back-end, no mesmo dia.", quem: ["fabricio"] },
  { data: "2026-09-18", titulo: "Rotas pelas ruas", texto: "O servidor passa a calcular trajetos com o Valhalla.", quem: ["matheus"] },
  { data: "2026-09-19", titulo: "Painel do administrador", texto: "Primeira versão do painel que cadastra farmácias, gerentes e remédios.", quem: ["gabriel", "fabricio"] },
  { data: "2026-09-21", titulo: "Mapa no aplicativo", texto: "Entra a tela de rota com o MapLibre.", quem: ["matheus"] },
  { data: "2026-09-30", titulo: "Pedidos entre farmácias", texto: "Nasce a redistribuição: uma farmácia pede, a outra aceita e envia.", quem: ["fabricio"] },
  { data: "2026-10-02", titulo: "Remédio pela foto", texto: "O servidor lê o nome do remédio na foto da caixa.", quem: ["matheus"] },
  { data: "2026-10-14", titulo: "Operação 3D", texto: "A farmácia em 3D, com estoque, equipe e caminhões.", quem: ["fabricio"] },
  { data: "2026-10-21", titulo: "Desempenho", texto: "Mapa de calor, rotas mais usadas e saúde do sistema.", quem: ["fabricio"] },
  { data: "2026-11-23", titulo: "Esta amostra", texto: "As três experiências juntas, sem servidor, para a apresentação. Montada com o Claude Code a partir do código das três plataformas.", quem: ["fabricio"] },
];

/**
 * Commits por mês, somando os repositórios: Intermedi (intermedi-front-end,
 * intermedi-back-end e intermedi-app), Auvox (front-end-auvox e back-end-auvox)
 * e esta demo (amostra-intermedi). Contagem de 25/11/2026, sem merges.
 */
export const COMMITS_POR_MES: { mes: string; intermedi: number; auvox: number; demo: number }[] = [
  { mes: "jun", intermedi: 0, auvox: 3, demo: 0 },
  { mes: "jul", intermedi: 2, auvox: 0, demo: 0 },
  { mes: "ago", intermedi: 16, auvox: 2, demo: 0 },
  { mes: "set", intermedi: 112, auvox: 13, demo: 0 },
  { mes: "out", intermedi: 68, auvox: 16, demo: 0 },
  { mes: "nov", intermedi: 44, auvox: 32, demo: 40 },
];

/** Repositórios contados nas estatísticas (nota discreta nos Bastidores). */
export const REPOSITORIOS = [
  "intermedi-front-end", "intermedi-back-end", "intermedi-app", "front-end-auvox", "back-end-auvox", "amostra-intermedi",
];
