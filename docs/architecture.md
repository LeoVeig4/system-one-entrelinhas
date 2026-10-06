# Arquitetura

React roda no navegador, Python fornece a API e serve o build, e Ollama executa Nimble localmente.

```text
React → POST /api/evaluations → Python → POST /v1/systemone → Ollama + Nimble
React ← resultado validado   ← Python ← answers tipadas    ← Ollama + Nimble
```

## Responsabilidades

- `frontend/src/pages/`: simulador e página Conceitos.
- `frontend/src/components/`: conversa, oferta, resultados e exemplos didáticos.
- `frontend/src/hooks/useSalesTrainer.js`: cenários, rascunho, tentativa e comparação.
- `frontend/src/lib/`: cliente HTTP e formatação.
- `backend/sales_trainer/server.py`: rotas, build e controle de uma avaliação ativa por processo.
- `backend/sales_trainer/evaluator.py`: requisição System One, transporte e validação integral das respostas.
- `backend/sales_trainer/scenarios.py`: catálogo e validação dos dados.
- `backend/sales_trainer/presentation.py`: converte decisões em dados de apresentação para a interface.
- `backend/sales_trainer/data/`: cenários e rubrica canônica.

Os testes vivem perto do código correspondente: `backend/tests/` e `frontend/tests/`. As configurações e lockfiles ficam na raiz. `scripts/python.mjs` seleciona a `.venv` e disponibiliza o pacote em `backend/` no caminho de imports do processo Python.

## Dados e rubricas

[scenarios.json](../backend/sales_trainer/data/scenarios.json) contém três cenários preparados. [evaluation_schema.json](../backend/sales_trainer/data/evaluation_schema.json) define dez perguntas: seis `noul`, um `choice` e três `score`.

O simulador recebe os metadados pela API. Conceitos importa o mesmo JSON no build pelo alias `@schema`, em [vite.config.js](../frontend/vite.config.js). Essa dependência é intencional: evita uma segunda cópia da rubrica e permite abrir Conceitos sem a API.

Ao alterar cenários ou critérios, atualize as versões e [a requisição de exemplo](../examples/system-one-request.json), reinicie Python e refaça o build. A fixture dos testes deve continuar compatível com o contrato.

## Rotas

| Rota | Responsabilidade |
| --- | --- |
| `GET /` e `/conceitos` | Entrada da interface React |
| `GET /assets/...` e `/favicon.svg` | Arquivos restritos ao build |
| `GET /api/scenarios` | Catálogo, modelo e metadados da rubrica |
| `POST /api/evaluations` | Avalia a mensagem com cenário e rubrica resolvidos pelo backend |

A entrada da avaliação contém `attempt_id`, `scenario_id`, `scenario_version`, `evaluation_schema_version` e `seller_response`. A saída contém identidade e versões, texto avaliado, modelo, `questions`, `answers`, `presentation`, duração e uso de tokens quando disponível.

Erros seguem `{error: {code, message}}`: 400 para entrada inválida; 404 para rota ou cenário ausente; 409 para versão incompatível ou avaliação em curso; 413 para corpo grande; 502 para resposta inválida ou rejeição do modelo; 503 para indisponibilidade; 504 para timeout. Sem build, páginas retornam 503 com instrução de compilação; a API continua funcionando.

## Estado e falhas

Cada tentativa captura seu ID e texto. O frontend aplica uma resposta somente se tentativa, cenário, versões e mensagem corresponderem ao envio. Trocar de cenário aborta a espera no navegador e descarta retornos atrasados; o Ollama pode continuar calculando.

Visitar Conceitos preserva rascunho e avaliação em curso. A comparação usa as duas últimas avaliações compatíveis. Falhas preservam o texto, sem fabricar resultados. O servidor libera sua trava após sucesso ou erro. Não há fila, repetição automática, banco ou persistência.

## Verificações e arquivos gerados

Testes Python verificam dados, contrato, apresentação e HTTP. Playwright verifica interação, falhas, comparação, navegação, Unicode e responsividade com uma fixture. `check:live` verifica uma inferência real e salva sua saída em `artifacts/live/`, sem gerar documentos ou alterar os exemplos versionados.

Build, dependências, caches e `artifacts/` são regeneráveis e ignorados pelo Git. Veja [os comandos no README](../README.md).
