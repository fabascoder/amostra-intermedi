// Configuração central do Intermedi Demo.
// Tudo o que define duração, tempos de simulação e contato fica aqui, para
// ajustar a apresentação sem mexer nas telas.

/** Duração padrão da sessão demonstrativa: três horas. */
export const SESSION_DURATION_MS = 3 * 60 * 60 * 1000;

/**
 * Duração efetiva da sessão. Em desenvolvimento é possível reduzi-la para
 * testar a expiração (npm run dev:expira, ou ?demo-duracao=60 na URL antes
 * da primeira experiência). O build de produção sempre usa as três horas.
 */
export function sessionDurationMs(): number {
  if (!import.meta.env.DEV) return SESSION_DURATION_MS;
  try {
    const daUrl = Number(new URLSearchParams(window.location.search).get("demo-duracao"));
    if (Number.isFinite(daUrl) && daUrl >= 10) return daUrl * 1000;
  } catch {
    /* sem URL: segue o padrão */
  }
  const doAmbiente = Number(import.meta.env.VITE_DEMO_SESSION_SECONDS);
  if (Number.isFinite(doAmbiente) && doAmbiente >= 10) return doAmbiente * 1000;
  return SESSION_DURATION_MS;
}

/** Intervalo da verificação periódica de validade da sessão. */
export const SESSION_CHECK_INTERVAL_MS = 15_000;

/** Versão do formato dos dados locais. Mudou o formato: dados antigos são descartados. */
export const STORAGE_VERSION = 1;

export const STORAGE_KEYS = {
  session: "intermedi_demo_session",
  progress: "intermedi_demo_progress",
  orders: "intermedi_demo_orders",
  feedback: "intermedi_demo_feedback",
  patient: "intermedi_demo_patient",
} as const;

/**
 * Contato oficial para pedir novo acesso. Não há contato validado nos
 * projetos originais, então os campos ficam vazios e a tela de sessão
 * encerrada mostra apenas a orientação presencial. Preencha antes de publicar.
 */
export const CONTACT: { email: string; phone: string; site: string } = {
  email: "",
  phone: "",
  site: "",
};
