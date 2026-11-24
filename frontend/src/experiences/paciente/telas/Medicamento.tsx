// Detalhe do remédio (medicamento/[id].tsx do intermedi-app). A primeira coisa
// na tela é o mapa do app (MapLibre + OpenFreeMap) com as farmácias que têm o
// remédio e o trajeto pelas ruas (Valhalla), a pé, de carro, moto ou bike.
// Sem mapa (sem internet ou WebGL), entra o mapa desenhado no lugar.
// Depois vêm as farmácias, a ficha simples, os cuidados e "Adicionar à rotina".
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { remedio as buscarRemedio } from "../../../demoServices/medicationService";
import { adicionarDose, alternarFavoritoRemedio, usePaciente } from "../../../demoServices/patientService";
import { formatarKm } from "../../../demoServices/pharmacyService";
import { LOCAL_PACIENTE, POUCAS_UNIDADES, cuidadosRemedio, exigeReceita, ondeTem, textoReceita, tituloRemedio } from "../dados";
import { FotoRemedio } from "../components/Fotos";
import { Ionicon } from "../components/Ionicon";
import { MapaFarmacias, minutosAPe } from "../components/MapaFarmacias";
import MapaReal from "../mapa/MapaReal";
import { MODOS, calcularRota, type ModoLocomocao, type Rota } from "../mapa/rotas";
import { Botao, BotaoFavorito, BotaoVoltar, IconTile, Tag } from "../components/ui";

const HORARIOS = ["06:00", "07:30", "08:00", "12:00", "14:00", "18:00", "20:00", "22:00"];

