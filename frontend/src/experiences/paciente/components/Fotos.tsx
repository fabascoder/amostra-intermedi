// "Fotos" da demonstração: ilustrações desenhadas em SVG, já que a amostra
// não tem imagens reais. A caixa do remédio segue as regras das embalagens
// brasileiras: faixa amarela com "G" nos genéricos e tarja vermelha ou preta
// quando o remédio exige receita. A farmácia aparece pela fachada.
import { useId } from "react";
import type { Farmacia, Remedio } from "../../../types";
import { tomPrincipal, type Tom } from "../dados";

const COR_TOM: Record<Tom, [string, string]> = {
  green: ["#1e9e6a", "#e3f4ea"],
  orange: ["#e2662b", "#fdeee7"],
  blue: ["#2f5bd3", "#e9effb"],
  purple: ["#7653d6", "#f1edfc"],
  red: ["#c8343f", "#fce8ea"],
  amber: ["#d48a12", "#fff1dc"],
  neutral: ["#55625d", "#f0f3f1"],
  cat: ["#1e9e6a", "#e3f4ea"],
};

export const corDoRemedio = (r: Remedio) => COR_TOM[tomPrincipal(r)];

/** Caixa do remédio em perspectiva, com nome, dosagem, faixa de genérico e tarja. */
export function FotoRemedio({ remedio, tamanho = 64, fundo = true, className = "" }: { remedio: Remedio; tamanho?: number; fundo?: boolean; className?: string }) {
  const [cor, suave] = corDoRemedio(remedio);
  const generico = remedio.tipo === "generico";
  const tarja = remedio.tarjaRemedio === "preta" ? "#1d1d1f" : remedio.tarjaRemedio === "sem_tarja" ? null : "#d32f2f";
  const capsula = /c[aá]psul/i.test(remedio.formaFarmaceutica);
  const nome = remedio.nomeRemedio.split(" ")[0];
  const desenho = remedio.idRemedio % 3;
  const g = useId().replace(/:/g, "");
  return (
    <span
      className={`a-foto-remedio ${className}`}
      style={{ width: tamanho, height: tamanho, borderRadius: tamanho * 0.28, background: fundo ? suave : "transparent" }}
      role="img"
      aria-label={`Caixa de ${remedio.nomeRemedio} ${remedio.dosagemRemedio}`}
    >
      <svg viewBox="10 16 100 96" width="100%" height="100%" aria-hidden="true">
        <defs>
          <linearGradient id={`${g}-luz`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fff" />
            <stop offset="1" stopColor="#eef1f3" />
          </linearGradient>
        </defs>
        <ellipse cx="62" cy="104" rx="40" ry="5" fill="rgba(0,0,0,.1)" />
        {/* topo e lateral */}
        <path d="M20 36 L36 26 L104 26 L88 36 Z" fill="#f7f8fa" />
        <path d="M88 36 L104 26 L104 88 L88 98 Z" fill="#dfe4e8" />
        <path d="M88 36 L104 26 L104 44 L88 54 Z" fill={cor} opacity=".85" />
        {/* frente */}
        <rect x="20" y="36" width="68" height="62" fill={`url(#${g}-luz)`} />
        <rect x="20" y="36" width="68" height="18" fill={cor} />
        {desenho === 0 && <circle cx="80" cy="45" r="13" fill="#fff" opacity=".18" />}
        {desenho === 1 && <path d="M20 50 Q44 40 88 48 V54 H20 Z" fill="#fff" opacity=".18" />}
        {desenho === 2 && <rect x="64" y="36" width="10" height="18" fill="#fff" opacity=".16" />}
        <text x="24" y="49" fill="#fff" fontFamily="Poppins, sans-serif" fontWeight="700" fontSize="10" textLength={Math.min(58, nome.length * 6.4)} lengthAdjust="spacingAndGlyphs">
          {nome}
        </text>
        <text x="24" y="66" fill={cor} fontFamily="Poppins, sans-serif" fontWeight="700" fontSize="9">{remedio.dosagemRemedio}</text>
        {/* comprimido ou cápsula desenhado na frente */}
        {capsula ? (
          <g transform="translate(58 70) rotate(-20)">
            <rect x="0" y="0" width="22" height="9" rx="4.5" fill="#fff" stroke="#d5dbe0" />
            <rect x="0" y="0" width="11" height="9" rx="4.5" fill={cor} />
          </g>
        ) : (
          <g>
            <circle cx="72" cy="74" r="7" fill="#fff" stroke="#d5dbe0" />
            <path d="M72 68.5 V79.5" stroke="#d5dbe0" strokeWidth="1.2" />
          </g>
        )}
        {generico && (
          <g>
            <rect x="20" y="72" width="30" height="12" fill="#ffd400" />
            <text x="24" y="81.5" fill="#1d1d1f" fontFamily="Poppins, sans-serif" fontWeight="800" fontSize="9">G</text>
            <text x="31" y="80.5" fill="#1d1d1f" fontFamily="Poppins, sans-serif" fontWeight="600" fontSize="4.4">Genérico</text>
          </g>
        )}
        {tarja && <rect x="20" y="90" width="68" height="8" fill={tarja} />}
        <path d="M20 36 L36 26 L104 26 L104 88 L88 98 L20 98 Z" fill="none" stroke="rgba(0,0,0,.08)" />
      </svg>
    </span>
  );
}

const PALETAS_FARMACIA: { toldo: string; ceu: [string, string]; placa: string }[] = [
  { toldo: "#0e6b50", ceu: ["#cfe9f7", "#f3fafc"], placa: "#0e6b50" },
  { toldo: "#2f5bd3", ceu: ["#dbe6fb", "#f6f9ff"], placa: "#1f3f9a" },
  { toldo: "#0f8a8a", ceu: ["#d4f0ee", "#f4fbfa"], placa: "#0b6b6b" },
  { toldo: "#d0602e", ceu: ["#fde3d3", "#fff8f3"], placa: "#a8451c" },
  { toldo: "#7653d6", ceu: ["#e6ddfb", "#faf8ff"], placa: "#5a3db0" },
];

/** Fachada da farmácia: placa com o nome, toldo listrado, vitrines e a cruz. */
export function FotoFarmacia({ farmacia, altura = 132, className = "" }: { farmacia: Farmacia; altura?: number; className?: string }) {
  const p = PALETAS_FARMACIA[(farmacia.idFarmacia - 1) % PALETAS_FARMACIA.length];
  const g = useId().replace(/:/g, "");
  const nome = farmacia.nomeFarmacia.toUpperCase();
  return (
    <span className={`a-foto-farmacia ${className}`} style={{ height: altura }} role="img" aria-label={`Fachada da ${farmacia.nomeFarmacia}`}>
      <svg viewBox="0 0 320 150" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <linearGradient id={`${g}-ceu`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={p.ceu[0]} />
            <stop offset="1" stopColor={p.ceu[1]} />
          </linearGradient>
          <linearGradient id={`${g}-vidro`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#d9eef5" />
            <stop offset="1" stopColor="#a9cbd8" />
          </linearGradient>
          <pattern id={`${g}-listras`} width="20" height="20" patternUnits="userSpaceOnUse">
            <rect width="10" height="20" fill={p.toldo} />
            <rect x="10" width="10" height="20" fill="#fff" />
          </pattern>
        </defs>
        <rect width="320" height="150" fill={`url(#${g}-ceu)`} />
        <circle cx="270" cy="28" r="14" fill="#fff" opacity=".7" />
        {/* prédio */}
        <rect x="40" y="30" width="240" height="112" fill="#f4f1ea" />
        <rect x="40" y="30" width="240" height="6" fill="#e3ddd0" />
        {/* placa */}
        <rect x="58" y="40" width="204" height="24" rx="4" fill={p.placa} />
        <text x="160" y="56.5" textAnchor="middle" fill="#fff" fontFamily="Poppins, sans-serif" fontWeight="700" fontSize="11" textLength={Math.min(184, nome.length * 8.2)} lengthAdjust="spacingAndGlyphs">
          {nome}
        </text>
        {/* toldo */}
        <path d="M48 68 H272 L264 82 H56 Z" fill={`url(#${g}-listras)`} />
        <path d="M56 82 H264" stroke="rgba(0,0,0,.12)" strokeWidth="2" />
        {/* vitrines com prateleiras */}
        {[64, 196].map((x) => (
          <g key={x}>
            <rect x={x} y="88" width="60" height="44" rx="2" fill={`url(#${g}-vidro)`} />
            <rect x={x + 4} y="104" width="52" height="2" fill="#fff" opacity=".8" />
            <rect x={x + 4} y="120" width="52" height="2" fill="#fff" opacity=".8" />
            {[0, 1, 2, 3, 4].map((i) => (
              <rect key={i} x={x + 6 + i * 10} y={96 + (i % 2) * 2} width="7" height={8 - (i % 2) * 2} fill={["#e2662b", "#2f5bd3", "#1e9e6a", "#ffd400", "#c8343f"][(i + farmacia.idFarmacia) % 5]} opacity=".85" />
            ))}
            {[0, 1, 2, 3].map((i) => (
              <rect key={`b${i}`} x={x + 8 + i * 12} y={112 + (i % 2)} width="8" height={7 - (i % 2)} fill={["#7653d6", "#1e9e6a", "#e2662b", "#2f5bd3"][(i + farmacia.idFarmacia) % 4]} opacity=".8" />
            ))}
            <path d={`M${x + 6} 90 L${x + 22} 90 L${x + 6} 106 Z`} fill="#fff" opacity=".35" />
          </g>
        ))}
        {/* porta */}
        <rect x="136" y="88" width="48" height="54" fill="#2c3e44" />
        <rect x="139" y="91" width="20" height="51" fill={`url(#${g}-vidro)`} />
        <rect x="161" y="91" width="20" height="51" fill={`url(#${g}-vidro)`} />
        {/* cruz luminosa */}
        <g transform="translate(286 70)">
          <rect x="-2" y="-14" width="4" height="14" fill="#9aa3a6" />
          <rect x="-10" y="-34" width="20" height="20" rx="3" fill="#fff" />
          <path d="M-3 -31 H3 V-27 H7 V-21 H3 V-17 H-3 V-21 H-7 V-27 H-3 Z" fill="#22b45e" />
        </g>
        {/* calçada */}
        <rect y="142" width="320" height="8" fill="#d8d4cc" />
      </svg>
    </span>
  );
}
