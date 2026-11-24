// Guia prático: acompanha o visitante no primeiro pedido, na tela de verdade.
// Cada passo diz ONDE tocar (o alvo pisca em verde) e PARA QUE serve aquilo na
// rotina de uma farmácia. Nada fica bloqueado: o guia só observa o que a
// pessoa faz e avança sozinho quando o passo acontece.
//
// O passo atual é calculado pelos dados (pedidos ao vivo, rota, janela aberta),
// então sair e voltar retoma de onde parou.
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { concluirGuia } from "../../../session/session";
import { ManagerIcon } from "../../../shared/icons";
import type { Pedido } from "../../../types";
import type { ExperienciaGerente } from "../config";

export type PassoGuia = {
  id: string;
  titulo: string;
  /** Para que serve, na rotina da farmácia. */
  pratica: string;
  /** O que fazer agora. */
  acao?: string;
  /** Seletor do que deve piscar na tela. */
  alvo?: string;
  final?: boolean;
};

type Entrada = {
  experiencia: ExperienciaGerente;
  base: string;
  pathname: string;
  pedidos: Pedido[];
  pedindo: boolean;
  /** Algo visível na tela (consultado a cada instante). */
  temNaTela: (seletor: string) => boolean;
};

const VIVOS = (pedidos: Pedido[]) => pedidos.filter((p) => p.aoVivo);

function passosSolicitante({ base, pathname, pedidos, pedindo, temNaTela }: Entrada): { passo: PassoGuia; numero: number; total: number } {
  const total = 4;
  const vivos = VIVOS(pedidos);
  const naVisaoGeral = pathname.replace(/\/$/, "") === base;
  const entregue = vivos.some((p) => p.status === "recebida");
  if (entregue) {
    return {
      numero: total,
      total,
      passo: {
        id: "pronto",
        final: true,
        titulo: "Remédio entregue!",
        pratica: "O remédio entrou no seu estoque e o paciente foi atendido sem precisar procurar outra farmácia. É assim que a rede funciona.",
      },
    };
  }
  if (vivos.length) {
    const naConfirmacao = temNaTela(".guia-confirmacao");
    const nosPedidos = pathname.endsWith("/pedidos");
    return {
      numero: 4,
      total,
      passo: {
        id: "acompanhar",
        titulo: "Acompanhe a entrega",
        pratica: "A outra farmácia aceita, a equipe dela separa as caixas e o entregador traz até você. Cada etapa aparece aqui, como o rastreio de uma encomenda.",
        acao: naConfirmacao
          ? "Toque em Acompanhar a entrega."
          : nosPedidos
            ? "Veja o status mudar sozinho. Para não esperar, use Concluir simulação agora."
            : "Abra Pedidos da rede para ver o rastreio.",
        alvo: naConfirmacao
          ? ".guia-confirmacao .mgr-primary"
          : nosPedidos
            ? ".demo-rastreio-vivo"
            : naVisaoGeral
              ? '[data-track="atalho:pedidos-da-rede"]'
              : 'a[data-track="menu:pedidos"]',
      },
    };
  }
  if (pedindo && temNaTela(".demo-pedir-farmacias")) {
    return {
      numero: 3,
      total,
      passo: {
        id: "enviar",
        titulo: "Quem envia e quanto",
        pratica: "A Intermedi só mostra as farmácias que podem enviar sem ficar abaixo do estoque mínimo delas, e já sugere a quantidade para repor o seu.",
        acao: "Confira e toque em Enviar solicitação.",
        alvo: ".demo-pedir-farmacias",
      },
    };
  }
  if (pedindo) {
    return {
      numero: 2,
      total,
      passo: {
        id: "remedio",
        titulo: "Escolha o remédio que falta",
        pratica: "Os que aparecem com \"precisa repor\" estão acabando aqui na sua unidade.",
        acao: "Escolha um remédio na lista.",
        alvo: ".emp-service-form select",
      },
    };
  }
  return {
    numero: 1,
    total,
    passo: {
      id: "abrir",
      titulo: "Faltou um remédio? Peça à rede",
      pratica: "Um paciente chegou com a receita e a sua farmácia não tem o remédio. Em vez de mandar a pessoa embora, você pede a uma farmácia da rede que tem sobrando.",
      acao: naVisaoGeral ? "Toque em Pedir à rede." : "Volte à Visão geral para achar o botão Pedir à rede.",
      alvo: naVisaoGeral ? '[data-track="atalho:pedir-a-rede"]' : 'a[data-track="menu:visao-geral"]',
    },
  };
}

