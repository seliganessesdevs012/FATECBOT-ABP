## Princípios de Leitura

| Símbolo      | Significado                                                           |
| ------------ | --------------------------------------------------------------------- |
| `[BE]`       | Task de backend (`apps/backend/`)                                     |
| `[FE]`       | Task de frontend (`apps/frontend/`)                                   |
| `[INFRA]`    | Task de infraestrutura (raiz do monorepo)                             |
| `[FIGMA]`    | Task de design de interface (Figma — sem arquivos de código)          |
| `[UML]`      | Task de modelagem UML com Astah (`docs/uml/`)                         |
| `[DB]`       | Task de modelagem de banco de dados com dbdesigner (`docs/database/`) |
| **Entrada**  | O que deve existir/estar pronto antes de iniciar                      |
| **Saída**    | O que a task entrega como artefato testável                           |
| **Peso**     | Story points estimados (escala Fibonacci: 1 · 2 · 3 · 5 · 8 · 13)     |
| **Arquivos** | Arquivos exclusivamente criados/editados por esta task                |

> **Regra de ouro:** arquivos de `types/`, `api/`, `service/` e `hooks/` são sempre tasks separadas.
> Isso garante que dois desenvolvedores nunca editem o mesmo arquivo ao mesmo tempo.

---

### 🏗️ Infraestrutura — Backend

---

#### TASK-001 · [BE] Bootstrap do servidor Express

**Módulo:** Infra / `src/`
**Prioridade:** 🔴 Crítica (bloqueante para todas as tasks BE)
**Peso:** `2 pts`
**Rastreabilidade RF:** —
**Rastreabilidade RNF:** RNF05 · RNF06

**Arquivos exclusivos desta task:**

- `apps/backend/src/server.ts`
- `apps/backend/src/index.ts`

**Entrada:**

- Repositório inicializado com `pnpm init` e dependências base instaladas (`express`, `typescript`)
- `tsconfig.json` presente

**Saída:**

- `server.ts` cria e exporta o app Express sem chamar `.listen()`
- `index.ts` importa o app e chama `.listen(PORT)`
- `GET /api/v1/health` retorna `{ "success": true }`
- Servidor responde em `http://localhost:3333`

**Contrato de saída (HTTP):**

```
GET /api/v1/health
→ 200 OK
→ { "success": true }
```

---

#### TASK-002 · [BE] Configuração de ambiente e banco de dados

**Módulo:** Infra / `src/config/`
**Prioridade:** 🔴 Crítica
**Peso:** `2 pts`
**Rastreabilidade RF:** —
**Rastreabilidade RNF:** RNF05 · RNF09

**Arquivos exclusivos desta task:**

- `apps/backend/src/config/env.ts`
- `apps/backend/src/config/database.ts`
- `apps/backend/.env.example`

**Entrada:**

- `TASK-001` concluída (app Express existe)
- Dependências: `zod`, `@prisma/client`

**Saída:**

- `env.ts` lê e valida `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `PORT`, `NODE_ENV` com Zod; encerra o processo com mensagem descritiva em caso de variável ausente
- `database.ts` exporta singleton `PrismaClient`
- `.env.example` documentado

**Contrato de saída (módulo):**

```ts
// config/env.ts
export const env: {
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  PORT: number;
  NODE_ENV: "development" | "production" | "test";
};

// config/database.ts
export const db: PrismaClient;
```

---

#### TASK-003 · [BE] Classe AppError e middleware de erros

**Módulo:** Infra / `src/errors/` + `src/middlewares/`
**Prioridade:** 🔴 Crítica
**Peso:** `3 pts`
**Rastreabilidade RF:** RF11
**Rastreabilidade RNF:** RNF02 · RNF09

**Arquivos exclusivos desta task:**

- `apps/backend/src/errors/AppError.ts`
- `apps/backend/src/middlewares/error.middleware.ts`
- `apps/backend/src/middlewares/logger.middleware.ts`

**Entrada:**

- `TASK-001` concluída
- `TASK-002` concluída (env disponível)

**Saída:**

- `AppError` é classe que estende `Error` com `statusCode` e `message`
- `error.middleware.ts` captura `AppError` → JSON formatado; `ZodError` → 422 com detalhes; erros desconhecidos → 500 sem vazar stack trace
- `logger.middleware.ts` loga método, rota e status de cada requisição

**Contrato de saída (módulo):**

```ts
// errors/AppError.ts
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number,
  ) {}
}

// middlewares/error.middleware.ts
export const errorMiddleware: ErrorRequestHandler;
// Garante que QUALQUER erro resulta em:
// { success: false, message: string, errors?: FieldError[] }
```

---

#### TASK-004 · [BE] Schema Prisma e migration inicial

**Módulo:** Infra / `prisma/`
**Prioridade:** 🔴 Crítica (bloqueante para todos os services)
**Peso:** `5 pts`
**Rastreabilidade RF:** RF01 · RF02 · RF03 · RF05 · RF07 · RF08 · RF09
**Rastreabilidade RNF:** —

**Arquivos exclusivos desta task:**

- `apps/backend/prisma/schema.prisma`
- `apps/backend/prisma/migrations/` (gerado automaticamente)

**Entrada:**

- `TASK-002` concluída (`DATABASE_URL` disponível)
- PostgreSQL rodando (local ou Docker)

**Saída:**

- Schema com as entidades: `User`, `ChatNode`, `InteractionLog`, `Question`
- Migration aplicada e banco criado
- Tipos Prisma gerados (`@prisma/client`)

**Contrato de saída (schema — entidades mínimas):**

```prisma
model User           { id Int @id @default(autoincrement()), name String, email String @unique, password_hash String, role Role, created_at DateTime @default(now()), updated_at DateTime @updatedAt }
model ChatNode       { id Int @id @default(autoincrement()), title String, slug String @unique, prompt String?, answer_summary String?, evidence_excerpt String?, evidence_source String?, parent_id Int?, display_order Int, is_active Boolean @default(true), created_at DateTime @default(now()), updated_at DateTime @updatedAt }
model InteractionLog { id Int @id @default(autoincrement()), navigation_flow Json, flag Satisfaction?, inquiry_ids Json?, created_at DateTime @default(now()) }
model Question       { id Int @id @default(autoincrement()), requester_name String, question String, requester_email String, attachment_name String?, attachment_mime_type String?, attachment_data Bytes?, status InquiryStatus @default(ABERTA), created_at DateTime @default(now()), updated_at DateTime @updatedAt }
```

---

#### TASK-005 · [BE] Seed de dados iniciais

**Módulo:** Infra / `prisma/`
**Prioridade:** 🟡 Alta
**Peso:** `2 pts`
**Rastreabilidade RF:** RF02 · RF03 · RF09
**Rastreabilidade RNF:** RNF09

**Arquivos exclusivos desta task:**

- `apps/backend/prisma/seed.ts`

**Entrada:**

- `TASK-004` concluída (schema e migrations aplicados)

**Saída:**

- Admin padrão criado (`admin@fatec.sp.gov.br` / `admin123`) com hash Argon2id
- Secretária padrão criada (`secretaria@fatec.sp.gov.br` / `secretaria123`)
- Nó raiz do chatbot criado com pelo menos 2 nós filhos de exemplo
- Comando `pnpm db:seed` funcional

---

#### TASK-006 · [BE] Utils: hash e JWT

**Módulo:** Infra / `src/utils/`
**Prioridade:** 🔴 Crítica (bloqueante para auth.service)
**Peso:** `3 pts`
**Rastreabilidade RF:** RF09
**Rastreabilidade RNF:** RNF08 · RNF09

**Arquivos exclusivos desta task:**

- `apps/backend/src/utils/hash.util.ts`
- `apps/backend/src/utils/jwt.utils.ts`
- `apps/backend/src/utils/pagination.utils.ts`

**Entrada:**

- `TASK-002` concluída (`env.JWT_SECRET` disponível)
- Dependências: `argon2`, `jsonwebtoken`

**Saída:**

- `hash.util.ts` exporta `hashPassword(plain: string): Promise<string>` e `comparePassword(plain: string, hash: string): Promise<boolean>` usando Argon2id
- `jwt.utils.ts` exporta `generateToken(payload: TokenPayload): string` e `verifyToken(token: string): TokenPayload`
- `pagination.utils.ts` exporta `paginate(page, limit)` retornando `{ skip, take }`

**Contrato de saída (módulo):**

```ts
// utils/hash.util.ts
export async function hashPassword(plain: string): Promise<string>;
export async function comparePassword(
  plain: string,
  hash: string,
): Promise<boolean>;

// utils/jwt.utils.ts
export function generateToken(payload: { sub: string; role: string }): string;
export function verifyToken(token: string): {
  sub: string;
  role: string;
  exp: number;
};

