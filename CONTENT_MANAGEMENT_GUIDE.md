# Guia do Sistema de Gerenciamento de Conteúdo

Este guia explica como usar o sistema de gerenciamento de conteúdo do Strapi para selecionar e publicar músicas do Spotify/SoundCloud, vídeos do YouTube e posts do Instagram.

## Índice

1. [Visão Geral](#visão-geral)
2. [Painel Visual de Seleção](#painel-visual-de-seleção)
3. [Configuração Inicial](#configuração-inicial)
4. [Music Page - Spotify & SoundCloud](#music-page)
5. [Videos Page - YouTube](#videos-page)
6. [Collaborations Page - Instagram](#collaborations-page)
7. [Endpoints da API](#endpoints-da-api)
8. [Troubleshooting](#troubleshooting)

## Visão Geral

O sistema permite que você:

- **Music Page**: Selecione tracks do Spotify e SoundCloud que serão exibidos na página de música
- **Videos Page**: Selecione vídeos do YouTube que serão exibidos na página de vídeos
- **Collaborations Page**: Selecione posts do Instagram que serão exibidos na página de colaborações

**Como funciona:**
1. ✨ **NOVO**: Use o painel visual para ver e selecionar conteúdo clicando em cards
2. OU você pode informar manualmente IDs/URLs no Content Manager
3. O Strapi busca automaticamente todos os dados das APIs oficiais
4. Os dados são salvos e podem ser editados manualmente se necessário
5. O conteúdo é publicado e disponibilizado via API REST para o frontend

## Painel Visual de Seleção

### ⭐ A Forma Mais Fácil de Selecionar Conteúdo!

Acesse o **Content Manager** no menu lateral do Strapi Admin:
- Clique em **Plugins → Content Manager** (ícone de grade com checkmark)
- Você verá 3 abas: **Music**, **Videos** e **Collaborations**

#### Como Usar:

**1. Music (Spotify/SoundCloud)**
- Selecione o provider (Spotify ou SoundCloud)
- Veja cards visuais com artwork, título, artista e álbum
- Clique nos cards para selecionar/desselecionar
- Use a busca para filtrar por título, artista ou álbum
- Clique em "Save Selection" para salvar

**2. Videos (YouTube)**
- Digite o YouTube Channel ID
- Clique em "Load Videos" para carregar os vídeos do canal
- Veja cards com thumbnail, título e views
- Clique nos cards para selecionar
- Salve sua seleção

**3. Collaborations (Instagram)**
- Veja automaticamente os posts recentes da sua conta
- Clique nos cards para selecionar
- Veja preview da mídia, caption, likes e comentários
- Salve sua seleção

**Vantagens do Painel Visual:**
- ✅ Não precisa digitar IDs manualmente
- ✅ Vê preview do conteúdo antes de selecionar
- ✅ Interface intuitiva com cards visuais
- ✅ Busca e filtros para encontrar conteúdo rapidamente
- ✅ Seleciona múltiplos itens de uma vez

## Configuração Inicial

### 1. Configure as Credenciais das APIs

Copie o arquivo `.env.example` para `.env` no diretório `strapi/`:

```bash
cd strapi
cp .env.example .env
```

Edite o arquivo `.env` e adicione suas credenciais:

#### Spotify API
1. Acesse https://developer.spotify.com/dashboard
2. Crie um novo app
3. Copie o **Client ID** e **Client Secret**
4. Adicione ao `.env`:
```env
SPOTIFY_CLIENT_ID=seu_client_id_aqui
SPOTIFY_CLIENT_SECRET=seu_client_secret_aqui
```

#### SoundCloud API
1. Acesse https://developers.soundcloud.com/
2. Registre seu app
3. Copie o **Client ID**
4. Adicione ao `.env`:
```env
SOUNDCLOUD_CLIENT_ID=seu_client_id_aqui
```

#### YouTube API
1. Acesse https://console.cloud.google.com/
2. Crie um novo projeto (ou use existente)
3. Ative a **YouTube Data API v3**
4. Crie uma credencial do tipo **API Key**
5. Adicione ao `.env`:
```env
YOUTUBE_API_KEY=sua_api_key_aqui
```

#### Instagram API
1. Acesse https://developers.facebook.com/apps/
2. Crie um app com **Instagram Graph API** (requer conta Business/Creator)
3. Obtenha um **Access Token** e **User ID**
4. Adicione ao `.env`:
```env
INSTAGRAM_ACCESS_TOKEN=seu_access_token_aqui
INSTAGRAM_USER_ID=seu_user_id_aqui
```

### 2. Inicie o Strapi

```bash
cd strapi
npm install
npm run develop
```

Acesse o painel admin em: `http://localhost:1337/admin`

### 3. Configure Permissões

No Strapi Admin:
1. Vá em **Settings → Users & Permissions → Roles → Public**
2. Marque as permissões de leitura (`find`) para:
   - `music-page`
   - `videos-page`
   - `collaborations-page`

## Music Page

### Selecionando Tracks do Spotify

1. No Strapi Admin, vá em **Content Manager → Music Page**
2. No campo `selectedSpotifyTrackIds`, adicione os IDs das tracks:
   ```json
   ["3n3Ppam7vgaVa1iaRUc9Lp", "011CUxemJqk7APX66YN1Va"]
   ```
3. Clique em **Save**

**Como obter o ID de uma track do Spotify:**
- URL: `https://open.spotify.com/track/3n3Ppam7vgaVa1iaRUc9Lp`
- ID: `3n3Ppam7vgaVa1iaRUc9Lp` (parte após `/track/`)

**O que acontece automaticamente:**
- O sistema busca os dados da track (título, artista, álbum, duração, arte, preview, etc.)
- Os dados são salvos nos componentes `spotifyTracks`
- Você pode editar manualmente qualquer campo se necessário

### Selecionando Tracks do SoundCloud

1. No campo `selectedSoundcloudTrackIds`, adicione os IDs ou URLs:
   ```json
   ["1234567890", "https://soundcloud.com/artist/track-name"]
   ```
2. Clique em **Save**

**Como obter o ID/URL de uma track do SoundCloud:**
- Use a URL completa da track: `https://soundcloud.com/silverpanda/track-name`
- Ou use o ID numérico se souber

### Listar Tracks Disponíveis

Você pode buscar as top tracks diretamente da API:

**Spotify:**
```bash
GET http://localhost:1337/api/music-page/available-tracks?provider=spotify
```

**SoundCloud:**
```bash
GET http://localhost:1337/api/music-page/available-tracks?provider=soundcloud
```

## Videos Page

### Selecionando Vídeos do YouTube

1. No Strapi Admin, vá em **Content Manager → Videos Page**
2. No campo `selectedYouTubeVideoIds`, adicione os IDs ou URLs dos vídeos:
   ```json
   ["dQw4w9WgXcQ", "https://www.youtube.com/watch?v=jNQXAC9IVRw"]
   ```
3. Clique em **Save**

**Como obter o ID de um vídeo do YouTube:**
- URL: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
- ID: `dQw4w9WgXcQ` (parâmetro `v=`)

**O que acontece automaticamente:**
- Busca título, descrição, canal, thumbnail, duração, views, likes, etc.
- Os dados são salvos nos componentes `youtubeVideos`
- Você pode categorizar os vídeos (Music Videos, PGTV, Sets, Other)

### Listar Vídeos de um Canal

Para buscar vídeos de um canal específico:

```bash
GET http://localhost:1337/api/videos-page/available-videos?channelId=UCxxxxxx
```

## Collaborations Page

### Selecionando Posts do Instagram

1. No Strapi Admin, vá em **Content Manager → Collaborations Page**
2. No campo `selectedInstagramPostIds`, adicione os IDs ou URLs dos posts:
   ```json
   ["https://www.instagram.com/p/ABC123/", "https://www.instagram.com/reel/XYZ789/"]
   ```
3. Clique em **Save**

**Como obter o ID/URL de um post do Instagram:**
- Use a URL completa do post: `https://www.instagram.com/p/ABC123/`
- O sistema extrai automaticamente o shortcode

**O que acontece automaticamente:**
- Busca caption, mídia, tipo (image/video/carousel), timestamp, likes, comments
- Os dados são salvos nos componentes `instagramPosts`
- Se a API não estiver configurada, você pode preencher manualmente

### Listar Posts Recentes

Para buscar os posts mais recentes da sua conta:

```bash
GET http://localhost:1337/api/collaborations-page/available-posts
```

## Endpoints da API

### Music Page

```bash
# Buscar conteúdo publicado
GET /api/music-page

# Atualizar conteúdo (admin)
PUT /api/music-page
Body: {
  "data": {
    "title": "Music",
    "selectedSpotifyTrackIds": ["id1", "id2"],
    "selectedSoundcloudTrackIds": ["id3", "id4"]
  }
}

# Listar tracks disponíveis
GET /api/music-page/available-tracks?provider=spotify
GET /api/music-page/available-tracks?provider=soundcloud
```

### Videos Page

```bash
# Buscar conteúdo publicado
GET /api/videos-page

# Atualizar conteúdo (admin)
PUT /api/videos-page
Body: {
  "data": {
    "title": "Videos",
    "selectedYouTubeVideoIds": ["videoId1", "videoId2"]
  }
}

# Listar vídeos de um canal
GET /api/videos-page/available-videos?channelId=UCxxxxxx
```

### Collaborations Page

```bash
# Buscar conteúdo publicado
GET /api/collaborations-page

# Atualizar conteúdo (admin)
PUT /api/collaborations-page
Body: {
  "data": {
    "title": "Collaborations",
    "selectedInstagramPostIds": ["url1", "url2"]
  }
}

# Listar posts recentes
GET /api/collaborations-page/available-posts
```

## Troubleshooting

### Erro: "Missing SPOTIFY_CLIENT_ID"

**Causa:** Credenciais do Spotify não configuradas no `.env`

**Solução:**
1. Verifique se o arquivo `strapi/.env` existe
2. Adicione as credenciais do Spotify
3. Reinicie o Strapi

### Erro: "Failed to fetch track"

**Causa:** ID inválido ou API não respondendo

**Solução:**
1. Verifique se o ID está correto
2. Teste o ID diretamente no Spotify/YouTube/etc
3. Verifique os logs do Strapi para mais detalhes

### Dados não aparecem no frontend

**Causa:** Conteúdo não publicado ou permissões incorretas

**Solução:**
1. Certifique-se de clicar em **Publish** no Strapi (não apenas Save)
2. Verifique as permissões públicas em Settings → Roles → Public
3. Teste o endpoint diretamente: `GET /api/music-page`

### Instagram API não funciona

**Causa:** Instagram API requer autenticação OAuth complexa

**Solução:**
1. Se você tem uma conta Business/Creator, configure o Instagram Graph API
2. Se não, você pode:
   - Adicionar posts manualmente nos componentes
   - Ou usar apenas o permalink e preencher os campos manualmente

### YouTube API quota exceeded

**Causa:** A API do YouTube tem limites de uso diários

**Solução:**
1. Aguarde o reset do limite (meia-noite PST)
2. Reduza o número de requisições
3. Considere cachear os dados

## Melhores Práticas

1. **Teste localmente primeiro**: Configure tudo localmente antes de fazer deploy
2. **Use IDs quando possível**: IDs são mais confiáveis que URLs
3. **Publique regularmente**: Mantenha o conteúdo atualizado
4. **Verifique os logs**: Os logs do Strapi mostram erros detalhados
5. **Faça backup**: Exporte o banco de dados regularmente

## Próximos Passos

- Adicionar suporte para playlists do Spotify
- Implementar cache de dados das APIs
- Criar interface customizada no Strapi Admin
- Adicionar suporte para mais plataformas (TikTok, Twitter, etc.)
