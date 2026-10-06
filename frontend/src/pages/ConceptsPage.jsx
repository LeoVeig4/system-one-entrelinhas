import { Link } from 'react-router-dom';
import ConceptExamples from '../components/ConceptExamples';

const request = {
  model: 'nimble:9b-q4_K_M',
  state: { solicitacao: 'Fui cobrado duas vezes. Quero o estorno de uma cobrança. Consigo acessar o serviço normalmente.' },
  questions: {
    department: {
      type: 'choice',
      instructions: 'Qual departamento deve atender esta solicitação?',
      criteria: {
        billing: 'Cobrança, pagamento ou reembolso',
        technical: 'Erros técnicos ou falhas de acesso',
        other: 'Outro assunto ou informação insuficiente',
      },
    },
    refund_requested: {
      type: 'noul',
      instructions: 'O cliente pede explicitamente estorno ou reembolso?',
      criteria: { true: 'Há pedido explícito de devolução de dinheiro', false: 'Não há pedido explícito de devolução de dinheiro' },
    },
    urgency: {
      type: 'score',
      instructions: 'Avalie a urgência somente pelo impacto relatado.',
      criteria: [
        'Rotina: serviço acessível, sem prazo crítico informado',
        'Prioridade: parte do serviço bloqueada ou prazo próximo explícito',
        'Crítico: serviço totalmente indisponível ou operação essencial paralisada',
      ],
    },
  },
};

// Recorte didático: estes números não vêm de uma chamada ao modelo.
const response = {
  model: 'nimble:9b-q4_K_M',
  answers: {
    department: { type: 'choice', choice: 'billing', probabilities: { billing: 0.9, technical: 0.03, other: 0.07 } },
    refund_requested: { type: 'noul', noul: 0.98 },
    urgency: { type: 'score', score: 0.25, legend: { 0: 'Rotina: serviço acessível, sem prazo crítico informado', 1: 'Prioridade: parte do serviço bloqueada ou prazo próximo explícito', 2: 'Crítico: serviço totalmente indisponível ou operação essencial paralisada' }, probabilities: { 0: 0.75, 1: 0.25, 2: 0 } },
  },
};

