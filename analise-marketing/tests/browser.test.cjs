// Ferramenta de desenvolvimento. Não é necessária para abrir a aplicação.
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'C:/Users/gabri/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const C = require('../core.js');
const output = path.join(__dirname, 'results'); fs.mkdirSync(output, { recursive: true });
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 }, acceptDownloads: true });
  const page = await context.newPage(), errors = [], network = [], checks = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('request', request => { if (/^https?:/.test(request.url())) network.push(request.url()); });
  page.on('dialog', dialog => dialog.accept());
  const check = name => { checks.push(name); console.log('PASS', name); };
  const value = async selector => (await page.locator(selector).first().textContent()).trim();
  const download = async (selector, filename) => { const promise = page.waitForEvent('download'); await page.locator(selector).click(); const item = await promise; await item.saveAs(path.join(output, filename)); return path.join(output, filename); };
  try {
    await page.goto(pathToFileURL(path.join(__dirname, '..', 'index.html')).href);
    await page.waitForSelector('#dispatch-metrics .metric-card'); await page.locator('#performance-mode').selectOption('campanhas'); await page.locator('#listing-mode').selectOption('campanhas');
    assert.equal(await page.locator('#dispatch-metrics .metric-card').count(), 6);
    assert.equal(await value('#result-count'), 'Exibindo 14 de 14 envios');
    const totals = await page.evaluate(() => CampaignCore.totals(DEMO_ROWS));
    assert.equal(totals.enviados, 88480);
    await page.screenshot({ path: path.join(output, 'desktop.png'), fullPage: true }); check('file:// inicial, 14 registros e seis indicadores');
    await page.locator('#campaign-search').fill('reativacao'); assert.equal(await value('#result-count'), 'Exibindo 2 de 14 envios');
    await page.locator('[data-channel="WhatsApp"]').click(); assert.equal(await page.locator('#campaign-table-body tr').count(), 2);
    await page.locator('#start-date').fill('2026-09-10'); assert.equal(await value('#result-count'), 'Exibindo 1 de 14 envios');
    await page.locator('#end-date').fill('2026-08-01'); assert.equal(await value('#result-count'), 'Exibindo 0 de 14 envios'); assert.equal(await page.locator('#date-error').isVisible(), true);
    await page.locator('#clear-filters').click(); await page.locator('.campaign-picker summary').click(); await page.locator('#campaign-options input').first().check(); assert.equal(await value('#selection-count'), '(1 selecionadas)');
    await page.locator('#clear-filters').click(); await page.locator('.campaign-picker summary').click();
    await page.locator('[data-sort="campanha"]').click(); assert.equal(await page.locator('[data-sort="campanha"]').locator('..').getAttribute('aria-sort'), 'ascending');
    await page.locator('[data-channel="Outros"]').click(); assert.equal(await page.locator('[data-action="pdf"]').isDisabled(), true); await page.locator('#clear-filters').click(); check('busca, seleção, datas, canais, ordenação e estados vazios');
    await page.locator('#theme-button').click(); assert.equal(await page.locator('body').getAttribute('class'), 'dark'); await page.reload(); assert.equal(await page.locator('body').getAttribute('class'), 'dark'); await page.screenshot({ path: path.join(output, 'dark.png'), fullPage: true }); await page.locator('#theme-button').click(); check('tema escuro e persistência de preferência');
    const model = await download('[data-action="template"]', 'modelo.xlsx');
    await page.locator('#file-input').setInputFiles(model); await page.waitForFunction(() => document.querySelector('#result-count').textContent === 'Exibindo 2 de 2 envios');
    assert.equal(await value('#dispatch-metrics .metric-value'), '15.200');
    check('modelo Excel e importação .xlsx');
    const csv = path.join(output, 'dados.csv'); fs.writeFileSync(csv, '\ufeffempresas;campanha;data de envio;enviados;entregues;lidos;cliques;canal;opt-out\r\nAurora;"Ação; setembro";24/09/2026;1.000;900;450;90;E-mail;2\r\nHorizonte;Teste;25/09/2026;200;180;90;18;SMS;0\r\n');
    await page.locator('#file-input').setInputFiles(csv); await page.waitForFunction(() => document.querySelector('#dispatch-metrics .metric-value').textContent === '1.200');
    await page.reload(); assert.equal(await value('#result-count'), 'Exibindo 2 de 2 envios'); check('CSV UTF-8, delimitador, aspas, números brasileiros e persistência dos disparos');
    const bad = path.join(output, 'invalido.csv'); fs.writeFileSync(bad, 'empresas;campanha;data de envio;enviados;entregues\nAurora;Errada;31/02/2026;100;90');
    await page.locator('#file-input').setInputFiles(bad); await page.waitForFunction(() => document.querySelector('#toast').textContent.includes('cancelada')); assert.equal(await value('#result-count'), 'Exibindo 2 de 2 envios'); check('importação inválida preserva dados anteriores');
    await page.locator('#campaign-search').fill('Ação');
    const excel = await download('[data-action="excel"] >> nth=0', 'exportado.xlsx');
    const parsed = await page.evaluate(async () => XLSX.version); assert.ok(parsed);
    const XLSX = require('../vendor/xlsx.full.min.js');
    const exported = XLSX.read(fs.readFileSync(excel), { type: 'buffer' }); assert.equal(XLSX.utils.sheet_to_json(exported.Sheets.Disparos).length, 1);
    const pdf = await download('[data-action="pdf"]', 'disparos.pdf'); assert.equal(fs.readFileSync(pdf).subarray(0, 5).toString(), '%PDF-'); check('Excel e PDF do recorte filtrado');
    await page.locator('[data-page="pos-evento"]').click(); await page.locator('#event-name').fill('Encontro anual'); await page.locator('#event-date').fill('2026-09-27'); await page.locator('#event-registered').fill('100'); await page.locator('#event-attendees').fill('50');
    await page.locator('.investment-name').fill('Campanha A'); await page.locator('.investment-cost').fill('100'); await page.locator('#add-investment').click(); await page.locator('.investment-name').nth(1).fill('Campanha B'); await page.locator('.investment-cost').nth(1).fill('200');
    assert.match(await value('#draft-cost'), /6,00/); await page.locator('#save-event').click(); assert.equal(await page.locator('.event-record').count(), 1); assert.match(await value('#event-metrics'), /6,00/);
    await page.locator('[data-edit]').click(); await page.locator('#event-attendees').fill('60'); await page.locator('#save-event').click(); assert.match(await value('#event-list'), /5,00/);
    await page.reload(); assert.equal(await page.locator('.event-record').count(), 1); check('criação, múltiplos investimentos, edição, cálculo e persistência de eventos');
    await page.locator('#event-name').fill('Evento inválido'); await page.locator('#event-date').fill('2026-09-27'); await page.locator('#event-registered').fill('5'); await page.locator('#event-attendees').fill('6'); await page.locator('#save-event').click(); assert.equal(await page.locator('.event-record').count(), 1); assert.equal(await page.locator('#event-attendees').evaluate(el => el.validity.rangeOverflow), true);
    await page.locator('#new-event-button').click(); check('validação impede presença maior que inscrições');
    await page.locator('#select-all-events').check(); assert.equal(await page.locator('#pdf-event-selected').isEnabled(), true);
    await page.locator('#event-search').fill('inexistente'); assert.match(await value('#event-selection-status'), /1 fora do filtro/);
    await download('#pdf-event-selected', 'eventos.pdf'); await download('#export-event-selected', 'eventos.xlsx'); await page.locator('#clear-event-filters').click();
    const eb = XLSX.read(fs.readFileSync(path.join(output, 'eventos.xlsx')), { type: 'buffer' }); const er = XLSX.utils.sheet_to_json(eb.Sheets.Eventos); assert.equal(er[0]['Custo por presente (R$)'], 5); assert.equal(XLSX.utils.sheet_to_json(eb.Sheets.Investimentos).length, 2);
    await page.evaluate(() => window.scrollTo(0, 0)); await page.screenshot({ path: path.join(output, 'eventos.png'), fullPage: true, style: '#toast{visibility:hidden}' }); check('seleção oculta, filtros e exportação de eventos com investimentos');
    const backup = await download('#backup-button', 'backup.json'); const stored = JSON.parse(fs.readFileSync(backup)); C.validateBackup(stored); assert.equal(stored.events.length, 1);
    await page.locator('[data-delete]').click(); assert.equal(await page.locator('.event-record').count(), 0);
    await page.locator('#restore-input').setInputFiles(backup); await page.waitForSelector('.event-record'); check('exclusão de evento e restauração completa de backup');
    const invalidBackup = path.join(output, 'backup-invalido.json'); fs.writeFileSync(invalidBackup, '{"version":99}'); await page.locator('#restore-input').setInputFiles(invalidBackup); await page.waitForFunction(() => document.querySelector('#toast').textContent.includes('não restaurado')); assert.equal(await page.locator('.event-record').count(), 1); check('backup inválido rejeitado sem perda de dados');
    await page.locator('[data-page="disparos"]').click(); await page.locator('#clear-data-button').click(); assert.equal(await value('#result-count'), 'Exibindo 0 de 0 envios'); await page.locator('#demo-button').click(); assert.equal(await value('#result-count'), 'Exibindo 14 de 14 envios'); check('limpeza e restauração de demonstração preservam eventos');
    for (const width of [390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const screen of ['disparos', 'pos-evento']) {
        await page.locator(`[data-page="${screen}"]`).click();
        const sizes = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth })); assert.ok(sizes.scroll <= sizes.client, `Overflow ${width} ${screen}: ${JSON.stringify(sizes)}`);
        if (width === 390) { await page.evaluate(() => window.scrollTo(0, 0)); await page.screenshot({ path: path.join(output, `mobile-${screen}.png`), fullPage: true, style: '#toast{visibility:hidden}' }); }
      }
    }
    check('responsividade de ambas as telas em 390, 768 e 1440 px');
    await page.locator('#help-button').click(); assert.equal(await page.locator('#help-dialog').isVisible(), true); await page.keyboard.press('Escape'); assert.equal(await page.locator('#help-dialog').isVisible(), false); check('ajuda e fechamento por teclado');
    assert.deepEqual(errors, []); assert.deepEqual(network, []); check('zero erros no console e zero requisições HTTP/HTTPS');
    fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify({ date: new Date().toISOString(), checks, errors, network }, null, 2));
    console.log(`${checks.length} verificações de navegador concluídas.`);
  } catch (error) { console.error('Interface:', await page.locator('#toast').textContent(), '\nErros:', errors); await page.screenshot({ path: path.join(output, 'failure.png'), fullPage: true }); throw error; }
  finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