// utils/pagination.utils.ts
export function paginate(
  page: number,
  limit: number,
): { skip: number; take: number };
```

---

### 🎨 Design — Figma

---

#### TASK-007 · [FIGMA] Design System e tokens visuais

**Módulo:** Design / Figma
**Prioridade:** 🟡 Alta (bloqueante para todos os demais frames Figma)
**Peso:** `5 pts`
**Rastreabilidade RF:** —
**Rastreabilidade RNF:** RNF01

**Arquivos exclusivos desta task:**

- `[Figma] Página "Design System"` — frames: Cores, Tipografia, Espaçamentos, Componentes Base

**Entrada:**

- Identidade visual da Fatec Jacareí definida (cores institucionais, logotipo)
- Decisão de stack de componentes UI concluída (shadcn/ui + Tailwind CSS)

**Saída:**

- Paleta de cores primária, secundária e neutra exportada como tokens nomeados (`--primary`, `--background`, `--destructive`, etc.)
- Escala tipográfica definida: heading 1–4, body, caption, code — com família, tamanho e peso
- Escala de espaçamentos baseada em múltiplos de 4px e grid de 12 colunas
- Componentes Figma reutilizáveis: Button (variantes primary/secondary/ghost/destructive), Input, Badge, Card, Modal/Dialog, Sidebar, Table
- Handoff de tokens anotado para facilitar o mapeamento com `tailwind.config.ts`

---

#### TASK-008 · [FIGMA] Wireframes — Login e fluxo de autenticação

**Módulo:** Design / Figma — Sprint 1 / Auth
**Prioridade:** 🟡 Alta
**Peso:** `3 pts`
**Rastreabilidade RF:** RF03 · RF09
**Rastreabilidade RNF:** RNF01

**Arquivos exclusivos desta task:**

- `[Figma] Página "Sprint 1 / Auth"` — frames: Login, Login-Erro, Login-Loading

**Entrada:**

- `TASK-007` concluída (Design System e componentes base disponíveis no Figma)

**Saída:**

- Frame "Login" com campos e-mail e senha, botão de submit e logo institucional
- Variante "Login-Erro" com mensagem de erro inline abaixo dos campos
- Variante "Login-Loading" com spinner no botão e campos desabilitados
- Anotações de comportamento documentadas no frame (ex.: redirecionamento por role após sucesso)
- Handoff referenciado por `TASK-029` (LoginForm.tsx)

---

#### TASK-009 · [FIGMA] Wireframes — Interface do Chatbot público

**Módulo:** Design / Figma — Sprint 1 / Chatbot
**Prioridade:** 🔴 Crítica
**Peso:** `5 pts`
**Rastreabilidade RF:** RF01 · RF02 · RF05 · RF07
**Rastreabilidade RNF:** RNF01

**Arquivos exclusivos desta task:**

- `[Figma] Página "Sprint 1 / Chatbot"` — frames: ChatWindow, MessageBubble, OptionButton, EvidenceCard, SatisfactionRating, QuestionForm

**Entrada:**

- `TASK-007` concluída (Design System disponível)
- Fluxo de navegação do chatbot definido em `application-overview.md`

**Saída:**

- Frame "ChatWindow" exibindo o fluxo completo: estado inicial (menu raiz) e estado de resposta
- Variantes de "MessageBubble": sender `bot` (alinhado à esquerda) e sender `user` (alinhado à direita)
- Variantes de "OptionButton": default, hover e disabled
- Frame "EvidenceCard" com trecho de evidência e referência da fonte
- Frame "SatisfactionRating" nos estados: neutro (sem seleção), gostei selecionado, não gostei selecionado, confirmação enviada
- Frame "QuestionForm" nos estados: vazio, preenchido e enviado com sucesso
- Handoff referenciado pelas tasks `TASK-037`, `TASK-038`, `TASK-039`, `TASK-040` e `TASK-044`

---

### 📐 Modelagem — UML e Banco de Dados

---

#### TASK-010 · [UML] Diagrama de Casos de Uso — Astah

**Módulo:** Modelagem / Astah
**Prioridade:** 🟡 Alta
**Peso:** `3 pts`
**Rastreabilidade RF:** RF01 · RF02 · RF03 · RF04 · RF05 · RF06 · RF07 · RF08 · RF09 · RF10 · RF11
**Rastreabilidade RNF:** —

**Arquivos exclusivos desta task:**

- `docs/uml/casos-de-uso.asta`
- `docs/uml/casos-de-uso.png`

**Entrada:**

- Requisitos funcionais e não funcionais levantados e aprovados pelo time
- User stories definidas e revisadas pelo Product Owner

**Saída:**

- Diagrama de Casos de Uso exportado em `.asta` e `.png`
- Atores identificados: **Aluno** (público, sem autenticação), **Admin** e **Secretária** (autenticados)
- Casos de uso mapeados para todos os RFs (RF01–RF11)
- Relacionamentos `<<include>>` e `<<extend>>` documentados onde aplicável

---

#### TASK-011 · [DB] Modelagem do Banco de Dados — dbdesigner

**Módulo:** Modelagem / dbdesigner
**Prioridade:** 🔴 Crítica
**Peso:** `3 pts`
**Rastreabilidade RF:** RF01 · RF02 · RF03 · RF04 · RF05 · RF07 · RF08 · RF09
**Rastreabilidade RNF:** RNF09

**Arquivos exclusivos desta task:**

- `docs/database/modelo-relacional.xml`
- `docs/database/modelo-relacional.png`

**Entrada:**

- `TASK-004` concluída (schema Prisma com todas as entidades e relacionamentos definidos)

**Saída:**

- Modelo relacional completo exportado do dbdesigner (`.xml` + `.png`)
- Entidades: `User`, `ChatNode`, `InteractionLog`, `Question`
- Chaves primárias (`Int` autoincrement), chaves estrangeiras e índices documentados em cada tabela
- Relacionamentos 1:N representados graficamente com cardinalidades (incluindo árvore de `ChatNode` por `parent_id`)

---

### 🏗️ Infraestrutura — Frontend

---

#### TASK-012 · [FE] Bootstrap do projeto Vite + TypeScript

**Módulo:** Infra / raiz do frontend
**Prioridade:** 🔴 Crítica (bloqueante para todas as tasks FE)
**Peso:** `2 pts`
**Rastreabilidade RF:** —
**Rastreabilidade RNF:** RNF01 · RNF05

**Arquivos exclusivos desta task:**

- `apps/frontend/vite.config.ts`
- `apps/frontend/tsconfig.json`
- `apps/frontend/tsconfig.app.json`
- `apps/frontend/tailwind.config.ts`
- `apps/frontend/eslint.config.ts`
- `apps/frontend/vitest.config.ts`
- `apps/frontend/index.html`
- `apps/frontend/.env.example`

**Entrada:**

- Monorepo pnpm configurado
- Node.js >= 20.x

**Saída:**

- `pnpm dev` sobe o servidor Vite em `http://localhost:5173`
- Path alias `@/` configurado apontando para `src/`
- Tailwind CSS funcional
- Vitest configurado

---

#### TASK-013 · [FE] Tipos globais compartilhados

**Módulo:** Infra / `src/types/`
**Prioridade:** 🔴 Crítica
**Peso:** `2 pts`
**Rastreabilidade RF:** RF01 · RF03 · RF07
**Rastreabilidade RNF:** —

**Arquivos exclusivos desta task:**

- `apps/frontend/src/types/api.types.ts`
- `apps/frontend/src/types/common.types.ts`

**Entrada:**

- `TASK-012` concluída

**Saída:**

- `api.types.ts` define `ApiResponse<T>`, `PaginatedResponse<T>`, `ApiError`, `FieldError`
- `common.types.ts` define `Role` (`'ADMIN' | 'SECRETARIA'`), `UUID`, `InquiryStatus`, `Satisfaction`

**Contrato de saída (tipos):**

```ts
// types/api.types.ts
export interface ApiResponse<T> {
  success: boolean;
  data: T;
}
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: { total: number; page: number; limit: number };
}
export interface ApiError {
  success: false;
  message: string;
  errors?: FieldError[];
}
export interface FieldError {
  field: string;
  message: string;
}

// types/common.types.ts
export type Role = "ADMIN" | "SECRETARIA";
export type UUID = string;
export type InquiryStatus = "ABERTA" | "RESPONDIDA";
export type Satisfaction = "ATENDEU" | "NAO_ATENDEU";
```

---

#### TASK-014 · [FE] Instância Axios e React Query client

**Módulo:** Infra / `src/lib/`
**Prioridade:** 🔴 Crítica
**Peso:** `3 pts`
**Rastreabilidade RF:** RF09 · RF11
**Rastreabilidade RNF:** RNF02 · RNF08

**Arquivos exclusivos desta task:**

- `apps/frontend/src/lib/axios.ts`
- `apps/frontend/src/lib/queryClient.ts`
- `apps/frontend/src/config/env.ts`

**Entrada:**

- `TASK-012` concluída
- `TASK-013` concluída (tipos disponíveis)
- Dependências: `axios`, `@tanstack/react-query`

**Saída:**

- `axios.ts` exporta instância `api` com `baseURL = VITE_API_URL`, interceptor de request que injeta `Authorization: Bearer <token>` a partir do Zustand store, e interceptor de resposta que redireciona para `/login` em caso de 401
- `queryClient.ts` exporta instância configurada com `staleTime: 60_000` e `retry: 1`
- `env.ts` valida `VITE_API_URL` com Zod

**Contrato de saída (módulo):**

```ts
// lib/axios.ts
export const api: AxiosInstance; // instância com interceptors configurados

// lib/queryClient.ts
export const queryClient: QueryClient;

// config/env.ts
export const env: { VITE_API_URL: string; VITE_ENABLE_DEVTOOLS: boolean };
```

---

#### TASK-015 · [FE] Provider global e Router

**Módulo:** Infra / `src/app/`
**Prioridade:** 🔴 Crítica
**Peso:** `2 pts`
**Rastreabilidade RF:** RF03 · RF09 · RF10 · RF11
**Rastreabilidade RNF:** —

**Arquivos exclusivos desta task:**

- `apps/frontend/src/app/provider.tsx`
- `apps/frontend/src/app/router.tsx`
- `apps/frontend/src/main.tsx`

**Entrada:**

- `TASK-014` concluída
- Dependências: `react-router-dom`, `@tanstack/react-query`

**Saída:**

- `provider.tsx` compõe `QueryClientProvider`, `BrowserRouter` e futuro `AuthProvider`
- `router.tsx` define as rotas atuais (`/`, `/login`, `/admin`, `/admin/nodes`, `/admin/users`, `/admin/tickets`, `/admin/logs`, `/secretary`) com `ProtectedRoute` e `RoleGuard` nas áreas internas
- Rotas previstas: `/`, `/login`, `/admin/*`, `/secretary/*`

---

#### TASK-016 · [FE] Utils frontend

**Módulo:** Infra / `src/utils/`
**Prioridade:** 🟡 Alta
**Peso:** `2 pts`
**Rastreabilidade RF:** RF09
**Rastreabilidade RNF:** RNF01 · RNF08

**Arquivos exclusivos desta task:**

- `apps/frontend/src/utils/date.utils.ts`
- `apps/frontend/src/utils/string.utils.ts`
- `apps/frontend/src/utils/token.utils.ts`

**Entrada:**

- `TASK-012` concluída

**Saída:**

