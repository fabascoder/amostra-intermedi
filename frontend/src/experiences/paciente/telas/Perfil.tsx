// Perfil ((tabs)/perfil.tsx do intermedi-app). Na demonstração não há conta:
// o "Sair da conta" vira "Trocar experiência" (volta à Central sem apagar nada)
// e os dados pessoais (e-mail, CPF, endereço) não existem.
import { useNavigate } from "react-router-dom";
import { usePaciente } from "../../../demoServices/patientService";
import { MASCOTES, MascoteAvatar } from "../../../shared/Mascote";
import { ContadorSessao, TrocarExperiencia } from "../../../shared/Sessao";
import { Cabecalho, LinhaLista, Tag } from "../components/ui";
import { useDosesDeHoje } from "./Inicio";
import { useNotificacoesApp } from "./Notificacoes";

export default function Perfil() {
  const navigate = useNavigate();
  const nome = usePaciente((p) => p.nome);
  const mascote = usePaciente((p) => p.mascote);
  const favoritos = usePaciente((p) => p.favoritosRemedios.length + p.favoritosFarmacias.length);
  const doses = useDosesDeHoje();
  const { naoLidas } = useNotificacoesApp();
  const pendente = doses.find((d) => !d.status);
  const emUso = new Set(doses.map((d) => d.idRemedio)).size;
  const estatisticas = [
    { valor: emUso, rotulo: "Remédios em uso", cor: "var(--a-primary-dark)" },
    { valor: doses.filter((d) => d.status === "tomado").length, rotulo: "Doses tomadas hoje", cor: "var(--a-orange)" },
    { valor: favoritos, rotulo: "Favoritos", cor: "var(--a-blue)" },
  ];
  return (
    <div className="a-tela">
      <Cabecalho
        grande={false}
        sobreposicao={58}
        inline={
          <div className="a-identidade">
            <span className="a-avatar" aria-hidden="true">{nome.charAt(0).toLocaleUpperCase("pt-BR")}</span>
            <div className="a-flex">
              <h1 className="t-h3 a-identidade-nome">{nome}</h1>
              <p className="t-label a-cab-sub">Paciente demonstrativo</p>
            </div>
          </div>
        }
      />
      <div className="a-corpo a-corpo-sobe-mais">
        <div className="a-estatisticas">
          {estatisticas.map((e) => (
            <div key={e.rotulo} className="a-estatistica">
              <span className="t-h2" style={{ color: e.cor }}>{e.valor}</span>
              <span className="t-caption">{e.rotulo}</span>
            </div>
          ))}
        </div>
        <div className="a-grupo">
          <LinhaLista inicio={<MascoteAvatar id={mascote} tamanho={44} />} titulo="Seu mascote" subtitulo={MASCOTES[mascote].nome} onClick={() => navigate("/aplicativo/mascote")} />
          <LinhaLista divisor icone="alarm-outline" tom="blue" titulo="Seus comprimidos" direita={pendente ? <Tag rotulo={`Próxima ${pendente.horario}`} tom="amber" /> : undefined} onClick={() => navigate("/aplicativo/comprimidos")} />
          <LinhaLista divisor icone="notifications-outline" tom="orange" titulo="Notificações" direita={naoLidas ? <Tag rotulo={`${naoLidas} nova${naoLidas > 1 ? "s" : ""}`} tom="red" /> : undefined} onClick={() => navigate("/aplicativo/notificacoes")} />
        </div>
        <div className="a-grupo a-grupo-demo">
          <div className="a-demo-linha">
            <span className="a-flex">
              <span className="t-bodyBold">Modo Demonstração</span>
              <span className="t-label">Seus dados ficam só neste aparelho e somem quando a sessão terminar.</span>
            </span>
          </div>
          <div className="a-demo-acoes">
            <ContadorSessao />
            <TrocarExperiencia className="a-trocar" />
          </div>
        </div>
      </div>
    </div>
  );
}
