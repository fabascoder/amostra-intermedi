# Intermedi Demo

Versão demonstrativa, 100% frontend, das plataformas do Intermedi, feita para a apresentação do TCC.
Reúne numa só aplicação React as três experiências do projeto — farmácia solicitante, farmácia
fornecedora e aplicativo do paciente — preservando o visual e os fluxos de `intermedi-front-end`
e `intermedi-app`. Não usa backend, banco de dados nem serviços externos.

## Como executar

Requer Node.js 20 ou superior (testado com Node 22).

```bash
npm install
npm run dev          # http://localhost:5180
```

Outros comandos:

| Comando | O que faz |
| --- | --- |
| `npm run build` | Verifica os tipos (`tsc -b`) e gera o build de produção em `dist/` |
| `npm run preview` | Serve o build de produção em http://localhost:4180 |
| `npm test` | Testes das regras da simulação (`tests/`, com o test runner do Node) |
| `npm run dev:expira` | Desenvolvimento com a sessão de **90 segundos**, para testar a expiração |

Também em desenvolvimento, abrir `http://localhost:5180/?demo-duracao=60` **antes** de começar a
primeira experiência cria uma sessão de 60 segundos. As duas opções são ignoradas no build de
produção, que usa sempre 3 horas (`src/config/demo.ts`).

Para recomeçar do zero no mesmo navegador, apague os dados do site (DevTools → Application →
Local Storage → `intermedi_demo_*`).

## Estrutura

```
src/
  App.tsx                 rotas, proteção local de sessão e carregamento sob demanda
  main.tsx                entrada; registra o service worker no build de produção
  config/
    demo.ts               duração da sessão (3 h), chaves do localStorage, contato
    simulation.ts         tempos das simulações (0/5/10/15/20 s, preparo, viagem)
  session/                sessão compartilhada: criação, validade, expiração, progresso
  lib/                    persistência segura (storage.ts) e estado compartilhado (store.ts)
  data/                   catálogo de remédios (seed do backend), farmácias, equipes e estoque
  simulators/pedidos.ts   estágio dos pedidos calculado por timestamps (funções puras)
  demoServices/           camada de serviços locais, com interface parecida com a da API
    medicationService     catálogo, estoque, disponibilidade
    pharmacyService       farmácias, equipes, distâncias
    orderService          pedidos entre farmácias, avisos por etapa
    notificationService   avisos (toasts)
    feedbackService       avaliações (provedor local trocável)
    patientService        nome, mascote, favoritos e rotina do paciente
  shared/                 contador, Trocar experiência, aviso inicial, avaliação, ícones, mascotes
  pages/                  Central de Experiências e tela de sessão encerrada
  experiences/
    gerente/              farmácia solicitante e fornecedora (casca do intermedi-frontend)
    paciente/             aplicativo do paciente (intermedi-app adaptado para a web)
  styles/                 tokens do intermedi-frontend + base da demonstração
public/sw.js              cache dos arquivos estáticos para funcionar com rede instável
tests/                    testes da simulação
```

## O que foi reaproveitado dos projetos originais

**intermedi-front-end** (plataforma web do gerente)

- Design system completo, copiado sem alterações: `tokens.css`, `personaTheme.css`, `manager.css`,
  `managerRefresh.css`, `managerSidebar.css`, `directory.css`, `chamados.css`, `remedios.css`,
  `rastreio.css`, `boasVindas.css`, `preparos.css`, `motion.css`.
- `services/rastreio.js` e `services/remedios.js` (sem mudanças) e trechos de `services/chamados.js`.
- Componentes portados mantendo o markup e as classes: `BoasVindas` (onboarding com painéis e
  passeio pela tela), `ManagerSidebar` (com o indicador deslizante), `Rastreio` (rastreio com o
  caminhão, linha do tempo, faixa "Em andamento", lista do sino), `Remedios` (foto, tarja, barra de
  estoque, resumo, tabela), `Ferramentas`, `DirectoryStats`, `CartaoPessoa`, `NumeroAnimado`,
  `PersonaAvatar`, `PersonaIcon`, `ManagerIcon`, `ChamadoModal`, `ToastRegion`, o sino de
  `ChamadosGerente`, o cartão `PedidoRecebido` e a tabela de enviados de `ManagerNetworkOrders`,
  e o aviso de preparo de `PreparosFarmacia`.
