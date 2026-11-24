// Notificações (notificacoes.tsx do intermedi-app): lembretes das doses de
// hoje que já passaram e dicas do app. Tudo local.
import { useNavigate } from "react-router-dom";
import { diaChave, marcarNotificacoesLidas, minutosDe, usePaciente } from "../../../demoServices/patientService";
import { Ionicon } from "../components/Ionicon";
import { Cabecalho } from "../components/ui";
import { FALAS } from "../personalidade";
import { useDosesDeHoje } from "./Inicio";

type Item = { id: string; icone: string; titulo: string; texto: string; quando: string; destino?: string };

const DICAS: Item[] = [
  { id: "dica-boas-vindas", icone: "information-circle-outline", titulo: "Boas-vindas ao Intermedi", texto: "Busque remédios e veja quais farmácias têm estoque perto de você.", quando: "Dica", destino: "/aplicativo/remedios" },
  { id: "dica-rotina", icone: "alarm-outline", titulo: "Lembretes das suas doses", texto: "Abra um remédio e toque em “Adicionar à rotina”. Eu aviso na hora de tomar.", quando: "Dica", destino: "/aplicativo/remedios" },
];

export function useNotificacoesApp() {
  const doses = useDosesDeHoje();
  const lidas = usePaciente((p) => p.notificacoesLidas);
  const f = FALAS[usePaciente((p) => p.mascote)];
  const agora = new Date();
  const minutos = agora.getHours() * 60 + agora.getMinutes();
  const hoje: Item[] = doses
    .filter((d) => !d.status && minutosDe(d.horario) <= minutos)
    .map((d) => ({ id: `dose-${diaChave()}-${d.id}`, icone: "alarm-outline", titulo: f.notificacao(d.remedio.nomeRemedio), texto: f.atrasada(d.remedio.nomeRemedio, d.horario), quando: `Hoje, ${d.horario}`, destino: "/aplicativo/comprimidos" }));
  const grupos = [{ titulo: "Hoje", itens: hoje }, { titulo: "Dicas do app", itens: DICAS }].filter((g) => g.itens.length);
  const todos = grupos.flatMap((g) => g.itens);
  return { grupos, todos, lidas, naoLidas: todos.filter((i) => !lidas.includes(i.id)).length };
}

export default function Notificacoes() {
  const navigate = useNavigate();
  const { grupos, todos, lidas, naoLidas } = useNotificacoesApp();
  const abrir = (item: Item) => {
    marcarNotificacoesLidas([item.id]);
    if (item.destino) navigate(item.destino);
  };
  return (
    <div className="a-tela">
      <Cabecalho
        voltar
        titulo="Notificações"
        subtitulo={naoLidas ? `${naoLidas} ${naoLidas === 1 ? "não lida" : "não lidas"}` : "Tudo lido"}
        direita={naoLidas ? <button type="button" className="a-marcar-todas" onClick={() => marcarNotificacoesLidas(todos.map((i) => i.id))}>Marcar todas<br />como lidas</button> : undefined}
      />
      <div className="a-corpo a-corpo-largo">
        {grupos.map((grupo) => (
          <section key={grupo.titulo} className="a-grupo-notif">
            <h2 className="t-h3">{grupo.titulo}</h2>
            {grupo.itens.map((item) => {
              const naoLida = !lidas.includes(item.id);
              return (
                <button key={item.id} type="button" className={`a-notif a-pressavel${naoLida ? " is-nao-lida" : ""}`} onClick={() => abrir(item)} aria-label={`${item.titulo}. ${naoLida ? "Não lida." : ""}`}>
                  <span className="a-notif-icone"><Ionicon name={item.icone} size={26} /></span>
                  <span className="a-flex">
                    <span className="t-bodyBold" style={{ color: "var(--a-primary-darker)" }}>{item.titulo}</span>
                    <span className="t-label">{item.texto}</span>
                    <span className="t-caption a-notif-quando">{item.quando}</span>
                  </span>
                  {naoLida && <i className="a-notif-ponto" aria-hidden="true" />}
                </button>
              );
            })}
          </section>
        ))}
      </div>
    </div>
  );
}
