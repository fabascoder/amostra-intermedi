// Mascotes do intermedi-app (components/ui/mascot.tsx), de react-native-svg
// para SVG da web, com os mesmos desenhos e cores.
import type { MascoteId } from "../demoServices/patientService";

export const MASCOTES: Record<MascoteId, {
  id: MascoteId; nome: string; jeito: string; descricao: string; topo: string; base: string; suave: string; destaque: string; artigo: "o" | "a";
}> = {
  broto: { id: "broto", nome: "Broto", jeito: "Calmo e organizado", artigo: "o", descricao: "Lembra das doses, avisa quando um remédio está acabando e mantém tudo em ordem.", topo: "#178A5E", base: "#D3EBDF", suave: "#E3F1EA", destaque: "#0E6B50" },
  lume: { id: "lume", nome: "Lume", jeito: "Energético e motivador", artigo: "o", descricao: "Incentiva hábitos saudáveis, celebra suas conquistas e ajuda você a manter a motivação.", topo: "#E2662B", base: "#F8D2BD", suave: "#FDEBE2", destaque: "#C2501C" },
  luar: { id: "luar", nome: "Luar", jeito: "Tranquila e acolhedora", artigo: "a", descricao: "Incentiva o descanso, promove o bem-estar e lembra você de cuidar de si com carinho.", topo: "#3D52C4", base: "#CDD6F7", suave: "#ECEBFB", destaque: "#5B3FC4" },
};

function OrnamentoTopo({ id, cor }: { id: MascoteId; cor: string }) {
  if (id === "lume") return <path d="M50 4 C58 14 62 20 58 28 C56 32 53 33 50 33 C45 33 41 29 42 23 C43 19 46 18 46 14 C49 17 49 20 49 22 C52 18 52 10 50 4 Z" fill={cor} />;
  if (id === "luar") return <path d="M54 6 A13 13 0 1 0 64 28 A10 10 0 1 1 54 6 Z" fill={cor} />;
  return (
    <g>
      <path d="M50 32 C50 24 51 18 54 13" stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" fill="none" />
      <path d="M54 14 C56 5 64 2 70 3 C69 10 63 16 54 14 Z" fill="#7FD4A6" />
    </g>
  );
}

function OrnamentoBase({ id, cor }: { id: MascoteId; cor: string }) {
  if (id === "lume") return <path d="M50 112 C55 118 57 122 55 127 C54 130 52 131 50 131 C47 131 44 128 45 124 C46 121 48 120 48 117 C50 119 50 121 50 122 C52 119 51 115 50 112 Z" fill={cor} />;
  if (id === "luar") return <path d="M50 110 L53 119 L62 122 L53 125 L50 134 L47 125 L38 122 L47 119 Z" fill={cor} />;
  return (
    <g>
      <rect x={46} y={113} width={8} height={20} rx={2} fill={cor} />
      <rect x={40} y={119} width={20} height={8} rx={2} fill={cor} />
    </g>
  );
}

/** Mascote de corpo inteiro (cápsula com olhos). */
export function Mascote({ id = "broto", tamanho = 160, sombra = true, className = "" }: { id?: MascoteId; tamanho?: number; sombra?: boolean; className?: string }) {
  const m = MASCOTES[id];
  return (
    <svg className={className} width={tamanho * (100 / 175)} height={tamanho} viewBox="0 0 100 175" role="img" aria-label={`Mascote ${m.nome}`}>
      {sombra && <ellipse cx={50} cy={170} rx={26} ry={3.5} fill="rgba(0,0,0,0.12)" />}
      <OrnamentoTopo id={id} cor={id === "broto" ? m.topo : id === "lume" ? "#F07A33" : "#4B5FD6"} />
      <path d="M20 92 V62 A30 30 0 0 1 80 62 V92 Z" fill={m.topo} />
      <path d="M20 92 H80 V130 A30 30 0 0 1 20 130 Z" fill={m.base} />
      <g className="mascote-olhos">
        <circle cx={40} cy={78} r={5.2} fill="#FFFFFF" />
        <circle cx={60} cy={78} r={5.2} fill="#FFFFFF" />
        <circle cx={41} cy={78.5} r={2.6} fill="#10241C" />
        <circle cx={61} cy={78.5} r={2.6} fill="#10241C" />
      </g>
      <OrnamentoBase id={id} cor={m.topo} />
    </svg>
  );
}

/** Só a "cabeça" do mascote num quadrado arredondado, como um ícone de app. */
export function MascoteAvatar({ id = "broto", tamanho = 56, fundo }: { id?: MascoteId; tamanho?: number; fundo?: string }) {
  const m = MASCOTES[id];
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 100 100" role="img" aria-label={`Mascote ${m.nome}`}>
      <rect x={0} y={0} width={100} height={100} rx={26} fill={fundo ?? m.suave} />
      <g transform="translate(0 6)">
        {id === "broto" ? (
          <g>
            <path d="M50 36 C50 30 51 25 54 21" stroke={m.topo} strokeWidth={3.5} strokeLinecap="round" fill="none" />
            <path d="M54 22 C56 13 64 10 70 11 C69 18 63 24 54 22 Z" fill="#5CC08C" />
          </g>
        ) : (
          <g transform="translate(0 12)"><OrnamentoTopo id={id} cor={m.topo} /></g>
        )}
        <path d="M16 94 V68 A34 34 0 0 1 84 68 V94 Z" fill={m.topo} />
        <circle cx={41} cy={76} r={5.5} fill="#FFFFFF" />
        <circle cx={59} cy={76} r={5.5} fill="#FFFFFF" />
        <circle cx={42} cy={76.5} r={2.8} fill="#10241C" />
        <circle cx={60} cy={76.5} r={2.8} fill="#10241C" />
      </g>
    </svg>
  );
}