- Logo oficial em WebP (`logoIntermedi.webp`).

**intermedi-app** (Expo/React Native)

- Tema (`constants/theme.ts`): cores, Poppins, raios, sombras, tons por categoria.
- Telas recriadas em React DOM com os mesmos layouts e textos: início, remédios, farmácias,
  assistente do mascote, favoritos, perfil, detalhe do remédio, estoque da farmácia,
  notificações, seus comprimidos e escolha de mascote.
- Componentes: `ScreenHeader` (cabeçalho verde com círculo e cruz), `Card`, `Tag`, `IconTile`,
  `ListRow`, `Button`, `BackButton`, `FavoriteButton`, `PillVisual`, `MedicineThumb`,
  `MedicineCard`, `PharmacyListCard`, a barra de abas flutuante, os mascotes Broto/Lume/Luar.
- Regras: `utils/medicine-style.ts` (cor e ícone por categoria, formato do comprimido),
  `services/assistente.ts` (respostas por regras, agora sobre o estoque fictício),
  `POUCAS_UNIDADES = 10`.
- Ícones: o mesmo conjunto Ionicons, como SVG inline (só os usados entram no bundle).

**intermedi-back-end** (só consulta)

- Catálogo dos 15 remédios do `database/seed.sql` (registros ANVISA fictícios, como no seed),
  categorias e campos da tabela `remedio`.
- Estados e campos de `redistribuicao` (`solicitada → aprovada → preparando → enviada →
  recebida`, `recusada`), preparo em caixas de 50 unidades.

## Principais adaptações

- **Sem login.** Cada experiência de gerente entra já autenticada visualmente como gerente
  demonstrativo; o aplicativo pede só o primeiro nome.
- **Dados locais.** As telas leem `demoServices/*`, que trabalham sobre `src/data` e guardam só o
  que muda. O formato dos objetos segue o backend (ex.: `Pedido` usa os campos de
  `redistribuicao`), por isso os componentes originais funcionam sem adaptação.
- **Timestamps em vez de texto UTC.** `dataDoChamado` passou a aceitar milissegundos.
- **Pedir à rede.** No original o pedido nasce de um chamado aceito; na demonstração o gerente da
  solicitante pede direto (diálogo com remédio, farmácia e quantidade), como descrito no guia de
  boas-vindas ("Peça e envie remédios a outras farmácias").
- **Preparo pela equipe.** Na fornecedora, o aviso que os funcionários recebem aparece para o
  gerente, que acompanha o funcionário assumir (automático em 5 s) ou adianta com "Começar agora".
- **Operações bloqueadas.** Adicionar ao estoque, cadastrar funcionário, entrada/ajuste/remoção de
  estoque não existem. Onde o original tem esses botões, eles aparecem desativados com o motivo
  "Indisponível no Modo Demo".
- **Onboarding.** O controle de "já viu" do original (por pessoa no localStorage) foi substituído
  pelos indicadores da sessão: `onboardingSolicitanteConcluido` e `onboardingFornecedoraConcluido`.
- **App no desktop.** A interface mobile fica numa coluna com proporção de telefone; ao lado, só a
  apresentação, atalhos para telas reais do app, o contador e "Trocar experiência".
- **Sem mapa e sem telefone.** As rotas no mapa (MapLibre/GPS) e as ligações foram trocadas pelo
  estoque da farmácia mais próxima e pelo horário, para não depender de rede nem discar números.
- **Desempenho.** As animações de entrada usam só `transform`/`opacity` (o desfoque animado do
  `motion.css` foi zerado), cada experiência é um chunk separado, as fontes são locais.

## O que funciona

