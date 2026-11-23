// Jeito de falar de cada mascote. O mesmo aviso muda de tom conforme o
// mascote escolhido: Broto é calmo e organizado, Lume é animado e motivador,
// Luar é tranquila e acolhedora.
import type { MascoteId } from "../../demoServices/patientService";

export type Falas = {
  /** Linha abaixo do "Olá, nome" na tela inicial. */
  saudacao: string;
  /** Sem nenhum remédio na rotina. */
  semRotina: string;
  /** Todas as doses de hoje confirmadas. */
  emDia: string;
  /** Próxima dose ainda longe. */
  proxima: (remedio: string, hora: string) => string;
  /** Faltam 30 minutos ou menos. */
  quaseHora: (remedio: string) => string;
  /** Passou do horário e não foi confirmada. */
  atrasada: (remedio: string, hora: string) => string;
  /** Logo depois de tocar em "Tomei". */
  tomou: string;
  /** Chat: apresentação e convite. */
  chatOla: (nome: string) => string;
  chatConvite: string;
  pensando: string;
  /** Chat: encontrou o remédio em N farmácias. */
  encontrou: (remedio: string, farmacias: number) => string;
  emFalta: (remedio: string) => string;
  naoEntendi: string;
  /** Notificação de dose. */
  notificacao: (remedio: string) => string;
};

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

export const FALAS: Record<MascoteId, Falas> = {
  broto: {
    saudacao: "Vamos deixar o seu dia em ordem?",
    semRotina: "Me conta quais remédios você toma. Eu organizo os horários e te lembro na hora certa.",
    emDia: "Todas as doses de hoje estão marcadas. Tudo em ordem por aqui.",
    proxima: (r, h) => `Sua próxima dose é ${r}, às ${h}. Já deixei anotado.`,
    quaseHora: (r) => `Está quase na hora de tomar ${r}. Separe um copo d'água.`,
    atrasada: (r, h) => `A dose de ${r} das ${h} ainda não foi marcada. Quando tomar, me avisa que eu anoto.`,
    tomou: "Anotado. Dose registrada.",
    chatOla: (n) => `Oi, ${n}! Eu sou o Broto.`,
    chatConvite: "Pergunte onde tem um remédio, se precisa de receita ou como usar o app. Eu respondo com calma.",
    pensando: "Broto está conferindo as farmácias…",
    encontrou: (r, n) => `Conferi aqui: tem ${r} em ${plural(n, "farmácia", "farmácias")}.`,
    emFalta: (r) => `Conferi todas as farmácias e ${r} está em falta agora. Vale tentar de novo mais tarde.`,
    naoEntendi: "Não entendi direito. Posso procurar um remédio pelo nome, mostrar farmácias com estoque ou explicar como usar o app.",
    notificacao: (r) => `Hora de tomar ${r}`,
  },
  lume: {
    saudacao: "Bora cuidar de você hoje?",
    semRotina: "Vamos montar sua rotina? Eu te lembro de cada dose e a gente comemora junto!",
    emDia: "Todas as doses tomadas! Você está mandando muito bem!",
    proxima: (r, h) => `Próxima parada: ${r}, às ${h}. Você consegue!`,
    quaseHora: (r) => `Tá chegando a hora de tomar ${r}! Prepara a água!`,
    atrasada: (r, h) => `Ei! A dose de ${r} das ${h} está esperando você. Bora tomar?`,
    tomou: "Isso aí! Mais uma dose na conta!",
    chatOla: (n) => `E aí, ${n}! Eu sou o Lume!`,
    chatConvite: "Manda sua pergunta: onde tem remédio, receita, lembretes… Eu resolvo rapidinho!",
    pensando: "Lume está correndo atrás das farmácias…",
    encontrou: (r, n) => `Achei! Tem ${r} em ${plural(n, "farmácia", "farmácias")}!`,
    emFalta: (r) => `Poxa, ${r} está em falta agora. Mas não desanima: tenta de novo daqui a pouco!`,
    naoEntendi: "Opa, não peguei essa! Me fala o nome de um remédio que eu procuro, ou pergunte sobre receita e lembretes!",
    notificacao: (r) => `Bora tomar ${r}!`,
  },
  luar: {
    saudacao: "Respira fundo. Como você está se sentindo hoje?",
    semRotina: "Quando quiser, me conte seus remédios. Eu lembro por você, com carinho.",
    emDia: "Você cuidou bem de você hoje. Agora descanse, você merece.",
    proxima: (r, h) => `Com calma: sua próxima dose é ${r}, às ${h}. Estou aqui com você.`,
    quaseHora: (r) => `Daqui a pouquinho é hora de tomar ${r}. Sem pressa, tá bom?`,
    atrasada: (r, h) => `Tudo bem se esqueceu. A dose de ${r} das ${h} ainda está te esperando.`,
    tomou: "Que bom que você se cuidou. Registrei com carinho.",
    chatOla: (n) => `Olá, ${n}. Eu sou a Luar.`,
    chatConvite: "Pode perguntar com calma: onde tem um remédio, receitas ou lembretes. Estou aqui para ajudar.",
    pensando: "Luar está procurando com cuidado…",
    encontrou: (r, n) => `Encontrei ${r} em ${plural(n, "farmácia", "farmácias")} perto de você.`,
    emFalta: (r) => `Sinto muito, ${r} está em falta agora. Se precisar, converse com o farmacêutico sobre alternativas.`,
    naoEntendi: "Não consegui entender, mas está tudo bem. Você pode me dizer o nome de um remédio ou perguntar sobre receitas e lembretes.",
    notificacao: (r) => `Um lembrete com carinho: ${r}`,
  },
};
