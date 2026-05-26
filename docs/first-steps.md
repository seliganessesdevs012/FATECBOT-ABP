# Primeiros Passos

Bem-vindo ao FatecBot. Este documento tem um objetivo só: te deixar com o projeto rodando e sabendo por onde começar a codar, o mais rápido possível.

---

## 1. Antes de tudo — entenda o que você vai construir

Leia [`application-overview.md`](./application-overview.md) agora. São 15 minutos que vão evitar muita confusão depois.

Você vai sair sabendo:

- O que é o FatecBot e o que ele faz
- Quem são os três perfis do sistema (Aluno, Secretária, Admin)
- Como a navegação do chatbot funciona por dentro

---

## 2. Rodando o projeto

Você vai precisar de **Docker** e **Git** instalados. Só isso.

```bash
git clone <repositorio>
cd fatecbot
# Crie um arquivo .env na raiz com as variáveis descritas no README principal
docker compose up --build
```

Após subir, acesse:

| O quê    | URL                          |
| -------- | ---------------------------- |
| Frontend | http://localhost:5173        |
| API      | http://localhost:3000/api/v1 |

Para testar o login, use as credenciais abaixo — elas são criadas pelo seed:

| Perfil     | E-mail                       | Senha            |
| ---------- | ---------------------------- | ---------------- |
| Admin      | `admin@fatec.sp.gov.br`      | `Admin@123`      |
| Secretária | `secretaria@fatec.sp.gov.br` | `Secretaria@123` |

> Algo não subiu? Consulte o [README principal](../README.md), o [README do frontend](../apps/frontend/README.md) e o [README do backend](../apps/backend/README.md).

---

## 3. Entenda onde tudo fica

Leia [`project-structure.md`](./project-structure.md) antes de criar qualquer arquivo. Ele explica a organização do monorepo e onde cada responsabilidade deve viver.

Regra principal: **o projeto é organizado por feature, não por tipo de arquivo.** Tudo relacionado ao chatbot fica em `features/chatbot/`, tudo de auth em `features/auth/`, e assim por diante.

---

## 4. Antes do primeiro commit

Leia [`project-standards.md`](./project-standards.md). Ele cobre as convenções de branch, commit e PR que o time segue.

---

## 5. Agora vai para sua task

Com o projeto rodando e a estrutura clara, abra o backlog da sprint atual:

- **[`sprint3/README.md`](./sprint3/README.md)** — sprint mais recente do fluxo de entrega documentado

Cada task diz exatamente quais arquivos ela possui, o que ela exporta e de quais outras tasks ela depende. Leia o contrato da sua task antes de escrever qualquer código.

---

## Precisa de ajuda com a stack?

Os READMEs de [`../apps/frontend/`](../apps/frontend/README.md) e [`../apps/backend/`](../apps/backend/README.md) concentram hoje as referências práticas mais úteis sobre stack, rotas montadas e setup atual. Consulte esses arquivos quando travar em algo específico.

---

> _Próximo documento: [`application-overview.md`](./application-overview.md)_
