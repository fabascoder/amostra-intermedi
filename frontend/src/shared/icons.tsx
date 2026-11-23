// Ícones originais do intermedi-frontend (ManagerIcon.jsx e PersonaIcon.jsx),
// portados para TypeScript sem mudar os desenhos.
import type { ReactNode } from "react";

type Role = "admin" | "gerente" | "funcionario" | "paciente";

export function PersonaIcon({ role, size = 32, className = "" }: { role: Role; size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 40 72" fill="currentColor" stroke="none" aria-hidden="true" focusable="false">
      <circle cx="20" cy="11" r="10" />
      {role === "admin" ? (
        <>
          <path d="M8 33a12 12 0 0 1 24 0v27a12 12 0 0 1-24 0V33Z" />
          <path d="M12 34a8 8 0 0 1 16 0v13H12V34Z" fill="#fff" />
          <path d="M7 13v10a7 7 0 0 0 7 7h2v-5h-2a2 2 0 0 1-2-2V13a2 2 0 0 1 2-2h1V6h-1A7 7 0 0 0 7 13Zm25-7h-1v5h1a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-2v5h2a7 7 0 0 0 7-7V13a7 7 0 0 0-7-7Z" transform="translate(-1 2) scale(.92)" />
          <path d="M29 18a9 9 0 0 1-18 0" fill="none" stroke="currentColor" strokeWidth="2.5" />
          <circle cx="20" cy="28" r="2" />
        </>
      ) : (
        <>
          <path fillRule="evenodd" d="M20 24A12 12 0 0 1 32 36v23a12 12 0 0 1-24 0V36a12 12 0 0 1 12-12Zm0 3a9 9 0 0 0-9 9v12h18V36a9 9 0 0 0-9-9Z" />
          {role === "gerente" && <path d="m18 27 1 4h2l1-4Zm1 5-1.5 13 2.5 2 2.5-2L21 32Z" />}
          {role === "paciente" && <path d="M18 32h4v3h3v4h-3v3h-4v-3h-3v-4h3Z" />}
          {role === "funcionario" && <path d="m12 29 8 7 8-7 2 3-8 7-2-2-2 2-8-7Zm11 12h5v2h-5Z" />}
        </>
      )}
    </svg>
  );
}

export function ManagerIcon({ name, size = 22 }: { name: string; size?: number }) {
  if (name === "heart") return <PersonaIcon role="paciente" size={size} />;
  const paths: Record<string, ReactNode> = {
    // acrescentados na demonstração, no mesmo traço dos originais
    swap: <><path d="M4 8h13l-3.5-3.5M20 16H7l3.5 3.5" /></>,
    star: <><path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9L12 3.5Z" /></>,
    play: <><circle cx="12" cy="12" r="9" /><path d="m10 8.5 5 3.5-5 3.5Z" /></>,
    ticket: <><path d="M4 5h16a1 1 0 0 1 1 1v4a2 2 0 0 0 0 4v4a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-4a2 2 0 0 0 0-4V6a1 1 0 0 1 1-1Z" /><path d="M15 5v3m0 3v2m0 3v3" /></>,
    pill: <><path d="m9 4-5 5a6.4 6.4 0 0 0 9 9l5-5a6.4 6.4 0 0 0-9-9Z" /><path d="m7 7 9 9m-2-9 2 2" /></>,
    people: <><circle cx="9" cy="8" r="3" /><path d="M3 21v-2a6 6 0 0 1 12 0v2M16 5a3 3 0 0 1 0 6m2 4a5 5 0 0 1 3 4v2" /></>,
    heart: <><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" /><path d="M7 12h3l2-3 2 6 2-3h2" /></>,
    box: <><path d="m12 3 9 5v9l-9 5-9-5V8l9-5Zm0 10v9M3 8l9 5 9-5M7.5 5.5l9 5V15" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-8 12a2 2 0 0 0 4 0" /></>,
    check: <><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    alert: <><path d="m10.3 4.5-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-2.5l-8-14a2 2 0 0 0-3.4 0Z" /><path d="M12 9v5m0 3v.1" /></>,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6m0-10v.1" /></>,
    truck: <><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z" /><circle cx="7" cy="18" r="1.8" /><circle cx="17" cy="18" r="1.8" /></>,
    pharmacy: <><rect x="4" y="3" width="16" height="18" rx="3" /><path d="M10 21v-5h4v5M12 6v6m-3-3h6" /></>,
    clipboard: <><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4.5V3h6v1.5M9 9h6m-6 4h6m-6 4h4" /></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3.5 6.5 8.5 6.5 8.5-6.5" /></>,
    phone: <><path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2Z" /></>,
    map: <><path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12Z" /><circle cx="12" cy="9" r="2.5" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4m8-4v4M3 10h18" /></>,
    id: <><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="11" r="2" /><path d="M6 16a3 3 0 0 1 6 0m3-6h3m-3 3h3" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    lock: <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>,
    print: <><path d="M7 9V3h10v6M7 17H4v-7h16v7h-3" /><path d="M7 14h10v7H7z" /></>,
    arrowLeft: <><path d="M19 12H5m6-6-6 6 6 6" /></>,
    userPlus: <><circle cx="10" cy="8" r="4" /><path d="M3 21a7 7 0 0 1 14 0M19 8v6m-3-3h6" /></>,
    search: <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5" /></>,
    cube: <><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Zm0 9 8-4.5M12 12v9M12 12 4 7.5" /></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.box}</svg>;
}