- `date.utils.ts` exporta `formatDate(iso: string): string` em pt-BR e `formatRelative(iso: string): string`
- `string.utils.ts` exporta `truncate(str, max)` e `capitalize(str)`
- `token.utils.ts` exporta `decodeJWT(token): JWTPayload` e `isTokenExpired(token): boolean`

---

#### TASK-017 · [FE] Componentes compartilhados base

**Módulo:** Infra / `src/components/shared/`
**Prioridade:** 🟡 Alta
**Peso:** `2 pts`
**Rastreabilidade RF:** —
**Rastreabilidade RNF:** RNF01 · RNF02

**Arquivos exclusivos desta task:**

- `apps/frontend/src/components/shared/LoadingSpinner.tsx`
- `apps/frontend/src/components/shared/ErrorBoundary.tsx`

**Entrada:**

- `TASK-012` concluída (Tailwind disponível)

**Saída:**

- `LoadingSpinner` é componente React que aceita `size?: 'sm' | 'md' | 'lg'`
- `ErrorBoundary` é class component que captura erros de renderização e exibe fallback

---

#### TASK-018 · [FE] Hooks globais utilitários

**Módulo:** Infra / `src/hooks/`
**Prioridade:** 🟢 Média
**Peso:** `2 pts`
**Rastreabilidade RF:** —
**Rastreabilidade RNF:** RNF01 · RNF02

**Arquivos exclusivos desta task:**

- `apps/frontend/src/hooks/useDebounce.ts`
- `apps/frontend/src/hooks/usePagination.ts`

**Entrada:**

- `TASK-012` concluída

**Saída:**

- `useDebounce<T>(value: T, delay: number): T`
- `usePagination(initialPage?, initialLimit?): { page, limit, setPage, setLimit, nextPage, prevPage }`

---

### 🐳 Infraestrutura — Docker

---

#### TASK-019 · [INFRA] Docker Compose e Dockerfiles

**Módulo:** Raiz do monorepo
**Prioridade:** 🔴 Crítica
**Peso:** `3 pts`
**Rastreabilidade RF:** —
**Rastreabilidade RNF:** RNF05 · RNF06

**Arquivos exclusivos desta task:**

- `docker-compose.yml`
- `apps/backend/Dockerfile`
- `apps/frontend/Dockerfile`
- `.env` (raiz, criado manualmente a partir das variáveis documentadas no README principal)
- `pnpm-workspace.yaml`

**Entrada:**

- `TASK-001` e `TASK-012` concluídas (apps existem)

**Saída:**

- `docker compose up --build` sobe os 3 containers: `postgres:16-alpine`, backend Node 20 em `:3000`, frontend Node 20 em `:5173`
- Health check no backend container aguarda o Postgres estar pronto
- Variáveis de ambiente documentadas no README principal para criação do `.env` da raiz

---

### 🔐 Módulo Auth

---

#### TASK-020 · [BE] auth.types.ts — DTOs e contratos de autenticação

**Módulo:** `src/modules/auth/`
**Prioridade:** 🔴 Crítica
**Peso:** `1 pts`
**Rastreabilidade RF:** RF03 · RF09
**Rastreabilidade RNF:** RNF08

**Arquivos exclusivos desta task:**

- `apps/backend/src/modules/auth/auth.types.ts`

**Entrada:**

- `TASK-004` concluída (modelo `User` no Prisma)

**Saída:**

- Tipos: `LoginDTO`, `TokenPayload`, `AuthUserResponse`

**Contrato de saída (tipos):**

```ts
export interface LoginDTO {
  email: string; // e-mail institucional
  password: string; // senha em plaintext — só existe no request; nunca persiste
}

export interface TokenPayload {
  sub: string; // userId (Int serializado no JWT)
  role: "ADMIN" | "SECRETARIA";
  exp: number; // Unix timestamp
}

export interface AuthUserResponse {
  id: number;
  name: string;
  email: string;
  role: "ADMIN" | "SECRETARIA";
}
```

---

#### TASK-021 · [BE] auth.service.ts — lógica de autenticação

**Módulo:** `src/modules/auth/`
**Prioridade:** 🔴 Crítica
**Peso:** `3 pts`
**Rastreabilidade RF:** RF03 · RF09
**Rastreabilidade RNF:** RNF08 · RNF09

**Arquivos exclusivos desta task:**

- `apps/backend/src/modules/auth/auth.service.ts`

**Entrada:**

- `TASK-020` concluída (tipos disponíveis)
- `TASK-006` concluída (`comparePassword`, `generateToken` disponíveis)
- `TASK-002` concluída (`db` disponível)
- `TASK-003` concluída (`AppError` disponível)

**Saída:**

- `login(dto: LoginDTO): Promise<{ token: string; user: AuthUserResponse }>`
- Lança `AppError('E-mail ou senha inválidos', 401)` se usuário não encontrado ou senha incorreta
- Usa `argon2.verify()` com Argon2id para comparar a senha
- Token JWT contém `{ sub: user.id, role: user.role }`

**Contrato de saída (módulo):**

```ts
export class AuthService {
  async login(
    dto: LoginDTO,
  ): Promise<{ token: string; user: AuthUserResponse }>;
}
```

---

#### TASK-022 · [BE] auth.controller.ts + auth.routes.ts

**Módulo:** `src/modules/auth/`
**Prioridade:** 🔴 Crítica
**Peso:** `3 pts`
**Rastreabilidade RF:** RF09 · RF11
**Rastreabilidade RNF:** —

**Arquivos exclusivos desta task:**

- `apps/backend/src/modules/auth/auth.controller.ts`
- `apps/backend/src/modules/auth/auth.routes.ts`

**Entrada:**

- `TASK-021` concluída (`AuthService` disponível)
- `TASK-003` concluída (error handler global)
- Dependência: `zod` (validação de schema)

**Saída:**

- `POST /auth/login` valida body com Zod, chama `AuthService.login()`, retorna `200` com `{ success: true, data: { token, user } }`
- Schema Zod: `{ email: z.string().email(), password: z.string().min(6) }`

**Contrato de saída (HTTP):**

```
POST /api/v1/auth/login
Body: { "email": string, "password": string }
→ 200: { "success": true, "data": { "token": string, "user": AuthUserResponse } }
→ 401: { "success": false, "message": "E-mail ou senha inválidos" }
→ 422: { "success": false, "message": "...", "errors": FieldError[] }
```

---

#### TASK-023 · [BE] auth.middleware.ts — validação JWT

**Módulo:** `src/middlewares/`
**Prioridade:** 🔴 Crítica (bloqueante para todas as rotas protegidas)
**Peso:** `2 pts`
**Rastreabilidade RF:** RF09 · RF11
**Rastreabilidade RNF:** RNF08

**Arquivos exclusivos desta task:**

- `apps/backend/src/middlewares/auth.middleware.ts`

**Entrada:**

- `TASK-006` concluída (`verifyToken` disponível)
- `TASK-003` concluída (`AppError` disponível)

**Saída:**

- Middleware Express que extrai `Authorization: Bearer <token>`, verifica com `verifyToken()`, e popula `req.user: TokenPayload`
- Lança `AppError('Token ausente ou inválido', 401)` se token inválido ou expirado

**Contrato de saída (módulo):**

```ts
// Popula req.user após validação
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}
export const authenticate: RequestHandler;
```

---

#### TASK-024 · [BE] rbac.middleware.ts — autorização por role

**Módulo:** `src/middlewares/`
**Prioridade:** 🔴 Crítica
**Peso:** `2 pts`
**Rastreabilidade RF:** RF03 · RF10 · RF11
**Rastreabilidade RNF:** —

**Arquivos exclusivos desta task:**

- `apps/backend/src/middlewares/rbac.middleware.ts`

**Entrada:**

- `TASK-023` concluída (`req.user` disponível)
- `TASK-003` concluída (`AppError` disponível)

**Saída:**

- `authorize(...roles: Role[])` retorna middleware que verifica se `req.user.role` está nos roles permitidos
- Lança `AppError('Acesso negado', 403)` se role insuficiente

**Contrato de saída (módulo):**

```ts
export function authorize(
  ...roles: Array<"ADMIN" | "SECRETARIA">
): RequestHandler;
// Uso: router.get('/nodes', authenticate, authorize('ADMIN'), nodesController.list)
```

---

#### TASK-025 · [FE] auth.types.ts — tipos de autenticação

**Módulo:** `src/features/auth/types/`
**Prioridade:** 🔴 Crítica
**Peso:** `1 pts`
**Rastreabilidade RF:** RF03 · RF09
**Rastreabilidade RNF:** RNF08

**Arquivos exclusivos desta task:**

- `apps/frontend/src/features/auth/types/auth.types.ts`

**Entrada:**

- `TASK-013` concluída (tipos `Role` disponíveis)

**Saída:**

```ts
export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: Role;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface JWTPayload {
  sub: string;
  role: Role;
  exp: number;
}
```

---

#### TASK-026 · [FE] auth.store.ts — estado global de autenticação (Zustand)

**Módulo:** `src/features/auth/stores/`
**Prioridade:** 🔴 Crítica
**Peso:** `2 pts`
**Rastreabilidade RF:** RF09 · RF10 · RF11
**Rastreabilidade RNF:** —

**Arquivos exclusivos desta task:**

- `apps/frontend/src/features/auth/stores/auth.store.ts`

**Entrada:**

- `TASK-025` concluída (tipos `AuthUser` disponíveis)
- Dependência: `zustand`

**Saída:**

- Store Zustand com: `token: string | null`, `user: AuthUser | null`, `setAuth(token, user)`, `clearAuth()`
- Usado pelo interceptor Axios (`TASK-014`) via `useAuthStore.getState().token`

**Contrato de saída (módulo):**

```ts
interface AuthStore {
  token: string | null;
  user: AuthUser | null;
  setAuth: (token: string, user: AuthUser) => void;
  clearAuth: () => void;
}
export const useAuthStore: UseBoundStore<StoreApi<AuthStore>>;
```

---

#### TASK-027 · [FE] auth.api.ts — chamadas de autenticação

