// Equipe da unidade em cartões (TeamTable / CartaoPessoa do intermedi-frontend).
// Só consulta: cadastro e exclusão de funcionários não existem na demonstração,
// e nenhum dado pessoal (CPF, e-mail, telefone) é exibido.
import { useState } from "react";
import { equipe } from "../../../demoServices/pharmacyService";
import { ManagerIcon } from "../../../shared/icons";
import { CartaoPessoa, DirectoryStats, GradePessoas } from "../components/Painel";
import { ChamadoModal } from "../components/Remedios";
import { useGerente } from "../contexto";
import { turno } from "../lib/util";
import type { Pessoa } from "../../../types";

export default function Funcionarios() {
  const { config } = useGerente();
  const time = equipe(config.idFarmacia);
  const [aberto, setAberto] = useState<Pessoa | null>(null);
  const farmaceuticos = time.funcionarios.filter((f) => /farmac/i.test(f.cargo)).length;
  return (
    <>
      <header className="mgr-page-head">
        <div>
          <h1>Funcionários</h1>
          <p>{config.unidade} · Quem atende os pacientes e prepara os envios para a rede.</p>
        </div>
        <div className="demo-acao-bloqueada">
          <button type="button" className="mgr-primary" disabled aria-describedby="motivo-novo">
            <ManagerIcon name="lock" size={16} /> Novo funcionário
          </button>
          <small id="motivo-novo">Cadastro indisponível no Modo Demo</small>
        </div>
      </header>

      <DirectoryStats
        items={[
          ["Funcionários", time.funcionarios.length, "people", "na unidade"],
          ["Farmacêuticos", farmaceuticos, "pill", "responsáveis técnicos"],
          ["Gerentes", 1 + time.outrosGerentes.length, "user", time.outrosGerentes.length ? `com ${time.outrosGerentes.join(", ")}` : "você cuida da unidade"],
        ]}
      />

      <section className="mgr-panel demo-equipe" aria-label="Equipe">
        <GradePessoas rotulo="Funcionários">
          {time.funcionarios.map((f) => (
            <li key={f.id}>
              <CartaoPessoa
                role="funcionario"
                nome={f.nome}
                papel={`${f.cargo} · ${turno(f.turno)}`}
                linhas={[["id", `Matrícula ${f.matricula}`], ["clock", `Turno da ${turno(f.turno).toLowerCase()}`]]}
                onAbrir={() => setAberto(f)}
              />
            </li>
          ))}
        </GradePessoas>
      </section>

      {aberto && (
        <ChamadoModal title={aberto.nome} onClose={() => setAberto(null)}>
          <dl className="demo-ficha">
            <div><dt>Cargo</dt><dd>{aberto.cargo}</dd></div>
            <div><dt>Turno</dt><dd>{turno(aberto.turno)}</dd></div>
            <div><dt>Matrícula</dt><dd>{aberto.matricula}</dd></div>
            <div><dt>Unidade</dt><dd>{config.unidade}</dd></div>
          </dl>
          <p className="demo-ficha-nota">Pessoa fictícia. Na plataforma real, a ficha mostra os atendimentos e os chamados do funcionário.</p>
          <div className="mgr-modal-actions">
            <button type="button" className="mgr-primary" onClick={() => setAberto(null)}>Fechar</button>
          </div>
        </ChamadoModal>
      )}
    </>
  );
}
