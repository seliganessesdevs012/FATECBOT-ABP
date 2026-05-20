# Sprint 2 - MVP Completo

> Sprint dedicada a entregar o MVP completo do FatecBot:
> painel administrativo, gestao de perguntas da secretaria,
> rastreabilidade operacional e consolidacao dos fluxos protegidos.

***

## Burndown e Demonstracao

![Grafico de Burndown da Sprint 2](./burndown.png)

**Link do Burndown da Sprint 2:** [Link Google](https://docs.google.com/spreadsheets/d/SEU_ID)

🎥 **Video de demonstracao da Sprint 2:** [Assistir no YouTube/Drive](https://youtu.be/SEU_ID)

***

## Objetivo

Entregar o MVP completo com fluxos publicos e internos operacionais,
garantindo que administracao, secretaria, autenticacao e rastreabilidade
funcionem de ponta a ponta.

***

## Entregaveis esperados

- Painel admin funcional para gestao de nos, usuarios e logs
- Painel da secretaria funcional para listagem e atualizacao de perguntas
- Vinculo de perguntas com sessao (`session_log_id`) preservando contexto do atendimento
- Fluxos protegidos por autenticacao e RBAC consolidados no backend e no frontend
- Testes cobrindo chatbot, autenticacao, perguntas e formulario de login
- `pnpm --filter backend build` e `pnpm --filter frontend build` sem erros

***

## Fora do escopo desta sprint

- Novos canais de atendimento alem da interface web atual
- Melhorias analiticas avancadas e expansoes fora do MVP academico

Esses itens ficam para a Sprint 3 ou para evolucoes posteriores.

***

# FatecBot - Sprint 2 · Tabela de Tasks

> **Sprint 2 - MVP completo**
> Periodo: DD/MM -- DD/MM · Status: 🔵 Planejada
>
> **Objetivo:** MVP completo com fluxos publicos e internos funcionais e backlog tecnico saneado.

---

## Tabela de Rastreabilidade - Sprint 2

**Link da tabela de Tasks com atribuicoes para cada desenvolvedor:** [Tabela de atribuicoes](https://docs.google.com/spreadsheets/d/SEU_ID)

> 🎯 **Total Sprint 2: 138 pts** · 38 tasks
> Escala Fibonacci: **1** tipo/config · **2** arquivo simples · **3** logica media · **5 ou 8** multiplos arquivos ou logica complexa

| Task     | Tipo      | Modulo    | Nome                                                                      | RFs                                                                 | RNFs          | Prioridade | Pts   |
| -------- | --------- | --------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------- | ------------- | ---------- | ----- |
| TASK-046 | `[UML]`   | Modelagem | Diagrama de Classes - Astah                                               | RF01 · RF02 · RF03 · RF04 · RF05 · RF07 · RF08 · RF09 · RF10 · RF11 | —             | ⚪ Baixa   | **5** |
| TASK-047 | `[BE]`    | Nodes     | `nodes.types.ts` - DTOs de nos                                            | RF04 · RF02                                                         | —             | 🟢 Media   | **2** |
| TASK-048 | `[BE]`    | Nodes     | `nodes.service.ts` - CRUD de nos                                          | RF04 · RF02                                                         | —             | 🟡 Alta    | **5** |
| TASK-049 | `[BE]`    | Nodes     | `nodes.controller.ts` + `nodes.routes.ts`                                 | RF04 · RF10 · RF11                                                  | —             | 🟢 Media   | **3** |
| TASK-050 | `[FE]`    | Nodes     | `nodes.api.ts` - chamadas CRUD                                            | RF04 · RF02                                                         | —             | 🟢 Media   | **2** |
| TASK-051 | `[FE]`    | Nodes     | `useNodes.ts` - hook de gerenciamento de nos                              | RF04 · RF02                                                         | —             | 🟢 Media   | **3** |
| TASK-052 | `[FE]`    | Nodes     | `NodeTree.tsx` - visualizacao hierarquica                                 | RF04 · RF02                                                         | RNF01         | 🟢 Media   | **5** |
| TASK-053 | `[FE]`    | Nodes     | `NodeEditor.tsx` - formulario de criacao/edicao                           | RF04 · RF02                                                         | RNF01         | 🟢 Media   | **5** |
| TASK-054 | `[BE]`    | Users     | `users.types.ts` + `users.service.ts` + `users.controller.ts` + `users.routes.ts` | RF03 · RF04 · RF10 · RF11                                   | —             | 🟢 Media   | **5** |
| TASK-055 | `[FE]`    | Users     | `users.api.ts` + `UserList.tsx`                                           | RF03 · RF04                                                         | RNF01         | 🟢 Media   | **3** |
| TASK-056 | `[FIGMA]` | Design    | Mockups do painel Admin                                                   | RF04                                                                | RNF01 · RNF04 | ⚪ Baixa   | **8** |
| TASK-057 | `[FE]`    | Layouts   | `AdminLayout.tsx` + Home publica do chatbot                               | RF03 · RF04                                                         | RNF01         | 🟡 Alta    | **3** |
| TASK-058 | `[FE]`    | Admin     | Paginas do painel Admin                                                   | RF03 · RF04                                                         | RNF01         | 🟢 Media   | **5** |
| TASK-059 | `[UML]`   | Modelagem | Diagrama de Sequencia - Astah                                             | RF01 · RF03 · RF05 · RF07 · RF09                                    | —             | ⚪ Baixa   | **3** |
| TASK-060 | `[UML]`   | Modelagem | Diagrama de Atividades - Astah                                            | RF01 · RF05 · RF06 · RF07 · RF08                                    | —             | ⚪ Baixa   | **3** |
| TASK-061 | `[BE]`    | Questions | `questions.service.ts` - extensao para listagem e status                  | RF05 · RF08                                                         | —             | 🟡 Alta    | **2** |
| TASK-062 | `[BE]`    | Questions | `questions.controller.ts` + `questions.routes.ts` - rotas protegidas      | RF05 · RF11                                                         | —             | 🟡 Alta    | **2** |
| TASK-063 | `[FE]`    | Questions | `questions.api.ts` - chamadas para secretaria                             | RF06                                                                | —             | 🟢 Media   | **2** |
| TASK-064 | `[FE]`    | Questions | `useQuestions.ts` - hook de perguntas                                     | RF06                                                                | —             | 🟢 Media   | **3** |
| TASK-065 | `[FE]`    | Questions | `QuestionsTable.tsx` + `StatusBadge.tsx`                                  | RF06                                                                | RNF01         | 🟢 Media   | **3** |
| TASK-066 | `[BE]`    | Logs      | `logs.types.ts` + `logs.service.ts` + `logs.controller.ts` + `logs.routes.ts` | RF04 · RF08 · RF10 · RF11                                    | —             | 🟢 Media   | **5** |
| TASK-067 | `[FE]`    | Admin     | `logs.api.ts` + `useLogs.ts` + `LogTable.tsx`                             | RF04 · RF08                                                         | RNF01         | 🟢 Media   | **5** |
| TASK-068 | `[FIGMA]` | Design    | Mockups do painel Secretaria                                              | RF06 · RF08                                                         | RNF01 · RNF04 | ⚪ Baixa   | **5** |
| TASK-069 | `[FE]`    | Pages     | Paginas do painel Secretaria + Logs Admin                                 | RF06 · RF08                                                         | RNF01         | 🟢 Media   | **3** |
| TASK-070 | `[BE]`    | Questions | Tipagem de handlers de questions para build dts                           | —                                                                   | —             | 🟡 Alta    | **2** |
| TASK-071 | `[FE]`    | Infra     | Ajuste do `ignoreDeprecations` no `tsconfig.app`                          | —                                                                   | —             | 🟡 Alta    | **1** |
| TASK-072 | `[INFRA]` | Questions | Vinculo de pergunta com sessao (`session_log_id`)                         | RF05 · RF08                                                         | —             | 🔴 Critica | **8** |
| TASK-073 | `[FE]`    | Questions | Alinhar status de `Question` com backend                                  | RF06                                                                | —             | 🟡 Alta    | **3** |
| TASK-074 | `[BE]`    | Infra     | Remover `any` explicito em utils de paginacao                             | —                                                                   | —             | 🟢 Media   | **2** |
| TASK-075 | `[FE]`    | Infra     | Remover non-null assertions em producao                                   | —                                                                   | —             | 🟢 Media   | **2** |
| TASK-076 | `[FE]`    | Chatbot   | Integrar `EvidenceCard` em respostas folha                                | RF02                                                                | RNF01         | 🟢 Media   | **3** |
| TASK-077 | `[BE]`    | Auth      | Testes de fluxo de autenticacao                                           | RF09 · RF10 · RF11                                                  | RNF08         | 🟡 Alta    | **5** |
| TASK-078 | `[BE]`    | Chatbot   | Testes de fluxo do chatbot                                                | RF01 · RF07 · RF08                                                  | —             | 🟡 Alta    | **5** |
| TASK-079 | `[BE]`    | Questions | Testes de fluxo de perguntas                                              | RF05 · RF06 · RF11                                                  | —             | 🟡 Alta    | **5** |
| TASK-080 | `[FE]`    | Chatbot   | Testes de navegacao do chatbot                                            | RF01 · RF07 · RF08                                                  | —             | 🟡 Alta    | **5** |
| TASK-081 | `[FE]`    | Auth      | Testes do formulario de login                                             | RF09 · RF10 · RF11                                                  | RNF01         | 🟢 Media   | **3** |
| TASK-082 | `[DOCS]`  | Docs      | Documentacao tecnica do projeto                                           | —                                                                   | —             | ⚪ Baixa   | **2** |
| TASK-083 | `[DOCS]`  | Docs      | Documentacao de sprint                                                    | —                                                                   | —             | ⚪ Baixa   | **2** |


## Principios de Leitura

| Simbolo   | Significado                                                                              |
| --------- | ---------------------------------------------------------------------------------------- |
| `[BE]`    | Task de backend (`apps/backend/`)                                                        |
| `[FE]`    | Task de frontend (`apps/frontend/`)                                                      |
| `[INFRA]` | Task de infraestrutura (raiz do monorepo)                                                |
| `[FIGMA]` | Task de design de interface                                                              |
| `[UML]`   | Task de modelagem UML com Astah (artefato externo versionado no time)                    |
| `[DB]`    | Task de modelagem de banco de dados com dbdesigner (artefato externo versionado no time) |
| `[DOCS]`  | Task de documentacao                                                                     |

> Este documento funciona como visao operacional da sprint.
> Para o detalhamento completo de contratos de cada task, use `docs/fatecbot-backlog.md` como fonte canonica.

---

## Legenda de Requisitos

### Funcionais

| Codigo | Descricao resumida                                                     |
| ------ | ---------------------------------------------------------------------- |
| RF01   | Navegacao conversacional - menus e submenus hierarquicos               |
| RF02   | Repositorio de conhecimento - nos, documentos, chunks e metadados      |
| RF03   | Perfis de usuario - Aluno (publico), Secretaria e Administrador        |
| RF04   | Painel admin - gestao de nos, usuarios e logs                          |
| RF05   | Encaminhamento de pergunta - texto + e-mail institucional              |
| RF06   | Gestao de perguntas - listagem e atualizacao de status pela secretaria |
| RF07   | Avaliacao de satisfacao - "Gostei" / "Nao gostei" ao fim do atendimento |
| RF08   | Registro de logs - navigationPath, satisfacao, timestamps              |
| RF09   | Autenticacao - login/senha para Secretaria e Administrador             |
| RF10   | Autorizacao por papel (RBAC) - controle de acesso no backend           |
| RF11   | Protecao de rotas - middleware JWT obrigatorio em rotas sensiveis      |

### Nao Funcionais

| Codigo | Descricao resumida                                                                      |
| ------ | --------------------------------------------------------------------------------------- |
| RNF01  | Interface simples, clara e responsiva (mobile e desktop)                               |
| RNF02  | Tempo de resposta adequado ao uso interativo                                           |
| RNF05  | Containerizacao com Docker - 3 containers                                              |
| RNF06  | Orquestracao via Docker Compose com comando unico                                      |
| RNF08  | Autenticacao JWT com `sub`, `role` e `exp` via `Authorization: Bearer`                 |
| RNF09  | Senhas com Argon2id; segredos em variaveis de ambiente; sem exposicao de dados sensiveis |

> A Sprint 2 cobre diretamente RF04 e RF06 e consolida RF01, RF02, RF03, RF05, RF07, RF08, RF09, RF10 e RF11 com testes, refinamentos e estabilizacao do MVP.

---

## 📖 User Stories - Sprint 2

> Cada User Story segue o formato padrao do Scrum:
> **Como** [tipo de usuario] · **Quero** [acao ou funcionalidade] · **Para que** [beneficio entregue]
>
> Os Criterios de Aceitacao detalham as condicoes que a funcionalidade deve atender para ser considerada concluida,
> escritos na perspectiva do usuario, descrevendo o comportamento esperado do sistema de forma clara e verificavel na Sprint Review.

---

### US-01 · RF01 - Navegacao Conversacional

> **Tasks:** TASK-046 · TASK-059 · TASK-060 · TASK-078 · TASK-080

**Como** aluno
**Quero** navegar pelo chatbot ate chegar a resposta mais adequada
**Para que** eu resolva minha duvida com autonomia

**Criterios de Aceitacao:**

- O fluxo conversacional deve continuar guiando o aluno por menus e submenus.
- O sistema deve manter consistencia entre a navegacao exibida e o historico registrado.
- Os testes da sprint devem cobrir selecao de opcoes, chegada em no folha e comportamento esperado da interface.
- O fluxo nao deve regredir com a entrada dos paineis internos do MVP.

---

### US-02 · RF02 - Repositorio de Conhecimento

> **Tasks:** TASK-047 · TASK-048 · TASK-050 · TASK-051 · TASK-052 · TASK-053 · TASK-076

**Como** administrador
**Quero** manter respostas do chatbot associadas a evidencias e fontes oficiais
**Para que** os alunos recebam informacoes verificaveis

**Criterios de Aceitacao:**

- Cada no de conteudo deve suportar resposta resumida, evidencia textual e fonte associada.
- Quando houver evidencia disponivel, ela deve ser exibida junto da resposta final do chatbot.
- A manutencao desses dados deve acontecer pelo fluxo administrativo definido na sprint.
- Quando nao houver evidencia cadastrada, o chatbot deve continuar exibindo a resposta normalmente.

---

### US-03 · RF03 - Perfis de Usuario

> **Tasks:** TASK-046 · TASK-054 · TASK-055 · TASK-057 · TASK-058 · TASK-059

**Como** usuario do sistema
**Quero** que cada perfil tenha acesso apenas a sua area de trabalho
**Para que** a experiencia faca sentido para visitantes, secretaria e administradores

**Criterios de Aceitacao:**

- O visitante deve continuar acessando o chatbot publico sem login.
- Usuarios internos devem encontrar seus fluxos em paines separados conforme o papel autenticado.
- O sistema deve refletir diferencas entre perfis tanto na navegacao quanto nas operacoes disponiveis.
- O layout administrativo deve deixar claro quando o usuario esta em area restrita.

---

### US-04 · RF04 - Gestao de Conteudo (Admin)

> **Tasks:** TASK-047 · TASK-048 · TASK-049 · TASK-050 · TASK-051 · TASK-052 · TASK-053 · TASK-054 · TASK-055 · TASK-056 · TASK-057 · TASK-058 · TASK-066 · TASK-067

**Como** administrador
**Quero** criar, editar e excluir nos, usuarios internos e registros operacionais do painel
**Para que** eu mantenha o conteudo e a operacao do FatecBot atualizados com controle institucional

**Criterios de Aceitacao:**

- O administrador deve conseguir cadastrar, editar e remover nos do chatbot com os campos necessarios para navegacao e resposta.
- O painel deve permitir consultar usuarios internos e manter seus acessos conforme a necessidade da operacao.
- A interface administrativa deve separar as areas de nos, usuarios e logs para facilitar manutencao.
- Acoes sensiveis do painel devem permanecer restritas a perfis autorizados.

---

### US-05 · RF05 - Encaminhamento de Pergunta

> **Tasks:** TASK-059 · TASK-061 · TASK-062 · TASK-072 · TASK-079

**Como** aluno
**Quero** enviar minha duvida para a secretaria quando o bot nao resolver meu problema
**Para que** eu receba suporte humano com o contexto do atendimento

**Criterios de Aceitacao:**

- A pergunta enviada deve ser persistida com os dados obrigatorios do solicitante.
- O envio deve continuar funcionando sem exigir autenticacao do aluno.
- Sempre que possivel, a pergunta deve ficar vinculada a sessao que a originou.
- O fluxo deve permitir acompanhamento posterior pela secretaria no painel interno.

---

### US-06 · RF06 - Gestao de Perguntas (Secretaria)

> **Tasks:** TASK-060 · TASK-063 · TASK-064 · TASK-065 · TASK-068 · TASK-069 · TASK-073 · TASK-079

**Como** secretaria academica
**Quero** visualizar, filtrar e atualizar o status das perguntas recebidas
**Para que** eu acompanhe a fila de atendimento com mais eficiencia

**Criterios de Aceitacao:**

- A secretaria deve visualizar nome do solicitante, e-mail, texto, status e data de criacao de cada pergunta.
- O painel deve permitir filtro por status para destacar perguntas abertas e respondidas.
- A alteracao de status para `RESPONDIDA` deve refletir imediatamente na listagem.
- A listagem deve continuar legivel e utilizavel tanto em desktop quanto em telas menores.

---

### US-07 · RF07 - Avaliacao de Satisfacao

> **Tasks:** TASK-060 · TASK-078 · TASK-080

**Como** aluno
**Quero** avaliar o atendimento ao final da conversa
**Para que** a equipe acompanhe a qualidade das respostas oferecidas

**Criterios de Aceitacao:**

- A avaliacao deve continuar disponivel ao final de atendimentos concluidos.
- O sistema deve aceitar apenas um envio de satisfacao por sessao.
- O feedback informado deve ficar associado ao historico do atendimento.
- A cobertura de testes da sprint deve validar esse comportamento sem regressao.

---

### US-08 · RF08 - Registro de Logs

> **Tasks:** TASK-060 · TASK-061 · TASK-066 · TASK-067 · TASK-068 · TASK-069 · TASK-072 · TASK-078 · TASK-080

**Como** administrador
**Quero** consultar os logs de navegacao, satisfacao e perguntas vinculadas a cada sessao
**Para que** eu acompanhe o uso do sistema e identifique oportunidades de melhoria

**Criterios de Aceitacao:**

- O sistema deve registrar fluxo de navegacao, timestamps e satisfacao por sessao.
- Perguntas enviadas pelo aluno devem poder ser relacionadas ao atendimento que as originou.
- O painel administrativo deve exibir os registros de forma consultavel para leitura operacional.
- As informacoes exibidas devem preservar o contexto necessario sem expor dados alem do requerido.

---

### US-09 · RF09 - Autenticacao por Login e Senha

> **Tasks:** TASK-059 · TASK-077 · TASK-081

**Como** secretaria academica
**Quero** acessar o sistema com e-mail institucional e senha
**Para que** eu utilize os paines internos com seguranca

**Criterios de Aceitacao:**

- O login deve continuar exigindo credenciais validas para usuarios internos.
- Credenciais invalidas devem retornar erro generico sem expor detalhes sensiveis.
- A autenticacao bem-sucedida deve manter o redirecionamento por papel.
- Os testes da sprint devem cobrir sucesso, falha e expiracao de sessao.

---

### US-10 · RF10 - Autorizacao por Papel (RBAC)

> **Tasks:** TASK-046 · TASK-049 · TASK-054 · TASK-066 · TASK-077 · TASK-081

**Como** sistema
**Quero** garantir que cada role acesse apenas o que lhe e permitido
**Para que** nenhuma operacao administrativa fique exposta a perfis errados

**Criterios de Aceitacao:**

- Usuarios `SECRETARIA` nao devem acessar operacoes exclusivas de administracao.
- Usuarios `ADMIN` devem conseguir operar os recursos protegidos previstos para seu papel.
- A negacao de acesso deve acontecer mesmo que o frontend tente expor uma acao indevida.
- Os testes da sprint devem validar cenarios de permissao e bloqueio por role.

---

### US-11 · RF11 - Protecao de Rotas por JWT

> **Tasks:** TASK-046 · TASK-049 · TASK-054 · TASK-062 · TASK-066 · TASK-077 · TASK-081

**Como** desenvolvedor
**Quero** que todas as rotas sensiveis permanecam protegidas por JWT
**Para que** o MVP completo nao exponha recursos internos sem autenticacao valida

**Criterios de Aceitacao:**

- Rotas protegidas devem exigir token valido para acesso.
- Tokens invalidos ou expirados devem impedir acesso as areas internas.
- Endpoints publicos do chatbot e de envio de pergunta devem continuar acessiveis sem autenticacao.
- A validacao deve permanecer consistente entre backend, navegacao protegida e testes automatizados.

---

> _Proximo documento: [`../sprint3/README.md`](../sprint3/README.md)_
