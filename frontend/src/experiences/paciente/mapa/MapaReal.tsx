// Mapa de verdade do intermedi-app (src/components/map/mapa.web.tsx): MapLibre
// com os modelos da OpenFreeMap (Liberty por padrão; o 3D levanta os prédios), os mesmos marcadores de farmácia e de
// "você" e a linha da rota verde (#10b968). Se o mapa não carregar (sem WebGL,
// sem internet ou bloqueado), avisa por onErro para a tela mostrar o desenho.
import { useEffect, useRef, useState } from "react";
import type { Map as MapaLibre, Marker, GeoJSONSource, LngLatBoundsLike } from "maplibre-gl";
import type { Farmacia } from "../../../types";
import { ICONE_FARMACIA, ICONE_USUARIO } from "./marcadores";
import type { Rota } from "./rotas";
import { PREDIOS_3D, urlEstiloMapa, type EstiloMapa } from "./estilos";
const ESPERA_MAXIMA = 12000;

type Ponto = { latitude: number; longitude: number };

const temTrajeto = (rota: Rota | null) => Boolean(rota?.geometria.coordinates.length);

export default function MapaReal({
  voce,
  farmacias,
  selecionada,
  rota,
  onSelecionar,
  onErro,
  espacoInferior = 60,
  modelo = "liberty",
  comecarNaRota = false,
}: {
  voce: Ponto;
  farmacias: Farmacia[];
  selecionada: number | null;
  rota: Rota | null;
  onSelecionar: (id: number) => void;
  onErro: () => void;
  espacoInferior?: number;
  /** Trocar o modelo recria o mapa (a tela usa key={modelo}). */
  modelo?: EstiloMapa;
  /** Abre já enquadrando a rota (veio de uma farmácia), sem a visão de todas. */
  comecarNaRota?: boolean;
}) {
  const inclinacao = modelo === "3d" ? 60 : 0;
  const caixa = useRef<HTMLDivElement>(null);
  const mapaRef = useRef<MapaLibre | null>(null);
  const prontoRef = useRef(false);
  const marcadores = useRef(new Map<number, { marcador: Marker; elemento: HTMLDivElement }>());
  const selecionarRef = useRef(onSelecionar);
  const erroRef = useRef(onErro);
  const libRef = useRef<typeof import("maplibre-gl") | null>(null);
  // 0: carregando a biblioteca · 1: mapa criado · 2: estilo carregado
  const [fase, setFase] = useState(0);
  // Primeiro enquadramento mostra todas as farmácias; depois, o trajeto escolhido.
  const visaoGeral = useRef(!comecarNaRota);

  useEffect(() => { selecionarRef.current = onSelecionar; }, [onSelecionar]);
  useEffect(() => { erroRef.current = onErro; }, [onErro]);

  // Cria o mapa uma vez.
  useEffect(() => {
    let cancelado = false;
    let mapa: MapaLibre | null = null;
    let observador: ResizeObserver | null = null;
    const desistir = window.setTimeout(() => { if (!prontoRef.current) erroRef.current(); }, ESPERA_MAXIMA);

    import("./maplibre")
      .then(({ maplibregl }) => {
        if (cancelado || !caixa.current) return;
        libRef.current = maplibregl;
        mapa = new maplibregl.Map({
          container: caixa.current,
          style: urlEstiloMapa(modelo),
          center: [voce.longitude, voce.latitude],
          zoom: 13,
          pitch: inclinacao,
          attributionControl: { compact: true },
        });
        mapaRef.current = mapa;
        setFase(1);
        mapa.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
        mapa.on("error", (e) => {
          // Erro do estilo (antes de carregar) = sem mapa. Tile isolado falhando não derruba.
          if (!prontoRef.current && !(e as { tile?: unknown }).tile) erroRef.current();
        });
        mapa.once("load", () => {
          if (modelo === "3d" && mapa) {
            // como no app: esconde os prédios do estilo e põe os da camada 3D
            const camadas = mapa.getStyle().layers;
            camadas.filter((c) => c.type === "fill-extrusion").forEach((c) => mapa!.setLayoutProperty(c.id, "visibility", "none"));
            mapa.addSource("intermedi-predios", { type: "vector", url: "https://tiles.openfreemap.org/planet" });
            mapa.addLayer(PREDIOS_3D, camadas.find((c) => c.type === "symbol")?.id);
          }
          prontoRef.current = true;
          window.clearTimeout(desistir);
          setFase(2);
        });
        observador = new ResizeObserver(() => mapa?.resize());
        observador.observe(caixa.current);

        // você
        const icone = document.createElement("div");
        icone.className = "a-mapa-real-voce";
        icone.innerHTML = ICONE_USUARIO;
        icone.setAttribute("aria-label", "Sua localização");
        new maplibregl.Marker({ element: icone, anchor: "center" }).setLngLat([voce.longitude, voce.latitude]).addTo(mapa);
      })
      .catch(() => erroRef.current());

    return () => {
      cancelado = true;
      window.clearTimeout(desistir);
      observador?.disconnect();
      marcadores.current.clear();
      mapa?.remove();
      mapaRef.current = null;
      prontoRef.current = false;
    };
    // a localização da demonstração é fixa
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Marcadores das farmácias (os mesmos do app), com o nome na escolhida.
  useEffect(() => {
    const mapa = mapaRef.current;
    const lib = libRef.current;
    if (!mapa || !lib) return undefined;
    const atuais = marcadores.current;
    farmacias.forEach((f) => {
      if (atuais.has(f.idFarmacia)) return;
      const elemento = document.createElement("div");
      elemento.className = "a-mapa-real-farmacia";
      elemento.innerHTML = `<span class="a-mapa-real-nome"></span>${ICONE_FARMACIA}`;
      elemento.querySelector(".a-mapa-real-nome")!.textContent = f.nomeFarmacia;
      elemento.setAttribute("role", "button");
      elemento.tabIndex = 0;
      elemento.setAttribute("aria-label", `Ver o trajeto até a ${f.nomeFarmacia}`);
      const escolher = () => selecionarRef.current(f.idFarmacia);
      elemento.addEventListener("click", (e) => { e.stopPropagation(); escolher(); });
      elemento.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); escolher(); }
      });
      const marcador = new lib.Marker({ element: elemento, anchor: "bottom" }).setLngLat([f.longitude, f.latitude]).addTo(mapa);
      atuais.set(f.idFarmacia, { marcador, elemento });
    });
    atuais.forEach((m, id) => {
      if (!farmacias.some((f) => f.idFarmacia === id)) {
        m.marcador.remove();
        atuais.delete(id);
      }
    });
    return undefined;
  }, [fase, farmacias]);

  useEffect(() => {
    marcadores.current.forEach(({ elemento }, id) => {
      elemento.classList.toggle("is-ativa", id === selecionada);
      elemento.setAttribute("aria-pressed", String(id === selecionada));
    });
  }, [fase, farmacias, selecionada]);

  // Rota e câmera.
  useEffect(() => {
    const mapa = mapaRef.current;
    const lib = libRef.current;
    if (!mapa || !lib || fase < 2) return;
    const desenhar = () => {
      const pontos = rota?.geometria.coordinates ?? [];
      const dados = {
        type: "FeatureCollection" as const,
        features: pontos.length >= 2 ? [{ type: "Feature" as const, properties: {}, geometry: { type: "LineString" as const, coordinates: pontos } }] : [],
      };
      const fonte = mapa.getSource("rota") as GeoJSONSource | undefined;
      if (fonte) fonte.setData(dados);
      else {
        mapa.addSource("rota", { type: "geojson", data: dados });
        mapa.addLayer({
          id: "linha-rota-borda", type: "line", source: "rota",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: { "line-color": "#ffffff", "line-width": 9 },
        });
        mapa.addLayer({
          id: "linha-rota", type: "line", source: "rota",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: { "line-color": "#10b968", "line-width": 5 },
        });
      }
      // enquadra: no começo, você e todas as farmácias que têm; depois, a rota escolhida
      const limites = new lib.LngLatBounds();
      pontos.forEach((p) => limites.extend(p));
      if (visaoGeral.current || !pontos.length) {
        limites.extend([voce.longitude, voce.latitude]);
        farmacias.forEach((f) => limites.extend([f.longitude, f.latitude]));
      }
      const caixaEl = mapa.getContainer();
      mapa.fitBounds(limites.toArray() as LngLatBoundsLike, {
        padding: {
          top: Math.min(120, caixaEl.clientHeight * 0.3),
          bottom: Math.min(espacoInferior, caixaEl.clientHeight * 0.4),
          left: Math.min(50, caixaEl.clientWidth * 0.12),
          right: Math.min(50, caixaEl.clientWidth * 0.12),
        },
        maxZoom: 16,
        pitch: inclinacao,
        bearing: 0,
        duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 600,
      });
    };
    desenhar();
    if (temTrajeto(rota)) visaoGeral.current = false;
    // a câmera só se move quando a rota (ou a fase) muda
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fase, rota]);

  return <div ref={caixa} className="a-mapa-real" />;
}
