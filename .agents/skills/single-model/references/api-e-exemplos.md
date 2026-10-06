# API e exemplos executáveis

Execute os exemplos a partir da raiz deste repositório. A skill e seus recursos estão em `.agents/skills/single-model`.

Contrato conferido no Ollama local `0.35.0` e no [código do compilador System One dessa versão](https://github.com/ollama/ollama/blob/v0.35.0/decision/systemone.go), em 02/10/2026.

## Entrada e saída

Envie JSON por `POST http://localhost:11434/v1/systemone`, com `Content-Type: application/json`.

| Campo | Significado |
| --- | --- |
| `model` | Tag instalada: `nimble:9b-q4_K_M` |
| `state` | Texto a avaliar; pode ser string, objeto ou array JSON |
| `questions` | Objeto de perguntas nomeadas |
| `keep_alive` | Opcional; por exemplo, `"5m"` mantém os pesos residentes após a chamada |

| Tipo de pergunta | Critérios de entrada | Campo da resposta |
| --- | --- | --- |
| `choice` | Objeto: categoria → descrição; descrição `null` usa o nome da categoria | `choice`, `probabilities`, `confidence` |
| `noul` | Opcional; objeto com descrições string para `true` e `false` | `noul`, número que representa P(verdadeiro) |
| `score` | Array de descrições, do menor ao maior nível | `score`, `legend`, `probabilities`, `confidence` |

As [estruturas da resposta](https://github.com/ollama/ollama/blob/v0.35.0/decision/types.go) usam números para `noul` e `score`; não há booleano JSON no campo `noul`. `usage` informa `input_tokens` e `output_tokens`. O array da rubrica começa no índice zero.

## Python com a dependência existente

O payload completo está em [assets/triagem.json](../assets/triagem.json). Exemplo próprio, adaptado ao projeto local:

```python
import json
from pathlib import Path
import requests

payload = json.loads(Path(
    r".agents\skills\single-model\assets\triagem.json"
).read_text(encoding="utf-8"))

response = requests.post(
    "http://localhost:11434/v1/systemone", json=payload, timeout=120
)
response.raise_for_status()
result = response.json()
answers = result["answers"]

department = answers["department"]["choice"]
p_refund = answers["refund_requested"]["noul"]
expected_urgency = answers["urgency"]["score"]
levels = answers["urgency"]["probabilities"]
most_likely_level = int(max(levels, key=levels.get))
print(department, p_refund, expected_urgency, most_likely_level)
```

O nível mais provável e o score esperado respondem perguntas diferentes. Uma distribuição de 60% no nível 0 e 40% no nível 2 produz score `0.8`, mesmo com o nível 0 como vencedor. Não arredonde o score para recuperar a classificação original.

## PowerShell com UTF-8 explícito

```powershell
$taskJsonPath = '.agents\skills\single-model\assets\triagem.json'
$taskJson = Get-Content -LiteralPath $taskJsonPath -Raw -Encoding utf8
$taskBody = [System.Text.Encoding]::UTF8.GetBytes($taskJson)
$taskResult = Invoke-RestMethod -Uri 'http://localhost:11434/v1/systemone' `
  -Method Post -ContentType 'application/json; charset=utf-8' `
  -Body $taskBody -TimeoutSec 120
$taskResult | ConvertTo-Json -Depth 20
```

## Helper sem instalação de pacotes

```powershell
$taskPython = '.\.venv\Scripts\python.exe'
$taskSkill = '.agents\skills\single-model'
& $taskPython "$taskSkill\scripts\run_request.py" --status
& $taskPython "$taskSkill\scripts\run_request.py" `
  --request "$taskSkill\assets\triagem.json" `
  --text 'O aplicativo fecha ao tentar abrir um relatório.'
```

Para texto de arquivo, use `--state-file`; ele substitui todo o `state` por uma string UTF-8. Para salvar uma resposta, use `--output 'C:\caminho\resposta.json'` com diretório existente. `--model` e `--base-url` permitem outra instalação explicitamente selecionada. Sem override, o helper preserva o modelo do payload ou usa a tag local padrão. Ele não instala modelos e não repete chamadas após falha.

## Integração JavaScript por HTTP

Exemplo próprio para Node com `fetch` disponível, sem SDK:

```javascript
import { readFile } from 'node:fs/promises';
const payload = JSON.parse(await readFile(
  '.agents/skills/single-model/assets/triagem.json', 'utf8'
));
const response = await fetch('http://localhost:11434/v1/systemone', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
  signal: AbortSignal.timeout(120_000),
});
if (!response.ok) throw new Error(`HTTP ${response.status}: ${await response.text()}`);
const result = await response.json();
console.log(result.answers.department.choice);
```

Esse exemplo JavaScript não foi executado nesta inspeção. Em um site, uma chamada a `localhost` apontaria para a máquina do visitante. Para uma aplicação web, desenhe uma integração de servidor adequada ao ambiente; o endpoint desta instalação é local.

## Limites e interpretação

O compilador do Ollama `0.35.0` aceita 1–64 perguntas e 2–26 alternativas por pergunta; não aceita critérios `null` em `noul` nem descrições `null` na rubrica. Instruções devem declarar uma decisão clara. Confira o erro HTTP do servidor para entradas inválidas. [Implementação versionada](https://github.com/ollama/ollama/blob/v0.35.0/decision/systemone.go).

Uma probabilidade pode estar alta mesmo com categorias incompletas: o modelo precisa distribuir massa entre as alternativas oferecidas. Para multilabel, crie perguntas `noul` separadas e valide combinações em código. Não aplique `bool(p_refund)`; qualquer float diferente de zero seria verdadeiro em Python. Se usar `p_refund >= limiar`, estabeleça o limiar com dados rotulados da aplicação.
