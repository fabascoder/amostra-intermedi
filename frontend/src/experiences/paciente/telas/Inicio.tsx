// Tela inicial do intermedi-app ((tabs)/index.tsx).
import { useNavigate } from "react-router-dom";
import { REMEDIOS } from "../../../data/remedios";
import { formatarHora, usePaciente, diaChave } from "../../../demoServices/patientService";
import { ContadorSessao } from "../../../shared/Sessao";
import { farmaciasPorDistancia, formatoComprimido, itensEmEstoque, LOCAL_PACIENTE } from "../dados";
import { BalaoMascote } from "../components/BalaoMascote";
import { Ionicon } from "../components/Ionicon";
import { SecoesCategorias } from "../components/SecoesCategorias";
import { Cabecalho, Card, MiniaturaRemedio, Tag, TituloSecao } from "../components/ui";
import { FALAS } from "../personalidade";
import { useNotificacoesApp } from "./Notificacoes";

export function useDosesDeHoje() {
  const doses = usePaciente((p) => p.doses);
  const historico = usePaciente((p) => p.historico[diaChave()]);
  return doses.map((d) => ({ ...d, remedio: REMEDIOS.find((r) => r.idRemedio === d.idRemedio)!, status: historico?.[d.id] }));
}

export default function Inicio() {
  const navigate = useNavigate();
  const nome = usePaciente((p) => p.nome);
  const mascote = usePaciente((p) => p.mascote);
  const doses = useDosesDeHoje();
  const { naoLidas } = useNotificacoesApp();
  const comEstoque = farmaciasPorDistancia().filter(({ farmacia }) => itensEmEstoque(farmacia.idFarmacia) > 0).length;

  return (
    <div className="a-tela">
      <Cabecalho
        grande={false}
        sobreposicao={52}
        inline={
          <span className="a-local" aria-label={`Sua região: ${LOCAL_PACIENTE.rotulo}`}>
            <Ionicon name="location-outline" size={18} />
            <span className="t-label a-uma-linha">{LOCAL_PACIENTE.rotulo}</span>
          </span>
        }
        direita={
          <button type="button" className="a-sino" aria-label={`Notificações${naoLidas ? `: ${naoLidas} não lidas` : ""}`} onClick={() => navigate("/aplicativo/notificacoes")}>
            <Ionicon name="notifications-outline" size={22} />
            {naoLidas > 0 && <i />}
          </button>
        }
      >
        <div>
          <h1 className="t-h1 a-ola">Olá, {nome}</h1>
          <p className="t-body a-cab-sub">{FALAS[mascote].saudacao}</p>
        </div>
        <div className="a-busca">
          <button type="button" className="a-busca-toque" onClick={() => navigate("/aplicativo/buscar")} aria-label="Buscar remédio ou farmácia">
            <Ionicon name="search-outline" size={22} color="var(--a-text-2)" />
            <span className="t-body a-uma-linha" style={{ color: "var(--a-muted)" }}>Buscar remédio ou farmácia</span>
          </button>
          <button type="button" className="a-busca-filtro" aria-label="Filtrar remédios" onClick={() => navigate("/aplicativo/remedios?filtro=1")}>
            <Ionicon name="options-outline" size={20} />
          </button>
        </div>
      </Cabecalho>

      <div className="a-corpo a-corpo-sobe">
        <BalaoMascote doses={doses} />

        <div className="a-atalhos">
          <button type="button" className="a-atalho a-pressavel" onClick={() => navigate("/aplicativo/farmacias")}>
            <Ionicon name="map-outline" size={22} className="a-atalho-icone" />
            <span className="a-flex">
              <span className="t-bodyBold">Farmácias perto</span>
              <span className="t-caption">{comEstoque} com estoque</span>
            </span>
          </button>
          <button type="button" className="a-atalho a-pressavel" onClick={() => navigate("/aplicativo/comprimidos")}>
            <Ionicon name="alarm-outline" size={22} className="a-atalho-icone" />
            <span className="a-flex">
              <span className="t-bodyBold">Seus comprimidos</span>
              <span className="t-caption">{doses.length ? `${doses.length} na rotina` : "Monte sua rotina"}</span>
            </span>
          </button>
        </div>

        <TituloSecao titulo="Remédios por categoria" acao="Ver todos" onAcao={() => navigate("/aplicativo/remedios")} />
        <SecoesCategorias />

        <TituloSecao titulo="Remédios de hoje" acao="Ver todos" onAcao={() => navigate("/aplicativo/comprimidos")} />
        {doses.length ? (
          <div className="a-lista">
            {doses.slice(0, 4).map((dose, i) => (
              <button key={dose.id} type="button" className={`a-dose a-pressavel${i > 0 ? " com-divisor" : ""}`} onClick={() => navigate("/aplicativo/comprimidos")}>
                <MiniaturaRemedio tom="neutral" formato={formatoComprimido(dose.remedio)} tamanho={48} />
                <span className="a-flex">
                  <span className="t-bodyBold a-uma-linha">{dose.remedio.nomeRemedio} {dose.remedio.dosagemRemedio}</span>
                  <span className="t-label a-uma-linha">{formatoComprimido(dose.remedio) === "capsule" ? "1 cápsula" : "1 comprimido"}</span>
                </span>
                {dose.status === "tomado" ? <Tag rotulo="Tomado" tom="green" /> : dose.status === "pulado" ? <Tag rotulo="Pulada" tom="neutral" /> : <Tag rotulo={formatarHora(dose.horario)} tom="amber" />}
              </button>
            ))}
          </div>
        ) : (
          <Card className="a-vazio-linha">
            <span className="t-label">Nenhum remédio na sua rotina ainda. Abra um remédio e toque em “Adicionar à rotina”.</span>
          </Card>
        )}

        <div className="a-demo-rodape">
          <ContadorSessao />
        </div>
      </div>
    </div>
  );
}
