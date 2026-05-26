---
applyTo: "apps/frontend/**"
---


# Regras do Frontend — FatecBot


## Organização por feature
Todo código novo de domínio vai em `src/features/<dominio>/`:
- `api/` — funções de chamada HTTP (Axios)
- `components/` — componentes visuais da feature
- `hooks/` — hooks que encapsulam lógica
- `types/` — tipos e interfaces do domínio


## Regras obrigatórias
- Dados da API: SEMPRE TanStack Query (`useQuery`, `useMutation`) — nunca useEffect + fetch manual
- Estado do cliente (token, user, role): SEMPRE Zustand em `features/auth/stores/auth.store.ts`
- Imports entre features: SEMPRE via alias `@/features/...` — nunca caminho relativo profundo
- Componentes `src/components/ui/`: NÃO editar diretamente — criar wrapper em `components/shared/`
- Proteção de rota: `ProtectedRoute` para autenticação, `RoleGuard` para role


## Referência técnica
Para decidir Query vs Zustand: docs/state-management.md
Para rotas disponíveis e roles: apps/frontend/README.md
Para padrões de código e commits: docs/project-standards.md
Para estrutura de pastas: docs/project-structure.md
Para variáveis de ambiente: apps/frontend/README.md
Para contrato de tasks: .github/tasks-instructions.md