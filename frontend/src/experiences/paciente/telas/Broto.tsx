// Assistente do mascote ((tabs)/broto.tsx + services/assistente.ts do
// intermedi-app). O original já responde com regras simples (não é um modelo
// de IA); aqui as mesmas regras consultam o estoque fictício local. A busca
// por foto da embalagem precisa da câmera e do servidor e não está na demo.
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { REMEDIOS } from "../../../data/remedios";
import { usePaciente } from "../../../demoServices/patientService";
import { formatarKm } from "../../../demoServices/pharmacyService";
import { MASCOTES, MascoteAvatar } from "../../../shared/Mascote";
import type { Remedio } from "../../../types";
import { POUCAS_UNIDADES, exigeReceita, ondeTem, tituloRemedio, type Tom } from "../dados";
import { Ionicon } from "../components/Ionicon";
import { IconTile } from "../components/ui";

type Resposta = {
  texto: string;
  conferido?: string;
  estoque?: { nome: string; linhas: { nome: string; detalhe: string; qtd: string; poucas: boolean }[]; dica?: string };
  acoes?: { rotulo: string; destino: string; principal?: boolean }[];
};
type Mensagem = { id: number; de: "voce" | "bot"; resposta: Resposta };

const normalizar = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function acharRemedios(pergunta: string): Remedio[] {
  const q = normalizar(pergunta);
  const porNome = new Map<string, Remedio>();
  REMEDIOS.forEach((r) => {
    const nome = normalizar(r.nomeRemedio.split(" ")[0]);
    if (nome.length > 2 && q.includes(nome) && !porNome.has(nome)) porNome.set(nome, r);
  });
  return Array.from(porNome.values());
}

function responder(pergunta: string): Resposta {
  const q = normalizar(pergunta);
  const achados = acharRemedios(pergunta);
  if (achados.length >= 2) {
    return {
      texto: `${achados.slice(0, 2).map((r) => `${tituloRemedio(r)}: ${ondeTem(r.idRemedio).length} farmácia(s) com estoque${exigeReceita(r) ? ", exige receita" : ""}`).join("\n")}\n\nQual é melhor para você depende do caso — confirme com o farmacêutico ou com seu médico.`,
      acoes: achados.slice(0, 2).map((r, i) => ({ rotulo: `Ver ${r.nomeRemedio}`, destino: `/aplicativo/medicamento/${r.idRemedio}`, principal: i === 0 })),
    };
  }
  if (achados.length === 1) {
    const r = achados[0];
    const lista = ondeTem(r.idRemedio);
    const conferido = "Consultou o estoque de 5 farmácias";
    if (!lista.length) {
      return {
        conferido,
        texto: `${tituloRemedio(r)} está em falta nas farmácias cadastradas agora.${exigeReceita(r) ? " Lembre que ele exige receita." : ""}`,
        acoes: [{ rotulo: "Ver remédio", destino: `/aplicativo/medicamento/${r.idRemedio}`, principal: true }, { rotulo: "Ver farmácias", destino: "/aplicativo/farmacias" }],
      };
    }
    const melhor = lista[0];
    return {
      conferido,
      texto: `Sim! Encontrei ${tituloRemedio(r)} em ${lista.length} ${lista.length === 1 ? "farmácia" : "farmácias"}:`,
      estoque: {
        nome: tituloRemedio(r),
        linhas: lista.slice(0, 3).map((i) => ({ nome: i.farmacia.nomeFarmacia, detalhe: [formatarKm(i.distancia), i.farmacia.bairro].filter(Boolean).join(" · "), qtd: `${i.quantidade} un.`, poucas: i.quantidade < POUCAS_UNIDADES })),
        dica: `${melhor.farmacia.nomeFarmacia} é a mais perto e tem ${melhor.quantidade} unidades.${exigeReceita(r) ? " Leve a receita." : ""}`,
      },
      acoes: [
        { rotulo: "Ver farmácia", destino: `/aplicativo/farmacia/${melhor.farmacia.idFarmacia}`, principal: true },
        { rotulo: "Ver remédio", destino: `/aplicativo/medicamento/${r.idRemedio}` },
      ],
    };
  }
  if (/reserv/.test(q)) return { texto: "Ainda não dá para reservar pelo app. Abra o remédio, veja qual farmácia tem estoque e vá até lá.", acoes: [{ rotulo: "Ver remédios", destino: "/aplicativo/remedios", principal: true }] };
  if (/renov/.test(q)) return { texto: "A renovação da receita é feita com o médico, na UBS ou na consulta. Leve a receita antiga e um documento com foto." };
  if (/receita/.test(q)) return { texto: "Remédios com a etiqueta \"Exige receita\" só são entregues com a receita em mãos. Os que mostram \"Sem receita\" são isentos de prescrição — mesmo assim, confirme com o farmacêutico.", acoes: [{ rotulo: "Ver remédios", destino: "/aplicativo/remedios" }] };
  if (/horario|movimento|fila|lotad|cheio/.test(q)) return { texto: "Ainda não tenho o movimento das unidades por horário. O horário de funcionamento de cada farmácia aparece na aba Farmácias.", acoes: [{ rotulo: "Ver farmácias", destino: "/aplicativo/farmacias", principal: true }] };
  if (/mascote|trocar/.test(q)) return { texto: "Para trocar de mascote, vá em Perfil → Seu mascote e escolha entre Broto, Lume e Luar.", acoes: [{ rotulo: "Trocar mascote", destino: "/aplicativo/mascote", principal: true }] };
  if (/lembr|dose|rotina|tomar|horas/.test(q)) return { texto: "Abra um remédio e toque em \"Adicionar à rotina\". Eu mostro a próxima dose na tela inicial e você confirma com \"Tomei\".", acoes: [{ rotulo: "Seus comprimidos", destino: "/aplicativo/comprimidos", principal: true }] };
  if (/farmacia|perto|ubs|endereco/.test(q)) return { texto: "Na aba Farmácias você vê as unidades cadastradas, o horário e o estoque de cada uma.", acoes: [{ rotulo: "Ver farmácias", destino: "/aplicativo/farmacias", principal: true }] };
  return { texto: "Posso procurar um remédio para você (é só escrever o nome), mostrar farmácias com estoque e explicar como usar o app. Para dúvidas de tratamento, fale com o farmacêutico." };
}

