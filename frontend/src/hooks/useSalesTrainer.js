import { useCallback, useEffect, useRef, useState } from 'react';
import { requestJson } from '../lib/api';

export function useSalesTrainer(enabled) {
  const [catalog, setCatalog] = useState(null);
  const [index, setIndex] = useState(0);
  const [draft, setDraft] = useState('');
  const [result, setResult] = useState(null);
  const [previous, setPrevious] = useState(null);
  const [active, setActive] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [finished, setFinished] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const activeRef = useRef(null);

  useEffect(() => {
    if (!enabled || catalog) return;
    const controller = new AbortController();
    setLoading(true); setError('');
    requestJson('/api/scenarios', { signal: controller.signal })
      .then(data => {
        if (!controller.signal.aborted) {
          setCatalog(data); setLoading(false);
        }
      })
      .catch(error => {
        if (!controller.signal.aborted) { setError(error.message); setLoading(false); }
      });
    return () => controller.abort();
  }, [enabled, catalog, loadAttempt]);

  useEffect(() => {
    if (!active) return;
    const tick = () => setElapsed(Math.floor((performance.now() - active.started) / 1000));
    tick(); const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [active]);

  useEffect(() => () => {
    activeRef.current?.controller.abort();
    activeRef.current = null;
  }, []);

  const stopWaiting = useCallback(() => {
    const pending = activeRef.current;
    activeRef.current = null;
    pending?.controller.abort();
    setActive(null);
  }, []);

  const selectScenario = useCallback(nextIndex => {
    stopWaiting(); setIndex(nextIndex); setDraft(''); setResult(null);
    setPrevious(null); setFinished(false); setError(''); setMessage('');
  }, [stopWaiting]);

  async function evaluate(event) {
    event.preventDefault();
    if (!catalog || activeRef.current) return;
    const text = draft;
    if (!text.trim() || Array.from(text).length > 2000) {
      setError('Escreva uma resposta de até 2.000 caracteres.'); return;
    }
    const scenario = catalog.scenarios[index];
    const attempt = { id: crypto.randomUUID(), index, text, started: performance.now(), controller: new AbortController() };
    activeRef.current = attempt;
    setActive(attempt); setError(''); setMessage('');
    try {
      const nextResult = await requestJson('/api/evaluations', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attempt_id: attempt.id, scenario_id: scenario.id,
          scenario_version: scenario.version, evaluation_schema_version: scenario.evaluation_schema_version, seller_response: text }),
        signal: attempt.controller.signal,
      });
      if (activeRef.current !== attempt) return;
      if (nextResult.attempt_id !== attempt.id || nextResult.scenario_id !== scenario.id
        || nextResult.scenario_version !== scenario.version
        || nextResult.evaluation_schema_version !== scenario.evaluation_schema_version
        || nextResult.seller_response !== text) {
        throw new Error('A avaliação não corresponde à tentativa enviada. Tente novamente.');
      }
      setPrevious(result); setResult(nextResult);
      setMessage('Simulação concluída. Explore os efeitos ou tente outra resposta.');
    } catch (error) {
      if (activeRef.current !== attempt || error.name === 'AbortError') return;
      setError(error.message); setMessage('A avaliação não foi concluída. Seu texto continua aqui.');
    } finally {
      if (activeRef.current === attempt) { activeRef.current = null; setActive(null); }
    }
  }

  function nextScenario() {
    if (!catalog) return;
    if (finished) { selectScenario(0); return; }
    if (index < catalog.scenarios.length - 1) selectScenario(index + 1);
    else { stopWaiting(); setFinished(true); setMessage(''); }
  }

  const count = Array.from(draft).length;
  const status = active
    ? `Explorando possíveis reações… ${elapsed} s. A primeira chamada pode levar mais tempo.`
    : loading ? 'Carregando cenários…' : message;

  return { catalog, scenario: catalog?.scenarios[index], index, draft, setDraft, count,
    result, previous, active, error, status, loading, finished, evaluate, selectScenario,
    nextScenario, clearError: () => setError(''), reload: () => setLoadAttempt(value => value + 1),
    canEvaluate: !!catalog && !active && !!draft.trim() && count <= 2000 };
}
