# Treino Loloa

App React + TypeScript + Vite + TailwindCSS para treino com progresso local, treino personalizado, PWA, vídeos, cardio, dor/desconforto e sincronização opcional com Supabase.

## Rodar localmente

```bash
npm install
npm run dev
```

Build de produção:

```bash
npm run build
```

## Configurar Supabase

Crie `frontend/.env.local`:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key
VITE_SUPABASE_AUTH_REDIRECT_URL=https://seu-site.com
```

Use apenas a `anon key` no frontend. Nunca coloque `service_role` no app.

`VITE_SUPABASE_AUTH_REDIRECT_URL` é opcional no desenvolvimento local, mas deve ser configurada no deploy para a URL pública do app. Assim, o email de confirmação de conta não manda o usuário para `127.0.0.1` ou `localhost`.

No painel do Supabase, confira também `Authentication > URL Configuration`:

- `Site URL`: URL pública do app.
- `Redirect URLs`: inclua a mesma URL pública usada em `VITE_SUPABASE_AUTH_REDIRECT_URL`.

No painel do Supabase, abra o SQL Editor e execute:

```sql
-- arquivo: frontend/supabase/schema.sql
```

O schema cria `profiles` e `user_app_data`, habilita Row Level Security e adiciona policies para cada usuário acessar apenas os próprios dados.

## Login e sincronização

- Sem login, o app continua usando `localStorage`.
- Com login, o app salva em `localStorage` e no Supabase.
- Ao entrar, o app carrega o remoto. Se remoto e local existirem, faz merge simples.
- Logs usam merge por chave, com prioridade do remoto em conflito.
- Listas usam `id` quando existir e evitam duplicatas.

Teste:

1. Rode `npm run dev`.
2. Clique em `Entrar / Criar conta`.
3. Crie uma conta ou entre com email/senha.
4. Edite algum treino, cardio ou exercício.
5. Confira o status `Sincronizado`.
6. Use `Sincronizar agora` para forçar o merge/salvamento.

## Adicionar vídeo manual

Edite `src/data/exerciseVideos.ts` e preencha a chave normalizada:

```ts
hip_thrust: {
  youtube: "https://www.youtube.com/watch?v=...",
  tiktok: "https://www.tiktok.com/@perfil/video/..."
}
```

O modal do exercício mostra YouTube, TikTok e sempre mantém `Buscar no YouTube` como fallback.

## Adicionar ilustrações de exercício

Coloque imagens em:

```txt
public/exercicios/nome_do_exercicio/01.png
public/exercicios/nome_do_exercicio/02.png
public/exercicios/nome_do_exercicio/03.png
```

Depois cadastre no exercício em `src/data/exerciseLibrary.ts`:

```ts
illustrations: [
  "/exercicios/hip_thrust/01.png",
  "/exercicios/hip_thrust/02.png",
  "/exercicios/hip_thrust/03.png"
]
```

Se não houver ilustrações, o modal mostra `Ilustrações ainda não cadastradas`.

## Cadastrar novo exercício

Edite `src/data/exerciseLibrary.ts`:

```ts
{
  id: "hip_thrust",
  name: "Hip thrust",
  focus: "Glúteo máximo",
  muscles: ["gluteo_maximo"],
  description: "Extensão de quadril com apoio nas costas.",
  tips: ["Suba controlando o quadril.", "Contraia no topo.", "Evite jogar a lombar."],
  alternatives: ["gluteo-no-cabo"],
  rest: 90,
  videoKey: "hip_thrust",
  illustrations: ["/exercicios/hip_thrust/01.png"]
}
```

Para criar treino no site, use `Treino personalizado`, escolha semanas e adicione exercícios da biblioteca.
