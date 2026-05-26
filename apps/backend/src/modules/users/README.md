# 👥 modules/users — Gestão de Usuários

> Módulo responsável pela criação e remoção dos usuários autenticados do sistema —
> Secretárias Acadêmicas e Administradores. Acesso restrito ao Administrador (RF04, RF03).

> **Estado atual:** o módulo está implementado com rotas `GET`, `POST` e `DELETE` protegidas por `ADMIN`.

***

## 📑 Índice

- [Responsabilidade](#responsabilidade)
- [Estrutura de Arquivos](#estrutura)
- [Camadas](#camadas)
- [Modelo de dados](#modelo)
- [Endpoints](#endpoints)
- [Regras de Contribuição](#regras)

***

## 🎯 Responsabilidade <a id="responsabilidade"></a>

Este módulo gerencia o ciclo de vida dos usuários autenticados do sistema.
O perfil **Aluno não é um usuário cadastrado** — ele acessa o chatbot de forma
pública, sem autenticação. Apenas Secretárias e Administradores possuem conta.

Os usuários iniciais são gerados pelo seed em `prisma/seed.ts`. A interface
permite criar usuários `ADMIN` ou `SECRETARIA`; o backend impede remover o
último usuário administrador.

| Responsabilidade | Arquivo |
| ---------------- | ------- |
| Listar, criar e remover usuários | `users.routes.ts` |
| Lógica de criação e remoção | `users.service.ts` |
| Receber requests e formatar respostas | `users.controller.ts` |
| Tipagem dos DTOs e responses | `users.types.ts` |

***

## 📁 Estrutura de Arquivos <a id="estrutura"></a>

```
modules/users/
├── users.controller.ts  # Recebe req, chama service, devolve resposta HTTP
├── users.service.ts     # Lógica de listagem, criação e remoção de usuários
├── users.routes.ts      # Define rotas protegidas (🔒 ADMIN)
└── users.types.ts       # CreateUserDto, UserResponse
```

***

## 🧱 Camadas <a id="camadas"></a>

### users.routes.ts

Todas as rotas são protegidas por `authenticate` + `authorize('ADMIN')`:

```ts
router.use(authenticate)
router.use(authorize('ADMIN'))

router.get('/', usersController.getAll)
router.post('/', usersController.create)
router.delete('/:id', usersController.remove)
```

O body do `POST /users` é validado com Zod antes de chegar ao controller.

### users.service.ts

**`listUsers`** — lista todos os usuários cadastrados com paginação.
Nunca retorna o campo `password_hash` — mapeie sempre para `UserResponse`
antes de retornar:

```ts
// ✅ Nunca retorne o hash da senha
const users = await prisma.user.findMany({
  skip,
  take,
  select: { id: true, name: true, email: true, role: true, created_at: true },
})
```

**`createUser`** — cria um novo usuário com role `ADMIN` ou `SECRETARIA`.
A senha é hasheada com Argon2id via `hashPassword` de `utils/hash.util.ts`
antes de persistir:

```ts
// ✅ Hash da senha antes de salvar
const hashedPassword = await hashPassword(dto.password)

await prisma.user.create({
  data: {
    email: dto.email,
    name: dto.name,
    password_hash: hashedPassword,
    role: dto.role,
  },
})
```

**`removeUser`** — remove um usuário pelo `id`. Bloqueia a remoção se o
usuário não existir ou se a operação removeria o único `ADMIN`:

```ts
// ✅ Proteção do admin padrão
if (user.role === 'ADMIN') {
  const adminCount = await db.user.count({ where: { role: 'ADMIN' } })
  if (adminCount <= 1) {
    throw new AppError('Nao e possivel remover o unico admin', 409)
  }
}
```

### users.controller.ts

Chama o service e formata a resposta HTTP. Não contém lógica de negócio:

```ts
// ✅ Controller fino — apenas orquestra
async create(req: Request, res: Response) {
  const user = await usersService.create(req.body)
  res.status(201).json({ success: true, data: user })
}
```

### users.types.ts

```ts
// Body esperado no POST /users
interface CreateUserDto {
  name: string
  email: string
  password: string    // senha em texto plano — hasheada no service
  role: 'SECRETARIA' | 'ADMIN'
}

// Resposta retornada ao frontend — nunca inclui password
interface UserResponse {
  id: number
  name: string
  email: string
  role: 'SECRETARIA' | 'ADMIN'
  created_at: string
}
```

***

## 🗄️ Modelo de dados <a id="modelo"></a>

```
User
├── id            Int      @id @default(autoincrement())
├── name          String
├── email         String   @unique
├── password_hash String   (hash Argon2id — nunca retornado pela API)
├── role          Role     (ADMIN | SECRETARIA)
├── created_at    DateTime @default(now())
└── updated_at    DateTime @updatedAt
```

> O campo `password_hash` **nunca** deve aparecer em nenhuma resposta da API —
> nem em listagem, nem em criação, nem em erro. Sempre use `select` explícito
> no Prisma ou mapeie para `UserResponse` antes de retornar.

***

## 🔌 Endpoints <a id="endpoints"></a>

Documentação completa com exemplos de request/response em
[`docs/api-layer.md`](../../../../../docs/api-layer.md).

| Método | Rota | Acesso | Descrição |
| ------ | ---- | :----: | --------- |
| `GET` | `/api/v1/users` | 🔒 ADMIN | Lista usuários internos |
| `POST` | `/api/v1/users` | 🔒 ADMIN | Cria usuário interno |
| `DELETE` | `/api/v1/users/:id` | 🔒 ADMIN | Remove usuário |

***

## 📐 Regras de Contribuição <a id="regras"></a>

- O campo `password_hash` **nunca** é retornado pela API — use sempre `select` explícito ou mapeie para `UserResponse`
- O `role` aceito no body do `POST` deve ser `ADMIN` ou `SECRETARIA`
- A remoção do último `ADMIN` **não é suportada** — bloqueie no service antes de chamar o Prisma
- Senhas são sempre hasheadas com Argon2id via `utils/hash.util.ts` — nunca use bcrypt ou salve em texto plano
- Rotas deste módulo são **sempre protegidas** — nunca remova o `authenticate` ou o `authorize('ADMIN')`

***

> _Próximo documento: [`../logs/README.md`](../logs/README.md)_
