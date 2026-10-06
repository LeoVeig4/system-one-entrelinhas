# Instalação e diagnóstico local

Para preparar e executar o projeto, siga o [README](../../../../README.md). O aplicativo usa React em `frontend/` e o pacote Python em `backend/sales_trainer/`.

A integração existente foi verificada com Ollama 0.35.1 e `nimble:9b-q4_K_M`. Esses dados são observações anteriores, não uma leitura atual do serviço. Confirme runtime e tag no ambiente de execução:

```powershell
node scripts/python.mjs .agents/skills/single-model/scripts/run_request.py --status
```

Para uma requisição pequena com os três tipos:

```powershell
node scripts/python.mjs .agents/skills/single-model/scripts/run_request.py --request .agents/skills/single-model/assets/triagem.json
```

O exemplo principal da aplicação está em [system-one-request.json](../../../../examples/system-one-request.json). Não há um script `code.py` separado.

## Diagnóstico

| Sintoma | Verificação |
| --- | --- |
| `ollama` fora do PATH | No Windows, procure a CLI em `%LOCALAPPDATA%/Programs/Ollama/ollama.exe`; confirme o caminho no seu ambiente |
| Conexão recusada | Confira se o aplicativo ou serviço Ollama está aberto |
| Modelo não encontrado | Confira `/api/tags` e a tag configurada |
| HTTP 400 | Confira tipos, critérios e mensagem de erro; confirme suporte a `/v1/systemone` |
| Timeout | Confira tamanho do contexto e carga inicial do modelo; não trate timeout como decisão |
| Build ausente | Execute `npm run build` na raiz |

Os pesos são instalados pelo Ollama e ficam fora do repositório. Tempos e limites dependem do runtime; consulte o [guia da API](api-e-exemplos.md) e revalide quando necessário.
