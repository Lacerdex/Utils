const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'C:/Users/gabri/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const output = path.join(__dirname, 'results'); fs.mkdirSync(output, { recursive: true });
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [], checks = [];
  page.on('pageerror', e => errors.push(e.message)); page.on('dialog', d => d.accept());
  const pass = name => { checks.push(name); console.log('PASS', name); };
  const upload = text => page.locator('#file-input').setInputFiles({ name: 'linhas.csv', mimeType: 'text/csv', buffer: Buffer.from(text) });
  const company = name => page.locator('#company-options label').filter({ hasText: name }).locator('input');
  const series = (name, metric) => page.locator(`#trend-chart g[data-company="${name}"][data-metric="${metric}"]`);
  const colors = { EmpA: ['#d93645', '#ef9099'], EmpB: ['#2563eb', '#85a8f5'], EmpC: ['#16964f', '#7bce9d'], EmpD: ['#b58a00', '#dfc15e'] };
  const csv = 'empresas;campanha;data de envio;enviados;entregues;lidos;cliques;canal;taxa de abertura;taxa de cliques\nEmpA;Uma;2026-09-01;100;100;30;3;E-mail;;\nEmpA;Duas;2026-09-01;100;100;20;2;SMS;;\nEmpA;Uma;2026-09-03;100;100;40;4;E-mail;;\nEmpB;Uma;2026-09-01;100;100;10;1;E-mail;;\nEmpB;Uma;2026-09-02;100;100;20;2;WhatsApp;;\nEmpC;Uma;2026-09-01;100;100;0;0;SMS;50%;20%\nEmpC;Uma;2026-09-02;100;100;30;3;SMS;;\nEmpD;Uma;2026-09-02;100;100;;;E-mail;25%;5%\nEmpE;Sem data;;100;100;10;1;SMS;;';
  try {
    await page.goto(pathToFileURL(path.join(__dirname, '..', 'index.html')).href);
    assert.equal(await page.locator('#trend-chart g[data-company]').count(), 6);
    const demoDates = await page.evaluate(() => ['EmpA', 'EmpB', 'EmpC'].map(name => [...new Set(DEMO_ROWS.filter(row => row.empresa === name).map(row => row.date))].sort()));
    const commonDays = ['2026-09-03', '2026-09-10', '2026-09-17', '2026-09-24'];
    assert.deepEqual(demoDates, [commonDays, commonDays, commonDays]);
    for (const name of ['EmpA', 'EmpB', 'EmpC']) {
      for (const metric of ['abertura', 'cliques']) assert.equal(await series(name, metric).locator('circle').count(), 4);
    }
    assert.equal(await page.evaluate(() => CampaignCore.totals(DEMO_ROWS).enviados), 88480);
    await page.locator('.charts-grid').screenshot({ path: path.join(output, 'demonstracao-datas-compartilhadas.png') });
    pass('demonstração: três empresas nas mesmas quatro datas, seis séries alinhadas e totais preservados');
    await upload(csv); await page.waitForFunction(() => document.querySelector('#result-count').textContent === 'Exibindo 9 de 9 envios');
    assert.equal(await page.locator('#trend-chart g[data-company]').count(), 8);
    for (const [name, expected] of Object.entries(colors)) {
      assert.equal(await series(name, 'abertura').locator('path').getAttribute('stroke'), expected[0]);
      assert.equal(await series(name, 'cliques').locator('path').getAttribute('stroke'), expected[1]);
      assert.equal(await series(name, 'cliques').locator('path').getAttribute('stroke-dasharray'), '6 4');
      assert.equal(await series(name, 'abertura').locator('path').getAttribute('stroke-dasharray'), null);
    }
    pass('duas séries por empresa: EmpA vermelha, EmpB azul, EmpC verde, EmpD amarela');
    assert.match(await series('EmpA', 'abertura').locator('circle').first().getAttribute('aria-label'), /Aberturas: 50$/);
    assert.match(await series('EmpA', 'cliques').locator('circle').first().getAttribute('aria-label'), /Cliques: 5$/);
    assert.equal(await series('EmpA', 'abertura').locator('circle').count(), 2);
    assert.equal(await series('EmpC', 'abertura').locator('circle').first().getAttribute('cy'), '209');
    assert.match(await series('EmpD', 'abertura').locator('circle').getAttribute('aria-label'), /Aberturas: 25$/);
    assert.match(await series('EmpD', 'cliques').locator('circle').getAttribute('aria-label'), /Cliques: 5$/);
    assert.equal(await page.locator('#trend-legend .company-legend').count(), 4);
    pass('somas por empresa/dia, zeros explícitos e estimativas; sem pontos artificiais em datas ausentes');
    const original = await series('EmpB', 'abertura').locator('path').getAttribute('stroke');
    await company('EmpB').check(); assert.equal(await page.locator('#trend-chart g[data-company]').count(), 2);
    assert.equal(await series('EmpB', 'abertura').locator('path').getAttribute('stroke'), original);
    await company('EmpD').check(); assert.equal(await page.locator('#trend-chart g[data-company]').count(), 4);
    await company('EmpB').uncheck(); assert.equal(await page.locator('#trend-chart g[data-company]').count(), 2);
    assert.equal(await series('EmpD', 'abertura').locator('circle').count(), 1);
    assert.ok(!(await series('EmpD', 'abertura').locator('path').getAttribute('d')).includes('NaN'));
    await company('EmpD').uncheck(); assert.equal(await page.locator('#trend-chart g[data-company]').count(), 8);
    pass('uma, várias e nenhuma empresa; cores estáveis e empresa com apenas uma data');
    await page.locator('#campaign-search').fill('duas'); assert.equal(await page.locator('#trend-chart g[data-company]').count(), 2);
    assert.match(await series('EmpA', 'abertura').locator('circle').getAttribute('aria-label'), /Aberturas: 20$/);
    await page.locator('#clear-filters').click(); await company('EmpA').check(); await page.locator('[data-channel="SMS"]').click();
    assert.match(await series('EmpA', 'abertura').locator('circle').getAttribute('aria-label'), /Aberturas: 20$/);
    await page.locator('#clear-filters').click(); await page.locator('#start-date').fill('2026-09-02'); await page.locator('#end-date').fill('2026-09-02');
    assert.equal(await page.locator('#trend-chart g[data-company]').count(), 6); assert.equal(await series('EmpA', 'abertura').count(), 0);
    await page.locator('#performance-mode').selectOption('campanhas'); assert.equal(await page.locator('#trend-chart g[data-company]').count(), 6);
    pass('busca, canal e datas filtram valores e empresas; troca de modo mantém recorte');
    await page.locator('#clear-filters').click();
    for (const mode of ['empresas', 'campanhas']) {
      await page.locator('#performance-mode').selectOption(mode);
      const row = page.locator('#engagement-chart .comparison-row').filter({ hasText: 'EmpA' }).first();
      const backgrounds = await row.locator('.bar-track i').evaluateAll(elements => elements.map(el => el.style.background));
      assert.deepEqual(backgrounds, ['rgb(217, 54, 69)', 'rgb(239, 144, 153)']);
    }
    pass('comparativo de taxas utiliza as cores da empresa nos dois modos');
    await company('EmpE').check(); assert.match(await page.locator('#trend-chart').textContent(), /Sem dados datados/);
    assert.equal(await page.locator('#trend-legend .company-legend').count(), 0);
    await page.locator('#clear-filters').click(); await page.locator('#campaign-search').fill('inexistente');
    assert.equal(await page.locator('#trend-chart svg').count(), 0); assert.equal(await page.locator('#trend-legend .company-legend').count(), 0);
    pass('sem data e recorte vazio removem linhas e legendas antigas');
    await page.locator('#clear-filters').click(); await page.locator('#performance-mode').selectOption('empresas');
    for (const dark of [false, true]) {
      if (dark) await page.locator('#theme-button').click();
      for (const width of [390, 1440]) {
        await page.setViewportSize({ width, height: 1000 });
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true);
        await page.screenshot({ path: path.join(output, `linhas-empresas-${dark ? 'escuro' : 'claro'}-${width}.png`), fullPage: true, style: '#toast{visibility:hidden}' });
      }
    }
    pass('legendas e séries em temas claro/escuro, desktop e celular');
    assert.deepEqual(errors, []); pass('zero erros JavaScript');
    fs.writeFileSync(path.join(output, 'company-charts-report.json'), JSON.stringify({ date: new Date().toISOString(), checks, errors }, null, 2));
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
