# 🌳 modules/nodes — Nós de Navegação

> Módulo responsável pelo CRUD completo da árvore de navegação do chatbot.
> Cada nó representa um menu, submenu ou resposta final que o usuário
> percorre durante o atendimento (RF02, RF04).
> Acesso restrito ao Administrador.

***

## 📑 Índice

- [Responsabilidade](#responsabilidade)
- [Estrutura de Arquivos](#estrutura)
- [Camadas](#camadas)
- [Modelo de dados](#modelo)
- [Tipos de nó](#tipos)
- [Endpoints](#endpoints)
- [Regras de Contribuição](#regras)

***

## 🎯 Responsabilidade <a id="responsabilidade"></a>

Este módulo permite ao Administrador construir e manter a árvore de
navegação que o chatbot usa para guiar o usuário. A **leitura pública**
dos nós — consumida pelo frontend durante o atendimento — é responsabilidade
de `modules/chatbot/`, não deste módulo.

| Responsabilidade | Arquivo |
| ---------------- | ------- |
| CRUD de nós de navegação | `nodes.routes.ts` |
| Lógica de criação, edição e remoção | `nodes.service.ts` |
| Receber requests e formatar respostas | `nodes.controller.ts` |
| Tipagem dos DTOs e responses | `nodes.types.ts` |

***

## 📁 Estrutura de Arquivos <a id="estrutura"></a>

```
modules/nodes/
├── nodes.controller.ts  # Recebe req, chama service, devolve resposta HTTP
├── nodes.service.ts     # Lógica de CRUD e validações de integridade da árvore
├── nodes.routes.ts      # Define rotas protegidas (🔒 ADMIN)
└── nodes.types.ts       # CreateNodeDto, UpdateNodeDto, NodeResponse
```

***

## 🧱 Camadas <a id="camadas"></a>

### nodes.routes.ts

Todas as rotas são protegidas por `authenticate` + `authorize('ADMIN')`.
Bodies de `POST` e `PATCH` são validados com Zod antes de chegar ao controller:

```ts
router.use(authenticate)
router.use(authorize('ADMIN'))

router.get('/', nodesController.getAll)
router.post('/', nodesController.create)
router.patch('/:id', nodesController.update)
router.delete('/:id', nodesController.remove)
```

### nodes.service.ts

**`listNodes`** — lista todos os nós ativos com seus metadados. Não expande filhos
recursivamente — o frontend monta a árvore com base no `parent_id` e recebe
`childrenCount` para bloquear ações quando necessário.

**`createNode`** — cria um novo nó. Valida que o `parent_id`, se informado,
existe no banco. Nós raiz têm `parent_id: null`. Quando há PDF de evidência,
o arquivo é salvo em storage e `evidence_source` passa a refletir o nome do arquivo.

**`updateNode`** — atualiza campos de um nó existente. Permite alterar
`parent_id`, desde que o novo pai exista e o nó não seja pai de si mesmo.

**`remove`** — remove um nó. **Bloqueado se o nó tiver filhos** — a
árvore nunca pode ficar com filhos órfãos:

```ts
// ✅ Verificação antes de deletar
const childCount = await prisma.chatNode.count({
  where: { parent_id: id, is_active: true },
})

if (childCount > 0) {
  throw new AppError(
    'Não é possível remover um nó com filhos. Remova os filhos primeiro.',
    409,
  )
}
```

### nodes.controller.ts

Chama o service e formata a resposta HTTP. Não contém lógica de negócio:

```ts
// ✅ Controller fino — apenas orquestra
async remove(req: Request, res: Response) {
  await nodesService.deleteNode(Number(req.params.id))
  res.status(200).json({ success: true, data: null })
}
```

### nodes.types.ts

```ts
// Body esperado no POST /nodes
interface CreateNodeDto {
  title: string
  slug: string
  prompt?: string | null
  answer_summary?: string | null
  evidence_excerpt?: string | null
  evidence_source?: string | null
  evidence_file_name?: string | null
  evidence_file_mime_type?: string | null
  evidence_file_data?: Uint8Array | null
  parent_id: number | null
  display_order: number
  is_active?: boolean
}

// Body esperado no PATCH /nodes/:id
interface UpdateNodeDto {
  title?: string
  slug?: string
  prompt?: string | null
  answer_summary?: string | null
  evidence_excerpt?: string | null
  evidence_source?: string | null
  evidence_file_name?: string | null
  evidence_file_mime_type?: string | null
  evidence_file_data?: Uint8Array | null
  parent_id?: number | null
  display_order?: number
  is_active?: boolean
}

// Resposta retornada ao frontend
interface NodeResponse {
  id: number
  title: string
  slug: string
  parent_id: number | null
  display_order: number
  is_active: boolean
  childrenCount: number
}
```

***

## 🗄️ Modelo de dados <a id="modelo"></a>

```
ChatNode
├── id               Int      @id @default(autoincrement())
├── title            String
├── slug             String   @unique
├── prompt           String?
├── answer_summary   String?
├── evidence_excerpt String?
├── evidence_source  String?
├── parent_id        Int?     → ChatNode (auto-referência)
├── display_order    Int
├── is_active        Boolean
├── created_at       DateTime
├── updated_at       DateTime
└── children         ChatNode[]
```

A estrutura é uma **árvore recursiva auto-referenciada** — cada nó
aponta para seu pai via `parent_id`. O nó raiz tem `parent_id: null`.

***

## 🌿 Tipos de nó <a id="tipos"></a>

| Tipo prático | Tem filhos | Tem resposta | Comportamento no chatbot |
| ------------ | :--------: | :----------: | ------------------------ |
| Nó com filhos | ✅ Sim | Opcional | Exibe prompt/título e lista de filhos como botões de opção |
| Nó folha | ❌ Não | ✅ `answer_summary` | Exibe resposta final + evidência, se preenchida |

> ⚠️ O código atual não usa `nodeType`. A distinção prática é feita pela
> presença ou ausência de filhos.

***

## 🔌 Endpoints <a id="endpoints"></a>

Documentação completa com exemplos de request/response em
[`docs/api-layer.md`](../../../../../docs/api-layer.md).

| Método | Rota | Acesso | Descrição |
| ------ | ---- | :----: | --------- |
| `GET` | `/api/v1/nodes` | 🔒 ADMIN | Lista todos os nós |
| `POST` | `/api/v1/nodes` | 🔒 ADMIN | Cria novo nó de navegação |
| `PATCH` | `/api/v1/nodes/:id` | 🔒 ADMIN | Atualiza nó existente |
| `DELETE` | `/api/v1/nodes/:id` | 🔒 ADMIN | Remove nó (bloqueado se tiver filhos) |

***

## 📐 Regras de Contribuição <a id="regras"></a>

- **Nunca permita remover** um nó com filhos — a integridade da árvore é inegociável
- O campo `display_order` define a posição do nó entre seus irmãos — o frontend depende disso para renderizar as opções na ordem correta
- **Não exponha** as rotas deste módulo publicamente — a leitura pública dos nós é exclusividade de `modules/chatbot/`
- Ao alterar `parent_id`, valide que o novo pai existe e que o nó não aponta para si mesmo

***

> _Próximo documento: [`../questions/README.md`](../questions/README.md)_