**Módulo:** `src/features/auth/api/`
**Prioridade:** 🔴 Crítica
**Peso:** `1 pts`
**Rastreabilidade RF:** RF09
**Rastreabilidade RNF:** RNF08

**Arquivos exclusivos desta task:**

- `apps/frontend/src/features/auth/api/auth.api.ts`

**Entrada:**

- `TASK-014` concluída (instância `api` disponível)
- `TASK-025` concluída (tipos disponíveis)

**Saída:**

```ts
export const authApi = {
  login(payload: LoginPayload): Promise<{ token: string; user: AuthUser }>
}
```

---

#### TASK-028 · [FE] useLogin.ts — hook de login

**Módulo:** `src/features/auth/hooks/`
**Prioridade:** 🔴 Crítica
**Peso:** `3 pts`
**Rastreabilidade RF:** RF03 · RF09 · RF10
**Rastreabilidade RNF:** —

**Arquivos exclusivos desta task:**

- `apps/frontend/src/features/auth/hooks/useLogin.ts`

**Entrada:**

- `TASK-027` concluída (`authApi` disponível)
- `TASK-026` concluída (`useAuthStore` disponível)

**Saída:**

- Hook que usa `useMutation` do TanStack Query
- Em `onSuccess`: chama `setAuth(token, user)` e redireciona por role (`ADMIN → /admin`, `SECRETARIA → /secretary`)
- Em `onError`: expõe mensagem de erro para o formulário

**Contrato de saída (hook):**

```ts
export function useLogin(): {
  login: (payload: LoginPayload) => void;
  isLoading: boolean;
  error: string | null;
};
```

---

#### TASK-029 · [FE] LoginForm.tsx — componente de formulário

**Módulo:** `src/features/auth/components/`
**Prioridade:** 🟡 Alta
**Peso:** `3 pts`
**Rastreabilidade RF:** RF09
**Rastreabilidade RNF:** RNF01

**Arquivos exclusivos desta task:**

- `apps/frontend/src/features/auth/components/LoginForm.tsx`

**Entrada:**

- `TASK-028` concluída (`useLogin` disponível)
- shadcn/ui instalado (componentes `Input`, `Button`, `Label`)
- `TASK-008` concluída (wireframe de referência disponível no Figma)

**Saída:**

- Formulário com campos `email` e `password`, botão de submit
- Exibe `LoadingSpinner` durante a mutation
- Exibe mensagem de erro abaixo do formulário em caso de falha

---

#### TASK-030 · [FE] ProtectedRoute.tsx + RoleGuard.tsx

**Módulo:** `src/components/shared/`
**Prioridade:** 🔴 Crítica
**Peso:** `2 pts`
**Rastreabilidade RF:** RF03 · RF10 · RF11
**Rastreabilidade RNF:** —

**Arquivos exclusivos desta task:**

- `apps/frontend/src/components/shared/ProtectedRoute.tsx`
- `apps/frontend/src/components/shared/RoleGuard.tsx`

**Entrada:**

- `TASK-026` concluída (`useAuthStore` disponível)

**Saída:**

- `ProtectedRoute`: redireciona para `/login` se `token === null`
- `RoleGuard`: recebe `allowedRoles: Role[]`, redireciona para `/` se `user.role` não está na lista

**Contrato de saída (componentes):**

```tsx
// ProtectedRoute: envolve rotas que exigem autenticação
<ProtectedRoute><AdminDashboard /></ProtectedRoute>

// RoleGuard: restringe por role
<RoleGuard allowedRoles={['ADMIN']}><NodeEditorPage /></RoleGuard>
```

---

### 🤖 Módulo Chatbot

---

#### TASK-031 · [BE] chatbot.types.ts — DTOs de navegação

**Módulo:** `src/modules/chatbot/`
**Prioridade:** 🔴 Crítica
**Peso:** `2 pts`
**Rastreabilidade RF:** RF01 · RF02 · RF07 · RF08
**Rastreabilidade RNF:** —

**Arquivos exclusivos desta task:**

- `apps/backend/src/modules/chatbot/chatbot.types.ts`

**Entrada:**

- `TASK-004` concluída (modelos `ChatNode` e `InteractionLog` existem)

**Saída:**

```ts
export interface ChatNodeChildDTO {
  id: number;
  title: string;
  slug: string;
  display_order: number;
}

export interface ChatNodeResponseDTO {
  id: number;
  title: string;
  slug: string;
  prompt: string | null;
  answer_summary: string | null;
  evidence_excerpt: string | null;
  evidence_source: string | null;
  parent_id: number | null;
  display_order: number;
  is_active: boolean;
  children: ChatNodeChildDTO[];
}

export interface CreateInteractionLogDTO {
  navigation_flow: string[];
  flag: "ATENDEU" | "NAO_ATENDEU";
}
```

---

#### TASK-032 · [BE] chatbot.service.ts — lógica de navegação

**Módulo:** `src/modules/chatbot/`
**Prioridade:** 🔴 Crítica
**Peso:** `5 pts`
**Rastreabilidade RF:** RF01 · RF02 · RF07 · RF08
**Rastreabilidade RNF:** —

**Arquivos exclusivos desta task:**

- `apps/backend/src/modules/chatbot/chatbot.service.ts`

**Entrada:**

- `TASK-031` concluída (tipos disponíveis)
- `TASK-002` concluída (`db` disponível)
- `TASK-003` concluída (`AppError` disponível)

**Saída:**

```ts
export class ChatbotService {
  async getRootNode(): Promise<ChatNodeResponseDTO>;
  async getNodeById(id: number): Promise<ChatNodeResponseDTO>;
  // lança AppError('Nó não encontrado', 404) se id inexistente
  async createInteractionLog(
    dto: CreateInteractionLogDTO,
  ): Promise<{ interactionLogId: number }>;
}
```

---

#### TASK-033 · [BE] chatbot.controller.ts + chatbot.routes.ts

**Módulo:** `src/modules/chatbot/`
**Prioridade:** 🔴 Crítica
**Peso:** `3 pts`
**Rastreabilidade RF:** RF01 · RF07 · RF08
**Rastreabilidade RNF:** —

**Arquivos exclusivos desta task:**

- `apps/backend/src/modules/chatbot/chatbot.controller.ts`
- `apps/backend/src/modules/chatbot/chatbot.routes.ts`

**Entrada:**

- `TASK-032` concluída (`ChatbotService` disponível)

**Saída:**

- `GET /nodes/root` → `ChatbotService.getRootNode()`
- `GET /nodes/:id` → `ChatbotService.getNodeById(id)`
- `POST /sessions/log` → `ChatbotService.createInteractionLog(body)` com validação Zod

**Contrato de saída (HTTP):**

```
GET  /api/v1/nodes/root     → 200: { success: true, data: ChatNodeResponseDTO }
GET  /api/v1/nodes/:id      → 200: { success: true, data: ChatNodeResponseDTO }
                            → 404: { success: false, message: "Nó não encontrado" }
POST /api/v1/sessions/log → 201: { success: true, data: { interactionLogId: number } }
                             → 422: validação Zod
```

---

#### TASK-034 · [FE] chatbot.types.ts — tipos de navegação

**Módulo:** `src/features/chatbot/types/`
**Prioridade:** 🔴 Crítica
**Peso:** `2 pts`
**Rastreabilidade RF:** RF01 · RF02 · RF07 · RF08
**Rastreabilidade RNF:** —

**Arquivos exclusivos desta task:**

- `apps/frontend/src/features/chatbot/types/chatbot.types.ts`

**Entrada:**

- `TASK-013` concluída (tipos base disponíveis)

**Saída:**

```ts
export interface ChatNodeChild {
  id: number;
  title: string;
  slug: string;
  display_order: number;
}

export interface ChatNode {
  id: number;
  title: string;
  slug: string;
  prompt: string | null;
  answer_summary: string | null;
  evidence_excerpt: string | null;
  evidence_source: string | null;
  parent_id: number | null;
  display_order: number;
  is_active: boolean;
  children: ChatNodeChild[];
}

export interface ChatMessage {
  id: string;
  sender: "bot" | "user";
  text: string;
  nodeId?: number;
}

export interface SessionRatingPayload {
  navigation_flow: string[];
  flag: Satisfaction;
}
```

---

#### TASK-035 · [FE] chatbot.api.ts — chamadas de navegação

**Módulo:** `src/features/chatbot/api/`
**Prioridade:** 🔴 Crítica
**Peso:** `2 pts`
**Rastreabilidade RF:** RF01 · RF07 · RF08
**Rastreabilidade RNF:** —

**Arquivos exclusivos desta task:**

- `apps/frontend/src/features/chatbot/api/chatbot.api.ts`

**Entrada:**

- `TASK-014` concluída (instância `api`)
- `TASK-034` concluída (tipos disponíveis)

**Saída:**

```ts
export const chatbotApi = {
  getRootNode(): Promise<ChatNode>
  getNode(id: number): Promise<ChatNode>
  submitRating(payload: SessionRatingPayload): Promise<{ interactionLogId: number }>
}
```

---

#### TASK-036 · [FE] useChatNavigation.ts — hook de estado da sessão

**Módulo:** `src/features/chatbot/hooks/`
**Prioridade:** 🔴 Crítica
**Peso:** `5 pts`
**Rastreabilidade RF:** RF01 · RF07 · RF08
**Rastreabilidade RNF:** RNF02

**Arquivos exclusivos desta task:**

- `apps/frontend/src/features/chatbot/hooks/useChatNavigation.ts`

**Entrada:**

- `TASK-035` concluída (`chatbotApi` disponível)
- `TASK-014` concluída (`queryClient` disponível)

**Saída:**

- Hook que gerencia: nó atual, histórico de mensagens e caminho de navegação
- Usa `useQuery` para buscar o nó raiz na inicialização e cada nó filho ao clicar

**Contrato de saída (hook):**

```ts
export function useChatNavigation(): {
  currentNode: ChatNode | null;
  messages: ChatMessage[];
  navigation_flow: string[];
  isLoading: boolean;
  navigateTo: (nodeId: number) => void;
  resetSession: () => void;
};
```

---

#### TASK-037 · [FE] MessageBubble.tsx + OptionButton.tsx

