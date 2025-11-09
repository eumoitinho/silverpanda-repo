# Onde Encontrar o Plugin Track Selector

## Localização no Strapi Admin

O plugin **Track Selector** deve aparecer no **menu lateral esquerdo** do Strapi Admin, com um ícone de música 🎵.

### Passos para acessar:

1. **Inicie o Strapi** (se ainda não estiver rodando):
   ```bash
   cd strapi
   npm run develop
   ```

2. **Acesse o Admin Panel**:
   - Abra `http://localhost:1337/admin` no navegador
   - Faça login se necessário

3. **Procure no menu lateral**:
   - O item "**Track Selector**" deve aparecer no menu lateral esquerdo
   - Ícone: 🎵 (música)
   - Localização: Geralmente após os itens padrão (Content Manager, etc.)

4. **Clique em "Track Selector"** para abrir a interface de seleção de tracks

## Se não aparecer:

### Verifique se o Strapi foi reiniciado:
- O plugin só aparece após reiniciar o servidor Strapi
- Pare o servidor (Ctrl+C) e inicie novamente: `npm run develop`

### Verifique o console do navegador:
- Abra o DevTools (F12)
- Veja se há erros no console
- Erros comuns: imports incorretos, componentes não encontrados

### Verifique os logs do Strapi:
- Veja se há erros de compilação TypeScript
- Verifique se todos os arquivos foram salvos corretamente

## Estrutura do Plugin:

```
strapi/src/
├── admin/
│   └── app.tsx (registra o menu link)
└── plugins/
    └── track-selector/
        └── admin/
            └── src/
                └── pages/
                    ├── HomePage/ (página principal)
                    └── TrackSelector/ (componente React)
```

## URL Direta:

Se o menu não aparecer, você pode tentar acessar diretamente:
- `http://localhost:1337/admin/plugins/track-selector`

## Troubleshooting:

1. **Plugin não aparece no menu:**
   - Verifique se `strapi/src/admin/app.tsx` está correto
   - Reinicie o Strapi completamente

2. **Erro ao abrir a página:**
   - Verifique se todos os componentes estão exportados corretamente
   - Veja os erros no console do navegador

3. **Tracks não carregam:**
   - Verifique se as variáveis de ambiente estão configuradas:
     - `SPOTIFY_CLIENT_ID`
     - `SPOTIFY_CLIENT_SECRET`
     - `SOUNDCLOUD_CLIENT_ID`
   - Verifique se o endpoint `/api/music-page/available-tracks` está funcionando

