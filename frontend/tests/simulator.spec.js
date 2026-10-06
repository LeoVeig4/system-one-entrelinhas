import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const recorded = JSON.parse(readFileSync(new URL('./fixtures/evaluation.json', import.meta.url), 'utf8'));

// Fixtures testam comportamento da interface. Não são previsões para o texto de teste.
function fixture(input) {
  return { ...structuredClone(recorded), attempt_id: input.attempt_id,
    scenario_id: input.scenario_id, scenario_version: input.scenario_version,
    evaluation_schema_version: input.evaluation_schema_version, seller_response: input.seller_response };
}
async function openSimulator(page) {
  await page.goto('/');
  await expect(page.locator('#seller-response')).toBeEnabled();
}
async function fulfillEvaluation(page) {
  await page.route('**/api/evaluations', route => route.fulfill({ json: fixture(route.request().postDataJSON()) }));
}

test('estado inicial, chat e nenhuma inferência automática', async ({ page }) => {
  const evaluations = [];
  page.on('request', request => { if (request.url().endsWith('/api/evaluations')) evaluations.push(request); });
  await openSimulator(page);
  await expect(page.locator('#messages .message')).toHaveCount(5);
  await expect(page.locator('#messages .seller')).toHaveCount(2);
  await expect(page.locator('#messages .objection')).toHaveCount(1);
  await expect(page.locator('.effect-value')).toHaveText(Array(6).fill('—'));
  await expect(page.locator('#evaluate')).toBeDisabled();
  expect(evaluations).toHaveLength(0);
});

test('dez resultados, snapshot do texto e comparação', async ({ page }) => {
  await fulfillEvaluation(page); await openSimulator(page);
  await page.locator('#seller-response').fill('Qual parte da planilha dá mais trabalho?');
  await page.locator('#evaluate').click();
  await expect(page.locator('.submitted-response .message-text')).toHaveText('Qual parte da planilha dá mais trabalho?');
  await expect(page.locator('[role=meter]')).toHaveCount(3);
  await expect(page.locator('#approach')).toHaveText(recorded.presentation.approach.label);
  await page.locator('#seller-response').fill('Vamos explorar essa dificuldade juntos.');
  await expect(page.locator('#result-note')).toContainText('resposta anterior');
  await page.locator('#evaluate').click();
  await page.locator('#comparison > summary').click();
  await expect(page.locator('#comparison-content')).toContainText('p.p.');
  await expect(page.locator('#comparison-content')).toContainText('Qual parte');
});

test('erro preserva rascunho e painel anterior', async ({ page }) => {
  await fulfillEvaluation(page); await openSimulator(page);
  await page.locator('#seller-response').fill('Primeira resposta.'); await page.locator('#evaluate').click();
  await expect(page.locator('#approach')).toHaveText(recorded.presentation.approach.label);
  await page.unroute('**/api/evaluations');
  await page.route('**/api/evaluations', route => route.fulfill({ status: 503, json: { error: { message: 'Modelo indisponível no teste.' } } }));
  await page.locator('#seller-response').fill('Preservar este rascunho.'); await page.locator('#evaluate').click();
  await expect(page.locator('#error')).toBeVisible();
  await expect(page.locator('#seller-response')).toHaveValue('Preservar este rascunho.');
  await expect(page.locator('#approach')).toHaveText(recorded.presentation.approach.label);
  await expect(page.locator('.pending-response')).toHaveCount(0);
});

test('resposta de outra identidade é rejeitada sem números fabricados', async ({ page }) => {
  await page.route('**/api/evaluations', route => route.fulfill({ json: { ...fixture(route.request().postDataJSON()), attempt_id: 'outra-tentativa' } }));
  await openSimulator(page);
  await page.locator('#seller-response').fill('Uma resposta de teste.'); await page.locator('#evaluate').click();
  await expect(page.locator('#error')).toContainText('não corresponde');
  await expect(page.locator('.effect-value')).toHaveText(Array(6).fill('—'));
});