**Módulo:** `src/features/chatbot/components/`
**Prioridade:** 🟡 Alta
**Peso:** `3 pts`
**Rastreabilidade RF:** RF01
**Rastreabilidade RNF:** RNF01

**Arquivos exclusivos desta task:**

- `apps/frontend/src/features/chatbot/components/MessageBubble.tsx`
- `apps/frontend/src/features/chatbot/components/OptionButton.tsx`

**Entrada:**

- `TASK-034` concluída (tipos `ChatMessage`, `ChatNodeChild`)
- Tailwind disponível
- `TASK-009` concluída (wireframes de referência disponíveis no Figma)

**Saída:**

- `MessageBubble`: renderiza uma mensagem do bot (alinhada à esquerda) ou do usuário (alinhada à direita) com estilo distinto
- `OptionButton`: botão clicável que exibe `child.title`, chama `onClick(child.id)` ao clicar

---

#### TASK-038 · [FE] EvidenceCard.tsx

**Módulo:** `src/features/chatbot/components/`
**Prioridade:** 🟡 Alta
**Peso:** `2 pts`
**Rastreabilidade RF:** RF02
**Rastreabilidade RNF:** RNF01

**Arquivos exclusivos desta task:**

- `apps/frontend/src/features/chatbot/components/EvidenceCard.tsx`

**Entrada:**

- `TASK-034` concluída (tipo `ChatNode`)
- `TASK-009` concluída (wireframe de referência disponível no Figma)

**Saída:**

- Componente que recebe `evidence_excerpt` e `evidence_source` do nó atual e exibe trecho + fonte quando existirem

---

#### TASK-039 · [FE] SatisfactionRating.tsx

**Módulo:** `src/features/chatbot/components/`
**Prioridade:** 🟡 Alta
**Peso:** `3 pts`
**Rastreabilidade RF:** RF07 · RF08
**Rastreabilidade RNF:** RNF01

**Arquivos exclusivos desta task:**

- `apps/frontend/src/features/chatbot/components/SatisfactionRating.tsx`

**Entrada:**

- `TASK-034` concluída (tipo `Satisfaction`)
- `TASK-035` concluída (`chatbotApi.submitRating`)
- `TASK-009` concluída (wireframe de referência disponível no Figma)

**Saída:**

- Componente com botões "👍 Gostei" e "👎 Não gostei"
- Recebe `navigation_flow: string[]`
- Ao clicar, chama `chatbotApi.submitRating()` e exibe confirmação

---

#### TASK-040 · [FE] ChatWindow.tsx — orquestrador do chatbot

**Módulo:** `src/features/chatbot/components/`
**Prioridade:** 🟡 Alta
**Peso:** `5 pts`
**Rastreabilidade RF:** RF01 · RF02 · RF07
**Rastreabilidade RNF:** RNF01

**Arquivos exclusivos desta task:**

- `apps/frontend/src/features/chatbot/components/ChatWindow.tsx`

**Entrada:**

- `TASK-036` concluída (`useChatNavigation`)
- `TASK-037` concluída (`MessageBubble`, `OptionButton`)
- `TASK-038` concluída (`EvidenceCard`)
- `TASK-039` concluída (`SatisfactionRating`)
- `TASK-009` concluída (wireframe de referência disponível no Figma)

**Saída:**

- Container principal da conversa
- Renderiza lista de `MessageBubble`
- Quando `currentNode.children.length > 0`: renderiza lista de `OptionButton`
- Quando `currentNode.children.length === 0`: renderiza `EvidenceCard` (se houver evidência) e `SatisfactionRating`

---

### ❓ Módulo Questions — Lado Público (Sprint 1)

---

#### TASK-041 · [BE] questions.types.ts — DTOs

**Módulo:** `src/modules/questions/`
**Prioridade:** 🟡 Alta
**Peso:** `1 pts`
**Rastreabilidade RF:** RF05 · RF08
**Rastreabilidade RNF:** —

**Arquivos exclusivos desta task:**

- `apps/backend/src/modules/questions/questions.types.ts`

**Entrada:**

- `TASK-004` concluída (modelo `Question` existe)

**Saída:**

```ts
export interface CreateQuestionDTO {
  requester_name: string;
  question: string;
  requester_email: string;
  attachment_name?: string | null;
  attachment_mime_type?: string | null;
  attachment_data?: Buffer | null;
}

export interface UpdateQuestionStatusDTO {
  status: "ABERTA" | "RESPONDIDA";
}

export interface QuestionResponseDTO {
  id: number;
  requester_name: string;
  question: string;
  requester_email: string;
  status: "ABERTA" | "RESPONDIDA";
  created_at: string;
  updated_at: string;
}
```

---

#### TASK-042 · [BE] questions.service.ts — criação de pergunta

**Módulo:** `src/modules/questions/`
**Prioridade:** 🟡 Alta
**Peso:** `2 pts`
**Rastreabilidade RF:** RF05 · RF08
**Rastreabilidade RNF:** —

**Arquivos exclusivos desta task:**

- `apps/backend/src/modules/questions/questions.service.ts`

**Entrada:**

- `TASK-041` concluída
- `TASK-002` concluída (`db`)

**Saída:**

```ts
export class QuestionsService {
  async createQuestion(dto: CreateQuestionDTO): Promise<QuestionResponseDTO>;
  // Sprint 3 — implementar depois:
  async listQuestions(filters: {
    status?: InquiryStatus;
    page: number;
    limit: number;
  }): Promise<{ data: QuestionResponseDTO[]; meta: PaginationMeta }>;
  async updateStatus(
    id: number,
    dto: UpdateQuestionStatusDTO,
  ): Promise<QuestionResponseDTO>;
}
```

> **Nota histórica da Sprint 1:** naquele momento, implementar apenas `createQuestion`. No código atual, listagem, atualização de status e download de anexos também estão implementados.

---

#### TASK-043 · [BE] questions.controller.ts + questions.routes.ts (POST público)

**Módulo:** `src/modules/questions/`
**Prioridade:** 🟡 Alta
**Peso:** `2 pts`
**Rastreabilidade RF:** RF05 · RF11
**Rastreabilidade RNF:** —

**Arquivos exclusivos desta task:**

- `apps/backend/src/modules/questions/questions.controller.ts`
- `apps/backend/src/modules/questions/questions.routes.ts`

**Entrada:**

- `TASK-042` concluída

**Saída:**

- `POST /questions` público, valida com Zod, chama `QuestionsService.createQuestion()`

**Contrato de saída (HTTP):**

```
POST /api/v1/questions
Body: { "requester_name": string, "question": string, "requester_email": string, "attachment"?: File }
→ 201: { "success": true, "data": QuestionResponseDTO }
→ 422: validação Zod
```

---

#### TASK-044 · [FE] QuestionForm.tsx — formulário de envio de pergunta

**Módulo:** `src/features/chatbot/components/`
**Prioridade:** 🟡 Alta
**Peso:** `3 pts`
**Rastreabilidade RF:** RF05 · RF08
**Rastreabilidade RNF:** RNF01

**Arquivos exclusivos desta task:**

- `apps/frontend/src/features/chatbot/components/QuestionForm.tsx`

**Entrada:**

- `TASK-035` concluída (`chatbotApi`) — ou criar função inline em `chatbot.api.ts`
- shadcn/ui instalado
- `TASK-009` concluída (wireframe de referência disponível no Figma)

**Saída:**

- Formulário com `requester_name` (input), `question` (textarea) e `requester_email` (input)
- Permite `attachment` opcional (PDF/JPG/PNG até 5MB)
- Exibe confirmação de envio após sucesso

---

### 🔗 Composição de Rotas (Backend)

---

#### TASK-045 · [BE] routes/index.ts — composição global de rotas

**Módulo:** `src/routes/`
**Prioridade:** 🔴 Crítica (deve ser atualizado a cada novo módulo)
**Peso:** `1 pts`
**Rastreabilidade RF:** RF01 · RF05 · RF09 · RF11
**Rastreabilidade RNF:** —

**Arquivos exclusivos desta task:**

- `apps/backend/src/routes/index.ts`

**Entrada:**

- `TASK-022`, `TASK-033`, `TASK-043` concluídas (módulos com `.routes.ts`)

**Saída:**

- Router Express que monta todos os módulos com prefixo `/api/v1`
- Registra o health check
- Importa e usa: `auth.routes`, `chatbot.routes`, `questions.routes`

> **Regra:** toda vez que uma nova task de routes for concluída (Sprint 2, Sprint 3), esta task é atualizada — mas apenas este arquivo.

---

### 📐 Modelagem — UML

---

#### TASK-046 · [UML] Diagrama de Classes — Astah

**Módulo:** Modelagem / Astah
**Prioridade:** 🟡 Alta
**Peso:** `5 pts`
**Rastreabilidade RF:** RF01 · RF02 · RF03 · RF04 · RF05 · RF07 · RF08 · RF09 · RF10 · RF11
**Rastreabilidade RNF:** —

**Arquivos exclusivos desta task:**

- `docs/uml/diagrama-de-classes.asta`
- `docs/uml/diagrama-de-classes.png`

**Entrada:**

- `TASK-010` concluída (Diagrama de Casos de Uso como base de rastreabilidade)
- Sprint 1 concluída (estrutura de módulos do backend estabilizada)
- `TASK-047`, `TASK-054`, `TASK-064` concluídas ou em andamento (DTOs e models definidos)

**Saída:**

- Diagrama de Classes exportado em `.asta` e `.png`
- Classes de domínio: `User`, `ChatNode`, `InteractionLog`, `Question`
- Services e Controllers representados com seus métodos públicos e assinaturas
- Visibilidades (`+`, `-`, `#`), tipos de atributos e retornos documentados
- Relacionamentos: associação, composição e dependência com multiplicidades

---

### 🌳 Módulo Nodes (Admin)

---

#### TASK-047 · [BE] nodes.types.ts — DTOs de nós

**Módulo:** `src/modules/nodes/`
**Prioridade:** 🔴 Crítica
**Peso:** `2 pts`
**Rastreabilidade RF:** RF04 · RF02
**Rastreabilidade RNF:** —

