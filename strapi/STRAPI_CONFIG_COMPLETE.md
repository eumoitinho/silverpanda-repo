# ✅ Configuração do Strapi - Próximos Passos

## 🎉 Content Types Criados

Os seguintes Content Types foram criados automaticamente:

1. **Homepage** (Single Type)
   - `title`, `subtitle`, `metaTitle`
   - `heroLogo`, `heroBackground`

2. **Music Page** (Single Type)
   - Componentes repeatables `spotifyTracks` e `soundcloudTracks` (preenchidos via API informando apenas o ID/link)

3. **Collaborations Page** (Single Type)
   - Componentes repeatables `instagramPosts` (permalink + mídia)

4. **Tour Date** (Collection Type)
   - `date` (date, required)
   - `city` (string, required)
   - `country` (string, required)
   - `venue` (string, required)
   - `link` (string, optional)
   - `ticketUrl` (string, optional)
   - `externalUrl` (string, optional)

5. **Video** (Collection Type)
   - `title` (string, required)
   - `youtubeId` (string) ou `youtubeUrl` (string)
   - `year` (string)
   - `category` (enum: Music Videos, PGTV, Sets, Other)
   - `thumbnail` (media - image)
   - `credits` (text)
   - `releaseDate` (date)
   - `order` (integer)

6. **Press Feature** (Collection Type)
   - `publication` (string, required)
   - `title` (string, optional)
   - `date` (date)
   - `link` (string, optional)
   - `cover` (media - image)

7. **About** (Single Type)
   - `image` (media - image)
   - `description` (text)
   - `paragraph1` (text)
   - `paragraph2` (text)
   - `paragraph3` (text)
   - `contactManagement` (string)
   - `contactManagementLink` (string)
   - `contactBookings` (string)
   - `contactBookingsLink` (string)
   - `credit` (string)

## 📋 Próximos Passos

### 1. Reiniciar o Strapi

```bash
cd strapi
npm run develop
```

O Strapi deve iniciar sem erros agora! ✅

### 2. Acessar o Admin

1. Abra `http://localhost:1337/admin`
2. Crie sua conta de administrador (se ainda não criou)
3. Faça login

### 3. Configurar Permissões Públicas

No Strapi Admin:

1. Vá em **Settings** → **Users & Permissions Plugin** → **Roles** → **Public**
2. Marque as seguintes permissões de **leitura**:
   - ✅ **homepage** → `find`
   - ✅ **music-page** → `find`
   - ✅ **collaborations-page** → `find`
   - ✅ **tour-date** → `find`, `findOne`
   - ✅ **video** → `find`, `findOne`
   - ✅ **press-feature** → `find`, `findOne`
   - ✅ **about** → `find`
3. Clique em **Save**

### 4. Criar API Token (Recomendado)

1. Vá em **Settings** → **API Tokens** → **Create new API Token**
2. Configure:
   - **Name**: `Frontend Token`
   - **Token type**: `Read-only`
   - **Token duration**: `Unlimited`
   - **Token permissions**: 
     - ✅ `homepage.find`
     - ✅ `tour-date.find`, `tour-date.findOne`
     - ✅ `video.find`, `video.findOne`
     - ✅ `press-feature.find`, `press-feature.findOne`
     - ✅ `about.find`
3. Clique em **Save**
4. **Copie o token gerado** (você vai precisar dele)

### 5. Adicionar Conteúdo Inicial

#### Homepage
1. Vá em **Content Manager** → **Homepage**
2. Clique em **Create new entry**
3. Preencha os campos do hero (Title, Subtitle, Meta Title, Hero Logo, Hero Background) e publique.

#### Music Page
1. Vá em **Content Manager** → **Music Page**
2. Clique em **Create new entry**
3. Para cada faixa:
   - Adicione um bloco **Spotify Track** ou **SoundCloud Track**
   - Informe apenas o `trackId` (Spotify) ou o `trackId/permalinkUrl` (SoundCloud)
   - Ao salvar, o Strapi consulta a API oficial e preenche título, artista, álbum, duração, data, links, preview e arte automaticamente. Ajuste manualmente se quiser sobrescrever.
4. Publique a entry.

#### Collaborations Page
1. Vá em **Content Manager** → **Collaborations Page**
2. Clique em **Create new entry**
3. Para cada card:
   - Informe o `permalink`
   - Envie a mídia (upload) ou preencha `mediaUrl`
   - Opcionalmente defina legenda, likes, comments
4. Publique.

#### Tour Dates
1. Vá em **Content Manager** → **Tour Date**
2. Clique em **Create new entry**
3. Adicione algumas datas de exemplo:
   - Date: escolha uma data
   - City: `Barcelona`
   - Country: `Spain`
   - Venue: `Parc Del Forum`
   - Link: (opcional) URL para tickets
4. **Save** e **Publish** cada uma

#### Videos
1. Vá em **Content Manager** → **Video**
2. Clique em **Create new entry**
3. Preencha:
   - **Title**: ex. `Silver Panda — Take No More`
   - **YouTube ID**: ID do vídeo (ex: `dQw4w9WgXcQ`) ou **YouTube URL**
   - **Year**: `2025`
   - **Category**: escolha uma (Music Videos, Sets, PGTV, Other)
   - **Thumbnail**: (opcional) faça upload de uma imagem
   - **Credits**: (opcional) ex. `Dir. Silver Panda`
   - **Order**: (opcional) número para ordenação
