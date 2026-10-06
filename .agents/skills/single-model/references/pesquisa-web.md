# Pesquisa na internet: maneiras de usar e evidência

Pesquisa realizada em **02/10/2026**. Foram usadas fontes primárias: Ollama, Bespoke Labs e TypeSafe. Resultados referentes ao framework estatístico NIMBLE em R foram descartados por se tratar de outro produto.

## Maneiras de integrar

| Caminho | Utilidade | Situação nesta máquina |
| --- | --- | --- |
| HTTP direto no Ollama | Reutilizar Python, PowerShell ou JavaScript com payload JSON | Python e os três tipos de pergunta testados localmente |
| SDK Python TypeSafe apontado para Ollama | Classes `Choice`, `Noul`, `Score` e resultados tipados | Documentado pelas fontes; pacote não instalado nem testado aqui |
| SDK JavaScript/TypeScript TypeSafe | Integração tipada no ecossistema JavaScript | Fonte oficial localizada; compatibilidade com o backend local deve ser conferida na versão escolhida |
| Scorers nativos Nimble | Controle da inferência e pesquisa, com MLX ou CUDA | Alternativa documentada; a instalação atual usa GGUF/Ollama |

HTTP direto é a continuação mais simples do seu projeto, por já funcionar com `requests`. A [biblioteca oficial Python](https://github.com/typesafe-ai/typesafe-sdk-python) fornece `TypeSafeClient.system_one`. A [biblioteca oficial JavaScript](https://github.com/typesafe-ai/typesafe-sdk-js) documenta o cliente TypeScript/JavaScript; consulte a configuração de URL da versão usada.

O Ollama documenta o SDK Python com `TYPESAFE_BASE_URL=http://localhost:11434`, uma chave fictícia local e a tag do modelo. O modo local não exige uma conta TypeSafe para inferência; serviços hospedados são integrações diferentes. [Exemplo oficial do Ollama](https://ollama.com/library/nimble:9b-q4_K_M).

Configuração opcional em PowerShell, **somente se o usuário quiser adotar o SDK**:

```powershell
$env:TYPESAFE_BASE_URL = 'http://localhost:11434'
$env:TYPESAFE_API_KEY = 'ollama'
$env:TYPESAFE_DEFAULT_MODEL = 'nimble:9b-q4_K_M'
```

Não foi necessário instalar esse SDK para os testes. Para usar suas classes, consulte a [documentação TypeSafe Python](https://docs.typesafe.ai/sdk/python) e a versão instalada, em vez de presumir que exemplos de outros backends têm o mesmo contrato.

## Aplicações encontradas nas fontes

O anúncio do Ollama demonstra decisões rápidas de jogo e descreve triagem, roteamento e moderação. A latência de **91 ms** vem de uma demonstração em **MacBook Pro M5 Max**; não é uma medida deste computador. [Anúncio oficial, 29/09/2026](https://ollama.com/blog/ollama-now-supports-jev-style-decision-models).

A suite Bespoke inclui intenção, RAG, paráfrases, verificação e rubricas. O conjunto público reúne **13 subconjuntos e 3.880 decisões** com rótulos humanos; o resultado publicado da execução original tem média macro de **74,8%**. Esses números medem concordância com rótulos e não garantem acerto em uma aplicação nova. [Benchmarks e metodologia](https://github.com/bespokelabsai/nimble/blob/main/docs/PUBLIC_BENCHMARKS.md).

Não compare diretamente esse número com os **75,7%** do teste reportado pelo Ollama: as execuções são diferentes. Também não use o resultado de avaliação sintética da receita inicial como uma precisão geral em produção. [Execução reportada pelo Ollama](https://ollama.com/library/nimble:9b-q4_K_M).

## Fontes técnicas para aprofundar

| Fonte | O que consultar |
| --- | --- |
| [Ollama: modelo e tag exata](https://ollama.com/library/nimble:9b-q4_K_M) | Distribuição GGUF, endpoint e exemplos |
| [Ollama: anúncio de modelos de decisão](https://ollama.com/blog/ollama-now-supports-jev-style-decision-models) | Casos de uso e demonstração |
| [Bespoke: repositório Nimble](https://github.com/bespokelabsai/nimble) | Código e organização do projeto |
| [Bespoke: model card](https://huggingface.co/bespokelabs/Bespoke-Nimble-9B) | Identidade do adapter, revisão e contrato nativo |
| [Bespoke: treinamento](https://github.com/bespokelabsai/nimble/blob/main/docs/NIMBLE_TRAINING.md) | Receita de ajuste do modelo |
| [Bespoke: scoring](https://github.com/bespokelabsai/nimble/blob/main/docs/PARALLEL_SCORING.md) | Diferenças entre backends |
| [Bespoke: benchmarks públicos](https://github.com/bespokelabsai/nimble/blob/main/docs/PUBLIC_BENCHMARKS.md) | Tarefas, datasets, resultados e limitações |
| [Ollama 0.35.0: compilador de perguntas](https://github.com/ollama/ollama/blob/v0.35.0/decision/systemone.go) | Limites reais e cálculo das respostas |
| [Ollama 0.35.0: tipos](https://github.com/ollama/ollama/blob/v0.35.0/decision/types.go) | Formato dos campos da API |

As aplicações propostas para atendimento, documentos e RAG estão detalhadas em [casos-de-uso.md](casos-de-uso.md), com a distinção entre exemplos publicados e propostas locais.
