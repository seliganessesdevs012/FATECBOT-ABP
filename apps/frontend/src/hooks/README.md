# 📁 src/hooks/

Hooks customizados de uso global — reutilizáveis por qualquer feature ou componente da aplicação. Diferente dos hooks dentro de `features/`, os hooks desta pasta **não pertencem a nenhum domínio de negócio** específico. São utilitários de comportamento genérico.

***

## Estrutura

```
hooks/
├── useDebounce.ts
└── usePagination.ts
```

***

## Quando usar esta pasta

A distinção entre `hooks/` global e `features/<dominio>/hooks/` é simples:

| Critério | Destino |
|---|---|
| Hook usa dados ou lógica de um domínio específico (chatbot, auth, admin) | `features/<dominio>/hooks/` |
| Hook é um utilitário genérico sem conhecimento de domínio | `hooks/` (esta pasta) |
| Hook usa TanStack Query ou faz chamada de API | `features/<dominio>/hooks/` |
| Hook encapsula comportamento de UI reutilizável | `hooks/` (esta pasta) |

***

## Hooks disponíveis

### `useDebounce.ts`

Retorna um valor com delay após a última atualização. Usado em campos de busca para evitar requisições a cada keystroke.

```ts
function useDebounce<T>(value: T, delay: number): T
```

Exemplo de uso:

```ts
const [search, setSearch] = useState('')
const debouncedSearch = useDebounce(search, 400)

useEffect(() => {
  // só executa 400ms após o usuário parar de digitar
}, [debouncedSearch])
```

***

### `usePagination.ts`

Gerencia estado de página e limite para listagens paginadas. Normaliza valores para inteiros positivos e expõe helpers de navegação.

```ts
function usePagination(initialPage?: number, initialLimit?: number): {
  page: number
  limit: number
  setPage: (page: number) => void
  setLimit: (limit: number) => void
  nextPage: () => void
  prevPage: () => void
}
```

Exemplo de uso:

```ts
const { page, limit, nextPage, prevPage } = usePagination(1, 20)
```

***

## Regras de contribuição

- Hooks nesta pasta **não importam** de nenhuma pasta dentro de `features/`
- Hooks nesta pasta **não usam** TanStack Query, Axios ou Prisma
- Se o hook crescer e começar a ter conhecimento de domínio, mova-o para a feature correspondente
- Todo hook deve ter sua assinatura de tipos documentada com um bloco de exemplo de uso

***

> _Próximo documento: [`../utils/README.md`](../utils/README.md)_