function passosFornecedora({ base, pathname, pedidos }: Entrada): { passo: PassoGuia; numero: number; total: number } {
  const total = 4;
  const vivos = VIVOS(pedidos);
  const naVisaoGeral = pathname.replace(/\/$/, "") === base;
  const nosPedidos = pathname.endsWith("/pedidos");
  const pedido = vivos[0];
  if (pedido?.status === "recusada") {
    return {
      numero: total,
      total,
      passo: {
        id: "recusado",
        final: true,
        titulo: "Pedido recusado",
        pratica: "Tudo bem recusar: a farmácia que pediu fica sabendo na hora e o pedido segue para outra farmácia da rede que tenha o remédio.",
      },
    };
  }
  if (pedido?.status === "recebida") {
    return {
      numero: total,
      total,
      passo: {
        id: "pronto",
        final: true,
        titulo: "Envio entregue!",
        pratica: "O remédio que estava no seu estoque chegou à outra farmácia, e o paciente dela foi atendido. Sua farmácia ajudou a rede.",
      },
    };
  }
  if (pedido && ["preparando", "enviada"].includes(pedido.status)) {
    return {
      numero: 4,
      total,
      passo: {
        id: "envio",
        titulo: "Acompanhe até a entrega",
        pratica: "As caixas vão para o caminhão e ele sai para a farmácia que pediu. Ela acompanha cada etapa do lado dela, ao mesmo tempo que você.",
        acao: "Espere a entrega ou toque em Concluir simulação agora.",
        alvo: ".demo-pedido-rastreio, .preparos",
      },
    };
  }
  if (pedido?.status === "aprovada") {
    return {
      numero: 3,
      total,
      passo: {
        id: "equipe",
        titulo: "Sua equipe prepara o envio",
        pratica: "Ao aceitar, um funcionário recebe o aviso na tela dele para separar as caixas e carregar o caminhão. Você vê quem está fazendo.",
        acao: "Toque em Começar agora, ou espere ele assumir.",
        alvo: '[data-track="comecar-preparo"]',
      },
    };
  }
  if (pedido && nosPedidos) {
    return {
      numero: 2,
      total,
      passo: {
        id: "aceitar",
        titulo: "Responda o pedido",
        pratica: "Antes de aceitar, a Intermedi mostra como fica o seu estoque depois do envio. Assim você ajuda sem ficar sem o remédio.",
        acao: "Toque em Aceitar pedido e depois em Confirmar aceite.",
        alvo: '[data-track="aceitar-pedido-rede"], .chamado-confirmar',
      },
    };
  }
  if (pedido) {
    return {
      numero: 1,
      total,
      passo: {
        id: "abrir",
        titulo: "Uma farmácia precisa de ajuda",
        pratica: "Outra farmácia da rede está sem um remédio que você tem no estoque. Com a Intermedi, o seu estoque ajuda um paciente de outro bairro.",
        acao: "Abra Pedidos da rede.",
        alvo: naVisaoGeral ? '[data-track="atalho:pedidos-da-rede"]' : 'a[data-track="menu:pedidos"]',
      },
    };
  }
  return {
    numero: 1,
    total,
    passo: {
      id: "esperar",
      titulo: "Um pedido está chegando",
      pratica: "Aqui você é a farmácia que atende. Outra farmácia da rede está sem um remédio que você tem, e o pedido dela chega em instantes.",
    },
  };
}

/** Passo atual do guia, recalculado quando os dados ou a tela mudam. */
export function useGuiaPratico(entrada: Omit<Entrada, "temNaTela" | "pathname">) {
  const { pathname } = useLocation();
  // Partes que só existem no DOM (janela aberta, farmácias listadas): confere a cada instante.
  const [, setTique] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => setTique((n) => n + 1), 400);
    return () => window.clearInterval(t);
  }, []);
  const temNaTela = (seletor: string) => Boolean(document.querySelector(seletor));
  const dados = { ...entrada, pathname, temNaTela };
  return entrada.experiencia === "solicitante" ? passosSolicitante(dados) : passosFornecedora(dados);
}

