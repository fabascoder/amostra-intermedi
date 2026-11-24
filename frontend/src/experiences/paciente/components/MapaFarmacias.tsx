// Mapa ilustrado do bairro (no estilo do mapa com trajetos do site da
// Intermedi): você no meio, as farmácias que têm o remédio marcadas e o trajeto
// até cada uma. A escolhida ganha o trajeto destacado; tocar num pino troca.
// É um desenho (sem serviço de mapas): funciona offline e em qualquer aparelho.
import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { listarFarmacias } from "../../../demoServices/pharmacyService";
import { LOCAL_PACIENTE, POUCAS_UNIDADES } from "../dados";
import type { Farmacia } from "../../../types";

type Item = { farmacia: Farmacia; quantidade: number; distancia: number };

const L = 360; // largura do desenho
const A = 300; // altura do desenho
const MARGEM_X = 50;
// em cima ficam o voltar e o favorito; embaixo, a folha que sobe sobre o mapa
const MARGEM_TOPO = 92;
const MARGEM_BAIXO = 64;

/** Nome curto para a etiqueta do pino: "Farmácia Saúde Leste" → "Saúde Leste". */
const curto = (nome: string) => nome.replace(/^(Farmácia|Drogaria)\s+/, "");

/** Minutos a pé (5 km/h, com folga de ruas) e de carro (25 km/h no bairro). */
export const minutosAPe = (km: number) => Math.max(1, Math.round((km * 1.3 * 60) / 5));
export const minutosDeCarro = (km: number) => Math.max(1, Math.round((km * 1.3 * 60) / 25));

function projetar(pontos: { latitude: number; longitude: number }[]) {
  const lats = pontos.map((p) => p.latitude);
  const lngs = pontos.map((p) => p.longitude);
  const [minLat, maxLat, minLng, maxLng] = [Math.min(...lats), Math.max(...lats), Math.min(...lngs), Math.max(...lngs)];
  // Mesma escala nos dois eixos (1° de longitude ≈ 0,92 de 1° de latitude aqui).
  const kx = 0.917;
  const largura = (maxLng - minLng) * kx || 0.01;
  const altura = maxLat - minLat || 0.01;
  const escala = Math.min((L - MARGEM_X * 2) / largura, (A - MARGEM_TOPO - MARGEM_BAIXO) / altura);
  const offX = (L - largura * escala) / 2;
  const offY = MARGEM_TOPO + (A - MARGEM_TOPO - MARGEM_BAIXO - altura * escala) / 2;
  return (p: { latitude: number; longitude: number }) => ({
    x: offX + (p.longitude - minLng) * kx * escala,
    y: offY + (maxLat - p.latitude) * escala,
  });
}

/** Trajeto pelas ruas: sobe ou desce até a metade, atravessa e chega. */
function caminho(de: { x: number; y: number }, para: { x: number; y: number }) {
  const meio = (de.y + para.y) / 2;
  const r = Math.min(10, Math.abs(para.x - de.x) / 2, Math.abs(meio - de.y));
  const sx = Math.sign(para.x - de.x) || 1;
  const sy1 = Math.sign(meio - de.y) || 1;
  const sy2 = Math.sign(para.y - meio) || 1;
  return [
    `M${de.x} ${de.y}`,
    `V${meio - sy1 * r}`,
    `Q${de.x} ${meio} ${de.x + sx * r} ${meio}`,
    `H${para.x - sx * r}`,
    `Q${para.x} ${meio} ${para.x} ${meio + sy2 * r}`,
    `V${para.y}`,
  ].join(" ");
}

type Caixa = { x: number; y: number; w: number; h: number };
const bate = (a: Caixa, b: Caixa) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

/** Põe cada etiqueta onde não cobre outra etiqueta nem um pino (a escolhida primeiro). */
function posicionarEtiquetas(itens: { id: number; x: number; y: number; texto: string }[], obstaculos: Caixa[]) {
  const ocupadas: Caixa[] = [...obstaculos];
  const posicoes = new Map<number, { dx: number; dy: number }>();
  for (const e of itens) {
    const w = e.texto.length * 5.6 + 16;
    const h = 22;
    const opcoes = [
      { dx: 0, dy: -50 }, // em cima
      { dx: w / 2 + 16, dy: -22 }, // à direita
      { dx: -(w / 2 + 16), dy: -22 }, // à esquerda
      { dx: 0, dy: 18 }, // embaixo
      { dx: w / 2 + 16, dy: 4 },
      { dx: -(w / 2 + 16), dy: 4 },
      { dx: w / 2 - 6, dy: -52 },
      { dx: -(w / 2 - 6), dy: -52 },
      { dx: 0, dy: 42 },
      { dx: w / 2 + 16, dy: -48 },
      { dx: -(w / 2 + 16), dy: -48 },
    ];
    const caixa = (o: { dx: number; dy: number }) => ({ x: e.x + o.dx - w / 2, y: e.y + o.dy - h / 2, w, h });
    const dentro = (c: Caixa) => c.x > 4 && c.x + c.w < L - 4 && c.y > 6 && c.y + c.h < A - 30;
    const escolhida = opcoes.find((o) => dentro(caixa(o)) && !ocupadas.some((c) => bate(c, caixa(o)))) ?? opcoes.find((o) => dentro(caixa(o))) ?? opcoes[0];
    ocupadas.push(caixa(escolhida));
    posicoes.set(e.id, escolhida);
  }
  return posicoes;
}