export default function Medicamento() {
  const { id } = useParams();
  const navigate = useNavigate();
  const remedio = buscarRemedio(Number(id));
  const favorito = usePaciente((p) => p.favoritosRemedios.includes(Number(id)));
  const naRotina = usePaciente((p) => p.doses.some((d) => d.idRemedio === Number(id)));
  const [mais, setMais] = useState(false);
  const [rotina, setRotina] = useState(false);
  const [horario, setHorario] = useState("08:00");
  const [escolhida, setEscolhida] = useState<number | null>(null);
  const [modo, setModo] = useState<ModoLocomocao>("pedestrian");
  const [mapaFalhou, setMapaFalhou] = useState(false);
  const [rotas, setRotas] = useState<{ id: number; rotas: Partial<Record<ModoLocomocao, Rota>>; falhou: boolean } | null>(null);
  const aoFalharMapa = useCallback(() => setMapaFalhou(true), []);
  const perto = useMemo(() => (remedio ? ondeTem(remedio.idRemedio) : []), [remedio]);
  const farmaciasDoMapa = useMemo(() => perto.map((p) => p.farmacia), [perto]);
  const idAlvo = (perto.find((p) => p.farmacia.idFarmacia === escolhida) ?? perto[0])?.farmacia.idFarmacia ?? null;

  // Trajetos até a farmácia escolhida nos quatro modos, como a tela de rota do app.
  useEffect(() => {
    const destino = perto.find((p) => p.farmacia.idFarmacia === idAlvo)?.farmacia;
    if (!destino) return undefined;
    let ativo = true;
    setRotas((r) => (r?.id === idAlvo ? r : null));
    Promise.allSettled(MODOS.map((m) => calcularRota(LOCAL_PACIENTE, destino, m.valor))).then((resultados) => {
      if (!ativo) return;
      const achadas: Partial<Record<ModoLocomocao, Rota>> = {};
      resultados.forEach((r, i) => { if (r.status === "fulfilled") achadas[MODOS[i].valor] = r.value; });
      setRotas({ id: idAlvo!, rotas: achadas, falhou: !Object.keys(achadas).length });
    });
    return () => { ativo = false; };
  }, [idAlvo, perto]);

  if (!remedio) {
    return (
      <div className="a-tela a-nao-encontrado">
        <BotaoVoltar tom="dark" />
        <p className="t-body">Medicamento não encontrado.</p>
      </div>
    );
  }

  const receita = exigeReceita(remedio);
  const maisPerto = perto[0];
  const alvo = perto.find((p) => p.farmacia.idFarmacia === escolhida) ?? maisPerto;
  const rotasDoAlvo = rotas && rotas.id === alvo?.farmacia.idFarmacia ? rotas : null;
  const rotaAtual = rotasDoAlvo?.rotas[modo] ?? null;
  // Sem o Valhalla: estimativa pela distância em linha reta (com folga para as ruas).
  const VELOCIDADE: Record<ModoLocomocao, number> = { pedestrian: 5, bicycle: 15, motorcycle: 30, auto: 25 };
  const tempoDe = (m: ModoLocomocao) => {
    const r = rotasDoAlvo?.rotas[m];
    if (r) return { min: Math.max(1, Math.round(r.tempoSegundos / 60)), km: r.distanciaMetros / 1000, estimado: false };
    if (!alvo) return null;
    return { min: Math.max(1, Math.round((alvo.distancia * 1.3 * 60) / VELOCIDADE[m])), km: alvo.distancia * 1.3, estimado: true };
  };
  const tempoModo = tempoDe(modo);
  // Só o que ajuda quem vai comprar: o que vem na caixa, receita e se é genérico.
  const quadros: { rotulo: string; valor: string; icone: string; tom: "blue" | "amber" | "purple" | "green" }[] = [
    { rotulo: "Na caixa", valor: remedio.apresentacaoRemedio.replace(/^Caixa com /, "").replace(/^Tubo com /, ""), icone: "cube-outline", tom: "blue" },
    { rotulo: "Receita", valor: textoReceita(remedio), icone: "document-text-outline", tom: "amber" },
    { rotulo: "Tipo", valor: { referencia: "De marca", generico: "Genérico", similar: "Similar" }[remedio.tipo], icone: "pricetag-outline", tom: "purple" },
    { rotulo: "Perto de você", valor: perto.length ? `${perto.length} ${perto.length === 1 ? "farmácia tem" : "farmácias têm"}` : "Em falta", icone: "location-outline", tom: "green" },
  ];

  return (
    <div className="a-tela a-tela-detalhe">
      <div className="a-mapa-capa">
        {mapaFalhou ? (
          <MapaFarmacias itens={perto} selecionada={alvo?.farmacia.idFarmacia ?? null} onSelecionar={setEscolhida} />
        ) : (
          <MapaReal
            voce={LOCAL_PACIENTE}
            farmacias={farmaciasDoMapa}
            selecionada={alvo?.farmacia.idFarmacia ?? null}
            rota={rotaAtual}
            onSelecionar={setEscolhida}
            onErro={aoFalharMapa}
            espacoInferior={70}
          />
        )}
        <div className="a-capa-barra a-mapa-barra">
          <BotaoVoltar tom="dark" />
          <BotaoFavorito flutuante selecionado={favorito} rotulo={favorito ? "Remover dos favoritos" : "Salvar nos favoritos"} onClick={() => alternarFavoritoRemedio(remedio.idRemedio)} />
        </div>
        {!perto.length && (
          <p className="a-mapa-aviso" role="status">
            <Ionicon name="alert-circle-outline" size={18} /> Nenhuma farmácia perto tem agora
          </p>
        )}
      </div>

      <div className="a-folha">
        <div className="a-remedio-topo">
          <FotoRemedio remedio={remedio} tamanho={64} />
          <div className="a-flex">
            <h1 className="t-h3">{tituloRemedio(remedio)}</h1>
            <p className="t-label">Para {remedio.indicacoes.charAt(0).toLowerCase() + remedio.indicacoes.slice(1)}</p>
          </div>
        </div>

        {alvo && (
          <div className="a-rota-cartao" aria-live="polite">
            <div className="a-rota-cartao-topo">
              <span className="a-flex">
                <span className="t-caption">{alvo === maisPerto ? "Mais perto de você" : "Farmácia escolhida"}</span>
                <span className="t-bodyBold">{alvo.farmacia.nomeFarmacia}</span>
                <span className="t-label">{[alvo.farmacia.rua && `${alvo.farmacia.rua}, ${alvo.farmacia.numero}`, alvo.farmacia.bairro].filter(Boolean).join(" · ")}</span>
              </span>
              <Tag rotulo={alvo.quantidade < POUCAS_UNIDADES ? "Últimas unidades" : "Tem"} tom={alvo.quantidade < POUCAS_UNIDADES ? "amber" : "green"} />
            </div>
            <div className="a-rota-modos" role="radiogroup" aria-label="Como você vai">
              {MODOS.map((m) => {
                const t = tempoDe(m.valor);
                return (
                  <button key={m.valor} type="button" role="radio" aria-checked={modo === m.valor} className={`a-rota-modo${modo === m.valor ? " is-ativo" : ""}`} onClick={() => setModo(m.valor)}>
                    <Ionicon name={m.icone} size={18} />
                    <span>{m.titulo}</span>
                    <strong>{t ? `${t.estimado ? "≈" : ""}${t.min} min` : "—"}</strong>
                  </button>
                );
              })}
            </div>
            <p className="a-rota-resumo t-caption">
              {rotasDoAlvo === null && !mapaFalhou
                ? "Calculando o trajeto pelas ruas…"
                : tempoModo
                  ? `${formatarKm(tempoModo.km)} pelo trajeto${tempoModo.estimado ? " (estimado, sem conexão com o serviço de rotas)" : ""}`
                  : ""}
            </p>
          </div>
        )}

        {perto.length > 1 && (
          <>
            <h2 className="t-h3">Todas que têm perto</h2>
            {perto.map(({ farmacia, quantidade, distancia }) => {
              const poucas = quantidade < POUCAS_UNIDADES;
              const ativa = farmacia.idFarmacia === alvo?.farmacia.idFarmacia;
              return (
                <button
                  key={farmacia.idFarmacia}
                  type="button"
                  className={`a-lugar a-pressavel${ativa ? " is-ativo" : ""}`}
                  aria-pressed={ativa}
                  onClick={() => { setEscolhida(farmacia.idFarmacia); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  aria-label={`Ver no mapa o trajeto até a ${farmacia.nomeFarmacia}, ${minutosAPe(distancia)} minutos a pé`}
                >
                  <IconTile icone="location-outline" tom={poucas ? "amber" : "green"} tamanho={46} />
                  <span className="a-flex">
                    <span className="t-bodyBold">{farmacia.nomeFarmacia}</span>
                    <span className="t-label">{[`${minutosAPe(distancia)} min a pé`, formatarKm(distancia), farmacia.bairro].filter(Boolean).join(" · ")}</span>
                  </span>
                  <Tag rotulo={poucas ? "Últimas unidades" : "Tem"} tom={poucas ? "amber" : "green"} />
                </button>
              );
            })}
          </>
        )}

        <div className="a-tags">
          {remedio.categorias.slice(0, 2).map((c) => <Tag key={c} rotulo={c} tom="cat" />)}
          <Tag rotulo={receita ? "Exige receita" : "Sem receita"} tom={receita ? "amber" : "green"} />
        </div>
        <div className="a-quadros">
          {quadros.map((q) => (
            <div key={q.rotulo} className="a-quadro">
              <IconTile icone={q.icone} tom="cat" tamanho={36} />
              <span className="a-flex">
                <span className="t-caption">{q.rotulo}</span>
                <span className="t-bodyBold a-quadro-valor">{q.valor.charAt(0).toUpperCase() + q.valor.slice(1)}</span>
              </span>
            </div>
          ))}
        </div>

        <button type="button" className="a-mais" aria-expanded={mais} onClick={() => setMais((v) => !v)}>
          <span className="t-bodyBold a-flex">Cuidados</span>
          <Ionicon name={mais ? "chevron-up" : "chevron-down"} size={20} color="var(--a-text-2)" />
        </button>
        {mais && (
          <div className="a-detalhes">
            {cuidadosRemedio(remedio).map(([rotulo, valor]) => (
              <div key={rotulo} className="a-detalhe">
                <span className="t-caption">{rotulo}</span>
                <span className="t-label" style={{ color: "var(--a-text)" }}>{valor}</span>
              </div>
            ))}
            <p className="t-caption">Na dúvida, fale com o farmacêutico antes de tomar.</p>
          </div>
        )}
      </div>

      <div className="a-acoes-fixas">
        <Botao
          variante="outline"
          larguraTotal={false}
          titulo="Ver farmácia"
          disabled={!alvo}
          icone={<Ionicon name="storefront-outline" size={20} />}
          rotulo={alvo ? `Abrir a ${alvo.farmacia.nomeFarmacia}` : "Nenhuma farmácia tem agora"}
          onClick={() => alvo && navigate(`/aplicativo/farmacia/${alvo.farmacia.idFarmacia}`)}
          className="a-botao-mapa"
        />
        <Botao titulo={naRotina ? "Ver na minha rotina" : "Adicionar à rotina"} onClick={() => (naRotina ? navigate("/aplicativo/comprimidos") : setRotina(true))} className="a-flex" />
      </div>

      {rotina && (
        <FolhaRotina
          horario={horario}
          setHorario={setHorario}
          onFechar={() => setRotina(false)}
          onConfirmar={() => {
            adicionarDose(remedio.idRemedio, horario);
            setRotina(false);
            navigate("/aplicativo/comprimidos");
          }}
        />
      )}
    </div>
  );
}

function FolhaRotina({ horario, setHorario, onFechar, onConfirmar }: { horario: string; setHorario: (h: string) => void; onFechar: () => void; onConfirmar: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const anterior = document.activeElement as HTMLElement | null;
    const d = ref.current;
    d?.showModal();
    return () => {
      if (d?.open) d.close();
      anterior?.focus?.();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="a-folha-modal"
      aria-label="Que horas você toma?"
      onCancel={(e) => { e.preventDefault(); onFechar(); }}
      onClick={(e) => { if (e.target === e.currentTarget) onFechar(); }}
    >
      <div className="a-folha-modal-corpo">
        <h2 className="t-h3">Que horas você toma?</h2>
        <p className="t-label">Eu te lembro todo dia nesse horário.</p>
        <div className="a-horarios" role="radiogroup" aria-label="Horário">
          {HORARIOS.map((h) => (
            <button key={h} type="button" role="radio" aria-checked={horario === h} className={horario === h ? "is-ativo" : undefined} onClick={() => setHorario(h)}>
              {h}
            </button>
          ))}
        </div>
        <Botao titulo={`Adicionar às ${horario}`} onClick={onConfirmar} />
        <Botao titulo="Cancelar" variante="ghost" onClick={onFechar} />
      </div>
    </dialog>
  );
}
