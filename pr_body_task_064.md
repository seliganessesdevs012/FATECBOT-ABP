Título: TASK-064 · [FE] Hook useQuestions (paginação e updateStatus)

Resumo
- Implementa hook `useQuestions` que consome `questionsApi` (TASK-063) e expõe listagem paginada via `useInfiniteQuery` e mutation `updateStatus`.
- Arquivo: `apps/frontend/src/features/secretary/hooks/useQuestions.ts`

O que foi feito
- useInfiniteQuery para buscar perguntas paginadas (params: status, limit).
- useMutation para atualizar status de pergunta e invalidar cache.
- Exporta: items, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage, refetch, updateStatus (mutateAsync) e estado da mutation.

Como testar
1. No frontend: `cd apps/frontend && npm install && npm run dev`.
2. Abrir UI da secretária e verificar listagem e ações de mudança de status.
3. Testes unitários: validar integração com `questionsApi` (mocks) e comportamento de cache (opcional).

Observações
- Ajustar `getNextPageParam` se o shape de `meta` do backend for distinto.
- Se `api` tiver baseURL com `/api/v1`, o hook usa endpoints sem repetir o prefixo.

Checklist
- [x] Arquivo criado: `useQuestions.ts`
- [x] Hook expõe listagem paginada e mutation
- [ ] Rodar testes e validar UI

Referências
- TASK-063 (questionsApi)
