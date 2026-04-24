# Documentação da API

Este arquivo documenta as principais rotas da API do backend Avance.

## Rotas principais

### Usuários
- `GET /api/users` — Lista usuários
- `POST /api/users` — Cria usuário
- `POST /api/users/login` — Login

### Salas
- `GET /api/salas` — Lista salas
- `POST /api/salas` — Cria sala

### Alunos
- `GET /api/alunos` — Lista alunos
- `POST /api/alunos` — Cria aluno

### Frequência
- `GET /api/frequencia` — Lista frequência
- `POST /api/frequencia` — Registra frequência

### Calendário
- `GET /api/calendario` — Lista eventos
- `POST /api/calendario` — Cria evento

---

> Para detalhes de parâmetros, consulte os arquivos em backend/routes/.

## Autenticação
A maioria das rotas exige autenticação via JWT no header `Authorization: Bearer <token>`.

## Observações
- Para rotas completas, consulte o código-fonte ou solicite documentação Swagger.
- Para testar, use ferramentas como Insomnia, Postman ou o arquivo `requests/frequencia-api.http`.
