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

## Lançamento oficial (contagem e abertura)

Uma camada por cima da plataforma, em `src/lancamento/`, que não altera nada da demonstração:

| Quando | O que o visitante vê |
| --- | --- |
| Antes do lançamento | Só a contagem regressiva, em qualquer endereço (`/`, `/aplicativo`, `/bastidores`…) |
| No zero | O "0" assenta e a abertura começa sozinha (cerca de 15 s) e termina na tela de boas-vindas |
| Depois, na primeira visita | A abertura, uma vez, e a plataforma |
| Depois, já tendo visto | A plataforma direto (a camada de lançamento nem é baixada) |

**Data e hora:** `LANCAMENTO` em `src/lancamento/config.ts`, no formato `"2026-12-01T19:00:00-03:00"`
(horário de Brasília). Os textos da contagem e da abertura ficam no mesmo arquivo. `null` desliga tudo.

**Como funciona**

- A contagem é a diferença entre agora e a data oficial, recalculada a cada segundo: recarregar não
  muda nada. O horário é conferido uma vez pelo cabeçalho `Date` do próprio servidor (uma requisição
  `HEAD`, sem backend), então um aparelho com o relógio errado ainda chega ao zero junto com os outros.
- "Já vi a abertura" fica no `localStorage` (`intermedi_abertura_vista`), fora das chaves da sessão:
  reativar a amostra não repete a abertura.
- A abertura (`Abertura.tsx`) é uma linha do tempo do GSAP sobre SVG e HTML: o zero vira ponto, o
  ponto vira a linha da frase, a linha se parte em pontos (as farmácias) que formam a cruz do
  logotipo e são ligados um a um, o traço ganha a forma da marca e a luz se abre na logo em cores, que pousa no lugar exato da logo da tela de boas-vindas. A marca foi
  reconstruída em vetor a partir de `wordmark-light.png` (medidas em `cena.ts`).
- Tudo o que o zero usa é baixado durante a contagem; nos últimos segundos nada depende da rede. Se a
  abertura não carregar, o zero leva direto à plataforma.
- Aparelhos modestos (ou que travam durante a contagem) recebem um perfil leve, sem brilho, rotação
  nem máscara circular. Com "reduzir movimento" ligado no sistema, a abertura vira um esmaecer curto.
- "Pular abertura" (ou Esc) leva à plataforma em menos de um segundo.
- Som: desligado por padrão. "Ligar som da abertura", na contagem, ativa um som gerado no próprio
  navegador (`som.ts`, sem arquivos). No projetor da apresentação, ligue antes do zero.

### Ensaio (testar sem esperar a data)

Abra o endereço com `?ensaio=CODIGO` (o mesmo código da reativação; em desenvolvimento, `?ensaio`
basta) e uma das opções:

| Endereço | Simula |
| --- | --- |
| `?ensaio=CODIGO&fase=contagem&em=10` | Contagem de 10 s, o zero, a abertura e a passagem para a plataforma |
| `?ensaio=CODIGO&fase=abertura` | Só a abertura (repete a cada vez que abrir) e a plataforma |
| `?ensaio=CODIGO&fase=depois` | Visitante depois do lançamento: abertura na primeira vez; ao recarregar, a plataforma direto |
| `&quadro=8.5` | Para a abertura nesse segundo, para revisar um quadro |
| `&perfil=leve` | Força o perfil de aparelhos modestos |

O ensaio vale só para aquela aba (`sessionStorage`), mostra um selo "Ensaio" com **Repetir** e
**Sair**, e nunca grava a marcação real. Sem o código, o público não entra nele. A equipe também pode
usar `&fase=depois` para navegar pela plataforma antes do lançamento.

## Limitações (segurança)

Sem backend, **o bloqueio por tempo é só da interface**. Quem apagar o armazenamento do navegador
ou usar outro navegador consegue uma sessão nova. A tela de fim orienta a procurar a equipe.

### Reativar a amostra (equipe)

Abra o endereço da amostra no aparelho da pessoa com `?reativar=CODIGO` no fim, por exemplo
`https://SEU-DOMINIO/?reativar=CODIGO`. A sessão daquele navegador é apagada (encerrada ou
ainda ativa) e a amostra recomeça nas boas-vindas, com três horas novas. O parâmetro some do
endereço logo em seguida, e um código errado não faz nada.

O código fica em `src/session/reativacao.ts` só como hash (`HASH_DO_CODIGO`). Para trocá-lo,
gere o hash do novo código (em minúsculas) com `hashCodigo()` desse arquivo e substitua o valor.
Como não há backend, isso é uma barreira de interface, não uma senha de verdade.

O contato oficial não foi encontrado nos projetos; `CONTACT` em `src/config/demo.ts` está vazio.
Preencha e-mail, telefone ou site para que apareçam na tela de sessão encerrada.

## Integrações para uma etapa futura

- Trocar `demoServices/*` por chamadas à API do `intermedi-backend` (as telas não mudam).
- Enviar avaliações a um serviço real: implementar `FeedbackProvider` em `feedbackService.ts`.
- Controle de acesso no servidor (sessões de demonstração emitidas e expiradas pelo backend).
- Fotos reais dos remédios, mapa e rotas no aplicativo, busca por foto da embalagem.
- Deploy (não feito nesta etapa). Para cache longo, sirva `dist/assets/*` com
  `Cache-Control: public, max-age=31536000, immutable` e `index.html` sem cache.
