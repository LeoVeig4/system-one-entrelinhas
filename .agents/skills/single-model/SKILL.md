---
name: single-model
description: Usar, explicar e integrar o Nimble 9B local no Ollama via System One para classificação, roteamento, verificações booleanas e avaliação por rubricas. Aplicar quando o usuário mencionar single-model, Nimble, modelos de decisão ou /v1/systemone neste ambiente. Não aplicar apenas porque um projeto usa um único modelo de linguagem.
---

# Single Model: Nimble / System One

Neste repositório, “single-model” corresponde ao projeto demonstrativo, que chama o modelo `nimble:9b-q4_K_M` pela API System One do Ollama. Single-model é o nome usado pelo usuário/projeto; Nimble é o modelo, Ollama é o runtime e System One é a interface de decisão.

Para executar ou modificar o aplicativo React/Python, consulte a [skill entrelinhas-repo](../entrelinhas-repo/SKILL.md). Este guia mantém o foco na API e no modelo. O inventário original observou Ollama 0.35.0; a integração React foi verificada com 0.35.1 em 03/10/2026, sem alterar a tag. Revalide o serviço em cada ambiente.

## Escolher a referência necessária

- Localizar arquivos, conferir versão, executar o exemplo ou diagnosticar o Windows: [instalação local](references/instalacao-local.md).
- Montar requisições e interpretar resultados: [guia de uso da API](references/api-e-exemplos.md).
- Explicar pesos, treinamento, logits, probabilidades e limites: [funcionamento](references/como-funciona.md).
- Escolher uma aplicação e desenhar sua validação: [casos de uso](references/casos-de-uso.md).
- Buscar alternativas de integração, exemplos públicos e benchmarks: [pesquisa na internet](references/pesquisa-web.md). As fontes foram consultadas em 02/10/2026; confira atualizações quando a tarefa depender delas.

## Procedimento

1. Confirme o serviço e a tag instalada com `GET http://localhost:11434/api/version` e `/api/tags`. A observação inicial foi Ollama `0.35.0` e `nimble:9b-q4_K_M`; revalide em cada ambiente. No Windows, procure o executável em `%LOCALAPPDATA%/Programs/Ollama/ollama.exe` caso ele esteja fora do PATH.
2. Defina a decisão antes da implementação: `state` contém fatos/contexto; `questions` contém perguntas, instruções e alternativas. Use `choice` para uma categoria, `noul` para uma condição e `score` para uma rubrica ordenada. Inclua `other` ou `insufficient_evidence` quando faltar evidência for uma possibilidade real.
3. Use `POST /v1/systemone` com JSON. Prefira HTTP direto neste projeto: `requests` já está instalado. O helper [run_request.py](scripts/run_request.py) também funciona somente com a biblioteca padrão. Não suponha que `/api/chat`, `ollama run` ou o SDK Ollama exponham a mesma interface tipada; confirme o suporte da versão antes de trocar a integração.
4. Na versão `0.35.0`, use de 1 a 64 perguntas por requisição e de 2 a 26 alternativas por `choice`/`score`. A capacidade de 255 opções do scorer nativo publicado no Hugging Face não é o limite deste endpoint. Mantenha prompts curtos; o contexto operacional local é `8194`, e a documentação do Nimble descreve uma janela de decisão de `8192` tokens.
5. Leia `answers[nome]`: `choice` é a categoria vencedora; `noul` é um número entre 0 e 1, representando P(verdadeiro); `score` é a expectativa dos índices da rubrica, começando em zero. Para o nível mais provável, use o argmax de `probabilities`. Não transforme `noul` em booleano com `bool(valor)`.
6. Trate `confidence` como concentração da distribuição, não como probabilidade calibrada de acerto. Selecione limiares com exemplos rotulados da aplicação. Perguntas são pontuadas individualmente; verifique em código quaisquer relações obrigatórias entre respostas.
7. Faça uma chamada pequena com dados sintéticos e confira esquema, resultado e tempo. Para medir latência, separe a carga inicial do modelo das chamadas com o modelo residente. Erros de conexão, HTTP ou timeout não são uma classificação válida; reporte o erro, sem repetir indefinidamente.

## Execução rápida

Execute a partir da raiz deste repositório, em PowerShell:

```powershell
$taskPython = '.\.venv\Scripts\python.exe'
$taskSkill = '.agents\skills\single-model'
& $taskPython "$taskSkill\scripts\run_request.py" --status
& $taskPython "$taskSkill\scripts\run_request.py" --request "$taskSkill\assets\triagem.json"
```

O exemplo combina departamento, pedido de estorno e urgência. Troque o contexto com `--text 'texto da solicitação'` ou `--state-file 'C:\caminho\texto.txt'`, sem reescrever as perguntas. O helper imprime o JSON e informa a duração em stderr; não executa ações a partir da decisão.

## Escopo e resultado esperado

Entregue o payload, o código de integração quando solicitado, a interpretação dos campos e a evidência do teste. Identifique separadamente o que foi observado localmente, o que vem das fontes e o que é proposta de aplicação. Use outro modelo para respostas abertas, explicações, extração livre ou geração de documentos; o Nimble decide entre opções fornecidas. Uma classificação não concede autorização para executar ferramentas ou alterar sistemas externos.
