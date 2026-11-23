import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/inter/index.css";
import "./styles/base.css";
import App from "./App";
import { verificarSessao } from "./session/session";

// Validade conferida antes do primeiro desenho (sessão vencida com a aba fechada).
verificarSessao();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Em produção, guarda os arquivos estáticos para a demonstração seguir
// funcionando mesmo se a internet do evento oscilar (public/sw.js).
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* sem service worker a aplicação funciona normalmente */
    });
  });
}