**Arquivos exclusivos desta task:**

- `apps/backend/src/modules/nodes/nodes.types.ts`

**Entrada:**

- `TASK-004` concluída (modelo `ChatNode`)

**Saída:**

```ts
export interface CreateNodeDTO {
  title: string;
  slug: string;
  prompt: string | null;
  answer_summary: string | null;
  evidence_excerpt: string | null;
  evidence_source: string | null;
  parent_id: number | null;
  display_order: number;
  is_active?: boolean;
}

export interface UpdateNodeDTO {
  title?: string;
  slug?: string;
  prompt?: string | null;
  answer_summary?: string | null;
  evidence_excerpt?: string | null;
  evidence_source?: string | null;
  parent_id?: number | null;
  display_order?: number;
  is_active?: boolean;
}

export interface NodeListItemDTO {
  id: number;
  title: string;
  slug: string;
  parent_id: number | null;
  display_order: number;
  is_active: boolean;
  childrenCount: number;
}
```

---

#### TASK-048 · [BE] nodes.service.ts — CRUD de nós

**Módulo:** `src/modules/nodes/`
**Prioridade:** 🔴 Crítica
**Peso:** `5 pts`
**Rastreabilidade RF:** RF04 · RF02
**Rastreabilidade RNF:** —

**Arquivos exclusivos desta task:**

- `apps/backend/src/modules/nodes/nodes.service.ts`

**Entrada:**

- `TASK-047` concluída
- `TASK-002` concluída (`db`)
- `TASK-003` concluída (`AppError`)

**Saída:**

```ts
export class NodesService {
  async listNodes(): Promise<NodeListItemDTO[]>;
  async getNodeById(id: number): Promise<ChatNodeResponseDTO>;
  async createNode(dto: CreateNodeDTO): Promise<NodeListItemDTO>;
  async updateNode(id: number, dto: UpdateNodeDTO): Promise<NodeListItemDTO>;
  async deleteNode(id: number): Promise<void>;
  // lança AppError('Nó possui filhos e não pode ser excluído', 409) se tiver filhos ativos
}
```

---

#### TASK-049 · [BE] nodes.controller.ts + nodes.routes.ts

**Módulo:** `src/modules/nodes/`
**Prioridade:** 🔴 Crítica
**Peso:** `3 pts`
**Rastreabilidade RF:** RF04 · RF10 · RF11
**Rastreabilidade RNF:** —

**Arquivos exclusivos desta task:**

- `apps/backend/src/modules/nodes/nodes.controller.ts`
- `apps/backend/src/modules/nodes/nodes.routes.ts`

**Entrada:**

- `TASK-048` concluída
- `TASK-023`, `TASK-024` concluídas (`authenticate`, `authorize`)

**Saída:**

- Todas as rotas protegidas com `authenticate + authorize('ADMIN')`

**Contrato de saída (HTTP):**

```
GET    /api/v1/nodes            → 200: { success: true, data: NodeListItemDTO[] }
POST   /api/v1/nodes            → 201: { success: true, data: NodeListItemDTO }
PATCH  /api/v1/nodes/:id        → 200: { success: true, data: NodeListItemDTO }
DELETE /api/v1/nodes/:id        → 200: { success: true }
                               → 409: { success: false, message: "Nó possui filhos..." }
```

---

#### TASK-050 · [FE] nodes.api.ts — chamadas CRUD

**Módulo:** `src/features/admin/api/`
**Prioridade:** 🔴 Crítica
**Peso:** `2 pts`
**Rastreabilidade RF:** RF04 · RF02
**Rastreabilidade RNF:** —

**Arquivos exclusivos desta task:**

- `apps/frontend/src/features/admin/api/nodes.api.ts`

**Entrada:**

- `TASK-014` concluída (`api`)

**Saída:**

```ts
export const nodesApi = {
  list(): Promise<NodeListItemDTO[]>
  getById(id: number): Promise<ChatNode>
  create(dto: CreateNodePayload): Promise<NodeListItemDTO>
  update(id: number, dto: Partial<CreateNodePayload>): Promise<NodeListItemDTO>
  remove(id: number): Promise<void>
}
```

---

#### TASK-051 · [FE] useNodes.ts — hook de gerenciamento de nós

**Módulo:** `src/features/admin/hooks/`
**Prioridade:** 🔴 Crítica
**Peso:** `3 pts`
**Rastreabilidade RF:** RF04 · RF02
**Rastreabilidade RNF:** —

**Arquivos exclusivos desta task:**

- `apps/frontend/src/features/admin/hooks/useNodes.ts`

**Entrada:**

- `TASK-050` concluída

**Saída:**

```ts
export function useNodes(): {
  nodes: NodeListItemDTO[];
  isLoading: boolean;
  createNode: (dto: CreateNodePayload) => Promise<void>;
  updateNode: (id: number, dto: Partial<CreateNodePayload>) => Promise<void>;
  deleteNode: (id: number) => Promise<void>;
};
```

---

#### TASK-052 · [FE] NodeTree.tsx — visualização hierárquica

**Módulo:** `src/features/admin/components/`
**Prioridade:** 🟡 Alta
**Peso:** `5 pts`
**Rastreabilidade RF:** RF04 · RF02
**Rastreabilidade RNF:** RNF01

**Arquivos exclusivos desta task:**

- `apps/frontend/src/features/admin/components/NodeTree.tsx`

**Entrada:**

- `TASK-051` concluída (`useNodes`)

**Saída:**

- Componente que renderiza a árvore de nós com indentação visual
- Cada item exibe: título, slug, botões de editar e excluir
- Aceita `onEdit(node)` e `onDelete(id)` como callbacks

---

#### TASK-053 · [FE] NodeEditor.tsx — formulário de criação/edição

**Módulo:** `src/features/admin/components/`
**Prioridade:** 🟡 Alta
**Peso:** `5 pts`
**Rastreabilidade RF:** RF04 · RF02
**Rastreabilidade RNF:** RNF01

**Arquivos exclusivos desta task:**

- `apps/frontend/src/features/admin/components/NodeEditor.tsx`

**Entrada:**

- `TASK-051` concluída (`createNode`, `updateNode`)
- shadcn/ui (Dialog, Form, Select)

**Saída:**

- Modal/Dialog com campos: título, slug, prompt, answer_summary, evidence_excerpt, evidence_source, nó pai (select), display_order, is_active (checkbox)
- Modo criação (sem `initialData`) e modo edição (com `initialData: NodeListItemDTO`)
- Chama `createNode` ou `updateNode` ao submeter

---

### 👤 Módulo Users (Admin)

---

#### TASK-054 · [BE] users.types.ts + users.service.ts + users.controller.ts + users.routes.ts

**Módulo:** `src/modules/users/`
**Prioridade:** 🟡 Alta
**Peso:** `5 pts`
**Rastreabilidade RF:** RF03 · RF04 · RF10 · RF11
**Rastreabilidade RNF:** —

**Arquivos exclusivos desta task:**

- `apps/backend/src/modules/users/users.types.ts`
- `apps/backend/src/modules/users/users.service.ts`
- `apps/backend/src/modules/users/users.controller.ts`
- `apps/backend/src/modules/users/users.routes.ts`

**Entrada:**

- `TASK-004`, `TASK-006` concluídas (`db`, `hashPassword`)
- `TASK-023`, `TASK-024` concluídas

**Contrato de saída (HTTP):**

```
GET    /api/v1/users       → 200: { success: true, data: UserResponseDTO[] }
POST   /api/v1/users       → 201: { success: true, data: UserResponseDTO }
  Body: { name, email, password, role: 'SECRETARIA' }
DELETE /api/v1/users/:id   → 200: { success: true }
  → 409 se tentar excluir o único admin
```

---

#### TASK-055 · [FE] users.api.ts + UserList.tsx

**Módulo:** `src/features/admin/`
**Prioridade:** 🟡 Alta
**Peso:** `3 pts`
**Rastreabilidade RF:** RF03 · RF04
**Rastreabilidade RNF:** RNF01

**Arquivos exclusivos desta task:**

- `apps/frontend/src/features/admin/api/users.api.ts`
- `apps/frontend/src/features/admin/components/UserList.tsx`

**Saída:**

- `users.api.ts`: `list()`, `create(dto)`, `remove(id)`
- `UserList`: tabela com nome, e-mail, role, data e botão excluir; modal de criação

---

### 🎨 Design — Figma

---

#### TASK-056 · [FIGMA] Mockups do painel Admin

**Módulo:** Design / Figma — Sprint 2 / Admin
**Prioridade:** 🟡 Alta
**Peso:** `8 pts`
**Rastreabilidade RF:** RF04
**Rastreabilidade RNF:** RNF01 · RNF04

**Arquivos exclusivos desta task:**

- `[Figma] Página "Sprint 2 / Admin"` — frames: AdminLayout, Dashboard, Nodes, Users

**Entrada:**

- `TASK-007` concluída (Design System e componentes base disponíveis no Figma)
- Fluxo de permissões e estrutura de dados do painel admin definidos em `application-overview.md`

**Saída:**

- Frame "AdminLayout" com sidebar (links para Nodes, Users, Logs), topbar com nome do usuário logado e botão de logout
- Frame "Dashboard" com cards de métricas: total de nós ativos, perguntas abertas e usuários cadastrados
- Frame "Nodes" com árvore hierárquica de nós, ações de editar/excluir por item e modal de criação/edição (campos: título, slug, prompt, answer_summary, evidence_excerpt, evidence_source, nó pai, display_order, is_active)
- Frame "Users" com tabela listando nome, e-mail e role, botão de excluir e modal de criação de usuário secretária
- Handoff referenciado pelas tasks `TASK-057` (AdminLayout) e `TASK-058` (Páginas Admin)

---

### 🖥️ Layouts e Páginas Admin

---

#### TASK-057 · [FE] AdminLayout.tsx + PublicLayout.tsx

**Módulo:** `src/components/layout/`
**Prioridade:** 🔴 Crítica
**Peso:** `3 pts`
**Rastreabilidade RF:** RF03 · RF04
**Rastreabilidade RNF:** RNF01