4. **Save** e **Publish**

#### Press Features
1. Vá em **Content Manager** → **Press Feature**
2. Clique em **Create new entry**
3. Preencha:
   - **Publication**: ex. `Billboard Magazine`
   - **Title**: (opcional)
   - **Date**: data da publicação
   - **Cover**: faça upload da imagem da capa
   - **Link**: (opcional) URL do artigo
4. **Save** e **Publish**

#### About
1. Vá em **Content Manager** → **About**
2. Clique em **Create new entry**
3. Preencha:
   - **Image**: faça upload da foto
   - **Description**: ou use os campos **Paragraph1**, **Paragraph2**, **Paragraph3**
   - **Contact Management**: ex. `management@silvpanda.com`
   - **Contact Management Link**: ex. `mailto:management@silvpanda.com`
   - **Contact Bookings**: ex. `bookings@silvpanda.com`
   - **Contact Bookings Link**: ex. `mailto:bookings@silvpanda.com`
   - **Credit**: ex. `Design by ANGELO`
4. **Save** e **Publish**

### 6. Configurar o Frontend

No arquivo `.env` na raiz do projeto (`silverpanda-repo/.env`):

```env
# Strapi Configuration
VITE_STRAPI_BASE_URL=http://localhost:1337
VITE_STRAPI_API_TOKEN=seu_token_aqui
VITE_STRAPI_PUBLICATION_STATE=preview
```

**Nota**: Se não criou um API Token, deixe `VITE_STRAPI_API_TOKEN` vazio. O frontend vai usar permissões públicas.
Use `VITE_STRAPI_PUBLICATION_STATE=preview` para visualizar alterações em tempo real (Live Edit). Para mostrar apenas conteúdo publicado, remova a variável ou defina `live`.

### 6.1 Configurar Preview / Live Preview no Strapi

No arquivo `strapi/.env`, adicione e ajuste conforme o ambiente:

```env
CLIENT_URL=http://localhost:3000
PREVIEW_URL=http://localhost:3000
PREVIEW_SECRET=sua_chave_preview_segura
```

O arquivo `strapi/config/admin.ts` já contém o bloco `preview` habilitado. Ele gera URLs no formato:

```
{PREVIEW_URL}/?preview=true&uid=api::homepage.homepage&documentId=...&status=draft
```

Quando o preview é aberto dentro do painel do Strapi, o frontend envia automaticamente o evento `previewReady`, recebe o script de Live Preview do Strapi e recarrega a página ao receber `strapiUpdate`. Assim, é possível fazer edição ao vivo diretamente do painel (Growth/Enterprise).

### 7. Testar a Integração

1. Inicie o frontend:
   ```bash
   npm run dev
   ```

2. Acesse `http://localhost:3000`

3. O conteúdo do Strapi deve aparecer automaticamente!

## 🔍 Verificar se está funcionando

### Testar API do Strapi diretamente:

```bash
# Homepage
curl "http://localhost:1337/api/homepage?populate=heroBackground,heroLogo"

# Music Page
curl "http://localhost:1337/api/music-page?populate[spotifyTracks][populate]=manualArtwork&populate[soundcloudTracks][populate]=manualArtwork"

# Collaborations Page
curl "http://localhost:1337/api/collaborations-page?populate=instagramPosts.media"

# Tour Dates
curl http://localhost:1337/api/tour-dates?sort=date:asc

# Videos
curl http://localhost:1337/api/videos?populate=thumbnail&sort=order:asc

# Press Features
curl http://localhost:1337/api/press-features?populate=cover&sort=publishedAt:desc

# About
curl http://localhost:1337/api/about?populate=image
```

### Com Token (se criou):

```bash
curl -H "Authorization: Bearer SEU_TOKEN_AQUI" http://localhost:1337/api/homepage
```

## 🚀 Deploy

### Para Produção

1. **Hospede o Strapi** (Railway, Render, Strapi Cloud, etc.)
2. **Atualize o `.env` do frontend** com a URL de produção:
   ```env
   VITE_STRAPI_BASE_URL=https://seu-strapi-domain.com
   VITE_STRAPI_API_TOKEN=seu_token_de_producao
   ```
3. **Configure CORS** no Strapi de produção para incluir seu domínio do frontend

## 📝 Notas Importantes

- ✅ Os Content Types já estão criados (sem componentes complexos)
- ✅ CORS já está configurado para localhost
- ⚠️ Você precisa configurar as permissões no admin
- ⚠️ Você precisa adicionar conteúdo inicial
- ⚠️ Para produção, atualize CORS com o domínio real

## 🆘 Troubleshooting

### Erro 403 (Forbidden)
- Verifique se configurou as permissões públicas corretamente
- Verifique se o conteúdo está publicado (não apenas salvo)

### CORS Error
- Verifique se o frontend está rodando na porta configurada no CORS
- Para produção, adicione o domínio no `middlewares.ts`

### Content não aparece
- Verifique se o conteúdo está **Published** (não apenas **Draft**)
- Verifique se as permissões estão configuradas
- Verifique o console do navegador para erros

### Erro "Metadata not found"
- ✅ **RESOLVIDO**: Removemos os componentes complexos e usamos campos simples
- Se ainda aparecer, delete a pasta `dist` e reinicie: `rm -rf dist && npm run develop`
