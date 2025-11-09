# Music Page Setup - Seleção Automática de Tracks

## Como Funciona

O sistema permite selecionar tracks do Spotify e SoundCloud automaticamente. Existem duas formas de adicionar tracks:

### Método 1: Seleção por IDs (Recomendado)

1. Acesse o endpoint `/api/music-page/available-tracks?provider=spotify` ou `/api/music-page/available-tracks?provider=soundcloud` para ver as tracks disponíveis
2. No Strapi Admin, edite a página "Music Page"
3. No campo `selectedSpotifyTrackIds`, adicione um array JSON com os IDs das tracks que deseja exibir:
   ```json
   ["4iV5W9uYEdYUVa79Axb7Rh", "3n3Ppam7vgaVa1URUkwnv8"]
   ```
4. No campo `selectedSoundcloudTrackIds`, faça o mesmo para tracks do SoundCloud:
   ```json
   ["123456789", "987654321"]
   ```
5. Ao salvar, o sistema automaticamente:
   - Busca as informações das tracks nas APIs
   - Cria os componentes `spotifyTracks` e `soundcloudTracks` com todos os dados
   - Preenche automaticamente título, artista, álbum, artwork, etc.

### Método 2: Adicionar Componentes Manualmente

Você também pode adicionar componentes `spotifyTracks` e `soundcloudTracks` manualmente:
- Preencha o `trackId` (Spotify) ou `trackId`/`permalinkUrl` (SoundCloud)
- O sistema preencherá automaticamente os campos do componente `manual` ao salvar

## Endpoint de Tracks Disponíveis

Para ver as tracks disponíveis, faça uma requisição autenticada para:

```
GET /api/music-page/available-tracks?provider=spotify
GET /api/music-page/available-tracks?provider=soundcloud
```

Resposta:
```json
{
  "data": [
    {
      "id": "4iV5W9uYEdYUVa79Axb7Rh",
      "title": "Track Name",
      "artist": "Artist Name",
      "album": "Album Name",
      "artwork": "https://...",
      "externalUrl": "https://open.spotify.com/track/..."
    }
  ],
  "provider": "spotify"
}
```

## Notas

- Os IDs selecionados são processados automaticamente ao salvar a página
- Se uma track não for encontrada na API, será criada com dados mínimos
- Componentes existentes são preservados ao adicionar novos IDs
- Duplicatas são evitadas automaticamente

