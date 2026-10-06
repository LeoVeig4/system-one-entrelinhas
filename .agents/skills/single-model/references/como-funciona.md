# Como o Nimble funciona

## Componentes desta instalação

**Nimble** é o modelo de decisão; **Ollama** carrega os pesos e serve a inferência; **System One** é a API de perguntas tipadas; **single-model** é o nome usado neste projeto. O arquivo de licença local identifica a combinação do adapter Bespoke-Nimble-9B com Qwen3.5-9B, ambos sob Apache 2.0.

O model card descreve o Nimble como um adapter LoRA de aproximadamente 165 MiB. Ele altera o comportamento da base Qwen3.5-9B para decisões a partir de contexto. Aqui, o Ollama já recebeu um GGUF com a base e o adapter fundidos, quantizado em `Q4_K_M`; não é necessário montar o adapter separadamente para usar a instalação. [Model card oficial](https://huggingface.co/bespokelabs/Bespoke-Nimble-9B).

## Fluxo de decisão

```text
state + perguntas + alternativas
            ↓
Ollama monta contexto e esquema com códigos das opções
            ↓
Nimble atribui logits aos tokens de resposta permitidos
            ↓
softmax sobre os candidatos → probabilidades
            ↓
Ollama monta answers e usage em JSON
```

O servidor monta um prompt para cada pergunta, contendo o contexto e o esquema completo, e marca qual campo deve ser decidido. Cada alternativa é associada a um código de um token. O scorer fornece logits dos candidatos; o JSON final é construído pelo código. O caminho de decisão não gera uma explicação ou cadeia de raciocínio. A implementação local calcula:

```text
choice     = alternativa de maior probabilidade
noul       = probabilidade do candidato verdadeiro
score      = soma de (índice do nível × probabilidade do nível)
confidence = 1 − entropia(probabilidades) / log(número de alternativas)
```

`confidence` é limitado a 0–1; uma distribuição uniforme se aproxima de zero, e uma concentrada se aproxima de um. Isso mede concentração, não correção. As perguntas são pontuadas individualmente. Várias perguntas em uma chamada não significam que o contexto seja necessariamente processado uma única vez. [Código Ollama 0.35.0](https://github.com/ollama/ollama/blob/v0.35.0/decision/systemone.go).

## Treinamento

A receita publicada usa exemplos contrastivos: um fato muda e a resposta correta deve mudar também. A curadoria verifica a política, os fatos decisivos e se a evidência realmente determina o resultado. A publicação inicial inclui 2.676 exemplos de treinamento e 324 de avaliação; os rótulos são sintéticos. Esses números descrevem a receita publicada, não uma confirmação de todos os dados usados no GGUF atual. [Repositório oficial](https://github.com/bespokelabsai/nimble).

O ajuste publicado usa LoRA rank 16, learning rate `5e-5`, batch efetivo 8 e uma época selecionada, com BF16 e limite de 2.048 tokens no treinamento. A função objetivo otimiza a decisão entre logits candidatos com rótulos de referência; não é necessário gerar uma resposta aberta para treinar a decisão. [Guia oficial de treinamento](https://github.com/bespokelabsai/nimble/blob/main/docs/NIMBLE_TRAINING.md).

## Diferenças entre backends e revisões

- O endpoint Ollama `0.35.0` limita alternativas a 26; o scorer nativo do checkpoint atual no Hugging Face anuncia até 255.
- O checkpoint atual anuncia contexto de 8.192 tokens e temperatura `T=1.0`; não copie a calibração `2.179` da revisão original para esta instalação. [Model card](https://huggingface.co/bespokelabs/Bespoke-Nimble-9B).
- O backend MLX documentado pode compartilhar o processamento do contexto entre campos; o CUDA documentado pontua campos com prompts completos. Isso é propriedade do backend, não promessa universal do modelo. [Guia de scoring](https://github.com/bespokelabsai/nimble/blob/main/docs/PARALLEL_SCORING.md).
- `Q4_K_M` reduz o espaço dos pesos com quantização; o tamanho do arquivo não inclui todas as necessidades de memória durante a execução. A inspeção local mostrou os pesos carregados em GPU, mas não foi um benchmark de capacidade.

## O que esperar na prática

O modelo é adequado a decisões com opções conhecidas e critérios explícitos. É preciso fornecer os fatos usados na avaliação: o modelo não consulta arquivos, internet ou bancos por conta própria. Ele também não substitui um gerador de texto para redação, explicações ou extração livre. Uma opção “sem evidência suficiente” pode representar incerteza causada pela entrada; uma distribuição de probabilidades não identifica sozinha todas as situações desconhecidas.

As capacidades `tools`, `thinking` e `completion` nos metadados locais não mudam o contrato de `/v1/systemone`. O projeto usa a capacidade `decision` e recebe saídas restritas ao esquema.
