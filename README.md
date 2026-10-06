# Entrelinhas · exemplo de System One

Projeto demonstrativo de decisões estruturadas com **React + Vite**, **Python** e **Nimble 9B no Ollama**, via **System One**.

Escolha um dos três cenários de venda, escreva uma resposta e observe dez decisões em uma chamada: seis `noul` para efeitos, um `choice` para abordagem e três `score` para intensidades. A página Conceitos explica os tipos com exemplos interativos sem inferência.

Os cenários são preparados; a avaliação no simulador usa o modelo real. Os percentuais não são taxas reais de conversão. O modelo pode superestimar promessas que não constam dos fatos da oferta.

## Preparar e executar

Pré-requisitos: Node.js 22.12+, Python 3.11+, uv e Ollama com suporte a `/v1/systemone`. A integração existente foi verificada com Ollama 0.35.1 e `nimble:9b-q4_K_M`; confirme a disponibilidade dessa API no seu ambiente. Os pesos do modelo ficam fora do projeto.

```shell
ollama pull nimble:9b-q4_K_M
uv sync --locked
npm ci
npm run build
npm start
```

Abra [o simulador](http://127.0.0.1:8000/) ou [Conceitos](http://127.0.0.1:8000/conceitos). Mantenha o Ollama aberto. Use Ctrl+C para encerrar o servidor. No PowerShell, use `npm.cmd` caso a política local bloqueie `npm.ps1`.

Depois do preparo, execute `npm start`. Após editar o frontend, refaça `npm run build`.

## Desenvolver

Execute `npm run backend` em um terminal e `npm run dev` em outro. Abra [127.0.0.1:5173](http://127.0.0.1:5173/). Vite encaminha `/api` ao Python na porta 8000. Reinicie o backend após editar Python, cenários ou rubricas.

`npm run preview` serve o build na porta 4173 e usa a mesma API. `npm start -- --port 8001` escolhe outra porta no uso normal; o proxy de desenvolvimento continua apontando para 8000.

## Organização

```text
frontend/                Interface React e testes de navegador
backend/sales_trainer/   API, cenários, rubricas e integração com o modelo
backend/tests/           Testes Python, sem inferência
examples/                Uma requisição completa de System One
scripts/                 Execução e verificações
docs/                   Arquitetura e conceitos da integração
.agents/skills/          Instruções locais para o Codex
artifacts/               Saídas geradas de verificações, ignoradas pelo Git
```

As configurações npm e Python ficam na raiz; os comandos são executados dali. `node_modules/`, `.venv/` e `frontend/dist/` são gerados localmente. O build em `frontend/dist/` é usado pelo servidor Python.

Leia [a arquitetura](docs/architecture.md), [o guia System One](docs/system-one.md) e [a requisição de exemplo](examples/system-one-request.json).

## Verificar

```shell
npm run build
npm run test:api
npm run test:ui
npm run check:docs
```

Os testes Python usam respostas controladas. Os testes de navegador usam [uma fixture](frontend/tests/fixtures/evaluation.json), verificando fluxo e interface, sem medir a precisão do modelo. No Windows, Playwright usa Edge; em outros sistemas, instale Chromium com `npx playwright install chromium`. `BROWSER_CHANNEL` permite escolher outro navegador compatível.

Com o site na porta 8000 e Ollama disponíveis, `npm run check:live` faz uma avaliação real e verifica o fluxo no navegador. Salva resultados em `artifacts/live/`; parte das verificações posteriores usa fixtures identificadas. Novas execuções sobrescrevem essa saída.

Relatórios HTML ficam em `artifacts/playwright-report/` e traces em `artifacts/test-results/`. Você pode excluir `artifacts/` a qualquer momento; verificações futuras recriam seus arquivos.

Não há banco, login, persistência de mensagens ou geração de respostas abertas. Recarregar a página descarta a sessão. O objetivo é estudar o uso dos três tipos de decisão em uma aplicação local.
