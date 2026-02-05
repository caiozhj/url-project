# URL Shortener API

API REST para encurtamento de URLs construída com NestJS e TypeScript.

## Pré-requisitos

- Docker e Docker Compose

## Como rodar

Ter o Docker Compose instalado:

```bash
# Clone o repositório
git clone <url-do-repositorio>
cd project-name

# Suba todos os serviços (banco, adminer e API)
docker-compose up -d
```

Sobe automaticamente:
- PostgreSQL na porta 5432
- Adminer na porta 8080 
- API na porta 3000

A API  em `http://localhost:3000`


## Documentação da API

Acesse a documentação Swagger em:
```
http://localhost:3000/api-docs
```

## Endpoints principais

### Autenticação
- `POST /api/auth/register` - Cadastrar usuário
- `POST /api/auth/login` - Fazer login (retorna Token)

### URLs
- `POST /api/urls/shorten` - Encurtar URL (público ou autenticado)
- `GET /:shortCode` - Redirecionar para URL original
- `GET /api/urls` - Listar URLs do usuário (autenticado)
- `PUT /api/urls/:id` - Atualizar URL (autenticado)
- `DELETE /api/urls/:id` - Deletar URL (autenticado)

## Testes

Para rodar os testes, você precisa ter Node.js

```bash
# Instalar dependências
npm install

# Testes unitários
npm run test

# Testes com cobertura
npm run test:cov

# Testes e2e
npm run test:e2e
```

## Variáveis de ambiente

Veja o arquivo `.env.example` para todas as variáveis disponíveis.

Principais:
- `DB_HOST` - Host do banco de dados
- `DB_PORT` - Porta do banco de dados
- `DB_USER` - Usuário do banco
- `DB_PASSWORD` - Senha do banco
- `DB_NAME` - Nome do banco
- `JWT_SECRET` - Chave secreta para JWT
- `SHORT_URL_DOMAIN` - Domínio base para URLs encurtadas

## Acessar o banco de dados

O Adminer está em `http://localhost:8080`

Credenciais:
- Sistema: PostgreSQL
- Servidor: postgres
- Usuário: postgres
- Senha: postgres
- Banco de dados: url-project


```

## Tecnologias

- NestJS
- TypeScript
- TypeORM
- PostgreSQL
- JWT
- Swagger/OpenAPI
