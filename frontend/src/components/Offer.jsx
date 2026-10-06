export default function Offer({ scenario }) {
  return <div className="panel offer-panel">
    <div className="section-top"><span className="eyebrow" id="category">{scenario?.category || 'Situação de venda'}</span><span className="stage" id="stage">{scenario?.stage}</span></div>
    <h2 id="scenario-title">{scenario?.title || 'Preparando a conversa'}</h2>
    <div className="offer"><div className="offer-heading"><span className="offer-label">Sua oferta</span><strong id="offer-price">{scenario?.offer_facts[0]}</strong></div>
      <p id="offer-summary">{scenario?.offer_summary || 'Carregando os fatos da oferta…'}</p>
      <details><summary>Consultar condições da oferta</summary><ul id="offer-facts">{scenario?.offer_facts.map(fact => <li key={fact}>{fact}</li>)}</ul></details>
    </div>
    <details className="context-details"><summary>O que você sabe sobre o cliente</summary><p id="customer-context" className="context-note">{scenario?.customer_context}</p></details>
  </div>;
}
