import { useState } from 'react';
import schema from '@schema';
import { decimal, percentage } from '../lib/format';

export default function ConceptExamples() {
  const [probability, setProbability] = useState(70);
  const [approach, setApproach] = useState('discovery');
  const [levelThree, setLevelThree] = useState(75);
  const score = 2 * (1 - levelThree / 100) + 3 * levelThree / 100;
  return <div className="examples-grid">
    <article className="panel example-card"><span className="type-tag">noul</span><h3>A probabilidade de uma condição.</h3><p>Considere a pergunta “O cliente pediu reembolso?”. Arraste para explorar a probabilidade atribuída a essa condição.</p>
      <div className="score-example"><output htmlFor="probability-example">{decimal.format(probability / 100)}</output><span>/ 1</span></div>
      <label htmlFor="probability-example">Probabilidade da condição: {probability}%</label><input id="probability-example" type="range" min="0" max="100" value={probability} onChange={event => setProbability(Number(event.target.value))} />
      <output htmlFor="probability-example" id="noul-example">P(verdadeiro): {probability}% · P(falso): {100 - probability}%</output>
      <p className="example-footnote">O campo noul é um número. Transformá-lo em sim ou não exige um limiar escolhido para a tarefa.</p>
    </article>
    <article className="panel example-card"><span className="type-tag cyan">choice</span><h3>Uma categoria predomina.</h3><p>Escolha uma categoria para montar uma distribuição ilustrativa: 60% nela e 8% em cada uma das outras.</p>
      <label htmlFor="approach-example">Categoria com maior peso</label><select id="approach-example" value={approach} onChange={event => setApproach(event.target.value)}>{Object.entries(schema.approaches).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>
      <output htmlFor="approach-example" className="example-choice">{schema.approaches[approach]}</output>
      <div className="example-bars">{Object.entries(schema.approaches).map(([key, label]) => <div key={key}><div className="distribution-header"><span>{label}</span><span>{key === approach ? '60%' : '8%'}</span></div><div className="distribution-track"><div className="distribution-fill" style={{ width: key === approach ? '60%' : '8%' }} /></div></div>)}</div>
      <p className="example-footnote">As alternativas competem dentro desta pergunta. A distribuição soma 100%.</p>
    </article>
    <article className="panel example-card"><span className="type-tag lime">score</span><h3>A intensidade pode ficar entre níveis.</h3><p>Distribua o peso entre os níveis 2 e 3. O score é a média ponderada, e pode ser fracionário.</p>
      <div className="score-example"><output htmlFor="score-example" id="expected-score">{decimal.format(score)}</output><span>/ 4</span></div>
      <label htmlFor="score-example">Peso no nível 3: {levelThree}%</label><input id="score-example" type="range" min="0" max="100" value={levelThree} onChange={event => setLevelThree(Number(event.target.value))} />
      <div className="score-weights"><span>Nível 2 · {100 - levelThree}%</span><span>Nível 3 · {levelThree}%</span></div><code>score = Σ nível × probabilidade</code>
      <p className="example-footnote">{percentage.format(100 - levelThree)}% × 2 + {percentage.format(levelThree)}% × 3 = {decimal.format(score)}. O nível mais provável e o valor esperado são informações diferentes.</p>
    </article>
  </div>;
}
