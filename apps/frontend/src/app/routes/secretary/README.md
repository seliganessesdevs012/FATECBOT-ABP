# 🗂️ routes/secretary — Painel da Secretária

> Componentes de página legados da secretária acadêmica (`/secretary/*`).
> Cada arquivo representa uma tela do painel e é responsável apenas por compor
> layout e features — a lógica de negócio vive em `features/secretary/`.

> **Estado atual:** no `router.tsx`, apenas `/secretary` está montada e seu `index.tsx` redireciona para `/admin`. `dashboard.tsx` e `questions.tsx` existem no diretório, mas não estão registrados no roteador atual.

---

## 📑 Índice

- [Responsabilidade](#responsabilidade)
- [Rotas desta pasta](#rotas)
- [Arquivos](#arquivos)
- [Regras de Contribuição](#regras)

---

## 🎯 Responsabilidade <a id="responsabilidade"></a>

As páginas da secretária foram preservadas como caminho legado. O fluxo operacional
atual de perguntas usa o painel unificado em `/admin/tickets`, com dados vindos
das APIs de perguntas.

Todo acesso a esta pasta é protegido por **duas camadas** declaradas em `router.tsx`:

```
Requisição → ProtectedRoute (valida autenticação) → RoleGuard(ADMIN/SECRETARIA) → Redirect para /admin
```

> ⚠️ **Nunca remova ou mova** o `RoleGuard` para dentro dos componentes de página.
> A proteção por role deve ser declarada no roteador, não nas folhas da árvore.

---

## 🗺️ Rotas desta pasta <a id="rotas"></a>

| Arquivo         | Rota                   | Descrição                                                         | RF   |
| --------------- | ---------------------- | ----------------------------------------------------------------- | ---- |
| `index.tsx`     | `/secretary`           | Redireciona para `/admin`                                        | RF03 · RF09 · RF10 |
| `dashboard.tsx` | —                      | Arquivo vazio, não montado no roteador atual                     | — |
| `questions.tsx` | —                      | Arquivo vazio, não montado no roteador atual                     | — |

---

## 📄 Arquivos <a id="arquivos"></a>

### dashboard.tsx

Arquivo vazio no estado atual e não montado no `router.tsx`.

### questions.tsx

Arquivo vazio no estado atual e não montado no `router.tsx`. O fluxo equivalente
está disponível em `/admin/tickets`.

> ⚠️ Esta tela é somente de **gestão de status** — a comunicação com o aluno
> ocorre fora do sistema, pelo e-mail institucional informado no envio da pergunta.

---

## 📐 Regras de Contribuição <a id="regras"></a>

- Componentes de página **importam apenas** de `features/secretary/`, `components/shared/` e utilitários de app
- **Nunca** faça fetch, mutation ou acesso direto ao Axios dentro desta pasta
- Toda nova rota de secretária deve ser declarada em `app/router.tsx` antes de criar o arquivo de página aqui
- Quando uma rota de secretária voltar a ser montada, o nome do arquivo deve espelhar o segmento de rota
- Mantenha os arquivos pequenos — se o arquivo passar de ~50 linhas, a lógica provavelmente está no lugar errado

---

> _Este README deve ser atualizado sempre que uma nova rota da secretária
> for adicionada ou removida do projeto._

> _Próximo documento: [`../../../../README.md`](../../../../README.md)_
