// Peças visuais do intermedi-app (components/ui/*.tsx e components/medicine,
// components/pharmacy), de React Native para React DOM. Os tamanhos, raios,
// cores e textos são os mesmos; os estilos ficam em ../app.css.
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { alternarFavoritoFarmacia, alternarFavoritoRemedio, usePaciente } from "../../../demoServices/patientService";
import { formatarKm } from "../../../demoServices/pharmacyService";
import type { Farmacia, Remedio } from "../../../types";
import { exigeReceita, itensEmEstoque, ondeTem, tituloRemedio, type FormatoComprimido, type Tom } from "../dados";
import { FotoFarmacia, FotoRemedio } from "./Fotos";
import { Ionicon } from "./Ionicon";

export function Texto({ v = "body", cor, className = "", children, as: Tag = "p" }: {
  v?: "h1" | "h2" | "h3" | "body" | "bodyBold" | "label" | "caption" | "link";
  cor?: string;
  className?: string;
  children: ReactNode;
  as?: "p" | "span" | "h1" | "h2" | "h3" | "strong";
}) {
  return <Tag className={`t-${v} ${className}`} style={cor ? { color: cor } : undefined}>{children}</Tag>;
}

export function Card({ children, className = "", onClick, rotulo }: { children: ReactNode; className?: string; onClick?: () => void; rotulo?: string }) {
  if (!onClick) return <div className={`a-card ${className}`}>{children}</div>;
  return (
    <button type="button" className={`a-card a-pressavel ${className}`} onClick={onClick} aria-label={rotulo}>
      {children}
    </button>
  );
}

export function Tag({ rotulo, tom = "green", ponto = false, className = "" }: { rotulo: string; tom?: Tom; ponto?: boolean; className?: string }) {
  return (
    <span className={`a-tag tom-${tom} ${className}`}>
      {ponto && <i />}
      {rotulo}
    </span>
  );
}

export function IconTile({ icone, tom = "green", tamanho = 48, tamanhoIcone, children }: { icone?: string; tom?: Tom; tamanho?: number; tamanhoIcone?: number; children?: ReactNode }) {
  return (
    <span className={`a-tile tom-${tom}`} style={{ width: tamanho, height: tamanho, borderRadius: tamanho * 0.3 }}>
      {children ?? (icone ? <Ionicon name={icone} size={tamanhoIcone ?? tamanho * 0.46} /> : null)}
    </span>
  );
}

export function TituloSecao({ titulo, acao, onAcao }: { titulo: string; acao?: string; onAcao?: () => void }) {
  return (
    <div className="a-secao">
      <h2 className="t-h3">{titulo}</h2>
      {acao && onAcao && (
        <button type="button" className="a-secao-acao" onClick={onAcao}>{acao}</button>
      )}
    </div>
  );
}

export function LinhaLista({ icone, tom = "green", titulo, subtitulo, direita, onClick, divisor = false, inicio }: {
  icone?: string; tom?: Tom; titulo: string; subtitulo?: string; direita?: ReactNode; onClick?: () => void; divisor?: boolean; inicio?: ReactNode;
}) {
  const conteudo = (
    <>
      {inicio ?? (icone ? <IconTile icone={icone} tom={tom} tamanho={44} /> : null)}
      <span className="a-linha-texto">
        <span className="t-bodyBold">{titulo}</span>
        {subtitulo && <span className="t-label">{subtitulo}</span>}
      </span>
      {direita ?? (onClick ? <Ionicon name="chevron-forward" size={20} color="var(--a-text-2)" /> : null)}
    </>
  );
  const classe = `a-linha${divisor ? " com-divisor" : ""}`;
  return onClick ? (
    <button type="button" className={`${classe} a-pressavel`} onClick={onClick}>{conteudo}</button>
  ) : (
    <div className={classe}>{conteudo}</div>
  );
}

export function Vazio({ icone, titulo, texto, children }: { icone: string; titulo: string; texto?: string; children?: ReactNode }) {
  return (
    <div className="a-card a-vazio">
      <IconTile icone={icone} tamanho={56} />
      <p className="t-bodyBold">{titulo}</p>
      {texto && <p className="t-label">{texto}</p>}
      {children}
    </div>
  );
}

