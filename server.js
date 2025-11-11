// Servidor para desenvolvimento local - executa as serverless functions
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(express.json());

// Serve audio files with correct MIME type
app.use('/Promo\\ Tracks', (req, res, next) => {
  const filePath = join(__dirname, 'public', 'Promo Tracks', decodeURIComponent(req.path.substring(1)));
  console.log('[Audio Middleware] Request for:', req.path);
  console.log('[Audio Middleware] File path:', filePath);
  console.log('[Audio Middleware] File exists:', existsSync(filePath));

  if (existsSync(filePath) && filePath.endsWith('.wav')) {
    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('Accept-Ranges', 'bytes');
    res.sendFile(filePath);
  } else {
    next();
  }
});

// Helper para criar o contexto do handler
function createHandler(req) {
  return {
    method: req.method,
    query: req.query || {},
    body: req.body,
    headers: req.headers,
  };
}

// Helper para executar a função serverless
async function executeFunction(filePath, req, res) {
  try {
    const module = await import(`file://${filePath}`);
    const handler = module.default;
    
    if (typeof handler !== 'function') {
      return res.status(500).json({ error: 'Handler is not a function' });
    }

    const handlerReq = createHandler(req);
    
    const handlerRes = {
      status: (code) => ({
        json: (data) => {
          res.status(code).json(data);
        },
        end: () => {
          res.status(code).end();
        },
      }),
      setHeader: (name, value) => {
        res.setHeader(name, value);
      },
      json: (data) => {
        res.json(data);
      },
    };

    await handler(handlerReq, handlerRes);
  } catch (error) {
    console.error('Error executing function:', error);
    res.status(500).json({ error: error.message });
  }
}

// Proxy de imagens do Instagram (para contornar CORS)
app.get('/api/proxy-image', async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.instagram.com/',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch image' });
    }

    // Copiar headers de conteúdo
    const contentType = response.headers.get('content-type');
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }

    // Headers de cache
    res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 horas
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Enviar a imagem
    const buffer = await response.buffer();
    res.send(buffer);
  } catch (error) {
    console.error('Error proxying image:', error);
    res.status(500).json({ error: 'Failed to proxy image' });
  }
});

// Rota para /api/*
app.all('/api/*', async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Extrair path: /api/spotify/albums -> spotify/albums
  const path = req.path.replace('/api/', '').replace(/\.js$/, '');
  const parts = path.split('/');
  const filePath = join(__dirname, 'api', ...parts) + '.js';

  try {
    await executeFunction(filePath, req, res);
  } catch (error) {
    console.error('Error loading function:', error);
    res.status(404).json({ error: 'Function not found: ' + path });
  }
});

const PORT = 8080;
app.listen(PORT, () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
  console.log(`📁 Serving functions from: ${join(__dirname, 'api')}`);
});