**Arquivos exclusivos desta task:**

- `apps/frontend/src/components/layout/AdminLayout.tsx`
- `apps/frontend/src/components/layout/PublicLayout.tsx`

**Entrada:**

- `TASK-026` concluída (`useAuthStore` para dados do usuário logado)
- `TASK-056` concluída (mockups de referência disponíveis no Figma)

**Saída:**

- `AdminLayout`: sidebar com links para `/admin/nodes`, `/admin/users`, `/admin/logs` + topbar com nome do usuário e botão logout
- `PublicLayout`: layout minimalista centralizado para o chatbot público

---

#### TASK-058 · [FE] Páginas do painel Admin

**Módulo:** `src/app/routes/admin/`
**Prioridade:** 🟡 Alta
**Peso:** `5 pts`
**Rastreabilidade RF:** RF03 · RF04
**Rastreabilidade RNF:** RNF01

**Arquivos exclusivos desta task:**

- `apps/frontend/src/app/routes/admin/dashboard.tsx`
- `apps/frontend/src/app/routes/admin/nodes.tsx`
- `apps/frontend/src/app/routes/admin/users.tsx`

**Entrada:**

- `TASK-057` concluída (`AdminLayout`)
- `TASK-052`, `TASK-053` concluídas (componentes de nós)
- `TASK-055` concluída (componentes de usuários)
- `TASK-056` concluída (mockups de referência disponíveis no Figma)

**Saída:**

- Cada página é um componente que envolve `AdminLayout` e o componente de feature correspondente
- `dashboard.tsx`: cards com contagem de nós, perguntas abertas e usuários
- `nodes.tsx`: `NodeTree` + `NodeEditor`
- `users.tsx`: `UserList`

---

### 📐 Modelagem — UML (Finalização)

---

#### TASK-059 · [UML] Diagrama de Sequência — Astah

**Módulo:** Modelagem / Astah
**Prioridade:** 🟡 Alta
**Peso:** `3 pts`
**Rastreabilidade RF:** RF01 · RF03 · RF05 · RF07 · RF09
**Rastreabilidade RNF:** —

**Arquivos exclusivos desta task:**

- `docs/uml/diagrama-de-sequencia.asta`
- `docs/uml/diagrama-de-sequencia.png`

**Entrada:**

- `TASK-046` concluída (Diagrama de Classes como referência estrutural)
- Fluxos principais implementados e validados (Sprints 1 e 2 concluídas)

**Saída:**

- Diagramas de Sequência exportados em `.asta` e `.png` cobrindo os fluxos:
  1. **Navegação no Chatbot** — Aluno → ChatWindow → chatbotApi → Backend → DB
  2. **Autenticação** — Usuário → LoginForm → useLogin → AuthService → JWT → redirect
  3. **Envio de Pergunta** — Aluno → QuestionForm → QuestionsService → DB → confirmação
- Lifelines, mensagens síncronas/assíncronas e retornos documentados em cada diagrama

---

#### TASK-060 · [UML] Diagrama de Atividades — Astah

**Módulo:** Modelagem / Astah
**Prioridade:** 🟡 Alta
**Peso:** `3 pts`
**Rastreabilidade RF:** RF01 · RF05 · RF06 · RF07 · RF08
**Rastreabilidade RNF:** —

**Arquivos exclusivos desta task:**

- `docs/uml/diagrama-de-atividades.asta`
- `docs/uml/diagrama-de-atividades.png`

**Entrada:**

- `TASK-059` concluída (Diagrama de Sequência como referência de fluxo)

**Saída:**

- Diagramas de Atividades exportados em `.asta` e `.png` para os processos:
  1. **Fluxo de atendimento do Chatbot** — do primeiro acesso até a avaliação de satisfação (RF01–RF08)
  2. **Gestão de Perguntas pela Secretária** — recebimento, triagem e marcação como respondida (RF05–RF06)
- Swimlanes separando responsabilidades por ator (Aluno, Sistema, Secretária)
- Nós de decisão, bifurcação e junção documentados com condições de guarda

---

### ❓ Módulo Questions — Lado Secretária

---

#### TASK-061 · [BE] questions.service.ts — extensão para listagem e status

**Módulo:** `src/modules/questions/` (extensão de `TASK-042`)
**Prioridade:** 🔴 Crítica
**Peso:** `2 pts`
**Rastreabilidade RF:** RF05 · RF08
**Rastreabilidade RNF:** —

**Arquivos exclusivos desta task:**

- `apps/backend/src/modules/questions/questions.service.ts` _(adicionar métodos `listQuestions` e `updateStatus`)_

**Entrada:**

- `TASK-042` concluída (service com `createQuestion` já existe)

**Saída:**

- `listQuestions(filters)`: filtra por `status`, suporta paginação `?page&limit`
- `updateStatus(id, dto)`: altera `status` para `RESPONDIDA`; lança `AppError(404)` se não encontrado

---

#### TASK-062 · [BE] questions.controller.ts + questions.routes.ts — rotas protegidas

**Módulo:** `src/modules/questions/` (extensão de `TASK-043`)
**Prioridade:** 🔴 Crítica
**Peso:** `2 pts`
**Rastreabilidade RF:** RF05 · RF11
**Rastreabilidade RNF:** —

**Arquivos exclusivos desta task:**

- `apps/backend/src/modules/questions/questions.controller.ts` _(adicionar handlers GET e PATCH)_
- `apps/backend/src/modules/questions/questions.routes.ts` _(adicionar rotas protegidas)_

**Entrada:**

- `TASK-061` concluída
- `TASK-023`, `TASK-024` concluídas

**Contrato de saída (HTTP):**

```
GET   /api/v1/questions?status=ABERTA&page=1&limit=20
      Authorization: Bearer <SECRETARIA|ADMIN>
→ 200: { success: true, data: QuestionResponseDTO[], meta: PaginationMeta }

PATCH /api/v1/questions/:id
      Authorization: Bearer <SECRETARIA|ADMIN>
      Body: { "status": "RESPONDIDA" }
→ 200: { success: true, data: QuestionResponseDTO }
→ 404: { success: false, message: "Pergunta não encontrada" }
```

---

#### TASK-063 · [FE] questions.api.ts — chamadas para secretária

**Módulo:** `src/features/secretary/api/`
**Prioridade:** 🔴 Crítica
**Peso:** `2 pts`
**Rastreabilidade RF:** RF06
**Rastreabilidade RNF:** —

**Arquivos exclusivos desta task:**

- `apps/frontend/src/features/secretary/api/questions.api.ts`

**Entrada:**

- `TASK-014` concluída
- `TASK-062` concluída (endpoints disponíveis)

**Saída:**

```ts
export const questionsApi = {
  list(params: { status?: InquiryStatus; page?: number; limit?: number }): Promise<PaginatedResponse<QuestionResponseDTO>>
  updateStatus(id: number, status: InquiryStatus): Promise<QuestionResponseDTO>
}
```

---

#### TASK-064 · [FE] useQuestions.ts — hook de perguntas

**Módulo:** `src/features/secretary/hooks/`
**Prioridade:** 🔴 Crítica
**Peso:** `3 pts`
**Rastreabilidade RF:** RF06
**Rastreabilidade RNF:** —

**Arquivos exclusivos desta task:**

- `apps/frontend/src/features/secretary/hooks/useQuestions.ts`

**Entrada:**

- `TASK-063` concluída
- `TASK-018` concluída (`usePagination`)

**Saída:**

```ts
export function useQuestions(statusFilter?: InquiryStatus): {
  questions: QuestionResponseDTO[];
  meta: PaginationMeta | null;
  isLoading: boolean;
  updateStatus: (id: number, status: InquiryStatus) => Promise<void>;
  page: number;
  setPage: (n: number) => void;
};
```

---

#### TASK-065 · [FE] QuestionsTable.tsx + StatusBadge.tsx

**Módulo:** `src/features/secretary/components/`
**Prioridade:** 🟡 Alta
**Peso:** `3 pts`
**Rastreabilidade RF:** RF06
**Rastreabilidade RNF:** RNF01

**Arquivos exclusivos desta task:**

- `apps/frontend/src/features/secretary/components/QuestionsTable.tsx`
- `apps/frontend/src/features/secretary/components/StatusBadge.tsx`

**Entrada:**

- `TASK-064` concluída (`useQuestions`)

**Saída:**

- `StatusBadge`: chip visual com cor distinta para `ABERTA` (amarelo) e `RESPONDIDA` (verde)
- `QuestionsTable`: tabela com colunas texto, e-mail, status, data e ação "Marcar como respondida"

---

### 📊 Módulo Logs (Admin/Secretaria)

---

#### TASK-066 · [BE] logs.types.ts + logs.service.ts + logs.controller.ts + logs.routes.ts

**Módulo:** `src/modules/logs/`
**Prioridade:** 🟡 Alta
**Peso:** `5 pts`
**Rastreabilidade RF:** RF04 · RF08 · RF10 · RF11
**Rastreabilidade RNF:** —

**Arquivos exclusivos desta task:**

- `apps/backend/src/modules/logs/logs.types.ts`
- `apps/backend/src/modules/logs/logs.service.ts`
- `apps/backend/src/modules/logs/logs.controller.ts`
- `apps/backend/src/modules/logs/logs.routes.ts`

**Entrada:**

- `TASK-002`, `TASK-003`, `TASK-023`, `TASK-024` concluídas

**Contrato de saída (HTTP):**

```
GET /api/v1/logs?flag=NAO_ATENDEU&from=ISO&to=ISO&page=1&limit=20
    Authorization: Bearer <ADMIN>
→ 200: {
    "success": true,
    "data": InteractionLogDTO[],
    "meta": PaginationMeta
  }
```

---

#### TASK-067 · [FE] logs.api.ts + useLogs.ts + LogTable.tsx

**Módulo:** `src/features/admin/`
**Prioridade:** 🟡 Alta
**Peso:** `5 pts`
**Rastreabilidade RF:** RF04 · RF08
**Rastreabilidade RNF:** RNF01

**Arquivos exclusivos desta task:**

