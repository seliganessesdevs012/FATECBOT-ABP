## Estrutura do Projeto

Este documento descreve a estrutura atual do monorepo FatecBot e as responsabilidades de cada pasta.

***

## Visao Geral

```text
fatecbot/
├── apps/
│   ├── backend/
│   └── frontend/
├── docs/
├── docker-compose.yml
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
└── README.md
```

***

## Apps

### apps/backend

```text
apps/backend/
├── Dockerfile
├── package.json
├── prisma/
│   └── schema.prisma
├── prisma.config.ts
├── README.md
├── src/
│   ├── config/
│   ├── errors/
│   ├── middlewares/
│   ├── modules/
│   │   ├── auth/
│   │   ├── chatbot/
│   │   ├── dashboard/
│   │   ├── logs/
│   │   ├── nodes/
│   │   ├── questions/
│   │   └── users/
│   ├── routes/
│   ├── utils/
│   ├── index.ts
│   └── server.ts
└── tsconfig.json
```

Responsabilidades principais:
- Expor API REST em `/api/v1`
- Implementar autenticacao e autorizacao por papel
- Persistir dados via Prisma

### apps/frontend

```text
apps/frontend/
├── Dockerfile
├── package.json
├── README.md
├── src/
│   ├── app/
│   │   └── routes/
│   │       ├── admin/
│   │       └── secretary/
│   ├── assets/
│   ├── components/
│   │   ├── shared/
│   │   └── ui/
│   ├── config/
│   ├── features/
│   │   ├── admin/
│   │   ├── auth/
│   │   ├── chatbot/
│   │   └── secretary/
│   ├── hooks/
│   ├── lib/
│   ├── types/
│   ├── utils/
│   ├── index.css
│   └── main.tsx
├── vite.config.ts
└── tsconfig.json
```

Responsabilidades principais:
- Entregar chatbot publico
- Entregar paineis de admin e secretaria
- Consumir API do backend

***

## Documentacao

```text
docs/
├── README.md
├── first-steps.md
├── application-overview.md
├── project-structure.md
├── project-standards.md
├── api-layer.md
├── assets/
├── sprint1/
├── sprint2/
└── sprint3/
```

Regras:
- Setup operacional canônico: `docs/first-steps.md`
- Contrato HTTP canônico: `docs/api-layer.md`
- Padrões de contribuicao: `docs/project-standards.md`

***

## Convencoes de Organizacao

- `apps/backend/src/modules/`: modulos de dominio do backend
- `apps/frontend/src/features/`: modulos de dominio do frontend
- `docs/sprint*/`: planejamento operacional de sprint

***

> Proximo documento: [project-standards.md](./project-standards.md)
