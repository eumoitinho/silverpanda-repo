# 🔧 Correção Rápida - Problema de Permissões do nvm

## Problema
Você está tendo erros de permissão ao tentar instalar Node.js com nvm:
```
mkdir: /Users/eumoitinho/.nvm/alias: Permission denied
```

## Solução Rápida

### Opção 1: Corrigir Permissões Manualmente

Execute no terminal:

```bash
# Corrigir permissões do diretório .nvm
chmod -R u+w ~/.nvm

# Depois tente instalar novamente
nvm install 18
nvm use 18
nvm alias default 18
```

### Opção 2: Usar o Script Incluído

```bash
# Execute o script de correção
./scripts/fix-nvm-permissions.sh
```

### Opção 3: Se ainda não funcionar

Se as permissões ainda estiverem incorretas, você pode precisar ajustar o proprietário:

```bash
# Verificar proprietário atual
ls -la ~/.nvm | head -3

# Se necessário, ajustar proprietário (substitua 'eumoitinho' pelo seu usuário se diferente)
sudo chown -R $(whoami) ~/.nvm

# Depois corrigir permissões
chmod -R u+w ~/.nvm
```

## ⚠️ IMPORTANTE: NÃO use `sudo` com nvm

O nvm é um script de shell que deve ser executado como seu usuário normal, não como root. Usar `sudo` com nvm causa problemas de permissão.

## Verificar Instalação

Após corrigir, verifique:

```bash
# Ver versão do Node
node --version

# Ver versão do npm
npm --version

# Ver versões instaladas
nvm list
```

## Para este Projeto

Este projeto funciona com Node.js 18 ou superior. Recomendamos usar Node.js 18 LTS:

```bash
nvm install 18
nvm use 18
nvm alias default 18
```

