# 🚀 Deploy Guide: Vercel + Railway

Este guia explica como fazer deploy do Silver Panda website usando Vercel (frontend) e Railway (backend API).

## 📋 Arquitetura

- **Frontend (Vercel)**: Vite + Static Assets + Promo Tracks
- **Backend (Railway)**: Express API + Spotify Integration

## 🎯 Passo a Passo

### 1. Deploy do Backend API (Railway)

#### 1.1. Criar conta no Railway
1. Acesse [railway.app](https://railway.app)
2. Faça login com GitHub

#### 1.2. Criar novo projeto
1. Clique em "New Project"
2. Escolha "Deploy from GitHub repo"
3. Selecione seu repositório `silverpanda-repo`
4. Railway detectará automaticamente Node.js

#### 1.3. Configurar variáveis de ambiente
No painel do Railway, vá em "Variables" e adicione:

```bash
SPOTIFY_CLIENT_ID=seu_client_id_aqui
SPOTIFY_CLIENT_SECRET=seu_client_secret_aqui
PORT=8080
NODE_ENV=production
```

💡 **Como obter credenciais do Spotify:**
1. Acesse [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard)
2. Crie um novo app
3. Copie Client ID e Client Secret

#### 1.4. Deploy
- Railway fará o deploy automaticamente
- Anote a URL gerada (ex: `https://silverpanda-api.railway.app`)

### 2. Deploy do Frontend (Vercel)

#### 2.1. Atualizar configuração
Abra `vercel.json` e substitua:

```json
"https://your-railway-api-url.railway.app"
```

Pela URL real do Railway (exemplo):

```json
"https://silverpanda-api.railway.app"
```

#### 2.2. Deploy no Vercel
1. Acesse [vercel.com](https://vercel.com)
2. Faça login com GitHub
3. Clique em "Add New Project"
4. Selecione seu repositório `silverpanda-repo`
5. Vercel detectará automaticamente Vite

#### 2.3. Configurações do Vercel
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

#### 2.4. Finalizar Deploy
- Clique em "Deploy"
- Vercel buildará e publicará automaticamente
- Sua URL estará disponível em poucos minutos

## ⚠️ Importante: Arquivos Grandes

Os arquivos WAV em `/public/Promo Tracks/` são muito grandes (50-58MB cada). **Considere uma das opções:**

### Opção 1: Comprimir para MP3 (Recomendado)
```bash
# Instalar ffmpeg primeiro: brew install ffmpeg
cd "public/Promo Tracks"
for file in *.wav; do
  ffmpeg -i "$file" -codec:a libmp3lame -qscale:a 2 "${file%.wav}.mp3"
done
```

Depois atualize `src/main.js` linha 1602:
```javascript
const audioUrl = `/Promo%20Tracks/${encodeURIComponent(file.filename.replace('.wav', '.mp3'))}`;
```

E linha 1679:
```html
<source src="${track.audioUrl}" type="audio/mpeg">
```

### Opção 2: Usar CDN Externo
Faça upload dos arquivos WAV para:
- AWS S3 + CloudFront
- Cloudinary
- Bunny CDN

Depois atualize as URLs em `src/main.js`.

## 🔄 Atualizações Automáticas

### Railway
- Push para `main` → Deploy automático
- Logs disponíveis no painel do Railway

### Vercel
- Push para `main` → Build e deploy automático
- Preview deployments para PRs
- Logs disponíveis no painel do Vercel

## 🐛 Troubleshooting

### Backend não responde
1. Verifique logs no Railway
2. Confirme variáveis de ambiente
3. Teste URL diretamente: `https://sua-url.railway.app/api/spotify/albums?limit=5`

### Frontend não carrega músicas
1. Confirme URL do Railway em `vercel.json`
2. Verifique CORS no console do navegador
3. Teste API diretamente no navegador

### Promo Tracks não tocam
1. Verifique tamanho dos arquivos (max 50MB no Vercel Free)
2. Considere comprimir para MP3
3. Verifique logs do navegador (F12)

## 📊 Monitoramento

### Railway
- Dashboard: Uso de CPU, RAM, Network
- Logs em tempo real
- Métricas de deploy

### Vercel
- Analytics integrado
- Core Web Vitals
- Function logs

## 💰 Custos

### Vercel (Free Tier)
- ✅ Bandwidth: 100GB/mês
- ✅ Builds: 6000 minutos/mês
- ⚠️ Function executions: 100GB-Hrs
- ⚠️ Limite de arquivo: 50MB

### Railway (Free Tier)
- ✅ $5 grátis/mês
- ⚠️ Depois: ~$0.000463/GB-hr

## 🎉 Pronto!

Seu site estará disponível em:
- Frontend: `https://silverpanda.vercel.app`
- API: `https://silverpanda-api.railway.app`

Para domínio customizado, configure em:
- Vercel → Settings → Domains
- Adicione CNAME para seu domínio
