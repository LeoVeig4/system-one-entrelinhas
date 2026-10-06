import { Fragment } from 'react';

export default function Chat({ trainer, inputRef }) {
  const { scenario, draft, setDraft, count, active, result, error, status, canEvaluate, evaluate } = trainer;
  const submitted = active?.text || result?.seller_response;
  return <div className="panel chat-panel">
    <div className="chat-header">
      <span id="customer-avatar" className="avatar" aria-hidden="true">{scenario?.customer_name.slice(0, 1) || '·'}</span>
      <div className="chat-contact"><strong id="customer-name">{scenario?.customer_name || 'Cliente'}</strong><span id="customer-profile">{scenario?.customer_profile || 'Conversa fictícia'}</span></div>
      <span className="dm-badge">DM</span>
    </div>
    <div className="chat-date">Hoje · conversa simulada</div>
    <div id="messages" className="messages" aria-label="Histórico da conversa">
      {scenario?.messages.map((item, index) => <Fragment key={`${scenario.id}-${index}`}>
        {index === scenario.messages.length - 1 && <div className="objection-divider">A objeção que você vai contornar</div>}
        <div className={`message ${item.role}${index === scenario.messages.length - 1 ? ' objection' : ''}`}>
          <div className="message-meta"><span className="message-name">{item.role === 'customer' ? scenario.customer_name : 'Você'}</span><span className="message-time">{item.time}</span></div>
          <p className="message-text">{item.content}</p>
        </div>
      </Fragment>)}
      {submitted && <div className={`message seller submitted-response${active ? ' pending-response' : ''}`}>
        <div className="message-meta"><span className="message-name">Você</span><span className="message-time">{active ? 'Avaliando…' : 'Resposta avaliada ✓'}</span></div>
        <p className="message-text">{submitted}</p>
      </div>}
    </div>
    <form id="response-form" className="response-panel" onSubmit={evaluate} noValidate>
      <div className="section-top"><label htmlFor="seller-response"><strong>Sua próxima mensagem</strong></label><span id="character-count" className={`character-count${count > 2000 ? ' over-limit' : ''}`}>{count.toLocaleString('pt-BR')} / 2.000</span></div>
      <textarea ref={inputRef} id="seller-response" rows="3" placeholder="Como você responderia a essa objeção?" aria-describedby="input-help character-count" disabled={!scenario} value={draft} onChange={event => setDraft(event.target.value)} />
      <div className="composer-actions"><p id="input-help" className="input-help">Responda do seu jeito, usando os fatos da oferta.</p><button id="evaluate" className="primary-button" disabled={!canEvaluate} type="submit">Enviar e ver reações <span aria-hidden="true">↗</span></button></div>
      <div id="status" role="status" aria-live="polite" className="status">{status}</div>
      <div id="error" role="alert" className="error" hidden={!error}>{error}</div>
      {!scenario && error && <button type="button" className="secondary-button" onClick={trainer.reload}>Recarregar cenários</button>}
    </form>
  </div>;
}
