# ⚙️ features/admin — Gestão de Conteúdo

> Feature responsável por toda a interface e lógica do painel administrativo.
> Cobre o CRUD de nós de navegação, usuários da secretaria
> e a visualização de logs de atendimento (RF04, RF08).

> **Estado atual:** dashboard, nós, usuários, tickets e logs possuem APIs/componentes funcionais. `documents.api.ts` e `useDocuments.ts` existem como arquivos vazios e não estão integrados ao roteador atual.

***

## 📑 Índice

- [Responsabilidade](#responsabilidade)
- [Estrutura de Arquivos](#estrutura)
- [Camadas](#camadas)
- [Mapeamento por Requisito](#requisitos)
- [Regras de Contribuição](#regras)

***

## 🎯 Responsabilidade <a id="responsabilidade"></a>

Esta feature é o coração do painel administrativo. Ela encapsula **tudo** que o
administrador precisa para manter o sistema funcionando: desde criar um novo nó
de navegação até visualizar os logs de atendimento gerados pelo chatbot.

Nenhuma lógica desta feature vaza para fora — os componentes de página em
`app/routes/admin/` apenas importam daqui e compõem o layout.

***

## 📁 Estrutura de Arquivos <a id="estrutura"></a>

```
features/admin/
├── api/                        # Funções de acesso à API REST
│   ├── nodes.api.ts            # GET, POST, PATCH, DELETE /nodes
│   ├── users.api.ts            # GET, POST, DELETE /users
│   ├── tickets.api.ts          # GET, PATCH /questions + download de anexo
│   ├── dashboard.api.ts        # GET /dashboard/metrics
│   ├── documents.api.ts        # Vazio no estado atual
│   └── logs.api.ts             # GET /logs
│
├── components/                 # Componentes visuais exclusivos do admin
│   ├── AdminDashboardOverview.tsx
│   ├── NodeTree.tsx
│   ├── NodeInspector.tsx
│   ├── NodeEditor.tsx
│   ├── UserList.tsx
│   ├── TicketList.tsx
│   └── LogTable.tsx
│
└── hooks/                      # Hooks de dados com TanStack Query
    ├── useAdminDashboard.ts    # useQuery para métricas do dashboard
    ├── useNodes.ts             # useQuery + useMutation para nós
    ├── useTickets.ts           # useQuery para tickets
    ├── useUpdateTicket.ts      # useMutation para status de tickets
    ├── useDocuments.ts         # Vazio no estado atual
    └── useLogs.ts              # useQuery para logs (somente leitura)
```

***

## 🧱 Camadas <a id="camadas"></a>

### api/

Funções puras que chamam os endpoints do backend via Axios. **Não usam hooks** —
retornam Promises diretamente para serem consumidas pelos hooks do TanStack Query.

```ts
// ✅ Padrão adotado em api/
export const nodesApi = {
  list: () => api.get<ApiResponse<NodeListItemDTO[]>>('/nodes').then(res => res.data.data),
  create: (data: CreateNodePayload) => api.post<ApiResponse<NodeListItemDTO>>('/nodes', data).then(res => res.data.data),
  update: (id: number, data: UpdateNodePayload) => api.patch<ApiResponse<NodeListItemDTO>>(`/nodes/${id}`, data).then(res => res.data.data),
  remove: (id: number) => api.delete(`/nodes/${id}`),
}

// ❌ Nunca use axios diretamente nos hooks ou componentes
```

### hooks/

Encapsulam as chamadas de `api/` em hooks do TanStack Query. São a **única fonte
de dados** para os componentes desta feature — nenhum componente chama `api/`
diretamente.

```ts
// ✅ Padrão adotado em hooks/
export function useNodes() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['nodes'],
    queryFn: nodesApi.list,
  })

  const createNodeMutation = useMutation({
    mutationFn: nodesApi.create,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['nodes'] })
    },
  })

  return {
    nodes: query.data ?? [],
    isLoading: query.isLoading || createNodeMutation.isPending,
    createNode: async dto => {
      await createNodeMutation.mutateAsync(dto)
    },
  }
}
```

### components/

Componentes React que consomem os hooks e renderizam a interface. Cada subpasta
representa um domínio visual independente com seu próprio `index.tsx`.

```tsx
// ✅ Componente correto — consome hook, não chama api/ diretamente
export function NodeForm({ onSuccess }: NodeFormProps) {
  const { createNode, isLoading } = useNodes()
  // ...
}
```

***

## 📋 Mapeamento por Requisito <a id="requisitos"></a>

| Requisito | Funcionalidade                         | Hook       | Componente              |
| --------- | -------------------------------------- | ---------- | ----------------------- |
| **RF04**  | CRUD de nós de navegação               | `useNodes` | `NodeTree`, `NodeEditor`, `NodeInspector` |
| **RF04**  | Criar e remover usuários internos      | TanStack Query no componente | `UserList` |
| **RF05/RF06** | Gerenciar tickets/perguntas        | `useTickets`, `useUpdateTicket` | `TicketList` |
| **RF08**  | Visualizar logs de atendimento         | `useLogs`  | `LogTable`              |
| **RF08**  | Métricas agregadas do painel           | `useAdminDashboard` | `AdminDashboardOverview` |

***

## 📐 Regras de Contribuição <a id="regras"></a>

- **Todo novo endpoint** de admin ganha um arquivo próprio em `api/` — nunca adicione funções em arquivos existentes de outro domínio
- **Todo acesso a dados** passa por um hook em `hooks/` — componentes **nunca** importam de `api/` diretamente
- Componentes desta feature **não importam** de outras features — se precisar de algo compartilhado, mova para `components/shared/`
- Após qualquer mutation bem-sucedida, **invalide o queryKey** correspondente para manter o cache sincronizado
- Formulários devem usar validação client-side com Zod antes de disparar a mutation

***

> _Este README deve ser atualizado sempre que um novo domínio de gestão
> for adicionado ao painel administrativo._

> _Próximo documento: [`../../../README.md`](../../../README.md)_