export default function ConceptsPage() {
  return <div className="concepts-page">
    <div className="concepts-hero">
      <div><p className="eyebrow">System One · conceitos básicos</p><h1>Contexto e critérios.<br /><span>Decisões estruturadas.</span></h1><p className="lead">Entenda como Ollama e Nimble trabalham juntos para classificar, avaliar condições e pontuar rubricas.</p><Link to="/" className="concept-cta">Experimentar no simulador <span aria-hidden="true">↗</span></Link></div>
      <div className="decision-summary"><p className="eyebrow">Três tipos de decisão</p><div><strong>?</strong><span>noul</span><i>+</i><strong>↗</strong><span>choice</span><i>+</i><strong>Σ</strong><span>score</span></div><p>Condição · categoria · intensidade</p><span className="summary-note">Você define a pergunta e os critérios.</span></div>
    </div>
    <nav className="concepts-index" aria-label="Nesta página"><a href="#pecas">Ollama e Nimble</a><a href="#fluxo">Como funciona</a><a href="#tipos">Tipos de decisão</a><a href="#requisicao">Requisição e resposta</a><a href="#exemplos">Exemplos interativos</a><a href="#limites">Como interpretar</a></nav>
    <section id="pecas" className="concept-section" aria-labelledby="pieces-title">
      <div className="section-heading"><p className="eyebrow">Três nomes, três papéis</p><h2 id="pieces-title">Ollama executa. Nimble avalia. System One organiza.</h2></div>
      <div className="types-grid">
        <article className="panel piece-card"><span className="piece-number">01 · RUNTIME</span><h3>Ollama</h3><p>É o programa que carrega e executa o modelo no computador. Na integração deste projeto, oferece o endpoint <code>/v1/systemone</code> para receber pedidos de decisão.</p></article>
        <article className="panel piece-card"><span className="piece-number">02 · MODELO</span><h3>Nimble 9B</h3><p>É o modelo especializado em decisões com alternativas e critérios fornecidos. Usa o contexto para atribuir pesos às possibilidades. A tag utilizada aqui é <code>nimble:9b-q4_K_M</code>.</p></article>
        <article className="panel piece-card"><span className="piece-number">03 · CONTRATO</span><h3>System One</h3><p>É a interface de decisão usada nesta integração. Recebe contexto e perguntas tipadas e devolve um JSON com condições, categorias e pontuações, em vez de uma resposta aberta de conversa.</p></article>
      </div>
    </section>
    <section id="fluxo" className="concept-section" aria-labelledby="flow-title">
      <div className="section-heading"><p className="eyebrow">Da pergunta à decisão</p><h2 id="flow-title">Como uma chamada funciona.</h2><p>As perguntas compartilham o contexto. Cada uma define o que deve ser avaliado.</p></div>
      <ol className="flow-steps decision-flow" aria-label="Fluxo de uma decisão System One">
        <li><span>01 · ENTRADA</span><h3>Contexto + perguntas</h3><p><code>state</code> traz os fatos. <code>questions</code> define instruções, tipos e alternativas.</p></li>
        <li><span>02 · API</span><h3>System One no Ollama</h3><p>Recebe o JSON em <code>/v1/systemone</code> e prepara as decisões para o modelo.</p></li>
        <li><span>03 · AVALIAÇÃO</span><h3>Nimble</h3><p>Pontua as alternativas a partir do contexto e dos critérios fornecidos.</p></li>
        <li><span>04 · SAÍDA</span><h3>Respostas tipadas</h3><p>O Ollama monta <code>answers</code> com o resultado de cada pergunta.</p></li>
      </ol>
      <div className="contract-grid">
        <div className="panel"><h3>Contexto não é instrução</h3><p><code>state</code> é o conteúdo a avaliar: uma mensagem, fatos ou um objeto JSON. <code>instructions</code> diz o que a pergunta deve decidir. Não é necessário reescrever os critérios a cada nova mensagem.</p></div>
        <div className="panel"><h3>Critérios dão significado</h3><p><code>criteria</code> descreve as categorias ou os níveis. Uma rubrica é uma sequência ordenada desses níveis. Critérios claros ajudam a distinguir possibilidades; inclua “outro” ou “informação insuficiente” quando fizer sentido.</p></div>
      </div>
    </section>
    <section id="tipos" className="concept-section" aria-labelledby="types-title">
      <div className="section-heading"><p className="eyebrow">Escolha o tipo pela pergunta</p><h2 id="types-title">Condição, categoria ou escala?</h2></div>
      <div className="types-grid">
        <article className="panel type-card"><span className="type-tag">noul</span><h3>“Esta condição é verdadeira?”</h3><p>Devolve um número entre 0 e 1, interpretado como a probabilidade atribuída à condição verdadeira. Não devolve um booleano.</p><p className="type-example">“O cliente pediu reembolso?” → <code>noul: 0.98</code></p><p>Se precisar decidir sim ou não, defina um limiar e valide-o com exemplos. Perguntas noul distintas não precisam somar 100%.</p></article>
        <article className="panel type-card"><span className="type-tag cyan">choice</span><h3>“Qual alternativa se aplica?”</h3><p>Devolve a categoria com maior probabilidade, além da distribuição entre as alternativas fornecidas.</p><p className="type-example">“Qual departamento atende?” → <code>choice: "billing"</code></p><p>As probabilidades somam 1 dentro dessa pergunta. A categoria vencedora não é uma nota de qualidade.</p></article>
        <article className="panel type-card"><span className="type-tag lime">score</span><h3>“Em qual nível da rubrica?”</h3><p>Devolve o valor esperado dos índices de níveis ordenados. A contagem começa em zero e o resultado pode ser fracionário.</p><p className="type-example">75% no nível 0 + 25% no nível 1 → <code>score: 0.25</code></p><p>Três critérios formam uma escala de 0 a 2; cinco formam uma escala de 0 a 4. O nível mais provável pode diferir do score.</p></article>
      </div>
    </section>
    <section id="requisicao" className="concept-section" aria-labelledby="request-title">
      <div className="section-heading"><p className="eyebrow">Um contexto, três perguntas</p><h2 id="request-title">Exemplo de requisição.</h2><p>Triagem de uma solicitação: departamento, pedido de reembolso e urgência.</p></div>
      <div className="panel detail-panel"><p><code>POST http://localhost:11434/v1/systemone</code><br /><code>Content-Type: application/json</code></p><pre aria-label="JSON da requisição System One">{JSON.stringify(request, null, 2)}</pre></div>
      <div className="contract-grid request-fields">
        <div className="panel"><h3>Campos da requisição</h3><dl className="contract-list"><div><dt><code>model</code></dt><dd>Tag do modelo instalado no Ollama.</dd></div><div><dt><code>state</code></dt><dd>Contexto compartilhado: pode ser texto, objeto ou array JSON.</dd></div><div><dt><code>questions</code></dt><dd>Perguntas nomeadas. Cada uma define <code>type</code>, <code>instructions</code> e seus critérios.</dd></div></dl></div>
        <div className="panel"><h3>Como definir os critérios</h3><p><strong>choice:</strong> objeto que relaciona cada categoria à sua descrição.</p><p><strong>noul:</strong> descrições de <code>true</code> e <code>false</code>; os critérios são opcionais nesse tipo.</p><p><strong>score:</strong> array ordenado de descrições, do nível mais baixo ao mais alto.</p><p><code>keep_alive</code> é opcional: por exemplo, <code>"5m"</code> mantém o modelo carregado por um período após a chamada.</p></div>
      </div>
      <details className="panel detail-panel"><summary>Ver uma resposta ilustrativa</summary><p>Recorte didático dos resultados. Os números abaixo foram escolhidos para explicar o formato; não são uma inferência executada. Campos como <code>confidence</code> e <code>usage</code> foram omitidos.</p><pre aria-label="JSON de resposta ilustrativa">{JSON.stringify(response, null, 2)}</pre><p><code>billing</code> vence com 90% do peso; o pedido de reembolso recebe 0,98; a urgência é 0 × 0,75 + 1 × 0,25 + 2 × 0 = 0,25, numa escala de 0 a 2.</p></details>
    </section>
    <section id="exemplos" className="concept-section" aria-labelledby="examples-title"><div className="section-heading"><p className="eyebrow">Aprenda mexendo</p><h2 id="examples-title">Faça os números mudarem.</h2><p className="didactic-label">Exemplos didáticos · sem inferência · categorias e escala do simulador</p></div><ConceptExamples /></section>
    <section id="limites" className="concept-section" aria-labelledby="limits-title">
      <div className="panel limits-panel"><div><p className="eyebrow">Interpretar é parte do uso</p><h2 id="limits-title">Probabilidade não garante acerto.</h2><p>Os resultados dependem dos fatos disponíveis e dos critérios definidos. A integração precisa de validação com exemplos representativos da tarefa.</p></div><ul><li><strong>Confidence:</strong> descreve a concentração da distribuição em choice e score. Não é uma probabilidade calibrada de acerto.</li><li><strong>Probabilities:</strong> mostram o peso entre alternativas de uma mesma pergunta; não confundem categorias com intensidades.</li><li><strong>Legend:</strong> relaciona os índices do score aos critérios da rubrica. <strong>Usage</strong> informa o uso de tokens da chamada.</li><li><strong>Contexto e evidência:</strong> o modelo avalia os dados enviados; não consulta fatos externos por conta própria. Falta de informação e falhas de execução precisam de tratamento explícito.</li></ul></div>
    </section>
    <div className="concepts-bottom"><div><h2>Veja os três tipos na prática.</h2><p>O simulador combina noul, choice e score numa avaliação.</p></div><Link to="/" className="primary-button">Abrir simulador <span aria-hidden="true">↗</span></Link></div>
    <p className="concept-sources">Referências: <a href="https://huggingface.co/bespokelabs/Bespoke-Nimble-9B" target="_blank" rel="noreferrer">Nimble · descrição oficial</a> · <a href="https://github.com/ollama/ollama/blob/v0.35.0/decision/types.go" target="_blank" rel="noreferrer">Contrato System One · Ollama v0.35.0</a></p>
  </div>;
}
