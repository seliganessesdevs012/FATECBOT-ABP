# 🔒 routes/admin — Painel do Administrador

> Componentes de página das rotas protegidas do administrador (`/admin/*`).
> Cada arquivo representa uma tela do painel e é responsável apenas por compor
> layout e features — a lógica de negócio vive em `features/admin/`.

> **Estado atual:** `router.tsx` monta `/admin`, `/admin/nodes`, `/admin/users`, `/admin/tickets` e `/admin/logs`. `documents.tsx` existe no diretório, mas não está registrado no roteador.

---

## 📑 Índice

- [Responsabilidade](#responsabilidade)
- [Rotas desta pasta](#rotas)
- [Arquivos](#arquivos)
- [Regras de Contribuição](#regras)

---

## 🎯 Responsabilidade <a id="responsabilidade"></a>

As páginas de admin são o ponto de encontro entre o layout autenticado e as features
de gestão de conteúdo (RF04). Elas **não implementam** lógica de dados — apenas
orquestram quais componentes de `features/admin/` aparecem em cada tela.

Todo acesso montado desta pasta é protegido por **duas camadas** declaradas em `router.tsx`:

Requisição → ProtectedRoute (valida autenticação) → RoleGuard(roles permitidas) → Página

> ⚠️ **Nunca remova ou mova** o `RoleGuard` para dentro dos componentes de página.
> A proteção por role deve ser declarada no roteador, não nas folhas da árvore.

---

## 🗺️ Rotas desta pasta <a id="rotas"></a>

| Arquivo         | Rota               | Descrição                                                  | RF   |
| --------------- | ------------------ | ---------------------------------------------------------- | ---- |
| `index.tsx`     | `/admin`           | Reexporta `dashboard.tsx`                                  | RF03 · RF09 · RF10 |
| `dashboard.tsx` | `/admin`           | Visão geral do painel com métricas                         | RF04 · RF08 |
| `nodes.tsx`     | `/admin/nodes`     | CRUD de nós de navegação                                   | RF04 |
| `tickets.tsx`   | `/admin/tickets`   | Gestão das perguntas/tickets recebidos                     | RF05 · RF06 |
| `users.tsx`     | `/admin/users`     | Criação e remoção de usuários internos                     | RF04 |
| `logs.tsx`      | `/admin/logs`      | Visualização de logs                                       | RF08 |
| `documents.tsx` | —                  | Arquivo vazio, não montado no roteador atual               | — |

---

## 📄 Arquivos <a id="arquivos"></a>

### dashboard.tsx

Tela inicial do painel. Exibe uma visão consolidada do sistema — resumo de perguntas
pendentes, nós cadastrados e interações recentes. Compõe cards e widgets de
`features/admin/components/`.

### nodes.tsx

Tela de gestão da árvore de navegação do chatbot. Permite criar, editar, reordenar
e excluir nós do tipo `MENU` e `ANSWER`. A exclusão é bloqueada quando o nó possui
filhos — essa regra é aplicada e validada no backend.

### documents.tsx

Arquivo vazio no estado atual e não montado no `router.tsx`.

### users.tsx

Tela de gestão de usuários internos. O administrador pode criar usuários `ADMIN`
ou `SECRETARIA` e remover existentes; o backend impede remover o único admin.

### logs.tsx

Tela de visualização dos logs de atendimento registrados pelo sistema (RF08).
Exibe o fluxo de navegação, perguntas enviadas, avaliações de satisfação e
data/hora de cada interação. Somente leitura — nenhuma ação de escrita disponível.

### tickets.tsx

Tela de gestão das perguntas encaminhadas pelo chatbot. Usa `TicketList` para
listar, filtrar, baixar anexos e marcar tickets como respondidos.

---

## 📐 Regras de Contribuição <a id="regras"></a>

- Componentes de página **importam apenas** de `features/admin/`, `components/shared/` e utilitários de app
- **Nunca** faça fetch, mutation ou acesso direto ao Axios dentro desta pasta
- Toda nova rota de admin deve ser declarada em `app/router.tsx` antes de criar o arquivo de página aqui
- O nome do arquivo deve espelhar o segmento de rota: `/admin/nodes` → `nodes.tsx`
- Mantenha os arquivos pequenos — se o arquivo passar de ~50 linhas, a lógica provavelmente está no lugar errado

---

> _Este README deve ser atualizado sempre que uma nova rota de administrador
> for adicionada ou removida do projeto._

> _Próximo documento: [`../secretary/README.md`](../secretary/README.md)_
