#!/bin/bash

# Script para corrigir permissões do nvm e instalar Node.js

echo "🔧 Corrigindo permissões do nvm..."

# Garantir que o nvm está carregado
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Corrigir permissões do diretório .nvm
if [ -d "$HOME/.nvm" ]; then
    echo "Ajustando permissões de $HOME/.nvm..."
    chmod -R u+w "$HOME/.nvm" 2>/dev/null || {
        echo "⚠️  Não foi possível ajustar permissões automaticamente."
        echo "   Execute manualmente: chmod -R u+w ~/.nvm"
    }
else
    echo "❌ Diretório .nvm não encontrado em $HOME/.nvm"
    exit 1
fi

# Verificar versão atual do Node
echo ""
echo "📦 Versão atual do Node.js:"
node --version 2>/dev/null || echo "Node.js não está instalado"

# Instalar Node.js 18 (LTS recomendado)
echo ""
echo "📥 Instalando Node.js 18 (LTS)..."
nvm install 18

# Usar Node.js 18
echo ""
echo "🔄 Ativando Node.js 18..."
nvm use 18

# Definir como padrão
echo ""
echo "⭐ Definindo Node.js 18 como padrão..."
nvm alias default 18

echo ""
echo "✅ Concluído!"
echo "📦 Node.js versão: $(node --version)"
echo "📦 npm versão: $(npm --version)"

