// components/Remedios.jsx do intermedi-frontend. Sem foto (a demonstração não
// carrega imagens): o ícone de pílula aparece, como no original quando o
// remédio não tem foto. As ações de estoque (entrada, ajuste, remoção) não
// existem aqui: a demonstração não edita cadastros.
import { useEffect, useRef } from "react";
import { ManagerIcon } from "../../../shared/icons";
import NumeroAnimado from "./NumeroAnimado";
import { formatarValidade, nomeComDosagem, situacao, tarja } from "../lib/remedios";
import { propsLinha } from "../lib/util";
import { statusPedido } from "../lib/chamados";

export function FotoRemedio({ nome, tamanho = "sm" }) {
  return (
    <span className={`remedio-foto remedio-foto-${tamanho}`}>
      <span className="remedio-foto-vazia" role="img" aria-label={`${nome || "Remédio"} sem foto`}>
        <ManagerIcon name="pill" size={tamanho === "lg" ? 44 : 20} />
      </span>
    </span>
  );
}

export function TarjaBadge({ valor }) {
  const { label, tone } = tarja(valor);
  return <span className={`remedio-tarja remedio-tarja-${tone}`}>{label}</span>;
}

// Situação do estoque + selo "Lote vencido"
export function SituacaoBadges({ item }) {
  const { label, tone } = situacao(item.situacao);
  return (
    <span className="remedio-selos">
      <span className={`mgr-badge chamado-badge ${tone}`}>{label}</span>
      {item.vencido && <span className="mgr-badge chamado-badge red">Lote vencido</span>}
    </span>
  );
}

export function StatusPedidoBadge({ status }) {
  const { label, tone } = statusPedido(status);
  return <span className={`mgr-badge chamado-badge ${tone}`}>{label}</span>;
}

// Barra quantidade × estoque mínimo (cheia em 2× o mínimo)
export function BarraEstoque({ quantidade, minimo }) {
  const qtd = Number(quantidade) || 0;
  const min = Number(minimo) || 0;
  const pct = min > 0 ? Math.min(100, Math.round((qtd / (min * 2)) * 100)) : qtd > 0 ? 100 : 0;
  const tone = qtd === 0 ? "zerado" : qtd <= min ? "critico" : "ok";
  return (
    <div className="remedio-barra-wrap">
      <strong>{qtd.toLocaleString("pt-BR")} un.</strong>
      <span
        className={`remedio-barra remedio-barra-${tone}`}
        role="meter"
        aria-valuemin={0}
        aria-valuemax={Math.max(min * 2, qtd, 1)}
        aria-valuenow={qtd}
        aria-label={`${qtd} unidades, mínimo ${min}`}
      >
        <i style={{ width: `${pct}%` }} />
        {min > 0 && <b className="remedio-barra-min" style={{ left: "50%" }} aria-hidden="true" />}
      </span>
      <small>mínimo {min.toLocaleString("pt-BR")}</small>
    </div>
  );
}

// Cards Total · Críticos · Zerados · Vencidos; clicar aplica o filtro de situação
export function ResumoEstoque({ resumo, filtro, onFiltrar }) {
  const cards = [
    ["", "Total", resumo?.totalItens, "box"],
    ["critico", "Críticos", resumo?.criticos, "alert"],
    ["zerado", "Zerados", resumo?.zerados, "pill"],
    ["vencido", "Vencidos", resumo?.vencidos, "clock"],
  ];
  return (
    <div className="remedio-resumo" role="group" aria-label="Resumo do estoque">
      {cards.map(([valor, label, total, icone]) => (
        <button
          key={label}
          type="button"
          className={`remedio-resumo-card remedio-resumo-${valor || "total"}`}
          aria-pressed={filtro === valor}
          onClick={() => onFiltrar(filtro === valor ? "" : valor)}
        >
          <span className="directory-stat-icon"><ManagerIcon name={icone} size={20} /></span>
          <span>
            <small>{label}</small>
            <strong><NumeroAnimado valor={total ?? "—"} /></strong>
          </span>
        </button>
      ))}
    </div>
  );
}

// Tabela do estoque; `acoes(item)` desenha os botões de cada linha e
// `onAbrir(item, elemento)` torna a linha inteira clicável (detalhe do remédio).
export function EstoqueTabela({ itens, acoes, onAbrir }) {
  return (
    <div className="mgr-table-wrap">
      <table className="remedio-tabela">
        <thead>
          <tr>
            <th scope="col">Remédio</th>
            <th scope="col">Quantidade</th>
            <th scope="col">Situação</th>
            <th scope="col">Lote</th>
            <th scope="col">Validade</th>
            {acoes && <th scope="col">Ações</th>}
          </tr>
        </thead>
        <tbody>
          {itens.map((item) => (
            <tr
              key={item.idEstoque ?? item.idRemedio}
              {...(onAbrir ? propsLinha((el) => onAbrir(item, el), `Abrir detalhes de ${item.nomeRemedio}`) : {})}
              className={[onAbrir && "perfil-linha", (item.vencido || item.situacao !== "ok") && "remedio-linha-alerta"].filter(Boolean).join(" ") || undefined}
            >
              <td>
                <div className="remedio-celula">
                  <FotoRemedio nome={item.nomeRemedio} />
                  <div>
                    <strong>{nomeComDosagem(item)}</strong>
                    <small>{[item.apresentacaoRemedio, item.fabricanteRemedio].filter(Boolean).join(" · ")}</small>
                    <TarjaBadge valor={item.tarjaRemedio} />
                  </div>
                </div>
              </td>
              <td data-rotulo="Quantidade"><BarraEstoque quantidade={item.quantidade} minimo={item.estoqueMinimo} /></td>
              <td data-rotulo="Situação"><SituacaoBadges item={item} /></td>
              <td data-rotulo="Lote">{item.lote || "—"}</td>
              <td data-rotulo="Validade">{formatarValidade(item.validade)}</td>
              {acoes && <td className="remedio-td-acoes"><div className="remedio-acoes">{acoes(item)}</div></td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// components/Chamados.jsx (ChamadoModal): diálogo nativo das plataformas
export function ChamadoModal({ title, onClose, children, className = "" }) {
  const ref = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    const dialog = ref.current;
    dialog.showModal();
    return () => {
      if (dialog.open) dialog.close();
      previous?.focus?.();
    };
  }, []);
  return (
    <dialog ref={ref} className={`mgr-modal chamado-modal ${className}`} aria-label={title} onCancel={onClose}>
      <div className="mgr-modal-head">
        <h2>{title}</h2>
        <button type="button" aria-label="Fechar janela" onClick={onClose}>×</button>
      </div>
      {children}
    </dialog>
  );
}

// Região sempre presente para leitores de tela anunciarem o toast
export function ToastRegion({ message }) {
  return (
    <div className="chamado-toast-region" aria-live="polite" role="status">
      {message && <div className="chamado-toast" key={message.id}>{message.texto}</div>}
    </div>
  );
}
