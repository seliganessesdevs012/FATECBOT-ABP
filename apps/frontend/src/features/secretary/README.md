# `features/secretary`

Domínio operacional da secretaria no frontend.

Mesmo com o painel compartilhado em `/admin`, esta pasta continua útil para concentrar a lógica específica da fila de perguntas.

## Estrutura atual

```text
features/secretary/
├── api/questions.api.ts
├── components/
├── hooks/
└── types/questions.types.ts
```

## O que esta feature faz hoje

- lista perguntas da fila interna;
- atualiza o status para `RESPONDIDA`;
- abre anexos protegidos;
- mostra auditoria de responsável quando disponível;
- expõe componentes reutilizáveis da fila, como `QuestionList` e `QuestionStatusBadge`.

## Observação

Apesar do nome da feature, os componentes desta pasta podem ser usados tanto por `SECRETARIA` quanto por `ADMIN` nas rotas compartilhadas do painel.
