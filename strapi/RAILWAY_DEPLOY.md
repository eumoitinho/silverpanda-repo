# 🚂 Deploy do Strapi no Railway

Este guia explica como fazer deploy do Strapi no Railway.

## 📋 Pré-requisitos

1. Conta no [Railway](https://railway.app)
2. Repositório no GitHub
3. Credenciais do Spotify (opcional, para integração)

## 🚀 Passo a Passo

### 1. Configurar o Projeto no Railway

1. Acesse [railway.app](https://railway.app)
2. Faça login com GitHub
3. Clique em "New Project"
4. Escolha "Deploy from GitHub repo"
5. Selecione o repositório `silverpanda-repo`
6. **IMPORTANTE**: Configure o **Root Directory** para `strapi`

### 2. Configurar Variáveis de Ambiente

No painel do Railway, vá em **Variables** e adicione:

#### Variáveis Obrigatórias

```bash
# App Keys (gere com: openssl rand -base64 32)
APP_KEYS=key1,key2,key3,key4

# API Token (gere com: openssl rand -base64 32)
API_TOKEN_SALT=seu_token_salt_aqui

# Admin JWT Secret (gere com: openssl rand -base64 32)
ADMIN_JWT_SECRET=seu_admin_jwt_secret_aqui

# Transfer Token Salt (gere com: openssl rand -base64 32)
TRANSFER_TOKEN_SALT=seu_transfer_token_salt_aqui

# JWT Secret (gere com: openssl rand -base64 32)
JWT_SECRET=seu_jwt_secret_aqui

# Port (Railway define automaticamente, mas pode sobrescrever)
PORT=1337

# Node Environment
NODE_ENV=production
```

#### Variáveis do Banco de Dados

**Opção 1: PostgreSQL (Recomendado para produção)**

```bash
DATABASE_CLIENT=postgres
DATABASE_URL=${{Postgres.DATABASE_URL}}
DATABASE_SSL=true
```

**Opção 2: SQLite (Apenas para desenvolvimento/teste)**

```bash
DATABASE_CLIENT=sqlite
DATABASE_FILENAME=.tmp/data.db
```

#### Variáveis do Spotify (Opcional)

```bash
SPOTIFY_CLIENT_ID=seu_client_id_aqui
SPOTIFY_CLIENT_SECRET=seu_client_secret_aqui
```

### 3. Adicionar Banco de Dados PostgreSQL (Recomendado)

1. No painel do Railway, clique em **"+ New"**
2. Selecione **"Database"** → **"Add PostgreSQL"**
3. Railway criará automaticamente um banco PostgreSQL
4. A variável `DATABASE_URL` será automaticamente injetada
5. Configure `DATABASE_CLIENT=postgres` nas variáveis de ambiente

### 4. Configurar Build Settings

No painel do Railway, vá em **Settings** → **Build & Deploy**:

- **Root Directory**: `strapi`
- **Build Command**: `npm run build` (ou deixe vazio, o `nixpacks.toml` já define)
- **Start Command**: `npm start` (ou deixe vazio, o `nixpacks.toml` já define)

### 5. Deploy

1. Railway detectará automaticamente o `nixpacks.toml` ou `railway.json`
2. O build será executado automaticamente
3. Após o build, o Strapi será iniciado
4. Anote a URL gerada (ex: `https://silverpanda-strapi.railway.app`)

### 6. Acessar o Admin do Strapi

1. Acesse `https://sua-url.railway.app/admin`
2. Crie sua conta de administrador
3. Configure seu conteúdo

## 🔧 Troubleshooting

### Erro: "yarn: not found"

**Solução**: Os arquivos `nixpacks.toml` e `railway.json` já estão configurados para usar `npm`. Certifique-se de que o **Root Directory** está configurado para `strapi`.

### Erro: "APP_KEYS is required"

**Solução**: Gere as chaves necessárias:

```bash
# No terminal local
openssl rand -base64 32  # Para APP_KEYS (repita 4 vezes)
openssl rand -base64 32  # Para API_TOKEN_SALT
openssl rand -base64 32  # Para ADMIN_JWT_SECRET
openssl rand -base64 32  # Para TRANSFER_TOKEN_SALT
openssl rand -base64 32  # Para JWT_SECRET
```

### Erro: "Database connection failed"

**Solução**: 
1. Verifique se o PostgreSQL foi adicionado
2. Confirme que `DATABASE_CLIENT=postgres`
3. Verifique se `DATABASE_URL` está configurada automaticamente
4. Se usar SQLite, certifique-se de que o volume está persistente

### Build falha

**Solução**:
1. Verifique os logs no Railway
2. Confirme que o Root Directory está como `strapi`
3. Verifique se todas as dependências estão no `package.json`
4. Tente fazer build local: `cd strapi && npm install && npm run build`

### Strapi não inicia

**Solução**:
1. Verifique os logs no Railway
2. Confirme que `PORT` está configurada (Railway define automaticamente)
3. Verifique se `HOST=0.0.0.0` (já está no `server.ts`)
4. Confirme que todas as variáveis de ambiente obrigatórias estão configuradas

## 📝 Variáveis de Ambiente Completas

Crie um arquivo `.env.example` no diretório `strapi/` com:

```bash
# App Keys (gere 4 chaves diferentes)
APP_KEYS=key1,key2,key3,key4

# API Token
API_TOKEN_SALT=your_api_token_salt

# Admin JWT
ADMIN_JWT_SECRET=your_admin_jwt_secret

# Transfer Token
TRANSFER_TOKEN_SALT=your_transfer_token_salt

# JWT Secret
JWT_SECRET=your_jwt_secret

# Database (PostgreSQL)
DATABASE_CLIENT=postgres
DATABASE_URL=postgresql://user:password@host:port/database
DATABASE_SSL=true

# Server
HOST=0.0.0.0
PORT=1337
NODE_ENV=production

# Spotify (Opcional)
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
```

## 🎯 Próximos Passos

1. Configure o CORS no Strapi para permitir requisições do frontend
2. Configure domínio customizado (opcional)
3. Configure backups do banco de dados
4. Configure monitoramento e alertas

## 📚 Recursos

- [Railway Docs](https://docs.railway.app)
- [Strapi Deployment Guide](https://docs.strapi.io/dev-docs/deployment)
- [Strapi Environment Variables](https://docs.strapi.io/dev-docs/configurations/environment)

