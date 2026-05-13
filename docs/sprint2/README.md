# Sprint 2 — MVP Completo

> Sprint dedicada a entregar o MVP completo: chatbot público, encaminhamento de perguntas,
> autenticação e RBAC, painéis internos e correções críticas da Sprint 1.

---

## Burndown e Demonstração

![Gráfico de Burndown da Sprint 2](./burndown.png)

**Link do Burndown da Sprint 2:** [Link Google](https://docs.google.com/spreadsheets/d/SEU_ID)

🎥 **Vídeo de demonstração da Sprint 2:** [Assistir no YouTube/Drive](https://youtu.be/SEU_ID)

---

## Objetivo

Entregar o MVP completo do FatecBot, cobrindo fluxos públicos e internos,
com estabilidade de build e rastreabilidade ponta a ponta.

---

## Entregáveis esperados

- Fluxo público do chatbot completo (navegação, evidências e satisfação)
- Envio de perguntas pelo aluno com rastreabilidade de sessão (`session_log_id`)
- Autenticação e RBAC com rotas protegidas para admin e secretaria
- Painéis internos operacionais (admin, secretaria e logs)
- `pnpm --filter backend build` e `pnpm --filter frontend build` passando sem erros
- Documentação técnica e de sprint registrada em formato padronizado

---

# FatecBot — Sprint 2 · Tabela de Tasks

> **Sprint 2 — MVP completo**
> Período: DD/MM -- DD/MM · Status: ⚪ Planejada
>
> **Objetivo:** MVP completo com fluxos públicos e internos funcionais e backlog técnico saneado.

---

## Tabela de Rastreabilidade — Sprint 2

**Link da tabela de Tasks com atribuições para cada desenvolvedor:** [Tabela de atribuições](https://docs.google.com/spreadsheets/d/SEU_ID)

> 🎯 **Total Sprint 2: 138 pts** · 38 tasks
> Escala Fibonacci: **1** tipo/config · **2** arquivo simples · **3** lógica média · **5 ou 8** múltiplos arquivos ou lógica complexa

| Task     | Tipo      | Módulo    | Nome                                                                      | RFs                                                                 | RNFs          | Prioridade | Pts   |
| -------- | --------- | --------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------- | ------------- | ---------- | ----- |
| TASK-046 | `[UML]`   | Modelagem | Diagrama de Classes — Astah                                               | RF01 · RF02 · RF03 · RF04 · RF05 · RF07 · RF08 · RF09 · RF10 · RF11 | —             | ⚪ Baixa   | **5** |
| TASK-047 | `[BE]`    | Nodes     | nodes.types.ts — DTOs de nós                                              | RF04 · RF02                                                         | —             | 🟢 Média   | **2** |
| TASK-048 | `[BE]`    | Nodes     | nodes.service.ts — CRUD de nós                                            | RF04 · RF02                                                         | —             | 🟡 Alta    | **5** |
| TASK-049 | `[BE]`    | Nodes     | nodes.controller.ts + nodes.routes.ts                                     | RF04 · RF10 · RF11                                                  | —             | 🟢 Média   | **3** |
| TASK-050 | `[FE]`    | Nodes     | nodes.api.ts — chamadas CRUD                                              | RF04 · RF02                                                         | —             | 🟢 Média   | **2** |
| TASK-051 | `[FE]`    | Nodes     | useNodes.ts — hook de gerenciamento de nós                                | RF04 · RF02                                                         | —             | 🟢 Média   | **3** |
| TASK-052 | `[FE]`    | Nodes     | NodeTree.tsx — visualização hierárquica                                   | RF04 · RF02                                                         | RNF01         | 🟢 Média   | **5** |
| TASK-053 | `[FE]`    | Nodes     | NodeEditor.tsx — formulário de criação/edição                             | RF04 · RF02                                                         | RNF01         | 🟢 Média   | **5** |
| TASK-054 | `[BE]`    | Users     | users.types.ts + users.service.ts + users.controller.ts + users.routes.ts | RF03 · RF04 · RF10 · RF11                                           | —             | 🟢 Média   | **5** |
| TASK-055 | `[FE]`    | Users     | users.api.ts + UserList.tsx                                               | RF03 · RF04                                                         | RNF01         | 🟢 Média   | **3** |
| TASK-056 | `[FIGMA]` | Design    | Mockups do painel Admin                                                   | RF04                                                                | RNF01 · RNF04 | ⚪ Baixa   | **8** |
| TASK-057 | `[FE]`    | Layouts   | AdminLayout.tsx + PublicLayout.tsx                                        | RF03 · RF04                                                         | RNF01         | 🟡 Alta    | **3** |
| TASK-058 | `[FE]`    | Admin     | Páginas do painel Admin                                                   | RF03 · RF04                                                         | RNF01         | 🟢 Média   | **5** |
| TASK-059 | `[UML]`   | Modelagem | Diagrama de Sequência — Astah                                             | RF01 · RF03 · RF05 · RF07 · RF09                                    | —             | ⚪ Baixa   | **3** |
| TASK-060 | `[UML]`   | Modelagem | Diagrama de Atividades — Astah                                            | RF01 · RF05 · RF06 · RF07 · RF08                                    | —             | ⚪ Baixa   | **3** |
| TASK-061 | `[BE]`    | Questions | questions.service.ts — extensão para listagem e status                    | RF05 · RF08                                                         | —             | 🟡 Alta    | **2** |
| TASK-062 | `[BE]`    | Questions | questions.controller.ts + questions.routes.ts — rotas protegidas          | RF05 · RF11                                                         | —             | 🟡 Alta    | **2** |
| TASK-063 | `[FE]`    | Questions | questions.api.ts — chamadas para secretária                               | RF06                                                                | —             | 🟢 Média   | **2** |
| TASK-064 | `[FE]`    | Questions | useQuestions.ts — hook de perguntas                                       | RF06                                                                | —             | 🟢 Média   | **3** |
| TASK-065 | `[FE]`    | Questions | QuestionsTable.tsx + StatusBadge.tsx                                      | RF06                                                                | RNF01         | 🟢 Média   | **3** |
| TASK-066 | `[BE]`    | Logs      | logs.types.ts + logs.service.ts + logs.controller.ts + logs.routes.ts     | RF04 · RF08 · RF10 · RF11                                           | —             | 🟢 Média   | **5** |
| TASK-067 | `[FE]`    | Admin     | logs.api.ts + useLogs.ts + LogTable.tsx                                   | RF04 · RF08                                                         | RNF01         | 🟢 Média   | **5** |
| TASK-068 | `[FIGMA]` | Design    | Mockups do painel Secretária                                              | RF06 · RF08                                                         | RNF01 · RNF04 | ⚪ Baixa   | **5** |
| TASK-069 | `[FE]`    | Pages     | Páginas do painel Secretária + Logs Admin                                 | RF06 · RF08                                                         | RNF01         | 🟢 Média   | **3** |
| TASK-070 | `[BE]`    | Questions | Tipagem de handlers de questions para build dts                           | —                                                                   | —             | 🟡 Alta    | **2** |
| TASK-071 | `[FE]`    | Infra     | Ajuste do ignoreDeprecations no tsconfig.app                              | —                                                                   | —             | 🟡 Alta    | **1** |
| TASK-072 | `[INFRA]` | Questions | Vínculo de pergunta com sessão (session_log_id)                           | RF05 · RF08                                                         | —             | 🔴 Crítica | **8** |
| TASK-073 | `[FE]`    | Questions | Alinhar status de Question com backend                                    | RF06                                                                | —             | 🟡 Alta    | **3** |
| TASK-074 | `[BE]`    | Infra     | Remover any explícito em utils de paginação                               | —                                                                   | —             | 🟢 Média   | **2** |
| TASK-075 | `[FE]`    | Infra     | Remover non-null assertions em produção                                   | —                                                                   | —             | 🟢 Média   | **2** |
| TASK-076 | `[FE]`    | Chatbot   | Integrar EvidenceCard em respostas folha                                  | RF02                                                                | RNF01         | 🟢 Média   | **3** |
| TASK-077 | `[BE]`    | Auth      | Testes de fluxo de autenticação                                           | RF09 · RF10 · RF11                                                  | RNF08         | 🟡 Alta    | **5** |
| TASK-078 | `[BE]`    | Chatbot   | Testes de fluxo do chatbot                                                | RF01 · RF07 · RF08                                                  | —             | 🟡 Alta    | **5** |
| TASK-079 | `[BE]`    | Questions | Testes de fluxo de perguntas                                              | RF05 · RF06 · RF11                                                  | —             | 🟡 Alta    | **5** |
| TASK-080 | `[FE]`    | Chatbot   | Testes de navegação do chatbot                                            | RF01 · RF07 · RF08                                                  | —             | 🟡 Alta    | **5** |
| TASK-081 | `[FE]`    | Auth      | Testes do formulário de login                                             | RF09 · RF10 · RF11                                                  | RNF01         | 🟢 Média   | **3** |
| TASK-082 | `[DOCS]`  | Docs      | Documentação técnica do projeto                                           | —                                                                   | —             | ⚪ Baixa   | **2** |
| TASK-083 | `[DOCS]`  | Docs      | Documentação de sprint                                                    | —                                                                   | —             | ⚪ Baixa   | **2** |

## Princípios de Leitura

| Símbolo   | Significado                                                                              |
| --------- | ---------------------------------------------------------------------------------------- |
| `[BE]`    | Task de backend (`apps/backend/`)                                                        |
| `[FE]`    | Task de frontend (`apps/frontend/`)                                                      |
| `[INFRA]` | Task de infraestrutura (raiz do monorepo)                                                |
| `[FIGMA]` | Task de design de interface                                                              |
| `[UML]`   | Task de modelagem UML com Astah (artefato externo versionado no time)                    |
| `[DB]`    | Task de modelagem de banco de dados com dbdesigner (artefato externo versionado no time) |
| `[DOCS]`  | Task de documentação                                                                     |

> Este documento funciona como visão operacional da sprint.
> Para o detalhamento completo de contratos de cada task, use `docs/fatecbot-backlog.md` como fonte canônica.

---

## Legenda de Requisitos

### Funcionais

| Código | Descrição resumida                                                      |
| ------ | ----------------------------------------------------------------------- |
| RF01   | Navegação conversacional — menus e submenus hierárquicos                |
| RF02   | Repositório de conhecimento — nós, documentos, chunks e metadados       |
| RF03   | Perfis de usuário — Aluno (público), Secretária e Administrador         |
| RF04   | Painel admin — gestão de nós e usuários                                 |
| RF05   | Encaminhamento de pergunta — texto + e-mail institucional               |
| RF06   | Gestão de perguntas — listagem e atualização de status pela secretaria  |
| RF07   | Avaliação de satisfação — "Gostei" / "Não gostei" ao fim do atendimento |
| RF08   | Registro de logs — navigationPath, satisfação, timestamps               |
| RF09   | Autenticação — login/senha para Secretária e Administrador              |
| RF10   | Autorização por papel (RBAC) — controle de acesso no backend            |
| RF11   | Proteção de rotas — middleware JWT obrigatório em rotas sensíveis       |

### Não Funcionais

| Código | Descrição resumida                                                                       |
| ------ | ---------------------------------------------------------------------------------------- |
| RNF01  | Interface simples, clara e responsiva (mobile e desktop)                                 |
| RNF02  | Tempo de resposta adequado ao uso interativo                                             |
| RNF05  | Containerização com Docker — 3 containers                                                |
| RNF06  | Orquestração via Docker Compose com comando único                                        |
| RNF08  | Autenticação JWT com `sub`, `role` e `exp` via `Authorization: Bearer`                   |
| RNF09  | Senhas com Argon2id; segredos em variáveis de ambiente; sem exposição de dados sensíveis |

---

> _Próximo documento: [`../sprint3/README.md`](../sprint3/README.md)_
