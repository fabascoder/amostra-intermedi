// Remédios ((tabs)/buscar-medicamentos.tsx do intermedi-app), com filtro:
// categorias, receita, tipo, só os que têm perto e a ordem da lista.
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { buscarRemedios, listarRemedios } from "../../../demoServices/medicationService";
import type { Remedio } from "../../../types";
import { categoriasDoCatalogo, exigeReceita, ondeTem } from "../dados";
import { Ionicon } from "../components/Ionicon";
import { Botao, Cabecalho, CartaoRemedio, Vazio } from "../components/ui";

type Filtros = {
  categorias: string[];
  receita: "todos" | "sem" | "com";
  tipo: "todos" | Remedio["tipo"];
  soComEstoque: boolean;
  ordem: "nome" | "farmacias";
};

const SEM_FILTRO: Filtros = { categorias: [], receita: "todos", tipo: "todos", soComEstoque: false, ordem: "nome" };

function aplicar(lista: Remedio[], f: Filtros): Remedio[] {
  const filtrada = lista.filter((r) => {
    if (f.categorias.length && !r.categorias.some((c) => f.categorias.includes(c))) return false;
    if (f.receita === "sem" && exigeReceita(r)) return false;
    if (f.receita === "com" && !exigeReceita(r)) return false;
    if (f.tipo !== "todos" && r.tipo !== f.tipo) return false;
    if (f.soComEstoque && !ondeTem(r.idRemedio).length) return false;
    return true;
  });
  return f.ordem === "farmacias"
    ? [...filtrada].sort((a, b) => ondeTem(b.idRemedio).length - ondeTem(a.idRemedio).length || a.nomeRemedio.localeCompare(b.nomeRemedio, "pt-BR"))
    : [...filtrada].sort((a, b) => a.nomeRemedio.localeCompare(b.nomeRemedio, "pt-BR"));
}

/** Quantos filtros estão ligados (o número no botão). */
const contarFiltros = (f: Filtros) =>
  f.categorias.length + Number(f.receita !== "todos") + Number(f.tipo !== "todos") + Number(f.soComEstoque) + Number(f.ordem !== "nome");

export default function Remedios() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [filtros, setFiltros] = useState<Filtros>(() => {
    const c = params.get("categoria");
    return c ? { ...SEM_FILTRO, categorias: [c] } : SEM_FILTRO;
  });
  const [folha, setFolha] = useState(() => params.get("filtro") === "1");
  const [busca, setBusca] = useState("");
  const buscaAdiada = useDeferredValue(busca);
  const campo = useRef<HTMLInputElement>(null);
  const categorias = useMemo(() => categoriasDoCatalogo(), []);

  useEffect(() => {
    if (params.get("buscar")) campo.current?.focus();
    if (params.get("filtro")) setParams({}, { replace: true });
  }, [params, setParams]);

  const lista = aplicar(buscarRemedios(buscaAdiada, listarRemedios()), filtros);
  const ligados = contarFiltros(filtros);
  const umaCategoria = filtros.categorias.length === 1 ? filtros.categorias[0] : "";

  function escolherCategoria(categoria: string) {
    setFiltros((f) => ({ ...f, categorias: categoria ? [categoria] : [] }));
  }

  return (
    <div className="a-tela">
      <Cabecalho titulo="Remédios" subtitulo="Encontre o que você precisa">
        <div className="a-busca-com-filtro">
          <label className="a-busca a-busca-campo">
            <Ionicon name="search-outline" size={22} color="var(--a-text-2)" />
            <input
              ref={campo}
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Nome do remédio"
              aria-label="Buscar remédio pelo nome"
              enterKeyHint="search"
            />
            {busca && (
              <button type="button" className="a-busca-limpar" aria-label="Limpar busca" onClick={() => setBusca("")}>
                <Ionicon name="close" size={18} />
              </button>
            )}
          </label>
          <button type="button" className={`a-filtro-botao${ligados ? " is-ligado" : ""}`} onClick={() => setFolha(true)} aria-label={ligados ? `Filtros: ${ligados} ligados` : "Abrir filtros"}>
            <Ionicon name="options-outline" size={22} />
            {ligados > 0 && <span className="a-filtro-contador">{ligados}</span>}
          </button>
        </div>
      </Cabecalho>

      <div className="a-chips" role="tablist" aria-label="Categorias">
        <button type="button" role="tab" aria-selected={!filtros.categorias.length} className={`a-chip${!filtros.categorias.length ? " is-todos" : ""}`} onClick={() => escolherCategoria("")}>
          Todos
        </button>
        {categorias.map((rotulo) => {
          const ativo = filtros.categorias.includes(rotulo);
          return (
            <button key={rotulo} type="button" role="tab" aria-selected={ativo} className={`a-chip tom-cat${ativo ? " is-ativo" : ""}`} onClick={() => escolherCategoria(ativo && umaCategoria ? "" : rotulo)}>
              <i />
              {rotulo}
            </button>
          );
        })}
      </div>

      <div className="a-corpo">
        <div className="a-resultado-linha">
          <p className="t-label" aria-live="polite">
            {lista.length} {lista.length === 1 ? "remédio" : "remédios"}
            {ligados ? " com esses filtros" : ""}
          </p>
          {ligados > 0 && (
            <button type="button" className="a-limpar-filtros" onClick={() => setFiltros(SEM_FILTRO)}>Limpar filtros</button>
          )}
        </div>
        {!lista.length && (
          <Vazio icone="bandage-outline" titulo="Nenhum remédio encontrado" texto={busca ? "Tente outro nome." : "Tire algum filtro para ver mais remédios."} />
        )}
        {lista.map((r) => (
          <CartaoRemedio key={r.idRemedio} remedio={r} onClick={() => navigate(`/aplicativo/medicamento/${r.idRemedio}`)} />
        ))}
      </div>

      {folha && (
        <FolhaFiltros
          inicial={filtros}
          categorias={categorias}
          contar={(f) => aplicar(buscarRemedios(buscaAdiada, listarRemedios()), f).length}
          onAplicar={(f) => { setFiltros(f); setFolha(false); }}
          onFechar={() => setFolha(false)}
        />
      )}
    </div>
  );
}

