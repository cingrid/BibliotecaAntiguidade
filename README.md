# Biblioteca da Antiguidade

App pessoal para acompanhar leituras da Antiguidade: 356 livros (fontes antigas, estudos e recepção), 11 trilhas de leitura, status, datas, notas e citações. Feito para o celular.

- **Página inicial pública:** mostra a estante, as tradições e as trilhas.
- **Área com senha:** marcações de leitura, notas, lista de compras.
- **Hospedagem:** Vercel (site estático + uma função serverless).
- **Banco:** Upstash Redis, ligado pela Vercel.

## Estrutura

```
biblioteca-antiguidade/
├── index.html      ← o app inteiro (HTML, CSS e JavaScript)
├── catalog.json    ← os livros e as trilhas
├── api/
│   └── dados.js    ← lê e grava as marcações; confere a senha
├── package.json    ← dependência @upstash/redis
└── README.md
```

---

## Passo 1 — Subir o código para o GitHub

Você vai fazer os passos a seguir porque a Vercel publica direto de um repositório: a cada `git push`, o site se atualiza sozinho.

1. No GitHub, crie um repositório vazio chamado `biblioteca-antiguidade` (sem README, sem .gitignore).
2. Descompacte o zip numa pasta e, no PowerShell, entre nela:

```powershell
cd C:\caminho\para\biblioteca-antiguidade
git init
git add .
git commit -m "Primeira versão da Biblioteca da Antiguidade"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/biblioteca-antiguidade.git
git push -u origin main
```

3. Teste: abra o repositório no GitHub e confira se aparecem `index.html`, `catalog.json`, a pasta `api` e o `package.json`.

Documentação: [Criar um repositório (GitHub)](https://docs.github.com/pt/repositories/creating-and-managing-repositories/creating-a-new-repository)

---

## Passo 2 — Importar o projeto na Vercel

Você vai fazer os passos a seguir porque a Vercel precisa conhecer o repositório para publicar o site e a função `/api/dados`.

1. Em [vercel.com/new](https://vercel.com/new), clique em **Import** no repositório `biblioteca-antiguidade`.
2. Em **Framework Preset**, deixe **Other**. Não mude Build Command nem Output Directory.
3. Clique em **Deploy**.
4. Teste: abra o endereço que a Vercel mostrar (algo como `biblioteca-antiguidade.vercel.app`). A página inicial com a estante deve aparecer. O login ainda **não** funciona: faltam o banco e a senha.

Documentação: [Importar um projeto (Vercel)](https://vercel.com/docs/getting-started-with-vercel/import)

---

## Passo 3 — Conectar o banco Upstash Redis

Você vai fazer os passos a seguir porque as suas marcações precisam ficar guardadas fora do navegador, para sincronizar entre celular e computador.

1. No painel do projeto na Vercel, abra a aba **Storage**.
2. Escolha **Upstash** → **Upstash for Redis** (pelo Marketplace) e crie um banco no plano gratuito. Região: a mais próxima disponível (ex.: São Paulo, se houver; senão, Washington D.C.).
3. Conecte o banco ao projeto `biblioteca-antiguidade` quando a Vercel perguntar.
4. Teste: em **Settings → Environment Variables**, devem aparecer variáveis criadas sozinhas, como `KV_REST_API_URL` e `KV_REST_API_TOKEN` (ou `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN`). O código aceita os dois nomes:

```js
url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
```

Documentação: [Integração Upstash + Vercel](https://upstash.com/docs/redis/howto/vercelintegration) · [SDK @upstash/redis](https://upstash.com/docs/redis/sdks/ts/overview)

---

## Passo 4 — Criar a senha

Você vai fazer os passos a seguir porque a função `/api/dados` só lê e grava se o pedido trouxer a senha certa, guardada como variável de ambiente (ela nunca aparece no código nem no GitHub).

1. Em **Settings → Environment Variables**, clique em **Add**:
   - **Key:** `APP_PASSWORD`
   - **Value:** a sua senha (use uma frase longa, ex.: `aquiles-chorou-no-canto-24`)
   - **Environments:** marque Production, Preview e Development.
2. Vá em **Deployments**, abra os três pontinhos do último deploy e clique em **Redeploy**. Variáveis novas só valem depois de um novo deploy.
3. Teste no PowerShell (troque o endereço e a senha):

```powershell
# Sem senha: deve responder 401
Invoke-RestMethod -Uri "https://SEU-SITE.vercel.app/api/dados"

# Com senha: deve responder est, notas e extras (vazios no começo)
Invoke-RestMethod -Uri "https://SEU-SITE.vercel.app/api/dados" -Headers @{ "x-app-password" = "SUA-SENHA" }
```

O primeiro comando mostra um erro 401 em vermelho: é o esperado. O segundo mostra `est`, `notas` e `extras`.

Documentação: [Variáveis de ambiente (Vercel)](https://vercel.com/docs/environment-variables) · [Funções (Vercel)](https://vercel.com/docs/functions)

---

## Passo 5 — Entrar e trazer o que você já marcou

Você vai fazer os passos a seguir porque o app no Claude guarda as marcações num banco diferente; o CSV leva tudo para cá.

1. No app do Claude, toque em **Copiar tudo (CSV)** e cole num arquivo de texto salvo como `antigo.csv`.
2. No seu site, toque em **Entrar** e digite a senha.
3. Na tela **Início**, desça até **Importar backup** e escolha `antigo.csv`.
4. Teste: os livros marcados no app do Claude aparecem com o mesmo status.

As anotações e citações feitas no app do Claude **não** vão no CSV. Se tiver poucas, copie à mão.

---

## Passo 6 — Colocar na tela inicial do celular

Você vai fazer os passos a seguir porque assim o site abre como um app, sem barra do navegador.

- **iPhone (Safari):** Compartilhar → **Adicionar à Tela de Início**.
- **Android (Chrome):** menu ⋮ → **Adicionar à tela inicial**.

---

## Como atualizar depois

Edite os arquivos, depois:

```powershell
git add .
git commit -m "Descreva a mudança"
git push
```

A Vercel publica sozinha em cerca de um minuto.

- **Adicionar livros ao catálogo de todo mundo:** edite `catalog.json`.
- **Adicionar um livro só seu:** use o botão **Adicionar livro** no app (fica no banco, não no código).

## Backup

Em **Início → Baixar backup** você baixa um `.json` com tudo (status, datas, notas, livros adicionados). **Importar backup** aceita esse arquivo de volta. Faça um de vez em quando.

## Segurança, em resumo

- A senha fica só na Vercel (`APP_PASSWORD`) e no aparelho onde você entrou.
- Sem a senha, ninguém lê nem grava suas marcações; o catálogo é público.
- Cada senha errada demora 0,7 s para responder, o que dificulta tentativas em massa.
- **Sair deste aparelho** apaga a senha e o cache do celular.
- Se trocar a senha na Vercel (e fazer Redeploy), os aparelhos antigos pedem login de novo.
