// Verificação de fluxo. Interceptações abaixo são fixtures de teste, não inferências.
const { chromium } = require(process.argv[2] || '@playwright/test');
const fs = require('node:fs/promises');
const path = require('node:path');
const assert = require('node:assert/strict');
const baseUrl = process.argv[3] || process.env.BASE_URL || 'http://127.0.0.1:8000';
const output = path.resolve(process.argv[5] || 'artifacts/live');

(async () => {
  await fs.mkdir(output, { recursive: true });
  const browser = await chromium.launch({ headless: true, channel: process.argv[4] || process.env.BROWSER_CHANNEL || (process.platform === 'win32' ? 'msedge' : undefined) });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const checks = [];
  try {
    await page.goto(baseUrl);
    await page.locator('#seller-response').waitFor({ state: 'visible' });
    await page.waitForFunction(() => !document.getElementById('seller-response').disabled);
    assert.equal(await page.locator('.effect-card').count(), 6);
    assert.equal(await page.locator('#evaluate').isDisabled(), true);
    assert.deepEqual(await page.locator('.effect-value').allTextContents(), Array(6).fill('—'));
    assert.equal(await page.locator('#messages .message').count(), 5);
    assert.equal(await page.locator('#messages .seller').count(), 2);
    assert.equal(await page.locator('#messages .objection').count(), 1);
    assert.equal(await page.locator('#customer-name').textContent(), 'Marina');
    assert.equal(await page.locator('.chat-panel #response-form').count(), 1);
    assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme), 'dark');
    await page.screenshot({ path: path.join(output, 'desktop-initial.png'), fullPage: true });
    checks.push('Estado inicial neutro e campo vazio sem chamada');

    const text = 'Entendo seu receio com o custo e o aprendizado. Em qual parte a planilha dá mais trabalho? O CRM tem lembretes e importação CSV, e você pode experimentar por 14 dias antes de decidir.';
    await page.locator('#seller-response').fill(text);
    const liveResponse = page.waitForResponse(response => response.url().endsWith('/api/evaluations'), { timeout: 150000 });
    await page.locator('#evaluate').click();
    const response = await liveResponse;
    assert.equal(response.status(), 200);
    const live = await response.json();
    await fs.writeFile(path.join(output, 'browser-live.json'), JSON.stringify(live, null, 2));
    await page.waitForFunction(() => document.getElementById('results').getAttribute('aria-busy') === 'false');
    assert.equal(live.seller_response, text);
    assert.equal(live.scenario_version, '2');
    assert.equal(await page.locator('.submitted-response .message-text').textContent(), text);
    assert.equal(Object.keys(live.answers).length, 10);
    assert.equal(await page.locator('[role=meter]').count(), 3);
    assert.equal(await page.locator('#approach').textContent(), live.presentation.approach.label);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: path.join(output, 'desktop-result.png'), fullPage: true });
    checks.push('Inferência real pelo navegador: dez respostas, cards, choice e três escalas');

    await page.locator('#seller-response').fill('Outra resposta para comparar.');
    assert.match(await page.locator('#result-note').textContent(), /resposta anterior/);
    const fixture = data => ({ ...structuredClone(live), attempt_id: data.attempt_id,
      scenario_id: data.scenario_id, scenario_version: data.scenario_version,
      evaluation_schema_version: data.evaluation_schema_version, seller_response: data.seller_response });
    await page.route('**/api/evaluations', async route => {
      await route.fulfill({ json: fixture(route.request().postDataJSON()) });
    });
    await page.locator('#evaluate').click();
    await page.locator('#comparison').waitFor({ state: 'visible' });
    await page.locator('#comparison > summary').click();
    assert.match(await page.locator('#comparison-content').textContent(), /p\.p\./);
    checks.push('Aviso de edição e comparação com fixture identificada');
    await page.unroute('**/api/evaluations');

    await page.route('**/api/evaluations', async route => {
      await route.fulfill({ status: 503, json: { error: { code: 'model_unavailable', message: 'Falha simulada de conexão.' } } });
    });
    await page.locator('#seller-response').fill('Preservar este texto em uma falha.');
    await page.locator('#evaluate').click();
    await page.locator('#error').waitFor({ state: 'visible' });
    assert.equal(await page.locator('#seller-response').inputValue(), 'Preservar este texto em uma falha.');
    assert.equal(await page.locator('.pending-response').count(), 0);
    assert.equal(await page.locator('#approach').textContent(), live.presentation.approach.label);
    checks.push('Falha preserva rascunho e não fabrica novos escores');
    await page.unroute('**/api/evaluations');

    let pendingRequest;
    let completeDelayed;
    const hold = new Promise(resolve => { completeDelayed = resolve; });
    const requested = new Promise(resolve => { pendingRequest = resolve; });
    await page.route('**/api/evaluations', async route => {
      const data = route.request().postDataJSON(); pendingRequest(); await hold;
      try { await route.fulfill({ json: fixture(data) }); } catch { /* Navegador já abortou. */ }
    });
    await page.locator('#evaluate').click();
    await requested;
    assert.equal(await page.locator('#evaluate').isDisabled(), true);
    await page.locator('#next').click();
    completeDelayed();
    await page.waitForFunction(() => document.getElementById('scenario-title').textContent.includes('perfil'));
    assert.equal(await page.locator('#seller-response').inputValue(), '');
    assert.deepEqual(await page.locator('.effect-value').allTextContents(), Array(6).fill('—'));
    assert.equal(await page.locator('.submitted-response').count(), 0);
    assert.equal(await page.locator('#messages .message').count(), 5);
    await page.unroute('**/api/evaluations');
    checks.push('Envio duplicado impedido; retorno atrasado descartado após navegação');

    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: path.join(output, 'mobile-initial.png'), fullPage: true });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.locator('#seller-response').fill('🙂'.repeat(2000));
    assert.equal(await page.locator('#evaluate').isDisabled(), false);
    await page.locator('#seller-response').fill('🙂'.repeat(2001));
    assert.equal(await page.locator('#evaluate').isDisabled(), true);
    await page.locator('#next').click();
    await page.locator('#next').click();
    await page.locator('#completion').waitFor({ state: 'visible' });
    await page.locator('#next').click();
    assert.match(await page.locator('#scenario-title').textContent(), /planilha/);
    checks.push('Celular sem overflow, Unicode consistente e fim/reinício sem nota');
    assert.deepEqual(errors, []);
    await fs.writeFile(path.join(output, 'browser-check.json'), JSON.stringify({ checks, page_errors: errors,
      live_duration_seconds: live.duration_seconds, fixtures_used: true }, null, 2));
    console.log(JSON.stringify({ checks, page_errors: errors }, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
