# Treino Loloa Admin

Ferramenta local para administrar dados estáticos do app sem editar TypeScript manualmente.

## Instalação

Python 3.11+ recomendado.

```bash
cd tools/training_admin
python -m pip install -r requirements.txt
```

`customtkinter`, `pydantic` e `pillow` são opcionais para a primeira versão: a GUI também abre com `tkinter` puro.

## Rodar a GUI

```bash
python app.py
```

A GUI edita apenas os JSONs em `tools/training_admin/data/`.

## Gerar TypeScript

Pela GUI: aba **Validação/Exportar** → **Gerar TypeScript**.

Ou pelo terminal:

```bash
python tools/training_admin/generator.py
```

Os arquivos gerados ficam em:

```text
frontend/src/data/generated/
```

## Adicionar exercício

1. Abra a aba **Exercícios**.
2. Clique em **Novo** ou duplique um exercício parecido.
3. Preencha `id`, `name`, `category`, `exerciseKind`, `focus`, `muscles`, `equipment`, `rest`, `description`, `tips` e `alternatives`.
4. Salve e valide.
5. Gere TypeScript.

## Inventário da academia

A aba **Equipamentos** controla quais aparelhos/acessórios existem. Use `available: false` para manter um equipamento documentado, mas impedir que ele seja tratado como disponível no app. Exemplos indisponíveis: `leg_press_90`, `eliptico`, `escada` e `remo`.

## Adicionar vídeo

1. Abra a aba **Vídeos**.
2. Use `exerciseId` igual ao ID do exercício.
3. Preencha `youtube` e/ou `tiktok`.
4. Salve, valide e gere TypeScript.

## Adicionar ilustrações

1. Aba **Ilustrações**.
2. Selecione o exercício.
3. Escolha as imagens.
4. A ferramenta copia para `frontend/public/exercicios/<exerciseId>/` e atualiza `illustrations`.

## Backups

Antes de salvar, a ferramenta cria backup em:

```text
tools/training_admin/backups/YYYYMMDD-HHMMSS/
```

## Validação

A aba **Validação/Exportar** mostra problemas como:

- ID duplicado;
- músculo inexistente;
- alternativa inexistente;
- equipamento inexistente;
- URL inválida;
- imagem ausente;
- treino apontando para exercício inexistente.

## Segurança

A ferramenta é local. Ela não usa Supabase, não usa internet, não lê `.env.local` e não mexe em dados de usuário.
