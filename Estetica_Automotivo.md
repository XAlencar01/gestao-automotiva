# 🚗 Smart System — Estética Automotiva

![CI](https://github.com/GSR159/gestao-agendamentos-estetica-automotiva/actions/workflows/ci.yml/badge.svg)
![Node](https://img.shields.io/badge/Node.js-20+-green)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-blue)
![License](https://img.shields.io/badge/license-Acadêmico-lightgrey)

Sistema completo de gestão de agendamentos para estética automotiva, desenvolvido como Trabalho de Conclusão de Curso em Engenharia de Software.

---

## 📌 Sobre o Projeto

O Smart System permite o gerenciamento completo de uma estética automotiva: clientes, veículos, serviços, funcionários, agendamentos e relatórios financeiros. O sistema conta com área administrativa e área do cliente, autenticação JWT, notificações por e-mail e conformidade com a LGPD.

**Deploy em produção:** [smartsystemauto.com.br](https://smartsystemauto.com.br)  
**Documentação da API:** `/api-docs` (Swagger UI)

---

## 🛠️ Tecnologias

| Camada | Tecnologia |
|---|---|
| Runtime | Node.js 20+ |
| Framework | Express 4 |
| Banco de dados | PostgreSQL |
| Autenticação | JWT + bcrypt |
| Validação | Joi |
| E-mail | Resend |
| Testes | Jest + Supertest |
| Documentação | Swagger / OpenAPI 3 |
| Logging | Winston |
| Agendamento | node-cron |
| Deploy | Vercel |
| CI/CD | GitHub Actions |

---

## 📂 Estrutura do Projeto

```
├── frontend/               # Interface web (HTML + Tailwind CSS + JS vanilla)
│   ├── agendamentos.html
│   ├── clientes.html
│   ├── veiculos.html
│   ├── servicos.html
│   ├── funcionarios.html
│   ├── agenda.html
│   ├── relatorios.html
│   ├── tela_cliente.html
│   └── ...
│
└── src/                    # Backend (Node.js / Express)
    ├── config/
    │   ├── db.js           # Conexão PostgreSQL
    │   ├── swagger.js      # Configuração OpenAPI
    │   └── constants.js    # Constantes e magic numbers
    ├── controllers/        # Recebem req/res e delegam ao service
    ├── services/           # Lógica de negócio
    ├── models/             # Queries SQL
    ├── routes/             # Endpoints + documentação Swagger
    ├── middlewares/        # Auth, Admin, Superadmin
    ├── jobs/               # Cron jobs (expiração de agendamentos)
    ├── utils/
    │   ├── logger.js       # Winston
    │   └── validacoes.js   # Schemas Joi
    ├── test/               # Testes Jest + Supertest
    ├── app.js
    └── server.js
```

---

## ⚙️ Como Executar

### Pré-requisitos

- Node.js 20+
- PostgreSQL 14+
- npm

### 1. Clone o repositório

```bash
git clone https://github.com/GSR159/gestao-agendamentos-estetica-automotiva.git
cd gestao-agendamentos-estetica-automotiva
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Copie o arquivo de exemplo e preencha com seus dados:

```bash
cp .env.example .env
```

```env
DATABASE_URL=postgresql://usuario:senha@localhost:5432/estetica_db
JWT_SECRET=sua_string_secreta_longa
FRONT_URL=http://127.0.0.1:5500
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
EMAIL_USER=noreply@seudominio.com.br
NODE_ENV=development
PORT=3000
```

### 4. Configure o banco de dados

Crie o banco e execute o script SQL:

```bash
psql -U postgres -c "CREATE DATABASE estetica_db;"
psql -U postgres -d estetica_db -f database/database.sql
```

Ou via pgAdmin: abra o Query Tool e execute o arquivo `database/database.sql`.

### 5. Inicie o servidor

```bash
# Desenvolvimento (com hot reload)
npm run dev

# Produção
npm start
```

O servidor sobe em `http://localhost:3000`  
A documentação da API fica em `http://localhost:3000/api-docs`

---

## 🔌 Endpoints Principais

A documentação completa e interativa está disponível em `/api-docs` (Swagger UI).

| Módulo | Endpoints |
|---|---|
| **Auth** | `POST /auth/register`, `POST /auth/login`, `GET /auth/confirmar-email`, `POST /auth/esqueci-senha`, `POST /auth/redefinir-senha` |
| **Clientes** | `GET /clientes`, `GET /clientes/:id`, `POST /clientes`, `PUT /clientes/:id`, `DELETE /clientes/:id`, `GET /clientes/:id/exportar` |
| **Veículos** | `GET /veiculos`, `POST /veiculos`, `PUT /veiculos/:id`, `DELETE /veiculos/:id` |
| **Serviços** | `GET /servicos`, `POST /servicos`, `PUT /servicos/:id`, `DELETE /servicos/:id` |
| **Agendamentos** | `GET /agendamentos`, `POST /agendamentos`, `PUT /agendamentos/:id`, `DELETE /agendamentos/:id` |
| **Funcionários** | `GET /funcionarios`, `POST /funcionarios`, `PUT /funcionarios/:id`, `DELETE /funcionarios/:id`, `GET /funcionarios/disponiveis` |
| **Agenda** | `GET /agenda/slots`, `GET /agenda/status-hoje`, `GET /agenda/funcionamento`, `PUT /agenda/funcionamento/:dia`, `GET /agenda/dias-fechados`, `POST /agenda/dias-fechados` |
| **Relatórios** | `GET /relatorios` |
| **Área do Cliente** | `GET /cliente/minha-conta`, `PUT /cliente/minha-conta`, `DELETE /cliente/minha-conta`, `GET /cliente/meus-agendamentos`, `POST /cliente/agendar` |
| **Admins** | `GET /admins`, `POST /admins`, `PATCH /admins/:id/toggle`, `DELETE /admins/:id` |

---

## 🧪 Testes

```bash
# Rodar todos os testes
npm test

# Rodar com relatório de cobertura
npm run test:coverage
```

Cobertura atual: **~64% statements**, **115 testes passando**.

Os testes cobrem: autenticação, agendamentos, clientes, veículos, serviços, funcionários, agenda, relatórios, middlewares e área do cliente.

---

## 🔍 Qualidade de Código

```bash
# Verificar problemas de lint
npm run lint

# Corrigir automaticamente
npm run lint:fix

# Formatar com Prettier
npm run format

# Verificar formatação sem alterar
npm run format:check
```

---

## 🔒 Segurança

- Autenticação via JWT com expiração de 24h
- Senhas com bcrypt (salt rounds: 10)
- Rate limiting: 200 req/15min global, 10 req/15min em `/auth`
- Helmet para headers HTTP seguros
- Validação de entrada com Joi em todas as rotas de mutação
- CORS configurável via variável de ambiente

---

## 🛡️ LGPD

O sistema implementa os seguintes direitos do titular (Lei 13.709/2018):

- **Art. 18, I** — Confirmação da existência de tratamento
- **Art. 18, II** — Acesso aos dados via `GET /cliente/minha-conta`
- **Art. 18, VI** — Portabilidade via `GET /clientes/:id/exportar`
- **Art. 18, VI** — Eliminação via `DELETE /cliente/minha-conta` (anonimização, histórico preservado)

---

## 🔁 CI/CD

O projeto usa GitHub Actions. A cada push na `main` ou `develop`:

1. Instala dependências (`npm ci`)
2. Verifica lint (`npm run lint`)
3. Roda testes com cobertura (`npm run test:coverage`)
4. Salva relatório de cobertura como artefato

---

## 👨‍💻 Autor

**Guilherme Rocha**  
Estudante de Engenharia de Software  
[github.com/GSR159](https://github.com/GSR159)

---

## 📄 Licença

Este projeto é de caráter acadêmico e educacional — Trabalho de Conclusão de Curso.