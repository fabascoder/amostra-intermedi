// Geometria da abertura. A marca foi medida no arquivo oficial
// (assets/brand/wordmark-light.png, 581 × 370 px) e é reconstruída em vetor
// para cada peça poder se mover; no fim, a logo oficial em cores assume o
// lugar exato do vetor.

export type Ponto = { x: number; y: number };

/** Marca do Intermedi em coordenadas do wordmark-light.png. */
export const MARCA = {
  /** caixa da tinta (o que é desenhado), usada para posicionar tudo na tela */
  caixa: { x: 11, y: 11, w: 559, h: 354 },
  /**
   * Linha central do contorno da cruz, aberta à direita, onde a palavra passa.
   * Começa na ponta de cima, contorna o braço de cima, o da esquerda e o de
   * baixo, e termina na ponta de baixo.
   */
  cruz: [
    [252, 121.5], [252, 18.5], [120.5, 18.5], [120.5, 121.5], [18.5, 121.5],
    [18.5, 253.5], [120.5, 253.5], [120.5, 356], [252, 356], [252, 253.5],
  ] as const,
  /** raio de cada canto (os cantos internos são vivos) */
  raios: [0, 29.5, 29.5, 0, 29.5, 29.5, 0, 29.5, 29.5, 0] as const,
  traco: 15.5,
  /** "Intermed" em Poppins Bold: cada letra posicionada sobre a do arquivo */
  corpo: 100.7,
  linhaBase: 222.5,
  letras: [["I", 42], ["n", 73], ["t", 143], ["e", 186], ["r", 249], ["m", 291], ["e", 402], ["d", 466]] as const,
  /** o "i" final é uma cápsula com o pingo em cima */
  pingo: { cx: 555.5, cy: 147.5, r: 10.5 },
  capsula: { x: 544, y: 166, w: 24, h: 56, r: 12, traco: 4 },
  capsulaCheia: "M542 193H570V210A14 14 0 0 1 556 224A14 14 0 0 1 542 210Z",
} as const;

/** logo-intermedi.webp (a logo em cores da plataforma) e a caixa da sua tinta. */
export const LOGO_COR = { w: 960, h: 540, caixa: { x: 59, y: 23, w: 806, h: 507 } } as const;

/**
 * Onde cada ponto do contorno fica enquanto é rede: farmácias espalhadas pelo
 * palco (−1 a 1 nos dois eixos). A ordem é a da cruz, então a linha que liga
 * os pontos em sequência é, ao mesmo tempo, a rota da rede e o futuro contorno.
 */
export const CONSTELACAO: readonly (readonly [number, number])[] = [
  [0.8, -0.5], [0.36, -0.88], [-0.24, -0.6], [0.06, -0.1], [-0.74, -0.34],
  [-0.88, 0.36], [-0.16, 0.3], [-0.44, 0.84], [0.34, 0.66], [0.9, 0.16],
];

/** Ligações extras da rede (pares de pontos), desenhadas depois da rota. */
export const CORDAS: readonly (readonly [number, number])[] = [
  [3, 6], [3, 9], [1, 3], [6, 8], [2, 4], [0, 9], [5, 7],
];

/** Remédios indo de uma farmácia a outra (de, para, nota do som). */
export const PULSOS: readonly { de: number; para: number; nota: number }[] = [
  { de: 4, para: 3, nota: 0 },
  { de: 8, para: 6, nota: 2 },
  { de: 3, para: 9, nota: 4 },
  { de: 2, para: 1, nota: 3 },
  { de: 6, para: 3, nota: 5 },
  { de: 9, para: 0, nota: 1 },
];

/** Converte coordenadas da marca para a tela, com a marca centrada em (cx, cy). */
export function mapaDaMarca(cx: number, cy: number, largura: number) {
  const { caixa } = MARCA;
  const k = largura / caixa.w;
  const ox = cx - (caixa.x + caixa.w / 2) * k;
  const oy = cy - (caixa.y + caixa.h / 2) * k;
  return { k, ox, oy, x: (u: number) => ox + u * k, y: (v: number) => oy + v * k };
}

const r2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Linha que passa pelos pontos, com cantos arredondados onde `raios` pede
 * (arco de 90° aproximado por Bézier cúbica; em outros ângulos, uma curva suave).
 */
export function caminho(pts: readonly Ponto[], raios: readonly number[]): string {
  if (pts.length < 2) return "";
  let d = `M${r2(pts[0].x)} ${r2(pts[0].y)}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const a = pts[i - 1];
    const v = pts[i];
    const b = pts[i + 1];
    const la = Math.hypot(v.x - a.x, v.y - a.y);
    const lb = Math.hypot(b.x - v.x, b.y - v.y);
    const r = Math.min(raios[i] ?? 0, la / 2, lb / 2);
    if (r < 0.05 || la < 0.01 || lb < 0.01) {
      d += `L${r2(v.x)} ${r2(v.y)}`;
      continue;
    }
    const ua = { x: (v.x - a.x) / la, y: (v.y - a.y) / la };
    const ub = { x: (b.x - v.x) / lb, y: (b.y - v.y) / lb };
    const k = 0.5523 * r;
    const p1 = { x: v.x - ua.x * r, y: v.y - ua.y * r };
    const p2 = { x: v.x + ub.x * r, y: v.y + ub.y * r };
    d += `L${r2(p1.x)} ${r2(p1.y)}C${r2(p1.x + ua.x * k)} ${r2(p1.y + ua.y * k)} ${r2(p2.x - ub.x * k)} ${r2(p2.y - ub.y * k)} ${r2(p2.x)} ${r2(p2.y)}`;
  }
  const z = pts[pts.length - 1];
  return `${d}L${r2(z.x)} ${r2(z.y)}`;
}