test('envio duplicado bloqueado e retorno atrasado descartado após novo cenário', async ({ page }) => {
  let resolveRequest, releaseResponse;
  const requested = new Promise(resolve => { resolveRequest = resolve; });
  const wait = new Promise(resolve => { releaseResponse = resolve; });
  let calls = 0;
  await page.route('**/api/evaluations', async route => {
    calls++; const data = route.request().postDataJSON(); resolveRequest(); await wait;
    try { await route.fulfill({ json: fixture(data) }); } catch { /* Abortada pela navegação. */ }
  });
  await openSimulator(page);
  await page.locator('#seller-response').fill('Mensagem aguardando.'); await page.locator('#evaluate').click(); await requested;
  await expect(page.locator('#evaluate')).toBeDisabled();
  await page.locator('#next').click(); releaseResponse();
  await expect(page.locator('#scenario-title')).toContainText('perfil');
  await expect(page.locator('#seller-response')).toHaveValue('');
  await expect(page.locator('.effect-value')).toHaveText(Array(6).fill('—'));
  await expect(page.locator('.submitted-response')).toHaveCount(0);
  expect(calls).toBe(1);
});

test('visitar conceitos durante avaliação preserva tentativa e rascunho editado', async ({ page }) => {
  let resolveRequest, releaseResponse;
  const requested = new Promise(resolve => { resolveRequest = resolve; });
  const wait = new Promise(resolve => { releaseResponse = resolve; });
  await page.route('**/api/evaluations', async route => {
    const input = route.request().postDataJSON(); resolveRequest(); await wait;
    await route.fulfill({ json: fixture(input) });
  });
  await openSimulator(page);
  await page.locator('#seller-response').fill('Mensagem enviada.'); await page.locator('#evaluate').click(); await requested;
  await page.locator('#seller-response').fill('Rascunho editado durante a avaliação.');
  await page.getByRole('link', { name: 'Conceitos', exact: true }).click();
  const response = page.waitForResponse('**/api/evaluations'); releaseResponse(); await response;
  await page.getByRole('link', { name: 'Simulador', exact: true }).click();
  await expect(page.locator('#seller-response')).toHaveValue('Rascunho editado durante a avaliação.');
  await expect(page.locator('.submitted-response .message-text')).toHaveText('Mensagem enviada.');
  await expect(page.locator('#result-note')).toContainText('resposta anterior');
});

test('conceitos acessíveis sem API; exemplos matemáticos e recarga', async ({ page }) => {
  const requests = [];
  await page.route('**/api/**', route => { requests.push(route.request().url()); return route.abort(); });
  await page.goto('/conceitos');
  await expect(page.locator('.concepts-page')).not.toContainText(/React|Python|backend|frontend/);
  await expect(page.getByRole('heading', { name: 'Exemplo de requisição.' })).toBeVisible();
  const request = JSON.parse(await page.getByLabel('JSON da requisição System One').textContent());
  expect(Object.values(request.questions).map(question => question.type)).toEqual(['choice', 'noul', 'score']);
  await expect(page.getByRole('heading', { name: 'Faça os números mudarem.' })).toBeVisible();
  await expect(page.locator('#expected-score')).toHaveText('2,75');
  await page.locator('#score-example').fill('50');
  await expect(page.locator('#expected-score')).toHaveText('2,50');
  await page.locator('#probability-example').fill('0');
  await expect(page.locator('#noul-example')).toHaveText('P(verdadeiro): 0% · P(falso): 100%');
  await page.locator('#approach-example').selectOption('information');
  await expect(page.locator('.example-choice')).toHaveText('Informativa');
  await page.reload();
  await expect(page.locator('#expected-score')).toHaveText('2,75');
  expect(requests).toHaveLength(0);
});

test('limite Unicode e fim/reinício sem nota', async ({ page }) => {
  await openSimulator(page);
  await page.locator('#seller-response').fill('🙂'.repeat(2000)); await expect(page.locator('#evaluate')).toBeEnabled();
  await page.locator('#seller-response').fill('🙂'.repeat(2001)); await expect(page.locator('#evaluate')).toBeDisabled();
  await page.locator('#next').click(); await page.locator('#next').click(); await page.locator('#next').click();
  await expect(page.locator('#completion')).toBeVisible();
  await page.locator('#next').click(); await expect(page.locator('#scenario-title')).toContainText('planilha');
});

for (const width of [1440, 390]) {
  test(`simulador e conceitos sem overflow ou erros (${width}px)`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize({ width, height: 900 });
    await openSimulator(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole('link', { name: 'Conceitos', exact: true }).click();
    await expect(page.locator('#expected-score')).toHaveText('2,75');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(errors).toEqual([]);
  });
}
