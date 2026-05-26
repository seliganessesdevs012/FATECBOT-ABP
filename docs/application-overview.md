# 🏛️ Visão Geral da Aplicação

> Este documento descreve a arquitetura geral do **FatecBot**: seus perfis de usuário,
> o modelo de dados, o fluxo de navegação do chatbot e a topologia de containers.
> É o ponto de partida para qualquer novo membro da equipe entender o sistema como um todo.

> **Nota de estado atual:** o código implementa o fluxo público do chatbot, login,
> guards de rota, perguntas com anexos, CRUD administrativo de nós e usuários,
> listagem/atualização de perguntas, métricas de dashboard e visualização de logs.
> A rota `/secretary` permanece como caminho legado e redireciona para o painel unificado em `/admin`.

***

## 📑 Índice

- [Perfis e Permissões](#perfis-e-permissões)
- [Arquitetura dos Containers](#arquitetura-dos-containers)
- [Modelo de Dados](#modelo-de-dados)
- [Fluxo do Chatbot](#fluxo-do-chatbot)
- [Fluxo de Autenticação](#fluxo-de-autenticação)
- [Fluxo de Encaminhamento de Pergunta](#fluxo-de-encaminhamento-de-pergunta)

***

## 👤 Perfis e Permissões <a id="perfis-e-permissões"></a>

O sistema implementa controle de acesso baseado em papéis (**RBAC — RF10**).
Existem três perfis com escopos distintos:

| Perfil                   | Autenticação |  Papel JWT   | O que pode fazer                                                     |
| ------------------------ | :----------: | :----------: | -------------------------------------------------------------------- |
| **Aluno / Visitante**    |  ❌ Pública  |      —       | Navegar no chatbot, enviar pergunta à secretaria, avaliar satisfação |
| **Secretária Acadêmica** |    ✅ JWT    | `SECRETARIA` | Acessar dashboard, tickets e logs; listar perguntas recebidas e atualizar status |
| **Administrador**        |    ✅ JWT    |   `ADMIN`    | Acessar dashboard, tickets e logs; CRUD de nós e usuários internos |

> ⚠️ O controle de acesso **deve ser aplicado no backend** via middleware.
> Proteção apenas no frontend (esconder botões) **não é suficiente** e viola o RF10/RF11.

***

## 🐳 Arquitetura dos Containers <a id="arquitetura-dos-containers"></a>

O sistema é executado com **3 containers obrigatórios** (RNF05/RNF06),
orquestrados via `docker-compose.yml` com inicialização em comando único.

```
┌─────────────────────────────────────────────────────────────────┐
│                        docker-compose                           │
│                                                                 │
│  ┌──────────────┐    HTTP     ┌──────────────────┐             │
│  │              │ ──────────► │                  │             │
│  │   frontend   │             │     backend      │             │
│  │  (React/Vite)│ ◄────────── │  (Node/Express)  │             │
│  │  :5173       │   JSON      │  :3000           │             │
│  └──────────────┘             └────────┬─────────┘             │
│                                        │ Prisma                │
│                                        │ Client                │
│                               ┌────────▼─────────┐             │
│                               │                  │             │
│                               │    postgres      │             │
│                               │  (PostgreSQL 16) │             │
│                               │  :5432           │             │
│                               └──────────────────┘             │
└─────────────────────────────────────────────────────────────────┘
```

### Responsabilidades de cada container

| Container  | Imagem base          | Porta | Função                                                 |
| ---------- | -------------------- | :---: | ------------------------------------------------------ |
| `frontend` | `node:20-alpine`     | 5173  | Serve a SPA React em modo dev (ou Nginx em prod)       |
| `backend`  | `node:20-alpine`     | 3000  | API REST com Express + Prisma; valida JWT; aplica RBAC |
| `postgres` | `postgres:16-alpine` | 5432  | Banco de dados relacional; dados persistidos em volume |

### Comunicação

- **Frontend → Backend:** requisições HTTP REST com header `Authorization: Bearer <token>` quando autenticado
- **Backend → Postgres:** conexão via Prisma Client usando `DATABASE_URL` (definida em `.env`)
- **Frontend → Postgres:** **nunca direta** — toda operação de dados passa pelo backend

***

## 🗄️ Modelo de Dados <a id="modelo-de-dados"></a>

### Diagrama Entidade-Relacionamento



### Descrição das entidades

#### `User`

Representa os usuários autenticados do sistema (Secretária e Administrador).
O perfil Aluno não possui registro — acesso é público.

| Campo           | Tipo   | Descrição                                                                          |
| --------------- | ------ | ---------------------------------------------------------------------------------- |
| `id`            | Int    | Identificador único auto-incrementado                                              |
| `name`          | String | Nome completo do usuário                                                           |
| `email`         | String | E-mail institucional (único no sistema)                                            |
| `password_hash` | String | Senha com hash Argon2id (memory-hard com 64 MiB por hash) — **nunca em plaintext** |
| `role`          | Enum   | `ADMIN` ou `SECRETARIA`                                                            |

#### `ChatNode`

Representa cada nó da árvore de navegação do chatbot (menus e respostas).
Nós com filhos funcionam como menus; nós sem filhos são folhas e exibem `answer_summary`.

| Campo              | Tipo    | Descrição                                                        |
| ------------------ | ------- | ---------------------------------------------------------------- |
| `id`               | Int     | Identificador único auto-incrementado                            |
| `title`            | String  | Texto do botão/opção exibido na lista de opções do nó pai        |
| `slug`             | String  | Identificador amigável único (ex: `aacc`, `datas-importantes`)   |
| `prompt`           | String  | Pergunta ou instrução exibida pelo bot ao entrar neste nó        |
| `answer_summary`   | String? | Resposta objetiva exibida em nós folha (sem filhos)              |
| `evidence_excerpt` | String? | Trecho de evidência extraído de documento oficial                |
| `evidence_source`  | String? | Fonte da evidência (ex: "Regulamento Geral das Fatecs, Art. 38") |
| `parent_id`        | Int?    | Referência ao nó pai. `null` indica nó raiz                      |
| `display_order`    | Int     | Ordenação dos filhos dentro do mesmo pai                         |
| `is_active`        | Boolean | Indica se o nó aparece nas listagens administrativas ativas       |

#### `SessionLog`

Registra cada sessão de atendimento completa (RF08).

| Campo             | Tipo  | Descrição                                                          |
| ----------------- | ----- | ------------------------------------------------------------------ |
| `navigation_flow` | JSON  | Array de slugs visitados em ordem cronológica                      |
| `flag`            | Enum? | `ATENDEU`, `NAO_ATENDEU` ou `null` (não avaliado)                  |
| `node_id`         | Int?  | Nó associado à avaliação mais recente                              |
| `feedback_history`| JSON? | Histórico de respostas avaliadas na mesma sessão, em ordem         |
| `inquiry_ids`     | JSON? | Campo legado opcional; perguntas atuais se vinculam por `session_log_id` |

#### `Question`

Pergunta enviada pelo aluno à Secretaria Acadêmica (RF05/RF06).

| Campo                  | Tipo    | Descrição                                           |
| ---------------------- | ------- | --------------------------------------------------- |
| `requester_name`       | String  | Nome do solicitante                                 |
| `question`             | String  | Texto da dúvida enviada pelo aluno                  |
| `requester_email`      | String  | E-mail institucional informado para resposta        |
| `status`               | Enum    | `ABERTA` (em aberto) ou `RESPONDIDA`                |
| `attachment_name`      | String? | Nome original do arquivo anexado                    |
| `attachment_mime_type` | String? | MIME type do anexo (ex: `application/pdf`)          |
| `attachment_storage_key` | String? | Chave do arquivo salvo no storage local              |
| `attachment_size_bytes` | Int?    | Tamanho do arquivo salvo                             |
| `attachment_data`      | Bytes?  | Campo legado para conteúdo binário do arquivo         |
| `session_log_id`       | Int?    | Sessão de atendimento que originou a pergunta         |
| `answered_by_user_id`  | Int?    | Usuário que marcou a pergunta como respondida         |
| `answered_at`          | DateTime?| Data/hora em que a pergunta foi marcada respondida    |

***

## 🤖 Fluxo do Chatbot <a id="fluxo-do-chatbot"></a>

O chatbot funciona como uma **árvore de navegação** armazenada no banco de dados.
Cada interação do usuário representa um passo na árvore.

```
[Usuário acessa a aplicação]
         │
         ▼
[GET /api/v1/nodes/root]
Carrega o nó raiz (prompt inicial):
"Para qual curso você deseja atendimento?"
         │
         ▼
[Usuário seleciona uma opção]
ex: "1. Desenvolvimento de Software Multiplataforma"
         │
         ▼
[GET /api/v1/nodes/:id]
Carrega o nó filho com suas opções:
"1.1 AACC  1.2 Datas importantes  1.3 Disciplinas..."
         │
    (repete até atingir um nó folha — sem filhos)
         │
         ▼
[Nó folha alcançado]
Exibe:
  ✅ answer_summary — resposta objetiva do bot
  📄 evidence_excerpt + evidence_source (se preenchidos)
         │
         ▼
[Avaliação de satisfação — RF07]
"Atendeu ✅" / "Não atendeu ❌"
         │
         ▼
[POST /api/v1/sessions/log]
Salva SessionLog com:
  - navigation_flow (array de slugs visitados)
  - flag (ATENDEU | NAO_ATENDEU | null)
  - created_at
         │
         ▼
[Opção: Enviar pergunta à secretaria — RF05]
  → Formulário: nome, texto da dúvida, e-mail, anexo (opcional)
  → POST /api/v1/questions
         │
         ▼
[Sessão encerrada]
```

***

## 🔐 Fluxo de Autenticação <a id="fluxo-de-autenticação"></a>

Aplicável aos perfis **Secretária Acadêmica** e **Administrador** (RF09, RNF08).

```
[Usuário acessa /login]
         │
         ▼
[Preenche e-mail + senha]
         │
         ▼
[POST /api/v1/auth/login]
  → Backend busca User por e-mail
  → Compara senha com argon2.verify() usando Argon2id (PHC 2015, superior ao bcrypt contra GPU/ASIC)
  → Se inválido: 401 Unauthorized
         │
         ▼
[Se válido: gera JWT]
  Payload: { sub: userId, role: 'ADMIN'|'SECRETARIA', exp: ... }
  Assina com JWT_SECRET
  Retorna: { token, user: { id, name, role } }
         │
         ▼
[Frontend salva token no Zustand (auth.store)]
  → Axios interceptor adiciona automaticamente
    "Authorization: Bearer <token>" em toda requisição
         │
         ▼
[Redirecionamento por role]
  ADMIN      → /admin
  SECRETARIA → /admin
  /secretary → redireciona para /admin
         │
         ▼
[A cada requisição a rota protegida]
  → auth.middleware.ts verifica o token JWT
  → rbac.middleware.ts verifica se o role tem permissão
  → Se expirado ou inválido: 401 → frontend redireciona para /login
```

***

## ❓ Fluxo de Encaminhamento de Pergunta <a id="fluxo-de-encaminhamento-de-pergunta"></a>

Disponível ao fim de qualquer atendimento no chatbot (RF05/RF06).

```
[Aluno clica em "Enviar pergunta à secretaria"]
         │
         ▼
[Formulário: nome, texto da dúvida, e-mail institucional, anexo (opcional)]
         │
         ▼
[POST /api/v1/questions]
  Body: { requester_name, question, requester_email, attachment? }
  → Valida e-mail e campos obrigatórios
  → Persiste Question com status: ABERTA
  → Se anexo presente: persiste attachment_name, attachment_mime_type, attachment_data
  → Resposta: 201 Created
         │
         ▼
[Área interna]
  → Dashboard, tickets e logs ficam no painel unificado em /admin
         │
         ▼
[Secretária atualiza o status]
  → PATCH /api/v1/questions/:id
  Body: { status: 'RESPONDIDA' }
  → Requer role: SECRETARIA
         │
         ▼
[Pergunta marcada como respondida]
  → Aluno recebe retorno por e-mail (fora do escopo do MVP)
```

***

> _Próximo documento: [`api-layer.md`](./api-layer.md)_