function Opcoes<T extends string>({ rotulo, valor, opcoes, onMudar }: { rotulo: string; valor: T; opcoes: [T, string][]; onMudar: (v: T) => void }) {
  return (
    <fieldset className="a-filtro-grupo">
      <legend className="t-bodyBold">{rotulo}</legend>
      <div className="a-filtro-opcoes">
        {opcoes.map(([v, texto]) => (
          <button key={v} type="button" role="radio" aria-checked={valor === v} className={`a-filtro-opcao${valor === v ? " is-ativa" : ""}`} onClick={() => onMudar(v)}>
            {texto}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function FolhaFiltros({ inicial, categorias, contar, onAplicar, onFechar }: {
  inicial: Filtros; categorias: string[]; contar: (f: Filtros) => number; onAplicar: (f: Filtros) => void; onFechar: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [f, setF] = useState(inicial);
  useEffect(() => {
    const anterior = document.activeElement as HTMLElement | null;
    const d = ref.current;
    d?.showModal();
    return () => {
      if (d?.open) d.close();
      anterior?.focus?.();
    };
  }, []);
  const total = contar(f);
  return (
    <dialog
      ref={ref}
      className="a-folha-modal a-folha-filtros"
      aria-label="Filtrar remédios"
      onCancel={(e) => { e.preventDefault(); onFechar(); }}
      onClick={(e) => { if (e.target === e.currentTarget) onFechar(); }}
    >
      <div className="a-folha-modal-corpo">
        <div className="a-filtros-topo">
          <h2 className="t-h3">Filtrar remédios</h2>
          <button type="button" className="a-limpar-filtros" onClick={() => setF(SEM_FILTRO)}>Limpar</button>
        </div>

        <fieldset className="a-filtro-grupo">
          <legend className="t-bodyBold">Para quê?</legend>
          <div className="a-filtro-opcoes">
            {categorias.map((c) => {
              const ativa = f.categorias.includes(c);
              return (
                <button key={c} type="button" aria-pressed={ativa} className={`a-filtro-opcao${ativa ? " is-ativa" : ""}`} onClick={() => setF((x) => ({ ...x, categorias: ativa ? x.categorias.filter((y) => y !== c) : [...x.categorias, c] }))}>
                  {ativa && <Ionicon name="checkmark" size={14} />}
                  {c}
                </button>
              );
            })}
          </div>
        </fieldset>

        <Opcoes rotulo="Receita" valor={f.receita} opcoes={[["todos", "Tanto faz"], ["sem", "Sem receita"], ["com", "Com receita"]]} onMudar={(receita) => setF((x) => ({ ...x, receita }))} />
        <Opcoes rotulo="Tipo" valor={f.tipo} opcoes={[["todos", "Todos"], ["generico", "Genérico"], ["referencia", "De marca"], ["similar", "Similar"]]} onMudar={(tipo) => setF((x) => ({ ...x, tipo }))} />
        <Opcoes rotulo="Ordenar por" valor={f.ordem} opcoes={[["nome", "Nome (A–Z)"], ["farmacias", "Mais farmácias têm"]]} onMudar={(ordem) => setF((x) => ({ ...x, ordem }))} />

        <label className="a-filtro-interruptor">
          <span className="a-flex">
            <span className="t-bodyBold">Só os que têm perto</span>
            <span className="t-label">Esconde os remédios em falta nas farmácias.</span>
          </span>
          <input type="checkbox" role="switch" checked={f.soComEstoque} onChange={(e) => setF((x) => ({ ...x, soComEstoque: e.target.checked }))} />
          <i aria-hidden="true" />
        </label>

        <Botao titulo={total ? `Ver ${total} ${total === 1 ? "remédio" : "remédios"}` : "Nenhum remédio"} disabled={!total} onClick={() => onAplicar(f)} />
      </div>
    </dialog>
  );
}