- `apps/frontend/src/features/admin/api/logs.api.ts`
- `apps/frontend/src/features/admin/hooks/useLogs.ts`
- `apps/frontend/src/features/admin/components/LogTable.tsx`

**Entrada:**

- `TASK-066` concluída
- `TASK-016` concluída (`date.utils.ts`)

**Saída:**

- `logs.api.ts`: `list(params)` com filtros por `flag`, intervalo de datas e paginação
- `useLogs`: hook com `useQuery`, expõe filtros e paginação
- `LogTable`: tabela com caminho de navegação (resumido), avaliação (`flag`) e perguntas vinculadas

---

### 🎨 Design — Figma

---

#### TASK-068 · [FIGMA] Mockups do painel Secretária

**Módulo:** Design / Figma — Sprint 3 / Secretary
**Prioridade:** 🟡 Alta
**Peso:** `5 pts`
**Rastreabilidade RF:** RF06 · RF08
**Rastreabilidade RNF:** RNF01 · RNF04

**Arquivos exclusivos desta task:**

- `[Figma] Página "Sprint 3 / Secretary"` — frames: SecretaryDashboard, Questions, LogsAdmin

**Entrada:**

- `TASK-007` concluída (Design System disponível)
- `TASK-056` concluída (padrões visuais do painel admin reutilizáveis no Figma)

**Saída:**

- Frame "SecretaryDashboard" com cards de contadores: total de perguntas abertas e total de perguntas respondidas
- Frame "Questions" com tabela filtrável por status (ABERTA/RESPONDIDA), incluindo componente StatusBadge em suas variantes de cor e ação "Marcar como respondida" por linha
- Frame "LogsAdmin" com tabela de sessões exibindo caminho de navegação resumido, ícone de satisfação, duração e perguntas vinculadas; filtros de data e satisfação no topo
- Handoff referenciado pela task `TASK-069` (Páginas Secretária + Logs)

---

### 🖥️ Páginas Secretária + Logs

---

#### TASK-069 · [FE] Páginas do painel Secretária + Logs Admin

**Módulo:** `src/app/routes/`
**Prioridade:** 🟡 Alta
**Peso:** `3 pts`
**Rastreabilidade RF:** RF06 · RF08
**Rastreabilidade RNF:** RNF01

**Arquivos exclusivos desta task:**

- `apps/frontend/src/app/routes/secretary/dashboard.tsx`
- `apps/frontend/src/app/routes/secretary/questions.tsx`
- `apps/frontend/src/app/routes/admin/logs.tsx`

**Entrada:**

- `TASK-057` concluída (`AdminLayout`)
- `TASK-065` concluída (`QuestionsTable`)
- `TASK-067` concluída (`LogTable`)
- `TASK-068` concluída (mockups de referência disponíveis no Figma)

**Saída:**

- `secretary/dashboard.tsx`: cards com total de perguntas abertas e respondidas
- `secretary/questions.tsx`: `QuestionsTable` com filtro de status
- `admin/logs.tsx`: `LogTable` com filtros de data e satisfação

---

> **Convenção de commits:** `feat(task-001): bootstrap Express app`
> Cada commit deve referenciar o ID da task para rastreabilidade no backlog.

---

## Detalhamento das Tasks Novas

### TASK-070 — Tipagem de handlers de questions para build dts

**Tipo:** 🟣 BE · **Módulo:** Questions · **Prioridade:** 🟡 Alta · **Pts:** 2

**Entrada:** build do backend falha no `tsup --dts` por tipos inferidos nos handlers de `/questions`.

**Saída:** handlers tipados com `Request/Response/NextFunction` e build passando com `pnpm --filter backend build`.

**Arquivos:** `apps/backend/src/modules/questions/questions.controller.ts`, `apps/backend/src/modules/questions/questions.routes.ts`

---

### TASK-071 — Ajuste do ignoreDeprecations no tsconfig.app

**Tipo:** 🔵 FE · **Módulo:** Infra · **Prioridade:** 🟡 Alta · **Pts:** 1

**Entrada:** `ignoreDeprecations` inválido quebra o build do frontend.

**Saída:** `ignoreDeprecations` com valor compatível com o TypeScript do projeto.

**Arquivos:** `apps/frontend/tsconfig.app.json`

---

### TASK-072 — Vínculo de pergunta com sessão (session_log_id)

**Tipo:** ⚙️ INFRA · **Módulo:** Questions · **Prioridade:** 🔴 Crítica · **Pts:** 8

**Entrada:** perguntas não carregam `session_log_id`, impedindo rastreabilidade da sessão.

**Saída:** `session_log_id` persistido em Question e enviado pelo frontend ao criar pergunta.

**Arquivos:** `apps/backend/prisma/schema.prisma`, `apps/backend/src/modules/questions/questions.types.ts`, `apps/backend/src/modules/questions/questions.service.ts`, `apps/backend/src/modules/questions/questions.controller.ts`, `apps/frontend/src/features/chatbot/types/chatbot.types.ts`, `apps/frontend/src/features/chatbot/hooks/useSubmitQuestion.ts`, `apps/frontend/src/features/chatbot/components/QuestionForm.tsx`

---

### TASK-073 — Alinhar status de Question com backend

**Tipo:** 🔵 FE · **Módulo:** Questions · **Prioridade:** 🟡 Alta · **Pts:** 3

**Entrada:** frontend usa status divergentes do backend (`pending/answered/archived`).

**Saída:** tipos alinhados a `ABERTA/RESPONDIDA` e testes ajustados.

**Arquivos:** `apps/frontend/src/features/chatbot/types/chatbot.types.ts`, `apps/frontend/src/types/common.types.ts`, `apps/frontend/src/features/chatbot/components/QuestionForm.test.tsx`

---

### TASK-074 — Remover any explícito em utils de paginação

**Tipo:** 🟣 BE · **Módulo:** Infra · **Prioridade:** 🟢 Média · **Pts:** 2

**Entrada:** `any` explícito em utilitário de paginação viola padrão de tipos.

**Saída:** assinatura do utilitário tipada sem `any`, mantendo comportamento.

**Arquivos:** `apps/backend/src/utils/pagination.utils.ts`

---

### TASK-075 — Remover non-null assertions em produção

**Tipo:** 🔵 FE · **Módulo:** Infra · **Prioridade:** 🟢 Média · **Pts:** 2

**Entrada:** non-null assertions presentes em código de produção.

**Saída:** guardas explícitas para DOM e navegação sem `!`.

**Arquivos:** `apps/frontend/src/main.tsx`, `apps/frontend/src/features/chatbot/hooks/useChatNavigation.ts`

---

### TASK-076 — Integrar EvidenceCard em respostas folha

**Tipo:** 🔵 FE · **Módulo:** Chatbot · **Prioridade:** 🟢 Média · **Pts:** 3

**Entrada:** EvidenceCard existe, mas não está integrado ao fluxo do chatbot.

**Saída:** nós folha exibem EvidenceCard quando houver evidência.

**Arquivos:** `apps/frontend/src/features/chatbot/components/EvidenceCard.tsx`, `apps/frontend/src/features/chatbot/components/ChatWindow.tsx`

---

### TASK-077 — Testes de fluxo de autenticação

**Tipo:** 🟣 BE · **Módulo:** Auth · **Prioridade:** 🟡 Alta · **Pts:** 5

**Entrada:** fluxo de autenticação sem testes de regressão.

**Saída:** testes cobrindo login, token inválido/expirado e RBAC básico.

**Arquivos:** novos testes em `apps/backend/src/modules/auth/` (seguindo padrão do projeto)

---

### TASK-078 — Testes de fluxo do chatbot

**Tipo:** 🟣 BE · **Módulo:** Chatbot · **Prioridade:** 🟡 Alta · **Pts:** 5

**Entrada:** navegação e sessão sem cobertura de fluxo completo.

**Saída:** testes de navegação por nós, nó folha e registro de sessão.

**Arquivos:** novos testes em `apps/backend/src/modules/chatbot/` (seguindo padrão do projeto)

---

### TASK-079 — Testes de fluxo de perguntas

**Tipo:** 🟣 BE · **Módulo:** Questions · **Prioridade:** 🟡 Alta · **Pts:** 5

**Entrada:** criação, vínculo e atualização de perguntas sem testes end-to-end.

**Saída:** testes cobrindo criação pública, vínculo com sessão, listagem e atualização de status.

**Arquivos:** novos testes em `apps/backend/src/modules/questions/` (seguindo padrão do projeto)

---

### TASK-080 — Testes de navegação do chatbot

**Tipo:** 🔵 FE · **Módulo:** Chatbot · **Prioridade:** 🟡 Alta · **Pts:** 5

**Entrada:** fluxo do chatbot no frontend sem cobertura de interação real.

**Saída:** testes cobrindo seleção de opções, nó folha, avaliação e reset.

**Arquivos:** novos testes em `apps/frontend/src/features/chatbot/` (seguindo padrão do projeto)

---

### TASK-081 — Testes do formulário de login

**Tipo:** 🔵 FE · **Módulo:** Auth · **Prioridade:** 🟢 Média · **Pts:** 3

**Entrada:** formulário de login sem testes de sucesso e erro.

**Saída:** testes de validação, submissão e redirecionamento por role.

**Arquivos:** novos testes em `apps/frontend/src/features/auth/` (seguindo padrão do projeto)

---

### TASK-082 — Documentação técnica do projeto

**Tipo:** 📄 DOCS · **Módulo:** Docs · **Prioridade:** ⚪ Baixa · **Pts:** 2

**Entrada:** documentação técnica fragmentada e sem consolidação.

**Saída:** documentação técnica padronizada com visão arquitetural e contratos atualizados.

**Arquivos:** artefatos de documentação técnica da sprint (sem especificação de caminhos).

---

### TASK-083 — Documentação de sprint

**Tipo:** 📄 DOCS · **Módulo:** Docs · **Prioridade:** ⚪ Baixa · **Pts:** 2

**Entrada:** sprint sem registro formal de decisões e evidências.

**Saída:** documentação de sprint com objetivos, entregas e referências de demonstração.

**Arquivos:** artefatos de documentação de sprint (sem especificação de caminhos).
