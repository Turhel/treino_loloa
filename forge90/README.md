<div align="center">

<img src="server/public/icon.png" width="96" alt="Logo do FORGE 90">

# FORGE 90

O FORGE 90 é um aplicativo multiusuário e auto-hospedado para musculação e planejamento de refeições, com leitor de código de barras, despensa e receitas integrados, incluindo importação por links da web e pelo [Mealie](https://mealie.io/). Ele monta um programa Push/Pull/Legs de 90 dias que continua em ciclos de 13 semanas, planeja refeições ajustadas aos macros de cada pessoa e acompanha peso, gordura corporal e cargas.

![Painel](docs/screenshots/dashboard.png)

</div>

## Conteúdo

- [Recursos](#recursos)
  - [Treino](#treino)
  - [Registro e calendário](#registro-e-calendário)
  - [Nutrição](#nutrição)
  - [Progresso](#progresso)
  - [Receitas e alimentos](#receitas-e-alimentos)
  - [Compras](#compras)
  - [Despensa](#despensa)
  - [Leitura de código de barras](#leitura-de-código-de-barras)
  - [Importação de receitas](#importação-de-receitas)
  - [Sincronização do plano alimentar](#sincronização-do-plano-alimentar)
  - [Cartões da academia](#cartões-da-academia)
  - [Interface compacta para celular](#interface-compacta-para-celular)
  - [Contas](#contas)
  - [Painel administrativo](#painel-administrativo)
- [Instalação](#instalação)
  - [Configuração](#configuração)
  - [Primeiro acesso](#primeiro-acesso)
- [Backup e recuperação](#backup-e-recuperação)
- [Segurança](#segurança)
- [Licença](#licença)
- [Créditos](#créditos)
- [Aviso](#aviso)

## Recursos

### Treino

- Os primeiros 90 dias passam por quatro fases: Fundação, com mais foco na parte superior do corpo enquanto você se adapta ao déficit, Construção, Intensificação e uma semana de deload com teste de recordes. Depois disso, o plano se repete em ciclos de 13 semanas, e o calendário mantém sempre o ciclo atual e o seguinte programados.
- As sessões alternam Push, Pull e Legs conforme a quantidade de dias de treino escolhida.
- Cada sessão combina séries pesadas de força com trabalho de hipertrofia, usando metas de repetições em reserva (RIR).
- O aplicativo indica quando aumentar a carga para estimular progressão de força.
- Os programas de treino personalizáveis incluem uma biblioteca com mais de 100 exercícios distribuídos em 11 grandes grupos musculares, cada um com execução e dicas. Cerca de metade são alternativas apoiadas por evidências, acompanhadas de uma nota explicando por que foram incluídas. Os exercícios alternam semanalmente dentro de seus padrões de movimento e podem ser ativados ou desativados quando quiser.

![Plano de treino](docs/screenshots/workout-plan.png)

### Registro e calendário

As séries podem ser registradas no cartão Hoje do painel, na visão detalhada do dia ou no modo treino. Cada exercício mostra a meta, possíveis recordes e uma sugestão para a próxima vez. O modo treino conduz a sessão um exercício por vez, com sugestão de carga e repetições. O cronômetro de descanso integrado e personalizável pode iniciar automaticamente após o registro de uma série para ajudar a manter um ritmo adequado.

O calendário tem visualizações mensal e semanal, e treinos e refeições podem ser arrastados entre os dias. O painel traz editores rápidos para o treino e as refeições do dia, e **Personalizar** permite reorganizar os painéis ou ocultar os que você não usa.

![Calendário](docs/screenshots/calendar.png)

### Nutrição

Escolha entre três objetivos: perder gordura, manter ou ganhar massa muscular.

As metas calóricas usam a TMB de Katch–McArdle, um multiplicador de atividade e calorias extras nos dias de musculação. A proteína é definida entre 0,5 e 1 g por libra de peso corporal, e carboidratos e gorduras completam o restante. Todos os dias, as porções das receitas são ajustadas para que as refeições atinjam as metas de proteína e calorias, arredondando itens como ovos e tortillas para unidades inteiras. Um orientador de tendência compara a média de peso de 7 dias com a meta e pode ajustar as calorias.

- **Perder gordura** cria um déficit com base no ritmo de perda definido e muda para manutenção quando a meta é atingida.
- **Manter** mantém as calorias estáveis, enquanto o orientador sinaliza desvios em qualquer direção.
- **Ganhar massa muscular** adiciona um superávit calculado a partir de uma meta de ganho semanal como porcentagem do peso corporal. Entre 0,25% e 0,5% é a faixa em que a maioria das pessoas consegue progredir sem transformar boa parte do excedente em gordura. A gordura cai para 25% das calorias, nunca abaixo de 0,3 g por libra, para concentrar o excedente em carboidratos, que sustentam o volume de treino. O superávit é limitado a 500 kcal por dia e a fase de ganho é interrompida, passando para manutenção, quando o limite de gordura corporal é atingido. Ambos os limites podem ser ajustados.

![Plano alimentar](docs/screenshots/diet-plan.png)

### Progresso

A página Progresso mostra gráficos do peso corporal comparado à média de 7 dias e à linha planejada, além de gordura corporal, massa magra e estimativa de uma repetição máxima para cada exercício, com recordes destacados. É possível visualizar tudo desde o primeiro dia ou apenas as duas últimas semanas e acompanhar quanto peso, gordura corporal e massa magra mudaram nesse período. A página também mostra se a média de 7 dias está à frente ou atrás do plano, quando você alcançará a meta de peso no ritmo atual e quais sessões foram realizadas ou perdidas nas últimas quatro semanas.

![Progresso](docs/screenshots/progress.png)

### Receitas e alimentos

O FORGE 90 vem com 36 receitas ricas em proteína pensadas para preparo antecipado, cada uma vinculada à fonte original, e uma base com cerca de 650 alimentos. Receitas com várias porções são programadas como sobras. É possível buscar receitas por ingrediente ou tag; as favoritas aparecem com mais frequência no plano; e qualquer receita pode ser editada, desativada, impressa ou criada do zero. As preferências alimentares são organizadas em uma lista por grupo, subgrupo e alimento individual. Desmarcar um alimento remove as receitas que o utilizam e substitui essas refeições futuras.

![Alimentos e receitas](docs/screenshots/recipes.png)

### Compras

A lista semanal de compras é agrupada por corredor ou grupo de alimentos e soma as porções exatas do calendário, incluindo sobras, com um cronograma de preparo em lote ao lado. Itens já cobertos pela despensa continuam na lista, marcados com um ícone de despensa, para que uma despensa desatualizada não faça você esquecer nada. Se a despensa cobrir apenas parte de um item, a lista mostra a quantidade total e informa quanto já há em casa. **Adicionar marcados à despensa** guarda de uma vez tudo o que foi comprado. Com o planejamento econômico ativado, as refeições de cada semana são organizadas para compartilhar ingredientes frescos, reduzindo embalagens e desperdício sem diminuir variedade nem ignorar favoritos.

![Lista de compras](docs/screenshots/grocery.png)

### Despensa

A despensa acompanha os alimentos disponíveis em casa, incluindo quantidades e datas de validade. Os itens entram por leitura de código de barras, pela lista de compras ou manualmente, e cada um recebe uma validade típica para aquele tipo de alimento, que pode ser alterada. Itens iguais com a mesma data de validade são mantidos em uma única entrada em vez de gerar várias linhas idênticas, e a busca na despensa mostra primeiro o que vence antes. Conforme cada dia planejado passa, as refeições correspondentes são descontadas automaticamente da despensa, priorizando os itens que vencem primeiro. Tudo que estiver a até duas semanas da validade aparece em **Vencendo em breve**, com uma contagem no item Despensa do menu.

![Despensa](docs/screenshots/pantry.png)

### Leitura de código de barras

No celular, **Escanear** lê o código de barras de alimentos embalados, incluindo EAN-13, UPC-A, EAN-8 e UPC-E, e procura o produto no [Open Food Facts](https://world.openfoodfacts.org). A primeira pessoa a escanear um produto confere nome, informação nutricional e tamanho da embalagem antes da inclusão. Depois disso, qualquer pessoa no servidor pode encontrá-lo por nome, marca ou código de barras. Produtos que não estejam no Open Food Facts podem ser cadastrados a partir do rótulo, e quem adicionou o produto, ou um administrador, pode corrigi-lo depois.

O lugar em que você faz a leitura define o que acontece:

- **Painel, calendário, visão do dia e Alimentos e receitas** (no celular: Hoje e o botão **+**): o produto é adicionado ao dia como alimento extra junto de uma das refeições. Ele entra nos macros do dia e as outras porções são reduzidas para abrir espaço. **Adicionar alimento** faz a mesma coisa sem usar a câmera.
- **Despensa:** cada leitura adiciona uma embalagem diretamente à despensa, permitindo escanear uma sacola inteira de compras em sequência. Escanear novamente o mesmo produto aumenta a quantidade em vez de criar outra linha, e a contagem também pode ser ajustada manualmente. **Revisar** mostra tudo que foi lido naquela sessão, com quantidades e validade, sem precisar abrir a página Despensa para corrigir os dados.

A câmera ao vivo precisa de HTTPS ou `localhost`. Em HTTP comum, Escanear pede uma foto do código de barras. O Chrome no Android usa o leitor de códigos integrado ao celular; outros navegadores, incluindo Safari no iPhone, usam o decodificador do próprio aplicativo.

![Adicionando um produto escaneado](docs/screenshots/barcode-product.png)

### Importação de receitas

**Importar receita**, na página Alimentos e receitas, importa uma receita por um link da web ou pelo Mealie usando a API. A importação por link funciona com qualquer site que publique dados padronizados de receita, o que inclui a maioria dos sites desse tipo. Para o Mealie, um administrador informa o endereço do servidor e um token de API em Configurações → Conexões de API. Depois disso, todos podem pesquisar e importar várias receitas de uma vez.

Cada ingrediente é associado a um alimento da base e sua quantidade é convertida para gramas, mililitros ou unidades. Toda importação é aberta para revisão antes de ser salva. O que não puder ser identificado, como um ingrediente sem alimento correspondente, uma quantidade ausente, o tipo de refeição ou o número de porções, fica destacado e precisa ser preenchido. Correspondências incertas também são sinalizadas para conferência. Suas correções são lembradas para a próxima vez. Se uma página não publicar nenhum dado estruturado de receita, o FORGE 90 tenta ler a própria página, procurando um título de ingredientes e a lista abaixo dele. Como isso é uma estimativa, a tela de revisão deixa isso claro e recomenda conferir tudo. Também é sempre possível colar a lista de ingredientes manualmente.

![Revisão da importação de receita](docs/screenshots/recipe-import.png)

### Sincronização do plano alimentar

A sincronização permite que duas pessoas conectem seus planos alimentares pelas configurações da Conta. Uma envia uma solicitação e escolhe quais refeições compartilhar; a outra aceita. As refeições compartilhadas passam a ser planejadas em conjunto usando apenas receitas que ambas possam consumir, levando em conta os favoritos das duas pessoas. As porções continuam ajustadas às metas individuais, enquanto a lista de compras e o cronograma de preparo em lote passam a considerar ambas.

Quando uma das pessoas altera uma refeição compartilhada, a mudança aparece imediatamente no próprio plano e é enviada à outra pessoa para aceitar ou recusar. Se ela recusar, cada uma mantém sua própria refeição naquele dia. Enquanto a sincronização estiver ativa, um botão Sincronizar nas páginas relevantes mostra quantas alterações aguardam resposta. Qualquer uma das pessoas pode alterar quais refeições são compartilhadas, com aprovação da outra, ou encerrar a sincronização a qualquer momento. Também é possível compartilhar uma única despensa pelas configurações de sincronização: os itens das duas pessoas são reunidos nela, e leituras ou edições atualizam a despensa para ambas. Ao interromper o compartilhamento, cada pessoa mantém uma cópia.

![Painel de sincronização](docs/screenshots/sync-panel.png)

### Cartões da academia

Adicione seu cartão de acesso em Configurações → Cartões da academia ou pelo painel. O código de barras aparecerá no painel para facilitar a entrada. Escaneie o código do cartão ou chaveiro, ou digite o número. São aceitos Code 128, Code 39, Codabar, Interleaved 2 of 5, EAN/UPC e QR codes. O escaneamento identifica o tipo automaticamente. Ao digitar, a opção Automático funciona com a maioria dos leitores, ou você pode selecionar o tipo do seu cartão. Tocar no código de barras abre uma versão em tela cheia e mantém a tela ativa. No celular, **Entrada** no topo da página Hoje faz o mesmo. É possível guardar vários cartões e alternar entre eles. QR codes só podem ser escaneados no Android, onde o navegador oferece um leitor integrado. Navegadores do iPhone não oferecem esse recurso, então o conteúdo do QR code precisa ser inserido manualmente.

![Cartão da academia](docs/screenshots/gym-card.png)

### Interface compacta para celular

No celular, o FORGE 90 usa uma interface compacta própria, com cinco abas na parte inferior em vez da barra lateral: Hoje, Plano, +, Cozinha e Você.

- **Hoje** reúne o painel e a visão do dia em uma única página. Faça a entrada na academia, registre a pesagem da manhã, inicie o treino e veja um resumo de progresso que abre a página Progresso completa. As refeições podem ser trocadas por uma lista pesquisável com os favoritos primeiro, e **Personalizar Hoje** define quais painéis aparecem e em que ordem.
- **Plano** reúne calendário, plano de treino e plano alimentar.
- **Cozinha** reúne lista de compras, despensa, receitas e cronograma de preparo. A lista é dividida em Comprar, No carrinho e Em casa. Quando as compras terminarem, um botão coloca todo o carrinho na despensa. Itens cobertos pela despensa aguardam em Em casa, com um botão **Preciso comprar** caso a despensa esteja desatualizada.
- **Você** reúne progresso, recordes, cartões da academia e configurações.
- **+** permite escanear ou adicionar alimentos, registrar peso, mostrar o cartão da academia, adicionar à despensa ou iniciar o treino a partir de qualquer aba.

![FORGE 90 no celular](docs/screenshots/phone.png)

### Accounts

One account is the **owner** — whoever set the server up. Only the owner can grant or remove administrator access, and no administrator can change, disable or delete the owner's account, so nobody can lock the owner out or strip the admin list by accident. Administrators can't remove their own access either. On an existing server the longest-standing administrator becomes the owner the first time it starts after updating.

An administrator invites new users from Admin → Users. Each invite link works once and expires after 7 days. A forgotten password can be reset by email (the link lasts 30 minutes). Accounts lock after repeated failed sign-ins, and the owner is emailed a reset link. Everyone can manage their profile, profile picture, password and signed-in devices, export or import their data, and delete their account.

### Admin console

- **Users:** invite people, resend or revoke invites, grant or remove admin rights, unlock accounts, send reset links, set temporary passwords and delete accounts.
- **Security:** password rules, lockout, session length and Require HTTPS.
- **App settings:** the app name (used in emails and the browser tab) and the address used in email links.
- **Email:** SMTP settings, with a test send function.
- **Server & proxy:** checks how the current connection reaches the app (HTTPS, the client IP it sees, secure cookies) and points out any proxy settings that need changing.
- **Activity log** and **Data & backup:** a filterable log of sign-ins and admin actions, and a full JSON export.

![Admin users](docs/screenshots/admin-users.png)

## Installation

GitHub Container Registry:

```
ghcr.io/oroshi-zz/forge_90:latest
```

The default listening port is `8090`. An Unraid template is included at `unraid/forge90.xml`.

### Configuration

| Variable | Default | Description |
|---|---|---|
| `APP_URL` | request host | Public address, used in invite and reset links and as the Require HTTPS redirect target. |
| `PORT` | `8090` | Listening port inside the container. |
| `DATA_DIR` | `/app/data` | Data location. |
| `ADMIN_EMAIL` | `admin@forge90.local` | Default administrator, created on first start. |
| `ADMIN_PASSWORD` | `forge90-admin` | Default administrator password. It must be changed at first sign-in. |
| `SMTP_HOST` | `smtp.gmail.com` | Mail server. |
| `SMTP_PORT` | `465` | Mail server port. |
| `SMTP_SECURITY` | `tls` | `tls`, `starttls` or `none`. |
| `SMTP_USER` | | Mail account username. |
| `SMTP_PASS` | | Mail account password. |
| `MAIL_FROM` | `SMTP_USER` | From address. |
| `MAIL_FROM_NAME` | `FORGE 90` | From name. |
| `TRUST_PROXY` | off | Addresses of your reverse proxy (IPs or CIDR ranges, comma-separated), or `true` to trust any. Forwarded headers are ignored from anywhere else. |
| `IMPORT_ALLOW_PRIVATE` | `false` | Lets link import reach private network addresses, for recipe sites on your own network. |
| `OFF_URL` | `https://world.openfoodfacts.org` | Where barcode lookups go, if you use an Open Food Facts mirror. |
| `REQUIRE_HTTPS` | auto | When `APP_URL` is https, plain-HTTP requests on any other host are redirected to it and HSTS is sent. Set to `false` to disable. |
| `COOKIE_SECURE` | `auto` | Marks the session cookie Secure when the request is HTTPS. |
| `TZ` | `UTC` | Time zone used in emails. |

The email settings can also be changed from Admin → Email.

> [!IMPORTANT]
> Configuring SMTP is required to send user invites and password resets. It's recommended to have SMTP configured even if you only have one user just in case of accidental lockout.

### First sign-in

Sign in with `admin@forge90.local` / `forge90-admin` (or your `ADMIN_EMAIL` / `ADMIN_PASSWORD`). You'll be asked to set a new password and a real email address, and then you'll go through the questionnaire. After that, invite users from Admin → Users.

## Backups and recovery

Everything lives in the data folder:

- `db.json`: accounts, sessions, invites, settings and the activity log
- `state/`: each user's plan
- `avatars/`: profile pictures
- `foods.json`: products added by scanning, shared by everyone
- `sync/`: shared-meal data for synced users

To back up, copy the folder while the container is stopped. Admin → Data & backup also downloads a JSON export of all accounts and plans, but without password hashes, so it's a record rather than a full restore. Individual users can export and import their own plan from Account settings.

If you're locked out of the only admin account, stop the container and run a one-off copy of the image against the same data folder:

```bash
docker run --rm -v /path/to/data:/app/data ghcr.io/oroshi-zz/forge_90:latest \
  node server.js --set-password you@example.com "new-password"

# or promote an existing account
docker run --rm -v /path/to/data:/app/data ghcr.io/oroshi-zz/forge_90:latest \
  node server.js --make-admin you@example.com

# or hand ownership to another account
docker run --rm -v /path/to/data:/app/data ghcr.io/oroshi-zz/forge_90:latest \
  node server.js --make-owner you@example.com
```

## Security

- Passwords are hashed with scrypt. Session, invite and reset tokens are random 256-bit values stored only as hashes.
- Cross-site requests are blocked, and responses carry a strict Content Security Policy.
- Sign-in, reset and invite endpoints are rate-limited per IP, and accounts lock after repeated failures. The forgot-password form gives the same response whether or not the account exists.
- Behind a proxy, the client IP comes from the entry your proxy added to `X-Forwarded-For`, so a client can't dodge rate limits by sending its own header.
- Synced users only see each other's shared meals and portions.
- Profile pictures are cropped and re-encoded in the browser, checked on the server, and only shown to signed-in users. Uploading a new one deletes the old file.
- Link import only reaches public addresses, so it can't be used to probe your network. The Mealie token stays on the server and is never sent to the browser.
- Gym card numbers are saved with the user's plan and aren't shared with sync partners.
- Barcodes are decoded on the phone, and camera images never leave it. Lookups go through the server, so Open Food Facts only sees the barcode number.

## License

FORGE 90 is licensed under the GNU Affero General Public License v3.0 or later. See [LICENSE](LICENSE). If you run a modified version for other people, the AGPL requires you to offer them its source; change `SOURCE_URL` in `src/ui-core.js` to point at your copy.

## Credits

Background photos are from Unsplash: Victor Freitas, Jorge Alberto Vega Barrera, Mina Rad, Shan A. Rajpoot, Rodrigo Rodrigues, Jason Briscoe, Vitaly Gariev, Jakob Owens, Alina Rubo, and Jonathan Borba for the sign-in page. Food values are approximations based on USDA FoodData Central. Product data for scanned barcodes comes from Open Food Facts contributors under the Open Database License. Recipe links go to their original authors.

## Disclaimer

Nothing in FORGE 90 is medical advice. Consult a medical professional before following its exercise and nutrition recommendations.
