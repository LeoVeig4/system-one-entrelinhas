import { Link } from 'react-router-dom';
import { compatible, decimal, percentage, signed } from '../lib/format';

function Distribution({ labels, probabilities }) {
  return Object.entries(labels).map(([key, label]) => <div className="distribution" key={key}>
    <div className="distribution-header"><span>{label}</span><span>{percentage.format(probabilities[key] * 100)}%</span></div>
    <div className="distribution-track"><div className="distribution-fill" style={{ width: `${probabilities[key] * 100}%` }} /></div>
  </div>);
}

function Comparison({ before, after }) {
  if (!compatible(before, after)) return null;
  const rows = [
    ...after.presentation.effects.map(item => [item.title, `${signed.format(item.percent - before.presentation.effects.find(previous => previous.key === item.key).percent)} p.p.`]),
    ['Abordagem', `${before.presentation.approach.label} → ${after.presentation.approach.label}`],
    ...after.presentation.dimensions.map(item => [item.title, `${signed.format(item.score - before.presentation.dimensions.find(previous => previous.key === item.key).score)} na escala`]),
  ];
  return <details id="comparison" className="panel detail-panel" key={after.attempt_id}>
    <summary>O que mudou nesta tentativa?</summary><div id="comparison-content"><p>Antes</p><p className="comparison-text">{before.seller_response}</p><p>Agora</p><p className="comparison-text">{after.seller_response}</p>
      {rows.map(([title, value]) => <div className="comparison-row" key={title}><span>{title}</span><span>{value}</span></div>)}
    </div>
  </details>;
}

export default function ResultsPanel({ trainer }) {
  const { catalog, result, previous, active, draft } = trainer;
  const schema = catalog?.schema;
  const presentation = result?.presentation;
  const edited = !!result && draft !== result.seller_response;
  return <section id="results" className="results-column" aria-labelledby="results-title" aria-busy={!!active}>
    <div className="panel reactions-panel"><div className="section-top"><span className="eyebrow">Possíveis reações</span><span className="small-badge">6 efeitos independentes</span></div>
      <h2 id="results-title">O que essa resposta pode despertar?</h2><p className="panel-description">Quanto mais presente o card, maior o escore daquele efeito.</p>
      <div id="effects" className="effect-grid">{schema?.effects.map(definition => {
        const effect = presentation?.effects.find(item => item.key === definition.key);
        return <div className="effect-card" data-effect={definition.key} key={definition.key} style={effect ? { '--strength': effect.opacity } : undefined} title={definition.description}>
          <div className="effect-surface" aria-hidden="true" /><span className="effect-icon" aria-hidden="true">{definition.icon}</span><span className="effect-title">{definition.title}</span>
          <div className="effect-value">{effect ? <>{percentage.format(effect.percent)}<span>%</span></> : '—'}</div><span className="effect-state">{effect ? 'Efeito simulado' : 'Aguardando simulação'}</span>
        </div>;
      })}</div>
      <p id="result-note" className={`result-note${edited ? ' edited' : ''}`}>{!result ? 'Escreva uma resposta para explorar os caminhos desta conversa.' : edited ? 'Você está editando. Este painel ainda se refere à resposta anterior.' : `Simulação desta resposta · ${decimal.format(result.duration_seconds)} s`}</p>
    </div>
    <div className="profile-grid"><div className="panel approach-panel"><p className="eyebrow">Sua abordagem</p><h2>Intenção predominante</h2><div id="approach" className="approach-label">{presentation?.approach.label || 'Ainda não avaliada'}</div>
      <p className="panel-description">Uma descrição da sua abordagem, sem nota ou ranking.</p>
      {result && <details id="approach-details"><summary>Ver outras possibilidades</summary><div id="approach-distribution" className="distributions"><Distribution labels={schema.approaches} probabilities={presentation.approach.probabilities} /></div></details>}
    </div><div className="panel dimensions-panel"><p className="eyebrow">Perfil da resposta</p><h2>Intensidades</h2>
      <div id="dimensions">{schema?.dimensions.map(definition => {
        const dimension = presentation?.dimensions.find(item => item.key === definition.key);
        return <div className="dimension" key={definition.key}><div className="dimension-header"><span>{definition.title}</span><span className="dimension-value">{dimension ? `${decimal.format(dimension.score)} / 4` : '—'}</span></div>
          <div className="scale" {...(dimension ? { role: 'meter', 'aria-label': definition.title, 'aria-valuemin': 0, 'aria-valuemax': 4, 'aria-valuenow': dimension.score } : {})}>
            {dimension && <span className="scale-mark" style={{ left: `${dimension.position * 100}%` }} />}
          </div><div className="scale-ends"><span>Menor</span><span>Maior</span></div>
        </div>;
      })}</div>
      {result && <details id="dimension-details"><summary>Entender os níveis</summary><div id="dimension-distributions">{presentation.dimensions.map(item => <div key={item.key}><p>{item.title}</p><Distribution labels={item.legend} probabilities={item.probabilities} /></div>)}</div></details>}
    </div></div>
    <Comparison before={previous} after={result} />
    {result && <details id="technical" className="panel detail-panel"><summary>Como o modelo respondeu</summary>
      <p className="panel-description">noul: efeitos independentes · choice: uma categoria · score: intensidade esperada. Confidence descreve concentração, não chance de acerto.</p>
      <div id="technical-content"><p>{result.model} · {result.usage ? `${result.usage.input_tokens} tokens de entrada · ${result.usage.output_tokens} de saída` : 'Uso de tokens não informado'}</p><details><summary>Resposta avaliada</summary><p className="comparison-text">{result.seller_response}</p></details></div>
      <pre id="raw-result">{JSON.stringify({ questions: result.questions, answers: result.answers, usage: result.usage }, null, 2)}</pre>
    </details>}
    <Link to="/conceitos" className="learn-link">Entenda os três tipos de decisão <span aria-hidden="true">→</span></Link>
  </section>;
}
