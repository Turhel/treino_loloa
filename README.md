# Treino Loloa

Reconstrução em Python do Treino Loloa. A aplicação nova usa Flask e mantém
as regras de treino em módulos Python fáceis de editar.

## Rodar localmente

```powershell
python -m pip install -r requirements.txt
python app.py
```

- `http://localhost:8000/` — home AMOLED propositalmente vazia.
- `http://localhost:8000/laboratorio` — interface integral do Forge 90, servida
  pelo Flask em modo local. Ela já guarda o estado do Forge no navegador.

## Base visual no laboratório

O laboratório serve a compilação original em `forge90/server/public/`, gerada
por `node build.js` dentro de `forge90/`. O Flask não inicia o servidor Node do
Forge: quando as APIs dele não estão presentes, a interface usa o modo local
original. A origem, o copyright e a licença AGPL-3.0-or-later estão preservados
no clone e no HTML entregue.

As regras próprias do Loloa continuam em Python. A próxima etapa é substituir,
uma por uma, as chamadas de persistência e decisão do Forge por APIs Flask,
sem alterar o layout que agora está em teste.

## Primeiro motor: intensidade adaptativa

`treino/adaptacao.py` decide a próxima intensidade pelo histórico do mesmo
exercício, não por um calendário fixo.

- dor relevante reduz a carga ou pede substituição;
- queda importante de repetições reduz a carga;
- duas tentativas sólidas permitem progressão moderada;
- nos demais casos a carga é mantida para consolidar a execução.

Execute os testes com:

```powershell
python -m unittest discover -s tests -v
```

## Migração

O diretório `frontend/` é a implementação React/Vite anterior e ainda está
preservado apenas como referência de dados. Ele não participa da nova aplicação
Flask. A configuração de produção será substituída depois que a base Python
estiver aprovada no laboratório.
