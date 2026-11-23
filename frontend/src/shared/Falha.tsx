import { Component, type ErrorInfo, type ReactNode } from "react";

/**
 * Se uma tela falhar, mostra uma saída em vez de uma página em branco.
 * A sessão e o progresso continuam salvos.
 */
export class LimiteDeFalha extends Component<{ children: ReactNode }, { erro: boolean }> {
  state = { erro: false };

  static getDerivedStateFromError() {
    return { erro: true };
  }

  componentDidCatch(erro: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) console.error("Falha na tela da demonstração:", erro, info.componentStack);
  }

  render() {
    if (!this.state.erro) return this.props.children;
    return (
      <main className="demo-falha" role="alert">
        <h1>Algo não saiu como esperado.</h1>
        <p>Sua sessão e o seu progresso continuam salvos. Volte à Central para continuar.</p>
        <a className="demo-botao" href="/">Voltar à Central</a>
      </main>
    );
  }
}
