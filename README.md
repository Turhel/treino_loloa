# treino_loloa

## Deploy na Vercel

Este repositório publica o app Vite que fica em `frontend/`.

O arquivo `vercel.json` na raiz já configura:

- instalação com `npm ci` dentro de `frontend`
- build com `npm run build` dentro de `frontend`
- publicação da pasta `frontend/dist`

### Como subir

1. Importe este repositório na Vercel.
2. Deixe a Vercel usar a configuração detectada do repositório.
3. Faça o deploy.

### Observações

- Se a Vercel perguntar a versão do Node.js, use a padrão mais recente compatível com o Vite atual.
- Para testar localmente, rode `npm install` e `npm run dev` dentro de `frontend`.
