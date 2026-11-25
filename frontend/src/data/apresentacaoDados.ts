// Bastidores da apresentação do TCC: quem apresentou cada parte e uma
// explicação curta de cada slide. Só dados (sem imports), para também gerar
// a versão em artefato a partir deste mesmo arquivo.
//
// Para trocar ou incluir a imagem de um slide: salve em src/assets/slides
// como <arquivo>.webp e <arquivo>-mini.webp e preencha `arquivo` abaixo.
// Slide sem `arquivo` aparece como "imagem ainda não enviada".

export type Slide = {
  /** Número do slide na apresentação (0 = capa). */
  numero: number;
  titulo: string;
  /** Para slides com várias telas (Histórico, Canvas, modais). */
  parte?: string;
  explicacao: string;
  arquivo?: string;
};

export type Periodo = {
  apresentador: string;
  resumo: string;
  slides: Slide[];
};

const PENDENTE = "A imagem e a explicação deste slide ainda não foram enviadas.";

export const PERIODOS: Periodo[] = [
  {
    apresentador: "Alexandre Santiago",
    resumo: "Abre a apresentação: a empresa Auvox, quem faz parte dela, a dedicatória e a epígrafe.",
    slides: [
      { numero: 0, titulo: "Capa", explicacao: "Abertura com a marca da Auvox e o slogan da empresa: “Onde a inovação tem valor de ouro”.", arquivo: "slide-00" },
      { numero: 1, titulo: "Descrição da Empresa", explicacao: "Apresenta a Auvox, empresa de tecnologia que desenvolve projetos e soluções digitais com foco em inovação, organização e qualidade.", arquivo: "slide-01" },
      { numero: 2, titulo: "Integrantes", explicacao: "Os dez integrantes da equipe Auvox.", arquivo: "slide-02" },
      { numero: 3, titulo: "Dedicatória", explicacao: "Agradecimento a Deus, aos professores, à família, aos amigos e ao Grupo Auvox pela parceria e pelo trabalho em equipe.", arquivo: "slide-03" },
      { numero: 4, titulo: "Epígrafe", explicacao: "Frase de Ada Lovelace, pioneira da programação, tirada das correspondências com Charles Babbage.", arquivo: "slide-04" },
    ],
  },
  {
    apresentador: "Beatriz",
    resumo: "Conta a história da Auvox, da fundação à definição do projeto, e mostra como a equipe se organiza.",
    slides: [
      { numero: 5, titulo: "Histórico", parte: "Fundação da AUVOX", explicacao: "11/12/2025: a empresa foi fundada pelos membros.", arquivo: "slide-05-a" },
      { numero: 5, titulo: "Histórico", parte: "Definição da IDV", explicacao: "02/03/2026: a identidade visual da empresa foi decidida.", arquivo: "slide-05-b" },
      { numero: 5, titulo: "Histórico", parte: "Desenvolvimento do site", explicacao: "12/03/2026: começo do desenvolvimento do site da empresa.", arquivo: "slide-05-c" },
      { numero: 5, titulo: "Histórico", parte: "Parcerias", explicacao: "21/03/2026: a Auvox iniciou uma parceria com a RazorByte e a SkillDev.", arquivo: "slide-05-d" },
      { numero: 5, titulo: "Histórico", parte: "Definição do tema", explicacao: "06/04/2026: a equipe definiu o tema e a proposta do TCC.", arquivo: "slide-05-e" },
      { numero: 5, titulo: "Histórico", parte: "Definição do projeto", explicacao: "20/05/2026: o nome e os principais direcionamentos do projeto foram definidos.", arquivo: "slide-05-f" },
      { numero: 6, titulo: "Organograma", explicacao: "Como a equipe se organiza: o gerente de projeto; tester, DBA, full-stack, analista e designer; e as frentes de front-end e back-end.", arquivo: "slide-06" },
    ],
  },
  {
    apresentador: "Ana Julia",
    resumo: "Explica a identidade visual da Auvox: o símbolo, as cores e o significado do nome.",
    slides: [
      { numero: 7, titulo: "Identidade Visual", parte: "Símbolo e cores", explicacao: "O símbolo é a letra A de Auvox. A parte dourada representa o ouro (Au) e o azul escuro remete à inovação e à tecnologia.", arquivo: "slide-07" },
      { numero: 8, titulo: "Identidade Visual", parte: "Nome e slogan", explicacao: "AUVOX une AU (ouro) e VOX (voz, em latim): “voz de ouro”. O slogan reforça a ideia de projetos inovadores e de alto valor.", arquivo: "slide-08" },
    ],
  },
  {
    apresentador: "Gabriel",
    resumo: "Apresenta o site institucional da Auvox.",
    slides: [
      { numero: 9, titulo: "Site", explicacao: "Mostra o site da Auvox, desenvolvido pela equipe.", arquivo: "slide-09" },
    ],
  },
  {
    apresentador: "Ariella",
    resumo: "Mostra o problema que o Intermedi resolve e por que ele importa, com dados sobre a distribuição de medicamentos e o caso de Larissa Amorim.",
    slides: [
      { numero: 10, titulo: "Problemas", explicacao: "Enquanto algumas unidades têm medicamentos em excesso, outras enfrentam a falta deles: remédios parados, risco de vencimento e pacientes sem atendimento.", arquivo: "slide-10" },
      { numero: 11, titulo: "Justificativa", explicacao: "Os motivos do projeto: falhas na distribuição e no controle, desperdício por vencimento, falta de integração entre postos, farmácias e sistemas, e a dificuldade de encontrar o remédio disponível.", arquivo: "slide-11" },
      { numero: 11, titulo: "Justificativa", parte: "A distribuição de medicamentos no Brasil", explicacao: "Os números do problema: mais de 50% das unidades com divergências de estoque, 63% dos medicamentos perdidos por vencimento antes da distribuição e 185 pacientes sem acesso a medicamentos já incorporados ao SUS.", arquivo: "slide-12-a" },
      { numero: 11, titulo: "Justificativa", parte: "Larissa Amorim", explicacao: "Larissa esperou 59 dias por um medicamento garantido pela Justiça e faleceu antes de recebê-lo. O caso mostra as falhas no acesso a medicamentos pelo SUS.", arquivo: "slide-12-b" },
    ],
  },
  {
    apresentador: "Fabricio",
    resumo: "Apresenta a solução: duas plataformas digitais interligadas, o aplicativo para a população e o sistema web para as instituições.",
    slides: [
      { numero: 12, titulo: "Solução", explicacao: "O app da população consulta a disponibilidade dos remédios, mostra os mais próximos e traz informações simples para facilitar o tratamento. O sistema web das instituições controla estoque e movimentação, liga postos, farmácias e administradores e abre chamados para reposição.", arquivo: "slide-12" },
    ],
  },
  {
    apresentador: "Miguel",
    resumo: "Explica a identidade visual do Intermedi, o significado do nome e de cada parte do logotipo, e apresenta a marca: saúde, tecnologia e acessibilidade.",
    slides: [
      { numero: 13, titulo: "Identidade Visual", parte: "Inter", explicacao: "\"Inter\" vem de intermediador: a conexão entre pacientes, farmácias e unidades de saúde. As cores da marca são o verde #08b760 e o preto #000000.", arquivo: "slide-13-a" },
      { numero: 13, titulo: "Identidade Visual", parte: "Medi", explicacao: "\"Medi\" vem de medicamento, reforçando o foco principal da plataforma.", arquivo: "slide-13-b" },
      { numero: 13, titulo: "Identidade Visual", parte: "O \"i\" em cápsula", explicacao: "O \"i\" do fim do nome foi redesenhado para lembrar uma pílula ou cápsula.", arquivo: "slide-13-c" },
      { numero: 13, titulo: "Identidade Visual", parte: "A cruz verde", explicacao: "O símbolo verde em volta do nome faz referência à Cruz Vermelha, ou Cruz da Vida, sinal ligado à saúde.", arquivo: "slide-13-d" },
      { numero: 14, titulo: "Intermedi", explicacao: "O Intermedi atua na área da saúde e tecnologia: conecta usuários a farmácias para encontrar medicamentos de forma rápida, prática e acessível.", arquivo: "slide-14" },
    ],
  },
  {
    apresentador: "Eduardo",
    resumo: "Explica o modelo de negócio do Intermedi pelo Canvas, bloco a bloco, e apresenta o slide 16.",
    slides: [
      { numero: 15, titulo: "Canvas", parte: "Proposta de Valor", explicacao: "O que o Intermedi entrega: controle de estoque e conexão entre farmácias, solicitação de lotes, aplicativo para a rede pública, consulta de dados, transparência e agilidade na reposição.", arquivo: "slide-15-a" },
      { numero: 15, titulo: "Canvas", parte: "Atividades Principais", explicacao: "Soluções logísticas para distribuir medicamentos por intermédio da empresa (B2B/C2B) e atendimento a empresas e pacientes da rede pública.", arquivo: "slide-15-b" },
      { numero: 15, titulo: "Canvas", parte: "Recursos Principais", explicacao: "Os sistemas que sustentam o negócio: controle de estoque, solicitação de lotes e o aplicativo do paciente.", arquivo: "slide-15-c" },
      { numero: 15, titulo: "Canvas", parte: "Canais", explicacao: "Atendimento pelo e-mail da empresa e pelas redes sociais (bate-papo).", arquivo: "slide-15-d" },
      { numero: 15, titulo: "Canvas", parte: "Estrutura de Custos", explicacao: "Desenvolvimento e manutenção, servidores e dados, suporte, logística e transporte, segurança da informação e marketing.", arquivo: "slide-15-e" },
      { numero: 15, titulo: "Canvas", parte: "Fontes de Receita", explicacao: "Taxa por volume entregue, contratos de disponibilidade pagos pelo contratante (como o SUS) e investimentos destinados à saúde.", arquivo: "slide-15-f" },
      { numero: 16, titulo: "Slide 16", explicacao: PENDENTE },
    ],
  },
  {
    apresentador: "Alexandre Rafael",
    resumo: "Apresenta os slides 17 a 19.",
    slides: [
      { numero: 17, titulo: "Slide 17", explicacao: PENDENTE },
      { numero: 18, titulo: "Slide 18", explicacao: PENDENTE },
      { numero: 19, titulo: "Slide 19", explicacao: PENDENTE },
    ],
  },
  {
    apresentador: "Matheus",
    resumo: "Fecha a apresentação: as ferramentas usadas, o vídeo do site e do aplicativo, a frase do projeto e os agradecimentos.",
    slides: [
      { numero: 20, titulo: "Ferramentas", explicacao: "O que a equipe usou: Figma, Canva e BR Modelo; Discord, WhatsApp e Trello; MySQL e SQLite; HTML, CSS, JavaScript e TypeScript; Node.js e React; VS Code; Git e GitHub.", arquivo: "slide-20" },
      { numero: 21, titulo: "Site/App", explicacao: "Chamada para o vídeo que mostra o site e o aplicativo do Intermedi.", arquivo: "slide-21" },
      { numero: 22, titulo: "Slide 22", explicacao: PENDENTE },
      { numero: 23, titulo: "Frase", explicacao: "A frase que resume o projeto: “O remédio que te falta é o sintoma de um sistema que não te enxerga!”", arquivo: "slide-23" },
      { numero: 24, titulo: "Agradecimentos/Fim", explicacao: "Encerramento da apresentação: obrigado pela atenção.", arquivo: "slide-24" },
    ],
  },
];

/** "Capa e slides 1 a 4", "Slides 5 e 6", "Slide 9", "Slides 20 a 24" */
export function faixaDeSlides(slides: Slide[]): string {
  const numeros = Array.from(new Set(slides.map((s) => s.numero))).sort((a, b) => a - b);
  const temCapa = numeros[0] === 0;
  const resto = numeros.filter((n) => n > 0);
  let texto = "";
  if (resto.length === 1) texto = `slide ${resto[0]}`;
  else if (resto.length === 2) texto = `slides ${resto[0]} e ${resto[1]}`;
  else if (resto.length > 2) texto = `slides ${resto[0]} a ${resto[resto.length - 1]}`;
  if (temCapa) return texto ? `Capa e ${texto}` : "Capa";
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export const rotuloDoSlide = (s: Slide) => (s.numero === 0 ? "Capa" : String(s.numero));
