#!/bin/bash

# Script para configurar o Strapi após criar os Content Types

echo "🚀 Configurando Strapi para Silver Panda..."
echo ""

# Verificar se está no diretório correto
if [ ! -d "strapi" ]; then
    echo "❌ Erro: Diretório 'strapi' não encontrado!"
    echo "   Execute este script da raiz do projeto: ./scripts/setup-strapi.sh"
    exit 1
fi

cd strapi

# Verificar se o .env existe
if [ ! -f ".env" ]; then
    echo "📝 Criando arquivo .env..."
    cp .env.example .env 2>/dev/null || {
        echo "⚠️  .env.example não encontrado. Criando .env básico..."
        cat > .env << ENVEOF
APP_KEYS=toBeModified1,toBeModified2,toBeModified3,toBeModified4
API_TOKEN_SALT=toBeModified
ADMIN_JWT_SECRET=toBeModified
JWT_SECRET=toBeModified
TRANSFER_TOKEN_SALT=toBeModified
HOST=0.0.0.0
PORT=1337
DATABASE_CLIENT=better-sqlite3
DATABASE_FILENAME=.tmp/data.db
FRONTEND_URL=http://localhost:3000
ENVEOF
    }
    echo "⚠️  IMPORTANTE: Edite o arquivo strapi/.env e adicione as chaves de segurança!"
    echo "   Execute: node scripts/generate-keys.js para gerar chaves seguras"
fi

echo ""
echo "✅ Estrutura do Strapi configurada!"
echo ""
echo "📋 Próximos passos:"
echo ""
echo "1. Gere as chaves de segurança:"
echo "   cd .. && node scripts/generate-keys.js"
echo ""
echo "2. Edite strapi/.env e adicione as chaves geradas"
echo ""
echo "3. Inicie o Strapi:"
echo "   cd strapi && npm run develop"
echo ""
echo "4. Acesse http://localhost:1337/admin e:"
echo "   - Crie sua conta de admin"
echo "   - Configure permissões públicas (Settings → Users & Permissions → Public)"
echo "   - Adicione conteúdo inicial"
echo ""
echo "5. Configure o frontend no arquivo .env:"
echo "   VITE_STRAPI_BASE_URL=http://localhost:1337"
echo ""