- Central de Experiências com contador, progresso das experiências visitadas, status ao vivo de
  cada experiência, informações da demonstração e avaliação.
- Aviso inicial uma única vez por sessão e sessão de 3 h compartilhada pelas três experiências
  (não reinicia ao trocar, recarregar ou fechar o navegador).
- Verificação da validade ao iniciar, a cada troca de rota, a cada 15 s, ao voltar para a aba,
  antes das operações e no segundo exato da expiração.
- Expiração: interrompe simulações, apaga progresso, pedidos, avaliações e dados do paciente, e
  mostra a tela "Sua experiência chegou ao fim." sem botão de reinício.
- Solicitante: visão geral, estoque com busca/filtros/resumo, catálogo da rede, detalhe do
  remédio, equipe, pedido fictício com validação, rastreio em 20 s com avisos a cada etapa,
  "Concluir simulação agora", progresso preservado ao recarregar ou trocar de experiência.
- Fornecedora: solicitação chega ~3 s após entrar (depois do guia), notificação única, aceitar ou
  recusar com motivo, impacto no estoque, preparo pelo funcionário, transporte e entrega,
  "Receber outra solicitação".
- Aplicativo: entrada com o nome, todas as abas, busca, categorias, detalhe, favoritos, rotina com
  "Tomei/Pular", notificações, mascote, assistente por regras.
- Avaliação com estrelas, item avaliado e comentário; uma avaliação por item na sessão (registrar
  de novo substitui), confirmação "Avaliação registrada nesta demonstração."
- Responsivo de 360 px a monitores grandes; respeita `prefers-reduced-motion`.

## O que é simulado

- Todas as farmácias, pessoas, endereços, telefones, estoques e pedidos.
- O aceite da fornecedora, o preparo, o transporte e a entrega (tempos em `config/simulation.ts`).
- As notificações (locais, no navegador).
- A avaliação (fica só no `localStorage`; não é enviada à equipe).
- O assistente do mascote responde por regras, como o original, sobre o estoque fictício.

## Armazenamento local

Chaves versionadas (campo `v`) e ligadas à sessão (campo `sid`). Dados de outra versão ou de outra
sessão são ignorados; JSON inválido é descartado; falha de escrita (modo privado, cota) não quebra
a aplicação. Nada de catálogo é gravado — só o que muda.

| Chave | Conteúdo |
| --- | --- |
| `intermedi_demo_session` | `sessionId`, `createdAt`, `expiresAt`, `status` |
| `intermedi_demo_progress` | experiências visitadas, onboarding de cada gerente, simulações concluídas |
| `intermedi_demo_orders` | pedidos da solicitante e solicitações da fornecedora (ids e timestamps) |
| `intermedi_demo_feedback` | avaliações registradas nesta sessão |
| `intermedi_demo_patient` | nome, mascote, favoritos, rotina e notificações lidas do paciente |

## Limitações (segurança)

Sem backend, **o bloqueio por tempo é só da interface**. Quem apagar o armazenamento do navegador
ou usar outro navegador consegue uma sessão nova. Não existe — e a demonstração não finge existir —
autorização remota de reativação. A tela de fim orienta a procurar a equipe.

O contato oficial não foi encontrado nos projetos; `CONTACT` em `src/config/demo.ts` está vazio.
Preencha e-mail, telefone ou site para que apareçam na tela de sessão encerrada.

## Integrações para uma etapa futura

- Trocar `demoServices/*` por chamadas à API do `intermedi-backend` (as telas não mudam).
- Enviar avaliações a um serviço real: implementar `FeedbackProvider` em `feedbackService.ts`.
- Controle de acesso no servidor (sessões de demonstração emitidas e expiradas pelo backend).
- Fotos reais dos remédios, mapa e rotas no aplicativo, busca por foto da embalagem.
- Deploy (não feito nesta etapa). Para cache longo, sirva `dist/assets/*` com
  `Cache-Control: public, max-age=31536000, immutable` e `index.html` sem cache.
