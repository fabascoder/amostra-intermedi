// Seus comprimidos (comprimidos.tsx do intermedi-app): o comprimido em
// destaque gira para mostrar a outra face, e cada dose é confirmada.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatarHora, marcarDose, removerDose } from "../../../demoServices/patientService";
import { formatoComprimido } from "../dados";
import { Ionicon } from "../components/Ionicon";
import { Botao, Cabecalho, Comprimido, MiniaturaRemedio, Tag, Vazio } from "../components/ui";
import { useDosesDeHoje } from "./Inicio";

const DESCRICAO = { round: "Redondo, com sulco no meio", capsule: "Cápsula de duas cores", oval: "Formato oval" } as const;

export default function Comprimidos() {
  const navigate = useNavigate();
  const doses = useDosesDeHoje();
  const [selecionadaId, setSelecionadaId] = useState<string>();
  const [costas, setCostas] = useState(false);
  const selecionada = doses.find((d) => d.id === selecionadaId) ?? doses.find((d) => !d.status) ?? doses[0];
  const tomadas = doses.filter((d) => d.status === "tomado").length;
  const hoje = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="a-tela">
      <Cabecalho voltar titulo="Seus comprimidos" subtitulo={hoje.charAt(0).toUpperCase() + hoje.slice(1)} sobreposicao={doses.length ? 70 : 0}>
        <div className="a-progresso-cab">
          <span className="t-label">Doses de hoje</span>
          <span className="t-label a-negrito">{tomadas} de {doses.length}</span>
        </div>
        <span className="a-trilho" aria-hidden="true"><i style={{ width: doses.length ? `${(tomadas / doses.length) * 100}%` : "0%" }} /></span>
      </Cabecalho>

      <div className={`a-corpo${doses.length ? " a-corpo-sobe-muito" : ""}`}>
        {!selecionada ? (
          <Vazio icone="ellipse-outline" titulo="Nenhum remédio na sua rotina" texto="Abra um remédio e toque em “Adicionar à rotina” para receber lembretes aqui.">
            <Botao compacto larguraTotal={false} titulo="Ver remédios" onClick={() => navigate("/aplicativo/remedios")} />
          </Vazio>
        ) : (
          <>
            <div className="a-destaque">
              <div className="a-visor">
                <span className="a-visor-lado">{costas ? "Vista de trás" : "Vista de frente"}</span>
                <span className="a-visor-halo" />
                <span className={`a-giro${costas ? " is-costas" : ""}`}>
                  <Comprimido formato={formatoComprimido(selecionada.remedio)} tamanho={128} costas={costas} cores={formatoComprimido(selecionada.remedio) === "capsule" ? ["#7F74E0", "#EF8FA6"] : undefined} />
                </span>
                <button type="button" className="a-girar" onClick={() => setCostas((v) => !v)} aria-label="Girar comprimido">
                  <Ionicon name="refresh" size={18} />
                  <span className="t-label a-negrito">Girar</span>
                </button>
              </div>
              <div className="a-destaque-info">
                <span className="a-flex">
                  <span className="t-h3">{selecionada.remedio.nomeRemedio} {selecionada.remedio.dosagemRemedio}</span>
                  <span className="t-label">{DESCRICAO[formatoComprimido(selecionada.remedio)]}</span>
                </span>
                <Tag rotulo={formatarHora(selecionada.horario)} tom="amber" />
              </div>
              <button type="button" className="a-remover" onClick={() => { removerDose(selecionada.id); setSelecionadaId(undefined); }}>
                <Ionicon name="trash-outline" size={16} />
                <span className="t-caption">Remover da rotina</span>
              </button>
            </div>

            {doses.map((dose) => {
              const ativa = dose.id === selecionada.id;
              return (
                <div key={dose.id} className={`a-dose-cartao${ativa ? " is-ativa" : ""}`}>
                  <button type="button" className="a-dose-abrir" onClick={() => { setSelecionadaId(dose.id); setCostas(false); }} aria-pressed={ativa} aria-label={`Ver ${dose.remedio.nomeRemedio}`}>
                    <MiniaturaRemedio tom="neutral" formato={formatoComprimido(dose.remedio)} tamanho={52} />
                    <span className="a-flex">
                      <span className="t-bodyBold a-uma-linha">{dose.remedio.nomeRemedio} {dose.remedio.dosagemRemedio}</span>
                      <span className="t-label">{formatarHora(dose.horario)}</span>
                    </span>
                  </button>
                  {dose.status ? (
                    <Tag rotulo={dose.status === "tomado" ? "Tomado" : "Pulada"} tom={dose.status === "tomado" ? "green" : "neutral"} />
                  ) : (
                    <span className="a-dose-acoes">
                      <button type="button" className="a-dose-pular" onClick={() => marcarDose(dose.id, "pulado")}>Pular</button>
                      <Botao compacto larguraTotal={false} titulo="Tomei" onClick={() => marcarDose(dose.id, "tomado")} />
                    </span>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
