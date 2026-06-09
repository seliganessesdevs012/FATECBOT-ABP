# `modules/dashboard`

Módulo de métricas do painel interno.

## Rota

| Método | Rota | Papel |
| --- | --- | --- |
| `GET` | `/api/v1/dashboard/metrics` | `ADMIN`, `SECRETARIA` |

## O que ele consolida hoje

- tickets não respondidos;
- taxa positiva dos últimos 7 dias;
- taxa positiva acumulada;
- média de cliques por sessão;
- quantidade de sessões analisadas;
- distribuição de cliques para o gráfico do dashboard.

## Observação

O frontend consome este módulo por um endpoint único, em vez de montar o dashboard a partir de várias queries separadas.
