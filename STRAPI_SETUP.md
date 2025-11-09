# Guia de Configuração do Strapi CMS

## Onde o Strapi fica?

O Strapi é um **CMS separado** que precisa ser configurado e hospedado independentemente do frontend. Você tem 3 opções:

### Opção 1: Projeto Strapi Separado (Recomendado) ⭐

Crie um projeto Strapi em um repositório separado:

```bash
# Em outro diretório/repositório
npx create-strapi-app@latest silver-panda-cms --quickstart
```

**Estrutura:**
```
silver-panda-cms/          # Projeto Strapi separado
├── config/
├── src/
└── package.json

silverpanda-repo/          # Frontend (este projeto)
├── api/
├── src/
└── index.html
```

**Vantagens:**
- Separação clara entre CMS e frontend
- Pode hospedar em serviços diferentes
- Mais fácil de escalar

### Opção 2: Monorepo (Strapi dentro deste repositório)

Crie uma pasta `strapi/` dentro deste repositório:

```bash
# Dentro de silverpanda-repo/
npx create-strapi-app@latest strapi --quickstart
```

**Estrutura:**
```
silverpanda-repo/
├── strapi/                 # Projeto Strapi
│   ├── config/
│   ├── src/
│   └── package.json
├── api/                    # Serverless functions
├── src/                    # Frontend (Vite)
└── index.html
```

**Vantagens:**
- Tudo em um repositório
- Mais fácil de gerenciar localmente

### Opção 3: Strapi Hospedado (Strapi Cloud, Railway, Render)

Use um serviço hospedado:
- **Strapi Cloud**: https://cloud.strapi.io
- **Railway**: https://railway.app
- **Render**: https://render.com
- **Heroku**: https://heroku.com

## Configuração Rápida

### 1. Criar o Projeto Strapi

```bash
# Opção A: Projeto separado
cd ..
npx create-strapi-app@latest silver-panda-cms --quickstart

# Opção B: Dentro deste repositório
cd silverpanda-repo
npx create-strapi-app@latest strapi --quickstart
```

### 2. Configurar as Chaves de Segurança

No arquivo `strapi/.env` (ou `silver-panda-cms/.env`):

```env
APP_KEYS=chave1,chave2,chave3,chave4
API_TOKEN_SALT=chave_salt
ADMIN_JWT_SECRET=chave_admin
JWT_SECRET=chave_jwt
TRANSFER_TOKEN_SALT=chave_transfer
SPOTIFY_CLIENT_ID=seu_spotify_client_id
SPOTIFY_CLIENT_SECRET=seu_spotify_client_secret
SOUNDCLOUD_CLIENT_ID=seu_soundcloud_client_id
```

**Gerar chaves:**
```bash
# Use o script incluído
node scripts/generate-keys.js
```

### 3. Configurar CORS

No arquivo `strapi/config/middlewares.js` (ou criar se não existir):

```javascript
module.exports = [
  'strapi::logger',
  'strapi::errors',
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'connect-src': ["'self'", 'https:'],
          'img-src': ["'self'", 'data:', 'blob:', 'res.cloudinary.com'],
          'media-src': ["'self'", 'data:', 'blob:', 'res.cloudinary.com'],
          upgradeInsecureRequests: null,
        },
      },
    },
  },
  {
    name: 'strapi::cors',
    config: {
      origin: [
        'http://localhost:3000',
        'http://localhost:5173',
        'https://your-vercel-domain.vercel.app',
        'https://silverpanda.com', // Seu domínio de produção
      ],
    },
  },
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
```

### 4. Criar os Content Types

Acesse o admin do Strapi: `http://localhost:1337/admin`

Crie os seguintes Content Types:

#### A. Homepage (Single Type)
- `title` (texto, opcional)
- `subtitle` (texto, opcional)
- `metaTitle` (texto, opcional)
- `heroLogo` (media - imagem, opcional)
- `heroBackground` (media - imagem, opcional – não exibido por padrão)

#### B. Music Page (Single Type)
- Componentes:
  - `spotifyTracks` (repeatable)
  - `soundcloudTracks` (repeatable)
- Basta informar o `trackId` (Spotify) ou `trackId/permalinkUrl` (SoundCloud); ao salvar, os dados são puxados automaticamente das APIs oficiais.

#### C. Collaborations Page (Single Type)
- Componentes:
  - `instagramPosts` (repeatable)
- Informe o `permalink` e a mídia (upload ou URL). Os demais campos são opcionais.

#### D. Tour Dates (Collection Type)
- `date` (Date)
- `city` (Text)
- `country` (Text)
- `venue` (Text)
- `link` (Text, optional)

#### E. Videos (Collection Type)
- `title` (Text)
- `youtubeId` (Text) ou `youtubeUrl` (Text)
- `year` (Text)
- `category` (Text) - ex: "Music Videos", "Sets", "PGTV"
- `thumbnail` (Media - Single)
- `credits` (Text - Long text ou Component)
- `releaseDate` (Date, optional)

#### F. Press Features (Collection Type)
- `publication` (Text)
- `title` (Text, optional)
- `date` (Date)
- `link` (Text, optional)
- `cover` (Media - Single)

