import { useRef } from 'react';
import Chat from '../components/Chat';
import Offer from '../components/Offer';
import ResultsPanel from '../components/ResultsPanel';

export default function SimulatorPage({ trainer }) {
  const inputRef = useRef(null);
  const { catalog, scenario, index, finished } = trainer;
  return <>
    <div className="intro"><div><p className="eyebrow">Treine a próxima mensagem</p><h1>A conversa começou.<br /><span>O próximo passo é seu.</span></h1><p className="lead">Leia a DM, entenda a objeção e experimente sua abordagem.</p></div>
      <div className="scenario-picker"><label htmlFor="scenario-select">Escolha uma situação</label><select id="scenario-select" disabled={!catalog} value={index} onChange={event => trainer.selectScenario(Number(event.target.value))}>
        {catalog ? catalog.scenarios.map((item, itemIndex) => <option key={item.id} value={itemIndex}>{item.title}</option>) : <option value={0}>Carregando cenários…</option>}
      </select><span id="progress">{catalog ? `Cenário ${index + 1} de ${catalog.scenarios.length} · avance quando quiser` : 'Três ofertas. Novas possibilidades.'}</span></div>
    </div>
    <div id="completion" className="completion" hidden={!finished}>Você explorou os três cenários. Pode recomeçar ou escolher outra situação, no seu ritmo.</div>
    <div className="workspace"><section className="context-column" aria-labelledby="scenario-title"><Offer key={scenario?.id} scenario={scenario} /><Chat trainer={trainer} inputRef={inputRef} /></section><ResultsPanel trainer={trainer} /></div>
    <div className="navigation"><button id="retry" className="secondary-button" disabled={!catalog} onClick={() => { trainer.clearError(); inputRef.current?.focus(); }}>Tentar outra resposta <span aria-hidden="true">↺</span></button>
      <button id="next" className="secondary-button" disabled={!catalog} onClick={trainer.nextScenario}>{finished ? 'Recomeçar ↺' : catalog && index === catalog.scenarios.length - 1 ? 'Concluir cenários →' : 'Próximo cenário →'}</button>
    </div>
  </>;
}
