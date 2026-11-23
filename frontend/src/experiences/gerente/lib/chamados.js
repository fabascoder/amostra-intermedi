// Trecho de services/chamados.js do intermedi-frontend: rótulos dos pedidos
// entre farmácias e formatação de datas. Única mudança: dataDoChamado também
// aceita milissegundos (a demonstração guarda timestamps em vez de texto UTC).

// Status de um pedido entre farmácias (redistribuição)
export const STATUS_PEDIDO = {
  solicitada: { label: "Aguardando resposta", tone: "yellow" },
  aprovada: { label: "Aguardando o preparo", tone: "blue" },
  preparando: { label: "Preparando", tone: "blue" },
  enviada: { label: "A caminho", tone: "purple" },
  recebida: { label: "Entregue", tone: "green" },
  recusada: { label: "Recusado", tone: "red" },
  cancelada: { label: "Cancelado", tone: "neutral" },
};

export const statusPedido = (status) =>
  STATUS_PEDIDO[status] ?? { label: status || "—", tone: "neutral" };

// "1:42" a partir de segundos
export function formatarContagem(segundos) {
  const s = Math.max(0, Math.ceil(segundos));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

// O back envia "AAAA-MM-DD HH:MM:SS" em UTC; a demonstração usa milissegundos.
export function dataDoChamado(valor) {
  if (valor === null || valor === undefined || valor === "") return null;
  if (typeof valor === "number") return Number.isFinite(valor) ? new Date(valor) : null;
  const data = new Date(`${String(valor).replace(" ", "T")}Z`);
  return Number.isNaN(data.getTime()) ? null : data;
}

// "28/09/2026 22:10" no horário local (ano: false → "28/09 22:10")
export function formatarDataChamado(valor, { ano = true } = {}) {
  const data = dataDoChamado(valor);
  if (!data) return "—";
  const dia = data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", ...(ano && { year: "numeric" }) });
  const hora = data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return `${dia} ${hora}`;
}

// "agora", "há 5 min", "há 3 h", "há 2 dias"
export function tempoDesde(valor, agora = Date.now()) {
  const data = dataDoChamado(valor);
  if (!data) return "";
  const minutos = Math.max(0, Math.floor((agora - data.getTime()) / 60000));
  if (minutos < 1) return "agora";
  if (minutos < 60) return `há ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `há ${horas} h`;
  const dias = Math.floor(horas / 24);
  return `há ${dias} ${dias === 1 ? "dia" : "dias"}`;
}
