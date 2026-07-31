# 🚀 Guia de Implantação do Importhour na Hostinger e GitHub

Este repositório foi **totalmente corrigido e otimizado** para rodar sem erros de compilação ou compatibilidade em servidores Linux como a **Hostinger** (Hospedagem Node.js, VPS ou Git Auto Deploy) e em pipelines do **GitHub**.

---

## 🛠️ O que causava o erro na Hostinger?

O erro original na Hostinger:
```text
Error: /lib64/libm.so.6: version `GLIBC_2.29' not found (required by .../@rollup/rollup-linux-x64-gnu/rollup.linux-x64-gnu.node)
```
ocorria porque os servidores web da Hostinger utilizam distribuições Linux com uma versão da biblioteca de sistema `GLIBC` inferior a `2.29`. A versão padrão do Rollup nativo exige C++ compilado para `GLIBC 2.29+`.

### ✅ Correções Aplicadas no Código:
1. **Ativação do Rollup WebAssembly (`@rollup/wasm-node`)**:
   - Adicionamos o pacote `@rollup/wasm-node` diretamente no `package.json` em `dependencies` e `overrides`.
   - Mapeamos o alias do Rollup em `vite.config.ts` para `@rollup/wasm-node`.
   - Desta forma, a compilação do Vite roda **100% em WebAssembly**, eliminando qualquer dependência de binários C++ ou versões de `GLIBC` do sistema operacional da Hostinger.

---

## 📦 Passos para Enviar ao GitHub e Implantar na Hostinger

### 1️⃣ Subir o Código para o GitHub

No terminal do seu computador (na pasta do projeto):
```bash
git init
git add .
git commit -m "feat: configurado para deploy na Hostinger com Rollup WASM"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git
git push -u origin main
```

---

### 2️⃣ Conexão Direta via Terminal SSH da Hostinger

Com as credenciais do seu painel Hostinger, você pode se conectar diretamente ao servidor via terminal para clonar, instalar e rodar o projeto:

```bash
# 1. Conecte-se ao seu servidor Hostinger
ssh -p 65002 u959973173@149.62.37.44

# 2. Navegue até a pasta da sua aplicação (ex: public_html ou pasta do domínio)
cd public_html

# 3. Clone o repositório ou atualize o código existente
git pull origin main

# 4. Instale as dependências e faça o build em formato WebAssembly (compatível com a Hostinger)
npm install
npm run build

# 5. Inicie a aplicação com o PM2 ou Node em produção
npm run start
```

---

### 3️⃣ Configuração do Projeto na Hostinger (Node.js Application)

No painel de controle hPanel da Hostinger:

1. Vá em **Aplicações Node.js** (ou **Criar Aplicação Node.js**).
2. **Versão do Node.js**: Escolha **Node.js 20.x** ou **22.x**.
3. **Modo de Aplicação**: `Production`.
4. **Pasta Raiz do Aplicativo**: `public_html` (ou a pasta do seu domínio).
5. **Arquivo de Início (Entry point)**:
   ```text
   dist/server.cjs
   ```
6. **Comando de Build (Build Command)**:
   ```bash
   npm install && npm run build
   ```
7. **Comando de Início (Start Command)**:
   ```bash
   npm run start
   ```

---

### 3️⃣ Caso Ocorra Cache de `node_modules` antigo na Hostinger

Se a Hostinger tentar reaproveitar a pasta `node_modules` antiga de uma tentativa com falha, execute o comando de limpeza no terminal SSH ou no console de build da Hostinger:

```bash
npm run clean
npm install
npm run build
```

O script `npm run clean` limpa automaticamente `dist`, `node_modules` e `package-lock.json`.

---

### 4️⃣ Variáveis de Ambiente (`.env`)

Copie as variáveis do seu `.env.example` para as configurações de ambiente no painel da Hostinger (ou crie o arquivo `.env` na raiz do projeto no gerenciador de arquivos da Hostinger):

```env
NODE_ENV=production
PORT=3000
GEMINI_API_KEY=sua_chave_aqui
```

---

## ⚡ Verificação de Comandos do `package.json`

- **`npm run dev`**: Executa o servidor de desenvolvimento.
- **`npm run build`**: Gera o build estático do frontend na pasta `dist/` e empacota o backend Express em `dist/server.cjs` via `esbuild`.
- **`npm run start`**: Executa o servidor Node em produção via `node dist/server.cjs`.
- **`npm run clean`**: Remove artefatos de build antigos e limpa `node_modules`.
