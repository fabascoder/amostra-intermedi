// Tela inicial do intermedi-app ((tabs)/index.tsx).
import { useNavigate } from "react-router-dom";
import { REMEDIOS } from "../../../data/remedios";
import { formatarHora, marcarDose, minutosDe, usePaciente, diaChave } from "../../../demoServices/patientService";
import { MascoteAvatar } from "../../../shared/Mascote";
import { ContadorSessao } from "../../../shared/Sessao";
import { categoriasMaisUsadas, estiloCategoria, farmaciasPorDistancia, formatoComprimido, itensEmEstoque, LOCAL_PACIENTE } from "../dados";
import { Ionicon } from "../components/Ionicon";
import { Botao, Cabecalho, Card, IconTile, MiniaturaRemedio, Tag, TituloSecao } from "../components/ui";
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
  const agora = new Date();
  const minutos = agora.getHours() * 60 + agora.getMinutes();
  const proxima = doses.find((d) => !d.status && minutosDe(d.horario) >= minutos - 60) ?? doses.find((d) => !d.status);
  const comEstoque = farmaciasPorDistancia().filter(({ farmacia }) => itensEmEstoque(farmacia.idFarmacia) > 0).length;
  const categorias = categoriasMaisUsadas(4);

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
          <p className="t-body a-cab-sub">Como você está hoje?</p>
        </div>
        <div className="a-busca">
          <button type="button" className="a-busca-toque" onClick={() => navigate("/aplicativo/remedios?buscar=1")} aria-label="Buscar remédio">
            <Ionicon name="search-outline" size={22} color="var(--a-text-2)" />
            <span className="t-body a-uma-linha" style={{ color: "var(--a-muted)" }}>Buscar remédio ou farmácia</span>
          </button>
          <button type="button" className="a-busca-filtro" aria-label="Filtrar por categoria" onClick={() => navigate("/aplicativo/remedios")}>
            <Ionicon name="options-outline" size={20} />
          </button>
        </div>
      </Cabecalho>

      <div className="a-corpo a-corpo-sobe">
        <Card className="a-lembrete">
          <MascoteAvatar id={mascote} tamanho={70} />
          <span className="a-flex">
            <span className="t-bodyBold">{proxima ? `${proxima.remedio.nomeRemedio} às ${proxima.horario}` : doses.length ? "Doses em dia!" : "Sua rotina"}</span>
            <span className="t-label">
              {proxima ? "Já tomou? Confirma que eu anoto." : doses.length ? "Você confirmou todas as doses." : "Cadastre seus remédios e eu te lembro na hora."}
            </span>
          </span>
          {proxima ? (
            <Botao compacto larguraTotal={false} titulo="Tomei" onClick={() => marcarDose(proxima.id, "tomado")} />
          ) : (
            <Botao compacto larguraTotal={false} titulo={doses.length ? "Ver" : "Adicionar"} onClick={() => navigate(doses.length ? "/aplicativo/comprimidos" : "/aplicativo/remedios")} />
          )}
        </Card>

        <TituloSecao titulo="Categorias" acao="Ver todas" onAcao={() => navigate("/aplicativo/remedios")} />
        <div className="a-categorias">
          {categorias.map((rotulo) => {
            const estilo = estiloCategoria(rotulo);
            return (
              <button key={rotulo} type="button" className="a-categoria a-pressavel" aria-label={`Ver remédios de ${rotulo}`} onClick={() => navigate(`/aplicativo/remedios?categoria=${encodeURIComponent(rotulo)}`)}>
                <IconTile icone={estilo.icone} tom={estilo.tom} tamanho={72} tamanhoIcone={30} />
                <span className="t-caption a-categoria-rotulo">{rotulo}</span>
              </button>
            );
          })}
        </div>

        <div className="a-atalhos">
          <button type="button" className="a-atalho tom-blue a-pressavel" onClick={() => navigate("/aplicativo/farmacias")}>
            <span className="a-atalho-icone"><Ionicon name="map-outline" size={24} color="var(--a-blue)" /></span>
            <span className="t-bodyBold">Farmácias perto</span>
            <span className="t-caption" style={{ color: "var(--a-blue)" }}>{comEstoque} com estoque</span>
          </button>
          <button type="button" className="a-atalho tom-orange a-pressavel" onClick={() => navigate("/aplicativo/comprimidos")}>
            <span className="a-atalho-icone"><Ionicon name="ellipse-outline" size={24} color="var(--a-orange)" /></span>
            <span className="t-bodyBold">Seus comprimidos</span>
            <span className="t-caption" style={{ color: "var(--a-orange)" }}>{doses.length ? `${doses.length} na rotina` : "Monte sua rotina"}</span>
          </button>
        </div>

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
