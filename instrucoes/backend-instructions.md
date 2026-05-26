---
applyTo: "apps/backend/**"
---


# Regras do Backend — FatecBot


## Arquitetura de módulos
Cada módulo em `src/modules/<dominio>/` segue SEMPRE essa estrutura:
- `<dominio>.controller.ts` — recebe req/res, delega ao service
- `<dominio>.service.ts` — lógica de negócio, acesso via Prisma
- `<dominio>.routes.ts` — define rotas e aplica middlewares
- `<dominio>.types.ts` — DTOs e tipos do módulo


## Regras obrigatórias
- Erros de negócio: `throw new AppError('mensagem', statusCode)`
- Validação de request body: sempre com schema Zod antes do controller
- Rotas protegidas: `authenticate` + `authorize('ADMIN' | 'SECRETARIA')`
- Senhas: Argon2id via `hash.util.ts` — nunca bcrypt ou md5
- Resposta de sucesso: `{ success: true, data: {} }`
- Resposta de erro: `{ success: false, message: '', errors?: [] }`
- Paginação: query params `?page=1&limit=20`, retornar `meta: { total, page, limit }`


## Referência técnica
Para contratos de API (request/response): docs/api-layer.md
Para modelo de dados (entidades, relações): docs/application-overview.md
Para padrões de código e commits: docs/project-standards.md
Para estrutura de pastas: docs/project-structure.md
Para variáveis de ambiente: apps/backend/README.md
Para dados iniciais do banco: docs/first-steps.md
Para backend setup: apps/backend/README.md
Para contrato de tasks: .github/tasks-instructions.md