type VarianteBotao = "solid" | "outline" | "ghost" | "solidLight" | "outlineLight" | "danger" | "soft";
export function Botao({ titulo, variante = "solid", compacto = false, larguraTotal = true, icone, onClick, disabled, tipo = "button", rotulo, className = "" }: {
  titulo: string; variante?: VarianteBotao; compacto?: boolean; larguraTotal?: boolean; icone?: ReactNode; onClick?: () => void; disabled?: boolean; tipo?: "button" | "submit"; rotulo?: string; className?: string;
}) {
  return (
    <button
      type={tipo}
      className={`a-botao b-${variante}${compacto ? " is-compacto" : ""}${larguraTotal ? " is-largo" : ""} ${className}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={rotulo}
    >
      {icone}
      <span>{titulo}</span>
    </button>
  );
}

export function BotaoVoltar({ tom = "light", onClick }: { tom?: "light" | "dark"; onClick?: () => void }) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      className={`a-voltar is-${tom}`}
      aria-label="Voltar"
      onClick={onClick ?? (() => (window.history.state?.idx > 0 ? navigate(-1) : navigate("/aplicativo")))}
    >
      <Ionicon name="chevron-back" size={22} />
    </button>
  );
}

export function BotaoFavorito({ selecionado, rotulo, onClick, flutuante = false }: { selecionado: boolean; rotulo: string; onClick: () => void; flutuante?: boolean }) {
  return (
    <button type="button" className={`a-favorito${flutuante ? " is-flutuante" : ""}${selecionado ? " is-ativo" : ""}`} aria-label={rotulo} aria-pressed={selecionado} onClick={onClick}>
      <Ionicon name={selecionado ? "heart" : "heart-outline"} size={22} />
    </button>
  );
}

/** Círculo e cruz translúcidos do canto dos cabeçalhos verdes. */
function DecorCabecalho() {
  return (
    <span className="a-cab-decor" aria-hidden="true">
      <i className="a-cab-circulo" />
      <i className="a-cab-cruz"><b /><b /></i>
    </span>
  );
}

export function Cabecalho({ titulo, subtitulo, voltar = false, direita, inline, children, sobreposicao = 0, grande }: {
  titulo?: string; subtitulo?: string; voltar?: boolean; direita?: ReactNode; inline?: ReactNode; children?: ReactNode; sobreposicao?: number; grande?: boolean;
}) {
  const tituloGrande = grande ?? !voltar;
  return (
    <header className="a-cab" style={{ paddingBottom: 20 + sobreposicao }}>
      <DecorCabecalho />
      {(voltar || direita || inline || !tituloGrande) && (
        <div className="a-cab-linha">
          {voltar && <BotaoVoltar />}
          {inline ? (
            <div className="a-flex">{inline}</div>
          ) : !tituloGrande && titulo ? (
            <div className="a-flex">
              <h1 className="t-h3 a-cab-titulo-compacto">{titulo}</h1>
              {subtitulo && <p className="t-label a-cab-sub">{subtitulo}</p>}
            </div>
          ) : (
            <div className="a-flex" />
          )}
          {direita}
        </div>
      )}
      {tituloGrande && titulo && (
        <div className="a-cab-bloco">
          <h1 className="t-h2">{titulo}</h1>
          {subtitulo && <p className="t-body a-cab-sub">{subtitulo}</p>}
        </div>
      )}
      {children}
    </header>
  );
}

/** Desenho simples do comprimido quando o remédio não tem foto. */
export function Comprimido({ formato = "round", tamanho = 28, cores, costas = false }: { formato?: FormatoComprimido; tamanho?: number; cores?: [string, string]; costas?: boolean }) {
  const [a, b] = cores ?? ["#FFFFFF", "#FFFFFF"];
  if (formato === "capsule") {
    const w = tamanho * 1.5;
    const h = tamanho * 0.62;
    return (
      <span className="a-capsula" style={{ width: w, height: h, borderRadius: h / 2 }}>
        <i style={{ background: a }} />
        <i style={{ background: b }} />
      </span>
    );
  }
  if (formato === "oval") {
    const w = tamanho * 1.4;
    const h = tamanho * 0.75;
    return <span className="a-comprimido" style={{ width: w, height: h, borderRadius: h / 2, background: a }} />;
  }
  return (
    <span className={`a-comprimido${tamanho > 60 ? " is-grande" : ""}`} style={{ width: tamanho, height: tamanho, borderRadius: tamanho / 2, background: a }}>
      {!costas && <i style={{ height: tamanho * 0.66, width: Math.max(1.5, tamanho / 70) }} />}
    </span>
  );
}

export function MiniaturaRemedio({ tom = "neutral", formato = "round", tamanho = 58 }: { tom?: Tom; formato?: FormatoComprimido; tamanho?: number }) {
  const capsula: [string, string] | undefined = formato === "capsule" ? [tom === "orange" ? "#EE8F68" : "#7F74E0", tom === "orange" ? "#FFFFFF" : "#EF8FA6"] : undefined;
  return (
    <span className={`a-miniatura tom-${tom === "neutral" ? "muted" : tom}`} style={{ width: tamanho, height: tamanho, borderRadius: tamanho * 0.3 }}>
      <Comprimido formato={formato} tamanho={tamanho * 0.48} cores={capsula} />
    </span>
  );
}

export function CartaoRemedio({ remedio, onClick, mostrarFavorito = false }: { remedio: Remedio; onClick: () => void; mostrarFavorito?: boolean }) {
  const favorito = usePaciente((p) => p.favoritosRemedios.includes(remedio.idRemedio));
  const farmacias = ondeTem(remedio.idRemedio).length;
  return (
    <div className="a-card a-cartao-remedio">
      <button type="button" className="a-cartao-abrir a-pressavel" onClick={onClick} aria-label={`Ver detalhes de ${tituloRemedio(remedio)}`}>
        <FotoRemedio remedio={remedio} tamanho={72} />
        <span className="a-cartao-info">
          <span className="t-bodyBold a-cartao-titulo">{tituloRemedio(remedio)}</span>
          <span className="t-label a-uma-linha">{remedio.categorias.join(" · ")}</span>
          <span className="a-tags">
            {exigeReceita(remedio) && <Tag rotulo="Exige receita" tom="amber" />}
            {farmacias > 0 ? <Tag rotulo={`${farmacias} ${farmacias === 1 ? "farmácia" : "farmácias"}`} tom="green" /> : <Tag rotulo="Sem estoque" tom="neutral" />}
          </span>
        </span>
        {!mostrarFavorito && <Ionicon name="chevron-forward" size={20} color="var(--a-text-2)" />}
      </button>
      {mostrarFavorito && (
        <BotaoFavorito selecionado={favorito} rotulo={favorito ? "Remover dos favoritos" : "Salvar nos favoritos"} onClick={() => alternarFavoritoRemedio(remedio.idRemedio)} />
      )}
    </div>
  );
}

export function CartaoFarmacia({ farmacia, distancia }: { farmacia: Farmacia; distancia?: number }) {
  const navigate = useNavigate();
  const favorito = usePaciente((p) => p.favoritosFarmacias.includes(farmacia.idFarmacia));
  const itens = itensEmEstoque(farmacia.idFarmacia);
  return (
    <div className="a-card a-cartao-farmacia">
      <button type="button" className="a-cartao-farmacia-foto" onClick={() => navigate(`/aplicativo/farmacia/${farmacia.idFarmacia}`)} aria-label={`Abrir ${farmacia.nomeFarmacia}`} tabIndex={-1}>
        <FotoFarmacia farmacia={farmacia} altura={120} />
      </button>
      <div className="a-cartao-farmacia-topo">
        <button type="button" className="a-cartao-abrir a-pressavel" onClick={() => navigate(`/aplicativo/farmacia/${farmacia.idFarmacia}`)} aria-label={`${farmacia.nomeFarmacia}. Ver o que tem`}>
          <span className="a-cartao-info">
            <span className="t-h3">{farmacia.nomeFarmacia}</span>
            <span className="t-label">{[`${farmacia.rua}, ${farmacia.numero}`, formatarKm(distancia)].filter(Boolean).join(" · ")}</span>
            <span className="t-label a-negrito" style={{ color: itens > 0 ? "var(--a-primary-dark)" : "var(--a-muted)" }}>
              {itens > 0 ? `${itens} ${itens === 1 ? "remédio disponível" : "remédios disponíveis"}` : "Sem estoque no momento"}
            </span>
          </span>
        </button>
        <BotaoFavorito selecionado={favorito} rotulo={favorito ? "Remover farmácia dos favoritos" : "Salvar farmácia nos favoritos"} onClick={() => alternarFavoritoFarmacia(farmacia.idFarmacia)} />
      </div>
      <div className="a-cartao-farmacia-base">
        <span className="a-horario">
          <Ionicon name="time-outline" size={18} color="var(--a-primary-dark)" />
          <span className="t-label">{farmacia.horario}</span>
        </span>
        <Botao compacto larguraTotal={false} titulo="Ver o que tem" onClick={() => navigate(`/aplicativo/farmacia/${farmacia.idFarmacia}`)} rotulo={`Ver o que tem na ${farmacia.nomeFarmacia}`} />
      </div>
    </div>
  );
}
