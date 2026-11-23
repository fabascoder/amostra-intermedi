// Estado do paciente demonstrativo no aplicativo: o primeiro nome informado,
// mascote, favoritos, rotina de doses e notificações lidas. Mesmos conceitos
// dos contextos do intermedi-app (user, care e favorites), guardados só no
// navegador e apagados quando a sessão demonstrativa termina.
import { STORAGE_KEYS } from "../config/demo";
import { gravar, ler } from "../lib/storage";
import { createStore, useStore } from "../lib/store";
import { idSessaoAtual, registrarLimpeza, verificarSessao } from "../session/session";

export type MascoteId = "broto" | "lume" | "luar";
export type StatusDose = "tomado" | "pulado";
export type Dose = { id: string; idRemedio: number; horario: string };

export type EstadoPaciente = {
  nome: string;
  mascote: MascoteId;
  favoritosRemedios: number[];
  favoritosFarmacias: number[];
  doses: Dose[];
  /** status das doses por dia: { "2026-11-23": { [idDose]: "tomado" } } */
  historico: Record<string, Record<string, StatusDose>>;
  notificacoesLidas: string[];
};

const INICIAL: EstadoPaciente = {
  nome: "",
  mascote: "broto",
  favoritosRemedios: [],
  favoritosFarmacias: [],
  doses: [],
  historico: {},
  notificacoesLidas: [],
};

const ehEstado = (v: unknown): v is EstadoPaciente => {
  const e = v as EstadoPaciente;
  return Boolean(e) && typeof e.nome === "string" && Array.isArray(e.doses) && Array.isArray(e.favoritosRemedios);
};

const carregar = () => ({ ...INICIAL, ...ler(STORAGE_KEYS.patient, idSessaoAtual(), INICIAL, ehEstado) });
export const pacienteStore = createStore<EstadoPaciente>(carregar());
registrarLimpeza(() => pacienteStore.set(carregar()));

function salvar(mudar: (e: EstadoPaciente) => EstadoPaciente): boolean {
  const sid = idSessaoAtual();
  if (!sid || !verificarSessao()) return false;
  const novo = mudar(pacienteStore.get());
  pacienteStore.set(novo);
  gravar(STORAGE_KEYS.patient, sid, novo);
  return true;
}

export const usePaciente = <S,>(seletor: (e: EstadoPaciente) => S) => useStore(pacienteStore, seletor);

export const diaChave = (data = new Date()) =>
  `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-${String(data.getDate()).padStart(2, "0")}`;
export const minutosDe = (hora: string) => {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + (m || 0);
};
/** "08:00" → "8h", "07:30" → "7h30" (mesmo formato do app original). */
export const formatarHora = (hora: string) => hora.replace(/^0/, "").replace(":", "h").replace(/h00$/, "h");

/** Primeiro nome: só letras, sem espaços extras, até 24 caracteres. */
export function limparNome(texto: string): string {
  return texto.trim().split(/\s+/)[0]?.replace(/[^\p{L}'-]/gu, "").slice(0, 24) ?? "";
}

export function definirNome(nome: string): boolean {
  const limpo = limparNome(nome);
  if (limpo.length < 2) return false;
  const primeira = limpo.charAt(0).toLocaleUpperCase("pt-BR") + limpo.slice(1);
  return salvar((e) => ({ ...e, nome: primeira }));
}

export function escolherMascote(mascote: MascoteId): void {
  salvar((e) => ({ ...e, mascote }));
}

export function alternarFavoritoRemedio(id: number): void {
  salvar((e) => ({
    ...e,
    favoritosRemedios: e.favoritosRemedios.includes(id) ? e.favoritosRemedios.filter((x) => x !== id) : [...e.favoritosRemedios, id],
  }));
}

export function alternarFavoritoFarmacia(id: number): void {
  salvar((e) => ({
    ...e,
    favoritosFarmacias: e.favoritosFarmacias.includes(id) ? e.favoritosFarmacias.filter((x) => x !== id) : [...e.favoritosFarmacias, id],
  }));
}

export function adicionarDose(idRemedio: number, horario: string): void {
  salvar((e) => {
    if (e.doses.some((d) => d.idRemedio === idRemedio && d.horario === horario)) return e;
    const doses = [...e.doses, { id: `${idRemedio}-${horario}`, idRemedio, horario }].sort((a, b) => minutosDe(a.horario) - minutosDe(b.horario));
    return { ...e, doses: doses.slice(0, 12) };
  });
}

export function removerDose(id: string): void {
  salvar((e) => ({ ...e, doses: e.doses.filter((d) => d.id !== id) }));
}

export function marcarDose(id: string, status: StatusDose): void {
  const dia = diaChave();
  salvar((e) => ({ ...e, historico: { [dia]: { ...(e.historico[dia] ?? {}), [id]: status } } }));
}

export function marcarNotificacoesLidas(ids: string[]): void {
  salvar((e) => ({ ...e, notificacoesLidas: Array.from(new Set([...e.notificacoesLidas, ...ids])).slice(-50) }));
}
