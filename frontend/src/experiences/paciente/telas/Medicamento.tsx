// Detalhe do remédio (medicamento/[id].tsx do intermedi-app): capa colorida
// pela categoria, ficha, farmácias perto com estoque, "Mais informações" e
// "Adicionar à rotina". O botão "Mapa" do original abre a rota no mapa; sem
// mapa na demonstração, ele leva ao estoque da farmácia mais próxima.
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { remedio as buscarRemedio } from "../../../demoServices/medicationService";
import { adicionarDose, alternarFavoritoRemedio, usePaciente } from "../../../demoServices/patientService";
import { formatarKm } from "../../../demoServices/pharmacyService";
import { POUCAS_UNIDADES, detalhesRemedio, estiloCategoria, exigeReceita, formatoComprimido, ondeTem, tituloRemedio, tomPrincipal } from "../dados";
import { Ionicon } from "../components/Ionicon";
import { Botao, BotaoFavorito, BotaoVoltar, Comprimido, IconTile, Tag } from "../components/ui";

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

  if (!remedio) {
    return (
      <div className="a-tela a-nao-encontrado">
        <BotaoVoltar tom="dark" />
        <p className="t-body">Medicamento não encontrado.</p>
      </div>
    );
  }

  const tom = tomPrincipal(remedio);
  const receita = exigeReceita(remedio);
  const perto = ondeTem(remedio.idRemedio);
  const maisPerto = perto[0];
  const formato = formatoComprimido(remedio);
  const quadros: { rotulo: string; valor: string; icone: string; tom: "blue" | "amber" | "purple" | "green" }[] = [
    { rotulo: "Forma", valor: remedio.formaFarmaceutica, icone: "ellipse-outline", tom: "blue" },
    { rotulo: "Embalagem", valor: remedio.apresentacaoRemedio, icone: "cube-outline", tom: "amber" },
    { rotulo: "Fabricante", valor: remedio.fabricanteRemedio, icone: "business-outline", tom: "purple" },
    { rotulo: "Tipo", valor: { referencia: "Referência", generico: "Genérico", similar: "Similar" }[remedio.tipo], icone: "checkmark", tom: "green" },
  ];

  return (
    <div className="a-tela a-tela-detalhe">
      <div className={`a-capa tom-${tom}`}>
        <i className="a-capa-bolha um" aria-hidden="true" />
        <i className="a-capa-bolha dois" aria-hidden="true" />
        <div className="a-capa-barra">
          <BotaoVoltar tom="dark" />
          <BotaoFavorito flutuante selecionado={favorito} rotulo={favorito ? "Remover dos favoritos" : "Salvar nos favoritos"} onClick={() => alternarFavoritoRemedio(remedio.idRemedio)} />
        </div>
        <div className="a-capa-arte">
          <Comprimido formato={formato} tamanho={140} cores={formato === "capsule" ? ["#EE8F68", "#FFFFFF"] : undefined} />
        </div>
      </div>

      <div className="a-folha">
        <div className="a-tags">
          {remedio.categorias.slice(0, 2).map((c) => <Tag key={c} rotulo={c} tom={estiloCategoria(c).tom} />)}
          <Tag rotulo={receita ? "Exige receita" : "Sem receita"} tom={receita ? "amber" : "green"} />
        </div>
        <div>
          <h1 className="t-h2">{tituloRemedio(remedio)}</h1>
          <p className="t-body" style={{ color: "var(--a-text-2)" }}>{remedio.principioAtivo}</p>
        </div>
        <div className="a-quadros">
          {quadros.map((q) => (
            <div key={q.rotulo} className="a-quadro">
              <IconTile icone={q.icone} tom={q.tom} tamanho={36} />
              <span className="a-flex">
                <span className="t-caption">{q.rotulo}</span>
                <span className="t-bodyBold a-quadro-valor">{q.valor.charAt(0).toUpperCase() + q.valor.slice(1)}</span>
              </span>
            </div>
          ))}
        </div>
        <p className="t-body" style={{ color: "var(--a-text-2)" }}>{remedio.descricao}. Indicado para: {remedio.indicacoes.toLowerCase()}.</p>

        <h2 className="t-h3">Disponível perto de você</h2>
        {!perto.length && (
          <div className="a-lugar">
            <IconTile icone="notifications-outline" tom="neutral" tamanho={44} />
            <span className="t-label a-flex">Nenhuma farmácia tem este remédio em estoque no momento.</span>
          </div>
        )}
        {perto.map(({ farmacia, quantidade, distancia }) => {
          const poucas = quantidade < POUCAS_UNIDADES;
          return (
            <button key={farmacia.idFarmacia} type="button" className="a-lugar a-pressavel" onClick={() => navigate(`/aplicativo/farmacia/${farmacia.idFarmacia}`)} aria-label={`${farmacia.nomeFarmacia}, ${quantidade} unidades`}>
              <IconTile icone="location-outline" tom={poucas ? "amber" : "green"} tamanho={46} />
              <span className="a-flex">
                <span className="t-bodyBold">{farmacia.nomeFarmacia}</span>
                <span className="t-label">{[formatarKm(distancia), `${quantidade.toLocaleString("pt-BR")} ${quantidade === 1 ? "unidade" : "unidades"}`].filter(Boolean).join(" · ")}</span>
              </span>
              <Tag rotulo={poucas ? "Poucas unid." : "Em estoque"} tom={poucas ? "amber" : "green"} />
            </button>
          );
        })}

        <button type="button" className="a-mais" aria-expanded={mais} onClick={() => setMais((v) => !v)}>
          <span className="t-bodyBold a-flex">Mais informações</span>
          <Ionicon name={mais ? "chevron-up" : "chevron-down"} size={20} color="var(--a-text-2)" />
        </button>
        {mais && detalhesRemedio(remedio).map((grupo) => (
          <div key={grupo.titulo} className="a-detalhes">
            <p className="t-label a-detalhes-titulo">{grupo.titulo}</p>
            {grupo.campos.map(([rotulo, valor]) => (
              <div key={rotulo} className="a-detalhe">
                <span className="t-caption">{rotulo}</span>
                <span className="t-label" style={{ color: "var(--a-text)" }}>{valor}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="a-acoes-fixas">
        <Botao
          variante="outline"
          larguraTotal={false}
          titulo="Farmácia"
          disabled={!maisPerto}
          icone={<Ionicon name="storefront-outline" size={20} />}
          rotulo={maisPerto ? `Ver estoque da ${maisPerto.farmacia.nomeFarmacia}, a mais perto` : "Nenhuma farmácia com estoque"}
          onClick={() => maisPerto && navigate(`/aplicativo/farmacia/${maisPerto.farmacia.idFarmacia}`)}
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
        <p className="t-label">Eu te lembro todo dia nesse horário. A rotina fica salva neste aparelho durante a demonstração.</p>
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
