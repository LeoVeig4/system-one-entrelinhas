# System One neste projeto

O Entrelinhas é um exemplo de decisões estruturadas. Nimble é o modelo; Ollama é o runtime local; System One é a interface de decisão usada pelo backend. “Single-model” é o nome do repositório e da skill local.

## Requisição

O backend envia `POST /v1/systemone` com:

- `model`: a tag `nimble:9b-q4_K_M`.
- `state`: oferta, fatos, histórico preparado e resposta candidata.
- `questions`: perguntas com tipo, instruções e critérios fornecidos pela aplicação.

Veja [uma requisição completa](../examples/system-one-request.json). O ponto de integração está em [evaluator.py](../backend/sales_trainer/evaluator.py).

## Tipos usados

| Tipo | Significado | Uso no simulador |
| --- | --- | --- |
| `noul` | Número entre 0 e 1 para uma condição | Seis possíveis efeitos da mensagem |
| `choice` | Categoria vencedora de uma distribuição | Abordagem predominante |
| `score` | Valor esperado dos índices de uma rubrica ordenada | Pressão, personalização e objetividade de 0 a 4 |

As seis perguntas `noul` são independentes: não precisam somar 100%. Em uma pergunta `choice`, as alternativas competem e suas probabilidades somam 1. Para `score`, o cálculo é `Σ índice × probabilidade`; por exemplo, 25% no nível 2 e 75% no nível 3 produzem 2,75. O valor esperado pode diferir do nível mais provável.

A rubrica dá significado aos níveis. Alterar seus critérios pode alterar os resultados. Por isso, as avaliações incluem versões e só são comparadas quando compatíveis.

## Interpretação

`confidence` descreve concentração da distribuição; não demonstra probabilidade calibrada de acerto. Os percentuais de efeitos representam a interpretação do modelo e não taxas reais de conversão. As intensidades não compõem uma nota geral de qualidade.

O modelo pode superestimar descontos ou prazos prometidos sem suporte nos fatos. Esta aplicação demonstra integração e interpretação dos campos, sem validar desempenho comercial.

## Exemplos e inferência

O simulador faz inferência real. A página Conceitos usa exemplos matemáticos locais, explicitamente identificados, e não chama o modelo. Os testes usam respostas controladas para verificar comportamento; a fixture não é um gabarito comercial.

O backend valida campos, tipos, intervalos, distribuições, categoria vencedora e cálculo do score. Falhas de conexão, timeout ou resultado inválido são erros, não classificações válidas.

Para instalação e execução, consulte [o README](../README.md). Para o caminho dos dados, consulte [a arquitetura](architecture.md).