#### G. About (Single Type)
- `image` (Media - Single)
- `description` (Text)
- `paragraph1` (Text)
- `paragraph2` (Text)
- `paragraph3` (Text)
- `contactManagement` (Text)
- `contactManagementLink` (Text)
- `contactBookings` (Text)
- `contactBookingsLink` (Text)
- `credit` (Text)

### 5. Configurar Permissões Públicas

No Strapi Admin:
1. Settings → Users & Permissions Plugin → Roles → Public
2. Marque as permissões de leitura para:
   - `homepage` - find
   - `music-page` - find
   - `collaborations-page` - find
   - `tour-dates` - find, findOne
   - `videos` - find, findOne
   - `press-features` - find, findOne
   - `about` - find

### 6. Criar API Token (Opcional, mas recomendado)

1. Settings → API Tokens → Create new API Token
2. Nome: "Frontend Token"
3. Token type: Read-only
4. Token duration: Unlimited
5. Permissões: Todas as collections acima com `find` e `findOne`

### 7. Configurar o Frontend

No arquivo `.env` do frontend (`silverpanda-repo/.env`):

```env
# Para desenvolvimento local
VITE_STRAPI_BASE_URL=http://localhost:1337

# Para produção (após hospedar o Strapi)
VITE_STRAPI_BASE_URL=https://your-strapi-domain.com

# Token (se criou um API Token)
VITE_STRAPI_API_TOKEN=seu_token_aqui

# Modo Live Preview (opcional: use 'preview' para ver rascunhos)
VITE_STRAPI_PUBLICATION_STATE=preview
```

### 8. Configurar Preview / Live Preview

1. No arquivo `strapi/.env`, adicione:
   ```env
   CLIENT_URL=http://localhost:3000
   PREVIEW_URL=http://localhost:3000
   PREVIEW_SECRET=uma_chave_segura_aqui
   ```
2. Confira o arquivo `strapi/config/admin.ts` para garantir que o bloco `preview` está habilitado. O handler já gera URLs no formato:
   ```
   {PREVIEW_URL}/?preview=true&uid=...&documentId=...&status=...
   ```
3. Abra o Strapi Admin → Content Manager → qualquer entry → clique em **Open preview**. O frontend será carregado em modo preview, consumindo rascunhos (`publicationState=preview`) e habilitando o Live Preview.
4. Dentro do preview, o frontend envia `previewReady` automaticamente e injeta o script fornecido pelo Strapi para edição inline. Ao salvar ou atualizar, o evento `strapiUpdate` força o recarregamento da página.

## Hospedagem do Strapi

### Opção A: Vercel (Serverless)

O Strapi pode ser hospedado no Vercel, mas requer configuração especial. Recomendo usar Railway ou Render.

### Opção B: Railway (Recomendado) 🚂

1. Crie conta em https://railway.app
2. New Project → Deploy from GitHub
3. Selecione o repositório do Strapi
4. Configure as variáveis de ambiente
5. Railway detecta automaticamente e faz deploy

### Opção C: Render

1. Crie conta em https://render.com
2. New → Web Service
3. Conecte o repositório do Strapi
4. Build Command: `npm install && npm run build`
5. Start Command: `npm start`
6. Configure as variáveis de ambiente

### Opção D: Strapi Cloud

1. Acesse https://cloud.strapi.io
2. Crie um projeto
3. Siga o wizard de setup
4. Mais fácil, mas pago

## Variáveis de Ambiente para Produção

No serviço de hospedagem, configure:

```env
HOST=0.0.0.0
PORT=1337
APP_KEYS=chave1,chave2,chave3,chave4
API_TOKEN_SALT=chave_salt
ADMIN_JWT_SECRET=chave_admin
JWT_SECRET=chave_jwt
TRANSFER_TOKEN_SALT=chave_transfer
DATABASE_CLIENT=postgres
DATABASE_HOST=seu_host
DATABASE_PORT=5432
DATABASE_NAME=strapi
DATABASE_USERNAME=seu_user
DATABASE_PASSWORD=sua_senha
DATABASE_SSL=true
SPOTIFY_CLIENT_ID=seu_spotify_client_id
SPOTIFY_CLIENT_SECRET=seu_spotify_client_secret
SOUNDCLOUD_CLIENT_ID=seu_soundcloud_client_id
```

## Resumo

1. **Crie o projeto Strapi** (separado ou dentro deste repo)
2. **Configure os Content Types** no admin
3. **Configure CORS** para permitir o frontend
4. **Configure permissões públicas** ou crie API Token
5. **Hospede o Strapi** (Railway, Render, etc.)
6. **Configure `VITE_STRAPI_BASE_URL`** (e, se quiser live preview, `VITE_STRAPI_PUBLICATION_STATE=preview`) no frontend apontando para o Strapi hospedado

## URLs Esperadas pelo Frontend

O frontend faz requisições para:
- `GET {STRAPI_BASE_URL}/api/homepage?populate=heroBackground&populate=heroLogo`
- `GET {STRAPI_BASE_URL}/api/tour-dates?sort=date:asc`
- `GET {STRAPI_BASE_URL}/api/videos?populate=thumbnail&sort=order:asc`
- `GET {STRAPI_BASE_URL}/api/press-features?populate=cover&sort=publishedAt:desc`
- `GET {STRAPI_BASE_URL}/api/about?populate=image`

Certifique-se de que essas rotas estão acessíveis publicamente ou com o token configurado.

