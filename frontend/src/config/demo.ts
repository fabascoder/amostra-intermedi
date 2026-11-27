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
 * `whatsapp`: número com DDI e DDD (ex.: "5519999999999"). Preenchido, a tela
 * de fim mostra o botão "Pedir novo acesso pelo WhatsApp" com o nome do visitante.
 */
export const CONTACT: { whatsapp: string; email: string; phone: string; site: string } = {
  whatsapp: "5511986063276",
  email: "",
  phone: "",
  site: "",
};

/**
 * Vídeo da plataforma completa (como o Intermedi realmente é). Enquanto estiver
 * vazio, o botão "Ver vídeo da plataforma" avisa que o vídeo chega em breve.
 */
export const VIDEO_PLATAFORMA_URL = "https://www.youtube.com/watch?v=jxfoUBurNJ8";

/**
 * Auvox, a equipe por trás do Intermedi: site e Instagram usados nos convites
 * que aparecem depois das três experiências. Sem Instagram preenchido, o
 * convite dele avisa que o perfil chega em breve.
 */
export const AUVOX: { site: string; instagram: string } = {
  site: "https://auvox.vercel.app",
  instagram: "auvox.company",
};

/** Intervalo entre os convites depois das três experiências. */
export const CONVITE_INTERVALO_MS = 2 * 60 * 1000;

/**
 * Lançamento da amostra (horário de Brasília, -03:00). Antes deste instante,
 * qualquer endereço mostra só a contagem regressiva (pages/Contagem.tsx); no
 * segundo exato o app abre sozinho, sem precisar de novo deploy.
 * `null` desliga a contagem.
 */
export const LANCAMENTO: string | null = "2026-12-01T00:00:00-03:00";