const TONS_CHIP: Tom[] = ["orange", "blue", "amber", "purple"];

export default function Broto() {
  const navigate = useNavigate();
  const nome = usePaciente((p) => p.nome);
  const mascoteId = usePaciente((p) => p.mascote);
  const primeiraDose = usePaciente((p) => p.doses[0]);
  const m = MASCOTES[mascoteId];
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [texto, setTexto] = useState("");
  const [pensando, setPensando] = useState(false);
  const proximoId = useRef(1);
  const fim = useRef<HTMLDivElement>(null);
  const timer = useRef(0);
  const nomeDose = primeiraDose ? REMEDIOS.find((r) => r.idRemedio === primeiraDose.idRemedio)?.nomeRemedio : undefined;
  const sugestoes = [
    { icone: "location-outline", tom: "green" as Tom, texto: nomeDose ? `Tem ${nomeDose} perto de mim?` : "Onde tem dipirona perto de mim?" },
    { icone: "bandage-outline", tom: "orange" as Tom, texto: "Preciso de receita?" },
    { icone: "document-text-outline", tom: "blue" as Tom, texto: "Como renovo minha receita?" },
    { icone: "time-outline", tom: "amber" as Tom, texto: "Como funcionam os lembretes?" },
  ];
  const chips = ["Preciso de receita?", "Tem losartana?", "Como troco de mascote?", "Como faço uma reserva?"];

  useEffect(() => () => window.clearTimeout(timer.current), []);
  useEffect(() => {
    fim.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [mensagens, pensando]);

  function perguntar(pergunta: string) {
    const q = pergunta.trim().slice(0, 200);
    if (!q || pensando) return;
    setTexto("");
    setMensagens((l) => [...l, { id: proximoId.current++, de: "voce", resposta: { texto: q } }]);
    setPensando(true);
    // pequena pausa para a resposta não parecer instantânea demais
    timer.current = window.setTimeout(() => {
      setMensagens((l) => [...l, { id: proximoId.current++, de: "bot", resposta: responder(q) }]);
      setPensando(false);
    }, 650);
  }

  function enviar(e: FormEvent) {
    e.preventDefault();
    perguntar(texto);
  }

  const artigo = m.artigo === "a" ? "à" : "ao";
  return (
    <div className="a-tela a-broto">
      {!mensagens.length ? (
        <header className="a-cab a-broto-hero">
          <span className="a-cab-decor" aria-hidden="true"><i className="a-cab-circulo" /></span>
          <span className="a-auvox"><b>A</b>AUVOX IA</span>
          <span className="a-broto-avatar"><MascoteAvatar id={mascoteId} tamanho={96} /></span>
          <h1 className="t-h2">Oi, {nome}! Eu sou {m.artigo} {m.nome}.</h1>
          <p className="t-body a-cab-sub">Pergunte sobre remédios, farmácias com estoque ou como usar o app.</p>
        </header>
      ) : (
        <header className="a-broto-topo">
          <MascoteAvatar id={mascoteId} tamanho={44} fundo="#FFFFFF" />
          <span className="a-flex">
            <span className="t-bodyBold" style={{ color: "#fff" }}>{m.nome}</span>
            <span className="t-caption" style={{ color: "rgba(255,255,255,.85)" }}>Assistente do Intermedi</span>
          </span>
          <button type="button" className="a-broto-nova" aria-label="Nova conversa" onClick={() => setMensagens([])}>
            <Ionicon name="refresh" size={20} />
          </button>
        </header>
      )}

      <div className="a-corpo a-broto-corpo">
        {!mensagens.length ? (
          <>
            <h2 className="t-h3">Experimente perguntar</h2>
            <div className="a-sugestoes">
              {sugestoes.map((s) => (
                <button key={s.texto} type="button" className={`a-sugestao tom-${s.tom} a-pressavel`} onClick={() => perguntar(s.texto)}>
                  <IconTile icone={s.icone} tom={s.tom} tamanho={40} />
                  <span className="t-bodyBold a-sugestao-texto">{s.texto}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="a-chat" aria-live="polite">
            {mensagens.map((msg) =>
              msg.de === "voce" ? (
                <p key={msg.id} className="a-balao-voce t-body">{msg.resposta.texto}</p>
              ) : (
                <div key={msg.id} className="a-balao-bot">
                  {msg.resposta.conferido && (
                    <span className="a-conferido t-caption"><Ionicon name="checkmark-circle" size={14} /> {msg.resposta.conferido}</span>
                  )}
                  <p className="t-body a-quebra">{msg.resposta.texto}</p>
                  {msg.resposta.estoque && (
                    <div className="a-estoque-bot">
                      {msg.resposta.estoque.linhas.map((l, i) => (
                        <div key={l.nome} className="a-estoque-linha">
                          <span className={`a-rank tom-${i === 0 ? "green" : "neutral"}`}>{i + 1}</span>
                          <span className="a-flex">
                            <span className="t-bodyBold">{l.nome}</span>
                            <span className="t-caption">{l.detalhe}</span>
                          </span>
                          <span className={`a-tag tom-${l.poucas ? "amber" : "green"}`}>{l.qtd}</span>
                        </div>
                      ))}
                      {msg.resposta.estoque.dica && (
                        <p className="a-dica t-label"><Ionicon name="bulb-outline" size={18} color="var(--a-primary-dark)" /><span><b>Minha sugestão: </b>{msg.resposta.estoque.dica}</span></p>
                      )}
                    </div>
                  )}
                  {!!msg.resposta.acoes?.length && (
                    <div className="a-bot-acoes">
                      {msg.resposta.acoes.map((a) => (
                        <button key={a.rotulo} type="button" className={`a-bot-acao${a.principal ? " is-principal" : ""}`} onClick={() => navigate(a.destino)}>
                          {a.rotulo}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ),
            )}
            {pensando && <p className="a-balao-bot a-pensando t-label"><span className="a-pontos"><i /><i /><i /></span>{m.nome} está consultando…</p>}
            <div className="a-chips a-chips-chat">
              {chips.map((c, i) => (
                <button key={c} type="button" className={`a-chip tom-${TONS_CHIP[i % TONS_CHIP.length]}`} onClick={() => perguntar(c)}>{c}</button>
              ))}
            </div>
            <div ref={fim} />
          </div>
        )}
      </div>

      <form className="a-broto-entrada" onSubmit={enviar}>
        <div className="a-entrada">
          <input value={texto} onChange={(e) => setTexto(e.target.value)} maxLength={200} placeholder={`Pergunte ${artigo} ${m.nome}`} aria-label={`Pergunte ${artigo} ${m.nome}`} enterKeyHint="send" />
          <button type="submit" className="a-enviar" aria-label="Enviar pergunta" disabled={!texto.trim() || pensando}>
            <Ionicon name="send" size={20} />
          </button>
        </div>
        <p className="t-caption a-centro">AUVOX IA pode errar. Para tratamento, fale com o farmacêutico.</p>
      </form>
    </div>
  );
}
