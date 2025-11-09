# Track Selector Plugin

Plugin customizado para selecionar tracks do Spotify e SoundCloud visualmente no admin do Strapi.

## Funcionalidades

- Interface visual para selecionar tracks do Spotify e SoundCloud
- Busca automática das top tracks das APIs
- Filtro por busca de texto
- Seleção múltipla com checkboxes
- Salvamento automático que preenche os componentes do Music Page

## Como Usar

1. Acesse o menu lateral do Strapi Admin
2. Clique em "Track Selector"
3. Selecione o provedor (Spotify ou SoundCloud)
4. Use a busca para filtrar tracks
5. Marque as tracks que deseja exibir
6. Clique em "Save Selection"
7. O sistema automaticamente:
   - Salva os IDs selecionados
   - Busca os dados das tracks nas APIs
   - Cria os componentes `spotifyTracks` e `soundcloudTracks`
   - Preenche todos os campos automaticamente

## Estrutura

- `admin/src/` - Código do frontend (React)
- `server/src/` - Código do backend (se necessário)
- `admin/src/pages/TrackSelector/` - Componente principal da interface

## Dependências

- `@strapi/design-system` - Componentes UI
- `@strapi/helper-plugin` - Helpers do Strapi
- `react-query` - Gerenciamento de estado e cache