function Fundo() {
  return (
    <g aria-hidden="true">
      <rect x="-20" y="-20" width={L + 40} height={A + 40} className="a-mapa-terra" />
      {/* quarteirões: ruas finas, levemente giradas */}
      <g transform={`rotate(-9 ${L / 2} ${A / 2})`} className="a-mapa-rua">
        {Array.from({ length: 16 }, (_, i) => <line key={`v${i}`} x1={-60 + i * 30} y1={-60} x2={-60 + i * 30} y2={A + 60} />)}
        {Array.from({ length: 13 }, (_, i) => <line key={`h${i}`} x1={-60} y1={-40 + i * 30} x2={L + 60} y2={-40 + i * 30} />)}
      </g>
      <path className="a-mapa-parque" d="M232 26c26-8 58 2 66 22s-10 40-38 42-48-8-52-28 6-30 24-36Z" />
      <path className="a-mapa-parque" d="M28 214c18-10 46-4 52 14s-6 34-28 34-40-10-40-26 4-16 16-22Z" />
      <path className="a-mapa-rio" d="M-20 158C60 136 110 186 190 166S300 120 380 140" />
      {/* avenidas */}
      <g className="a-mapa-avenida">
        <path d="M-20 86C80 74 200 108 380 92" />
        <path d="M104 -20C112 80 90 190 122 320" />
        <path d="M-20 236C120 222 250 252 380 214" />
        <path d="M276 -20C266 90 300 190 284 320" />
      </g>
    </g>
  );
}

