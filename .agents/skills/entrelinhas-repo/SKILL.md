---
name: entrelinhas-repo
description: Usar, executar, diagnosticar e modificar o exemplo Entrelinhas, com frontend React/Vite e backend Python integrado ao Nimble no Ollama via System One.
---

# Trabalhar com o Entrelinhas

Localize a raiz por `package.json`, `pyproject.toml`, `frontend/` e `backend/`. Execute comandos a partir dela.

Leia o [README](../../../README.md), a [arquitetura](../../../docs/architecture.md) e o [guia System One](../../../docs/system-one.md). Para payloads e interpretação do modelo, consulte a [skill single-model](../single-model/SKILL.md).

## Execução

Uso normal: `uv sync --locked`, `npm ci`, `npm run build`, `npm start`. Abra `http://127.0.0.1:8000`. Para avaliar, Ollama deve estar disponível em `localhost:11434`, com `nimble:9b-q4_K_M` e suporte a `/v1/systemone`.

Desenvolvimento: `npm run backend` em um terminal e `npm run dev` em outro; abra `http://127.0.0.1:5173`. Vite encaminha `/api` ao Python. Os scripts selecionam a `.venv` e adicionam `backend/` ao caminho de imports. No PowerShell, use `npm.cmd` se necessário.

## Modificação e verificação

Interface em `frontend/src/`; API em `backend/sales_trainer/`; cenários e rubricas em `backend/sales_trainer/data/`. Conceitos importa a rubrica canônica pelo alias `@schema`. Ao alterar critérios ou fatos, sincronize versões e `examples/system-one-request.json`, reinicie Python e refaça o build.

Preserve a identidade da tentativa, o texto capturado no envio, os rascunhos em falha e ao visitar Conceitos, e o descarte de retornos após troca de cenário. Abortar no navegador não garante cancelar o Ollama. Não agregar efeitos independentes ou intensidades em uma nota geral. Percentuais não são taxas reais de conversão.

Verifique com `npm run build`, `npm run test:api`, `npm run test:ui` e `npm run check:docs`. Testes Python ficam em `backend/tests/`; testes de navegador e fixture em `frontend/tests/`. Fixtures verificam fluxo, não qualidade comercial.

`npm run check:live` exige site e modelo disponíveis, faz uma inferência real e salva saída em `artifacts/live/`. Relatórios Playwright ficam em `artifacts/`. São arquivos gerados e não documentação versionada.

## Diagnóstico e entrega

Build ausente: compilar. `.venv` ausente: `uv sync --locked`. API indisponível no Vite: verificar Python na porta 8000. Falha de modelo: verificar Ollama e tag com o helper single-model. Porta ocupada: identificar o serviço existente antes de substituir processos. Não substituir falhas por números demonstrativos.

Entregue mudanças, verificações e limitações. Mantenha o projeto pequeno e didático; não reintroduza históricos, capturas ou documentos duplicados como requisito de operação.
