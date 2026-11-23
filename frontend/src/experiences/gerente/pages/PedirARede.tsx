// "Pedir à rede": escolhe o remédio, a farmácia que vai enviar e a
// quantidade. Mesmos campos, validações e confirmação dos formulários das
// plataformas (SolicitarReposicao.jsx). Ao confirmar, a solicitação fictícia
// é criada no navegador e a simulação de 20 segundos começa.
import { useId, useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { disponibilidade, estoqueDaFarmacia, listarRemedios, podeEnviar } from "../../../demoServices/medicationService";
import { criarPedido } from "../../../demoServices/orderService";
import { notificar } from "../../../demoServices/notificationService";
import { SOLICITANTE_TIMELINE } from "../../../config/simulation";
import { ChamadoModal, FotoRemedio, TarjaBadge } from "../components/Remedios";
import { useGerente } from "../contexto";
import { nomeComDosagem, quantidadeReposicao } from "../lib/remedios";

export function PedirARede({ idRemedioInicial, onFechar }: { idRemedioInicial?: number; onFechar: () => void }) {
  const uid = useId();
  const navigate = useNavigate();
  const { config, visao } = useGerente();
  const estoque = useMemo(() => estoqueDaFarmacia(config.idFarmacia, visao.ajustes), [config.idFarmacia, visao.ajustes]);
  const remedios = listarRemedios();
  const [idRemedio, setIdRemedio] = useState(idRemedioInicial ? String(idRemedioInicial) : "");
  const ofertas = useMemo(
    () => (idRemedio ? disponibilidade(Number(idRemedio), visao.ajustes, config.idFarmacia).filter((d) => podeEnviar(d) > 0) : []),
    [idRemedio, visao.ajustes, config.idFarmacia],
  );
  const sugestaoQtd = (id: string) => {
    const meu = estoque.find((l) => l.idRemedio === Number(id));
    return meu ? String(Math.min(quantidadeReposicao(meu), 200)) : "30";
  };
  const [idFornecedora, setIdFornecedora] = useState(() => (idRemedioInicial ? String(disponibilidade(idRemedioInicial, visao.ajustes, config.idFarmacia).filter((d) => podeEnviar(d) > 0)[0]?.farmacia.idFarmacia ?? "") : ""));
  const [quantidade, setQuantidade] = useState(() => (idRemedioInicial ? sugestaoQtd(String(idRemedioInicial)) : ""));
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroEnvio, setErroEnvio] = useState("");
  const [criado, setCriado] = useState<number | null>(null);

  const oferta = ofertas.find((d) => String(d.farmacia.idFarmacia) === idFornecedora);
  const limite = oferta ? podeEnviar(oferta) : 0;
  const meu = estoque.find((l) => l.idRemedio === Number(idRemedio));
  const escolhido = remedios.find((r) => String(r.idRemedio) === idRemedio);

  function escolherRemedio(valor: string) {
    setIdRemedio(valor);
    setErros({});
    const primeiras = valor ? disponibilidade(Number(valor), visao.ajustes, config.idFarmacia).filter((d) => podeEnviar(d) > 0) : [];
    setIdFornecedora(primeiras[0] ? String(primeiras[0].farmacia.idFarmacia) : "");
    setQuantidade(valor ? sugestaoQtd(valor) : "");
  }

  function validar() {
    const encontrados: Record<string, string> = {};
    const n = Number(quantidade);
    if (!idRemedio) encontrados.remedio = "Selecione o remédio.";
    else if (!ofertas.length) encontrados.remedio = "Nenhuma farmácia da rede pode enviar este remédio agora.";
    if (idRemedio && ofertas.length && !idFornecedora) encontrados.farmacia = "Escolha a farmácia que vai enviar.";
    if (!quantidade || !Number.isInteger(n) || n <= 0) encontrados.quantidade = "Informe um número inteiro maior que zero.";
    else if (oferta && n > limite) encontrados.quantidade = `A ${oferta.farmacia.nomeFarmacia} pode enviar até ${limite} unidades sem ficar abaixo do mínimo.`;
    return encontrados;
  }

  function enviar(evento: FormEvent) {
    evento.preventDefault();
    const encontrados = validar();
    setErros(encontrados);
    setErroEnvio("");
    if (Object.keys(encontrados).length) return;
    const resultado = criarPedido({ idRemedio: Number(idRemedio), quantidade: Number(quantidade), idFornecedora: Number(idFornecedora) });
    if (!resultado.ok) {
      setErroEnvio(resultado.erro);
      return;
    }
    setCriado(resultado.id);
    notificar(`Solicitação enviada à ${oferta?.farmacia.nomeFarmacia}.`);
  }

  if (criado !== null) {
    return (
      <ChamadoModal title="Solicitação enviada" onClose={onFechar}>
        <div className="chamado-confirmacao" role="status">
          <p>
            <strong>Pedido #{criado} enviado à {oferta?.farmacia.nomeFarmacia}</strong>
          </p>
          <p className="demo-modal-texto">
            {quantidade}× {escolhido && nomeComDosagem(escolhido)}. A simulação leva cerca de {Math.round(SOLICITANTE_TIMELINE.entrega / 1000)} segundos: aceite, preparo, transporte e entrega. Você recebe um aviso a cada etapa, mesmo em outra tela.
          </p>
        </div>
        <div className="mgr-modal-actions">
          <button type="button" className="mgr-secondary" onClick={onFechar}>Fechar</button>
          <button
            type="button"
            className="mgr-primary"
            autoFocus
            onClick={() => {
              onFechar();
              navigate(`${config.basePath}/pedidos?aba=enviados&pedido=${criado}`);
            }}
          >
            Acompanhar a entrega
          </button>
        </div>
      </ChamadoModal>
    );
  }

  const erroId = (campo: string) => `${uid}-${campo}`;
  return (
    <ChamadoModal title="Pedir à rede" onClose={onFechar} className="emp-service-modal">
      <form className="mgr-form emp-service-form" onSubmit={enviar} noValidate>
        <label>
          Remédio
          <select
            value={idRemedio}
            onChange={(e) => escolherRemedio(e.target.value)}
            aria-invalid={Boolean(erros.remedio)}
            aria-describedby={erros.remedio ? erroId("remedio") : undefined}
          >
            <option value="">Selecione o remédio</option>
            {remedios.map((r) => {
              const linha = estoque.find((l) => l.idRemedio === r.idRemedio);
              const alerta = linha && (linha.situacao !== "ok" || linha.vencido) ? " · precisa repor" : "";
              return (
                <option key={r.idRemedio} value={r.idRemedio}>
                  {nomeComDosagem(r)}{alerta}
                </option>
              );
            })}
          </select>
          {erros.remedio && <small className="chamado-field-error" id={erroId("remedio")}>{erros.remedio}</small>}
        </label>

        {escolhido && (
          <div className="demo-pedir-resumo">
            <FotoRemedio nome={escolhido.nomeRemedio} />
            <div>
              <strong>{nomeComDosagem(escolhido)}</strong>
              <small>
                {meu ? `Sua unidade tem ${meu.quantidade} un. (mínimo ${meu.estoqueMinimo})` : "Sua unidade não tem este remédio"}
              </small>
              <TarjaBadge valor={escolhido.tarjaRemedio} />
            </div>
          </div>
        )}

        {idRemedio && ofertas.length > 0 && (
          <fieldset className="demo-pedir-farmacias">
            <legend>Farmácia que vai enviar</legend>
            {ofertas.map((d) => (
              <label key={d.farmacia.idFarmacia} className={`demo-pedir-farmacia${idFornecedora === String(d.farmacia.idFarmacia) ? " is-escolhida" : ""}`}>
                <input
                  type="radio"
                  name={`${uid}-farmacia`}
                  value={d.farmacia.idFarmacia}
                  checked={idFornecedora === String(d.farmacia.idFarmacia)}
                  onChange={(e) => {
                    setIdFornecedora(e.target.value);
                    setErros((x) => ({ ...x, farmacia: "", quantidade: "" }));
                  }}
                />
                <span>
                  <strong>{d.farmacia.nomeFarmacia}</strong>
                  <small>{d.farmacia.bairro} · pode enviar até {podeEnviar(d)} un.</small>
                </span>
              </label>
            ))}
            {erros.farmacia && <small className="chamado-field-error">{erros.farmacia}</small>}
          </fieldset>
        )}

        <label>
          Quantidade
          <input
            type="number"
            inputMode="numeric"
            min="1"
            max={limite || undefined}
            step="1"
            value={quantidade}
            onChange={(e) => {
              setQuantidade(e.target.value);
              setErros((x) => ({ ...x, quantidade: "" }));
            }}
            aria-invalid={Boolean(erros.quantidade)}
            aria-describedby={[erros.quantidade && erroId("quantidade"), oferta && erroId("limite")].filter(Boolean).join(" ") || undefined}
          />
          {oferta && <small className="remedio-obrigatorio-nota" id={erroId("limite")}>Até {limite} unidades da {oferta.farmacia.nomeFarmacia}.</small>}
          {erros.quantidade && <small className="chamado-field-error" id={erroId("quantidade")}>{erros.quantidade}</small>}
        </label>

        {erroEnvio && <p className="chamado-inline-error" role="alert">{erroEnvio}</p>}
        <div className="mgr-modal-actions">
          <button className="mgr-secondary" type="button" onClick={onFechar}>Cancelar</button>
          <button className="mgr-primary" type="submit">Enviar solicitação</button>
        </div>
      </form>
    </ChamadoModal>
  );
}