export function MapaFarmacias({ itens, selecionada, onSelecionar }: { itens: Item[]; selecionada: number | null; onSelecionar: (id: number) => void }) {
  const todas = useMemo(() => listarFarmacias(), []);
  // Animação de entrada só na primeira vez (trocar de farmácia não reinicia tudo).
  const [entrando, setEntrando] = useState(true);
  useEffect(() => {
    const t = window.setTimeout(() => setEntrando(false), 1800);
    return () => window.clearTimeout(t);
  }, []);
  const posicao = useMemo(() => projetar([LOCAL_PACIENTE, ...todas]), [todas]);
  const voce = posicao(LOCAL_PACIENTE);
  const comEstoque = new Map(itens.map((i) => [i.farmacia.idFarmacia, i]));
  const semEstoque = todas.filter((f) => !comEstoque.has(f.idFarmacia));
  const escolhido = itens.find((i) => i.farmacia.idFarmacia === selecionada) ?? null;
  // A escolhida é desenhada por último, por cima das outras.
  const ordem = [...itens].sort((a, b) => Number(a.farmacia.idFarmacia === selecionada) - Number(b.farmacia.idFarmacia === selecionada));

  const rotuloDe = (f: Farmacia, distancia: number) =>
    f.idFarmacia === selecionada ? `${curto(f.nomeFarmacia)} · ${minutosAPe(distancia)} min` : curto(f.nomeFarmacia);
  // pinos ocupam o espaço logo acima do ponto; a escolhida escolhe o lugar primeiro
  const pinos: Caixa[] = [
    // botões de voltar e favoritar, nos cantos de cima
    { x: 0, y: 0, w: 70, h: 64 },
    { x: L - 70, y: 0, w: 70, h: 64 },
    ...itens.map(({ farmacia }) => { const p = posicao(farmacia); return { x: p.x - 13, y: p.y - 38, w: 26, h: 38 }; }),
    { x: voce.x - 12, y: voce.y - 12, w: 24, h: 24 },
  ];
  const etiquetas = posicionarEtiquetas(
    [...itens]
      .sort((a, b) => Number(b.farmacia.idFarmacia === selecionada) - Number(a.farmacia.idFarmacia === selecionada) || a.distancia - b.distancia)
      .map(({ farmacia, distancia }) => ({ id: farmacia.idFarmacia, ...posicao(farmacia), texto: rotuloDe(farmacia, distancia) })),
    pinos,
  );

  const teclar = (id: number) => (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelecionar(id);
    }
  };

  return (
    <svg
      className={`a-mapa${entrando ? " is-entrando" : ""}`}
      viewBox={`0 0 ${L} ${A}`}
      preserveAspectRatio="xMidYMid slice"
      role="group"
      aria-label={
        itens.length
          ? `Mapa: ${itens.length} ${itens.length === 1 ? "farmácia tem" : "farmácias têm"} este remédio perto de você${escolhido ? `. Trajeto até a ${escolhido.farmacia.nomeFarmacia}` : ""}`
          : "Mapa: nenhuma farmácia perto de você tem este remédio agora"
      }
    >
      <Fundo />

      {/* farmácias sem o remédio: só a referência, apagadas */}
      {semEstoque.map((f) => {
        const p = posicao(f);
        return (
          <g key={f.idFarmacia} className="a-mapa-pino is-sem" transform={`translate(${p.x} ${p.y})`} aria-hidden="true">
            <circle r="5" />
          </g>
        );
      })}

      {/* trajetos */}
      {ordem.map(({ farmacia }, i) => {
        const ativo = farmacia.idFarmacia === selecionada;
        const d = caminho(voce, posicao(farmacia));
        return (
          <g key={`r${farmacia.idFarmacia}`} className={`a-mapa-rota${ativo ? " is-ativa" : ""}`} style={{ "--i": i } as React.CSSProperties} aria-hidden="true">
            <path className="a-mapa-rota-base" d={d} pathLength={100} />
            <path className="a-mapa-rota-fluxo" d={d} pathLength={100} />
          </g>
        );
      })}

      {/* você */}
      <g className="a-mapa-voce" transform={`translate(${voce.x} ${voce.y})`} aria-hidden="true">
        <circle className="a-mapa-voce-onda" r="9" />
        <circle className="a-mapa-voce-halo" r="12" />
        <circle className="a-mapa-voce-ponto" r="7" />
      </g>

      {/* farmácias com o remédio */}
      {ordem.map(({ farmacia, quantidade, distancia }, i) => {
        const p = posicao(farmacia);
        const ativo = farmacia.idFarmacia === selecionada;
        const poucas = quantidade < POUCAS_UNIDADES;
        return (
          <g
            key={farmacia.idFarmacia}
            className={`a-mapa-pino${ativo ? " is-ativo" : ""}${poucas ? " is-poucas" : ""}`}
            transform={`translate(${p.x} ${p.y})`}
            style={{ "--i": i } as React.CSSProperties}
            role="button"
            tabIndex={0}
            aria-pressed={ativo}
            aria-label={`${farmacia.nomeFarmacia}, ${minutosAPe(distancia)} minutos a pé${poucas ? ", últimas unidades" : ""}`}
            onClick={() => onSelecionar(farmacia.idFarmacia)}
            onKeyDown={teclar(farmacia.idFarmacia)}
          >
            <circle className="a-mapa-pino-alvo" r="22" />
            <g className="a-mapa-pino-corpo">
              <path className="a-mapa-pino-gota" d="M0 0C-8-10-12-16-12-23a12 12 0 1 1 24 0c0 7-4 13-12 23Z" />
              <path className="a-mapa-pino-cruz" d="M-1.8-28.5h3.6v3.6h3.6v3.6h-3.6v3.6h-3.6v-3.6h-3.6v-3.6h3.6Z" />
            </g>
          </g>
        );
      })}

      {/* etiquetas por cima de tudo, sem se cobrir */}
      {ordem.map(({ farmacia, distancia }, i) => {
        const p = posicao(farmacia);
        const o = etiquetas.get(farmacia.idFarmacia) ?? { dx: 0, dy: -50 };
        const texto = rotuloDe(farmacia, distancia);
        const largura = texto.length * 5.6 + 16;
        const ativo = farmacia.idFarmacia === selecionada;
        return (
          <g
            key={`e${farmacia.idFarmacia}`}
            className={`a-mapa-etiqueta${ativo ? " is-ativa" : ""}`}
            transform={`translate(${p.x + o.dx} ${p.y + o.dy})`}
            style={{ "--i": i } as React.CSSProperties}
            onClick={() => onSelecionar(farmacia.idFarmacia)}
            aria-hidden="true"
          >
            <rect x={-largura / 2} y={-11} width={largura} height={22} rx={11} />
            <text textAnchor="middle" dominantBaseline="central">{texto}</text>
          </g>
        );
      })}
    </svg>
  );
}
