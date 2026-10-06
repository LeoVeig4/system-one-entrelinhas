# Casos de uso e critérios para escolher

O melhor ponto de partida neste projeto é a **triagem de solicitações**, pois já existe uma integração funcionando. As aplicações abaixo precisam de um contexto definido e opções ou níveis conhecidos.

## Casos presentes nas fontes

O Ollama apresenta triagem de tickets, roteamento entre modelos, moderação de conteúdo/ferramentas e uma demonstração de decisões de movimento em Pac-Man. São exemplos públicos; somente a triagem sintética foi testada nesta máquina. [Anúncio oficial](https://ollama.com/blog/ollama-now-supports-jev-style-decision-models).

Os benchmarks da Bespoke incluem classificação de intenção, presença de evidência em RAG, paráfrases, relações entre afirmação e evidência, moderação e rubricas de qualidade de respostas/resumos. A avaliação indica viabilidade dessas formas de pergunta, sem demonstrar qualidade suficiente para qualquer aplicação específica. [Suite de benchmarks](https://github.com/bespokelabsai/nimble/blob/main/docs/PUBLIC_BENCHMARKS.md).

## Propostas práticas de aplicação

A tabela é uma proposta de desenho para aplicações, não uma lista de integrações já instaladas ou casos de clientes comprovados.

| Aplicação | Conteúdo de `state` | Perguntas e resultados | Como usar o resultado |
| --- | --- | --- | --- |
| Triagem de atendimento | Mensagem do cliente e impacto relatado | `choice`: financeiro/técnico/comercial/outro; `noul`: pede estorno; `score`: urgência | Sugerir fila e ordem de atendimento |
| Organização de documentos ou notas | Trecho do documento e taxonomia desejada | `choice`: tipo de documento; várias `noul`: contém decisão, tarefa, prazo explícito | Aplicar categorias conhecidas depois de avaliar a qualidade |
| Classificação multilabel | Texto e definições de cada etiqueta | Uma `noul` por etiqueta | Permitir várias etiquetas simultâneas |
| Roteamento de IA | Solicitação e descrições das capacidades dos destinos | `choice`: modelo rápido/modelo mais capaz/revisão | Selecionar o próximo componente do fluxo |
| Seleção de ferramenta | Pedido e descrição de ferramentas candidatas | `choice`: busca/calculadora/banco/nenhuma | Produzir uma sugestão de ferramenta; argumentos e autorização pertencem ao agente |
| Filtragem de trechos para RAG | Pergunta do usuário e um trecho candidato | `noul`: o trecho contém evidência útil; `score`: relevância por rubrica | Filtrar candidatos antes de um modelo gerar a resposta |
| Verificação de afirmações | Afirmação e evidência fornecida | `choice`: sustentada/contradita/sem informação | Encaminhar afirmações sem suporte para revisão |
| Deduplicação semântica | Duas mensagens ou descrições | `noul`: expressam o mesmo pedido | Sugerir grupos de duplicatas sem apagar registros automaticamente |
| Avaliação de resposta/resumo | Pedido, resposta e texto de referência | `score`: utilidade/consistência/completude | Monitorar qualidade ou priorizar revisão |
| Regras internas descritas em texto | Política da empresa e fatos relevantes | `choice`: atende/não atende/evidência insuficiente | Auxiliar a leitura; regras exatas já estruturadas podem ser avaliadas diretamente em código |
| Moderação | Mensagem ou descrição de ação e política concreta | `noul` por condição; `choice`: encaminhamento | Classificar para um fluxo com controles próprios |
| Estado de jogo ou simulação | Representação textual do estado e movimentos permitidos | `choice`: próximo movimento | Explorar decisões discretas medindo latência e resultados |

## Desenhos concretos

### Triagem: começo mais direto

Reutilize [triagem.json](../assets/triagem.json). Avalie exemplos de cobrança, erro técnico, preço, assunto fora das classes e mensagens que misturam temas. Estabeleça uma regra explícita para decidir o departamento principal quando houver dois assuntos. Se isso não existir, a classificação pode variar mesmo com ambos os temas presentes.

O pedido de estorno é uma característica separada do departamento: uma mensagem pode ser técnica e pedir dinheiro de volta. Perguntas independentes preservam essa distinção. O resultado apenas sugere o destino; a aplicação decide o que fazer com ele.

### RAG: evidência antes de geração

Primeiro, outro componente recupera os trechos. Depois, envie pares de pergunta e trecho ao Nimble, perguntando se cada trecho contém a informação necessária. Um trecho sobre o assunto pode ser irrelevante para o fato perguntado. Use uma rubrica concreta para relevância se precisar de mais que sim/não.

Esse desenho não transforma o Nimble em buscador, leitor de PDFs ou gerador de citações. Extração do texto, busca e geração da resposta são etapas separadas. Quantos pares cabem por chamada depende da janela do prompt e do custo; 64 perguntas é um teto de API, não uma meta de lote.

### Documentos e reuniões: classificar conteúdo já obtido

Depois de obter o texto, perguntas possíveis: “este trecho registra uma decisão?”, “há uma tarefa assumida explicitamente?” e “qual é o assunto principal?”. Use `choice` para uma taxonomia fixa e `noul` para presença de características. Para extrair o nome livre de uma pessoa, um prazo ou a redação de uma tarefa, use um extrator ou modelo de geração apropriado.

### Avaliação: níveis que uma pessoa consegue distinguir

Uma rubrica de consistência pode ter: 0 = contradição explícita; 1 = mistura fatos sustentados e não sustentados; 2 = conteúdo sustentado pela referência. Os níveis devem descrever situações observáveis. Uma nota genérica “boa/média/ruim” tende a esconder divergências de interpretação. Registre tanto a distribuição quanto o nível de maior probabilidade.

## Quando outra abordagem atende melhor

| Necessidade | Abordagem mais adequada |
| --- | --- |
| Redigir e-mails, explicar a decisão ou criar relatório | Modelo de geração |
| Extrair campos com valores livres, trechos exatos ou JSON aninhado | Extração estruturada ou geração com validação |
| Comparar datas/valores já estruturados por uma regra exata | Código determinístico |
| Indexar e pesquisar muitos documentos | Busca/embeddings; o Nimble pode avaliar os candidatos recuperados |
| Ler imagens, áudio ou PDFs sem texto extraído | OCR, transcrição ou modelo apropriado ao formato |
| Tomar decisões com fatos externos ausentes | Obter os fatos antes da classificação |

## Validar a aplicação escolhida

Separe exemplos reais rotulados por pessoas; inclua casos claros, ambíguos, negativos e com informação ausente. Valide português da sua aplicação, sem inferir qualidade pelo idioma inglês dos benchmarks. Para classificação, confira erros por categoria; para booleanos, compare falsos positivos e negativos; para rubricas, examine divergências entre níveis.

Escolha limiares e encaminhamento para revisão com esse conjunto. Registre versão/digest do modelo, payload e rubrica para reproduzir decisões. Se mudar quantização, critérios ou revisão do modelo, confira os resultados de novo. Quando houver exigência de consistência entre campos, verifique-a em código.
