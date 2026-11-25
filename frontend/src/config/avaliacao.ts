// Para onde vão as avaliações dos visitantes: um Google Forms da equipe.
// As respostas caem na planilha do formulário; não passa por back-end nem banco.
//
// Como preencher (Google Forms → ⋮ → "Gerar link pré-preenchido"):
//   link gerado: https://docs.google.com/forms/d/e/<ID>/viewform?usp=pp_url&entry.111=5&entry.222=geral&entry.333=teste
//   • FORMS_ID        → o <ID> do link
//   • ENTRADAS.nota   → "entry.111" (pergunta da nota, 1 a 5)
//   • ENTRADAS.alvo   → "entry.222" (o que está avaliando)
//   • ENTRADAS.comentario → "entry.333"
// O formulário precisa aceitar respostas sem login: desligue "Coletar e-mails"
// e "Limitar a 1 resposta" nas configurações.
//
// Enquanto FORMS_ID estiver vazio, a avaliação fica só no navegador (como antes).

export const FORMS_ID = "1FAIpQLScbmFC9XQXvwkGGl-D6CcfQd5wtctlzICwH2MKI4hJK3wjjmw";

export const ENTRADAS = {
  nota: "entry.92885925",
  alvo: "entry.627285629",
  comentario: "entry.674250888",
  // nome digitado no início da demonstração (vazio = não envia)
  nome: "entry.1658178487",
};

export const formsConfigurado = (): boolean =>
  Boolean(FORMS_ID && ENTRADAS.nota && ENTRADAS.alvo && ENTRADAS.comentario);

export const urlRespostaForms = (): string =>
  `https://docs.google.com/forms/d/e/${FORMS_ID}/formResponse`;