/** Faz o alvo piscar e rola até ele quando o passo muda. */
function useDestaque(alvo: string | undefined, chave: string) {
  const rolouPara = useRef("");
  useEffect(() => {
    if (!alvo) return undefined;
    let atual: Element | null = null;
    let rolagem = 0;
    const marcar = () => {
      const el = document.querySelector(alvo);
      if (el !== atual) {
        atual?.classList.remove("guia-alvo");
        atual = el;
      }
      if (!el) return;
      el.classList.add("guia-alvo");
      if (rolouPara.current !== chave) {
        rolouPara.current = chave;
        // Espera a troca de tela terminar (ela volta ao topo) antes de rolar até o alvo.
        rolagem = window.setTimeout(() => {
          const reduzir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
          document.querySelector(alvo)?.scrollIntoView({ block: "center", inline: "nearest", behavior: reduzir ? "auto" : "smooth" });
        }, 350);
      }
    };
    marcar();
    const t = window.setInterval(marcar, 300);
    return () => {
      window.clearInterval(t);
      window.clearTimeout(rolagem);
      atual?.classList.remove("guia-alvo");
    };
  }, [alvo, chave]);
}

function Conteudo({ passo, numero, total }: { passo: PassoGuia; numero: number; total: number }) {
  return (
    <div key={passo.id} className="guia-conteudo">
      <h2>{passo.titulo}</h2>
      <p className="guia-pratica">
        <strong>Na prática: </strong>
        {passo.pratica}
      </p>
      {passo.acao && (
        <p className="guia-acao">
          <span className="guia-acao-icone" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>
          </span>
          {passo.acao}
        </p>
      )}
      <span className="guia-trilho" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => <i key={i} className={i < numero ? "is-feito" : undefined} />)}
      </span>
    </div>
  );
}

/** Dica do guia dentro de uma janela (a janela fica por cima do cartão do guia). */
export function GuiaNaJanela({ guia }: { guia: ReturnType<typeof useGuiaPratico> | null }) {
  useDestaque(guia?.passo.alvo, guia?.passo.id ?? "");
  if (!guia) return null;
  return (
    <div className="guia guia-na-janela" role="status">
      <div className="guia-topo">
        <span className="guia-marca"><ManagerIcon name="info" size={14} /> Guia prático · passo {guia.numero} de {guia.total}</span>
      </div>
      <Conteudo {...guia} />
    </div>
  );
}

/** Cartão fixo no pé da tela (celular) ou no canto (computador). */
export function GuiaPratico({ experiencia, guia, escondido }: { experiencia: ExperienciaGerente; guia: ReturnType<typeof useGuiaPratico>; escondido: boolean }) {
  const [minimizado, setMinimizado] = useState(false);
  useDestaque(escondido || minimizado ? undefined : guia.passo.alvo, guia.passo.id);
  // Passo novo: o cartão volta a abrir, para a pessoa ver o que fazer.
  useEffect(() => setMinimizado(false), [guia.passo.id]);
  if (escondido) return null;

  if (minimizado) {
    return (
      <button type="button" className="guia-pilula" onClick={() => setMinimizado(false)} aria-label={`Abrir o guia prático: passo ${guia.numero} de ${guia.total}`}>
        <ManagerIcon name="info" size={16} />
        Guia · passo {guia.numero} de {guia.total}
      </button>
    );
  }

  return (
    <aside className={`guia${guia.passo.final ? " is-final" : ""}`} aria-label="Guia prático" aria-live="polite">
      <div className="guia-topo">
        <span className="guia-marca"><ManagerIcon name="info" size={14} /> Guia prático · passo {guia.numero} de {guia.total}</span>
        {!guia.passo.final && (
          <>
            <button type="button" className="guia-icone-botao" onClick={() => setMinimizado(true)} aria-label="Minimizar o guia">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 12h12" /></svg>
            </button>
            <button type="button" className="guia-icone-botao" onClick={() => concluirGuia(experiencia)} aria-label="Fechar o guia (você pode explorar sozinho)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="m6 6 12 12M18 6 6 18" /></svg>
            </button>
          </>
        )}
      </div>
      <Conteudo {...guia} />
      {guia.passo.final && (
        <button type="button" className="mgr-primary guia-concluir" onClick={() => concluirGuia(experiencia)}>
          Concluir guia
        </button>
      )}
    </aside>
  );
}
