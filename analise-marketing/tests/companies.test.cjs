const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'C:/Users/gabri/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const XLSX = require('../vendor/xlsx.full.min.js');
const output = path.join(__dirname, 'results'); fs.mkdirSync(output, { recursive: true });
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
  const errors = [], checks = [];
  page.on('pageerror', e => errors.push(e.message)); page.on('dialog', d => d.accept());
  const pass = name => { checks.push(name); console.log('PASS', name); };
  const upload = text => page.locator('#file-input').setInputFiles({ name: 'empresas.csv', mimeType: 'text/csv', buffer: Buffer.from(text) });
  const company = name => page.locator('#company-options label').filter({ hasText: name }).locator('input');
  const count = async n => assert.equal(await page.locator('#result-count').textContent(), `Exibindo ${n} de 7 envios`);
  const csv = 'empresas;campanha;data de envio;enviados;entregues;lidos;cliques;canal\nAurora;Igual;2026-09-01;100;100;50;10;E-mail\nHorizonte;Igual;2026-09-01;200;200;20;2;E-mail\nAurora;Oferta;2026-09-02;900;900;90;9;WhatsApp\nHorizonte;Oferta;2026-09-02;300;300;60;3;SMS\nSolar;C1;2026-09-03;100;100;10;1;E-mail\nSolar;C2;2026-09-03;100;100;10;1;WhatsApp\nSolar;C3;2026-09-03;100;100;10;1;SMS';
  try {
    await page.goto(pathToFileURL(path.join(__dirname, '..', 'index.html')).href);
    assert.equal(await page.locator('#performance-mode').inputValue(), 'empresas');
    assert.equal(await page.locator('#listing-mode').inputValue(), 'empresas');
    assert.deepEqual(await page.locator('#company-options label').allTextContents(), ['EmpA', 'EmpB', 'EmpC']);
    pass('demonstração com EmpA, EmpB e EmpC');
    await upload(csv); await page.waitForFunction(() => document.querySelector('#result-count').textContent === 'Exibindo 7 de 7 envios');
    assert.equal(await page.locator('[data-company-group]').count(), 3);
    assert.equal(await page.locator('[data-campaign-row]').count(), 7);
    assert.deepEqual(await page.evaluate(() => {
      let company = '';
      return [...document.querySelectorAll('#campaign-table-body tr')].map(row => {
        if (row.hasAttribute('data-company-group')) { company = row.querySelector('strong').textContent; return true; }
        return row.querySelector('strong').textContent === company;
      });
    }), Array(10).fill(true));
    pass('listagem por empresas coloca cada campanha sob sua empresa');
    assert.match(await page.locator('#campaign-table-body').textContent(), /14,00%/); pass('modo empresas inicial: totais e taxas ponderadas');
    await page.locator('#performance-mode').selectOption('campanhas');
    assert.equal(await page.locator('[data-company-group]').count(), 3);
    await page.locator('#listing-mode').selectOption('campanhas');
    assert.equal(await page.locator('#campaign-table-body tr').count(), 7);
    assert.equal(await page.locator('[data-company-group]').count(), 0);
    pass('listagem geral mantém todas as campanhas; listagem e desempenho são independentes');
    assert.equal(await page.locator('#engagement-chart .comparison-row').count(), 7); pass('todas as campanhas, inclusive além de cinco, separadas por empresa');
    await company('Aurora').check(); await count(2);
    assert.equal(await page.locator('#campaign-options input').count(), 2);
    await page.locator('#performance-mode').selectOption('empresas');
    assert.equal(await page.locator('#campaign-table-body tr').count(), 2);
    await page.locator('#listing-mode').selectOption('empresas');
    assert.equal(await page.locator('[data-company-group]').count(), 1);
    assert.equal(await page.locator('[data-campaign-row]').count(), 2);
    await page.locator('#listing-mode').selectOption('campanhas');
    assert.equal(await page.locator('#dispatch-metrics .metric-value').first().textContent(), '1.000'); pass('filtro de empresa preservado na troca de modo');
    await company('Horizonte').check(); await count(4);
    await company('Aurora').uncheck(); await count(2);
    await company('Horizonte').uncheck(); await count(7); pass('seleção múltipla e nenhuma empresa equivale a todas');
    await page.locator('.campaign-picker summary').click();
    await page.locator('#campaign-options label').filter({ hasText: 'Aurora · Igual' }).locator('input').check(); await count(1);
    await company('Horizonte').check(); await count(2);
    assert.equal(await page.locator('#campaign-options input:checked').count(), 0); pass('seleção identifica empresa e campanha; seleção incompatível é removida');
    await page.locator('#clear-filters').click(); await company('Aurora').check();
    await page.locator('#campaign-search').fill('oferta'); await page.locator('#start-date').fill('2026-09-02'); await page.locator('#end-date').fill('2026-09-02'); await page.locator('[data-channel="WhatsApp"]').click(); await count(1);
    await page.locator('#performance-mode').selectOption('campanhas'); await count(1); pass('empresa, busca, datas e canal combinados nos dois modos');
    const dl = page.waitForEvent('download'); await page.locator('[data-action="excel"]').first().click(); const file = path.join(output, 'empresas-filtradas.xlsx'); await (await dl).saveAs(file);
    const book = XLSX.read(fs.readFileSync(file), { type: 'buffer' }), raw = XLSX.utils.sheet_to_json(book.Sheets.Disparos), summary = XLSX.utils.sheet_to_json(book.Sheets.Resumo);
    assert.equal(raw.length, 1); assert.equal(raw[0].empresas, 'Aurora'); assert.equal(summary[0].Empresa, 'Aurora'); assert.equal(summary[0].Campanha, 'Oferta');
    const pdfDownload = page.waitForEvent('download'); await page.locator('[data-action="pdf"]').click(); const pdfFile = path.join(output, 'empresas-filtradas.pdf'); await (await pdfDownload).saveAs(pdfFile); const pdf = fs.readFileSync(pdfFile, 'latin1'); assert.ok(pdf.includes('Aurora')); assert.ok(!pdf.includes('Horizonte')); pass('Excel e PDF incluem empresa e somente o recorte ativo');
    await page.locator('#clear-filters').click(); await page.locator('#performance-mode').selectOption('empresas');
    const dc = page.waitForEvent('download'); await page.locator('[data-action="excel"]').first().click(); const cf = path.join(output, 'resumo-empresas.xlsx'); await (await dc).saveAs(cf);
    assert.equal(XLSX.utils.sheet_to_json(XLSX.read(fs.readFileSync(cf), { type: 'buffer' }).Sheets.Resumo).length, 3); pass('exportação agrega por empresa no modo empresas');
    for (const invalid of ['campanha;enviados\nA;1', 'empresas;campanha;enviados\nAurora;A;1\n ;B;2']) {
      await upload(invalid); await page.waitForFunction(() => document.querySelector('#toast').textContent.includes('cancelada')); await count(7);
    } pass('coluna ausente ou empresa vazia rejeita importação inteira');
    for (const mode of ['empresas', 'campanhas']) {
      await page.locator('#performance-mode').selectOption(mode);
      await page.locator('#listing-mode').selectOption(mode);
      for (const width of [390, 768, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true);
        if (width !== 768) await page.screenshot({ path: path.join(output, `${mode}-${width}.png`), fullPage: true, style: '#toast{visibility:hidden}' });
      }
    } pass('ambos os modos sem transbordamento em 390, 768 e 1440 px');
    await page.reload(); await count(7); pass('persistência dos registros com empresa');
    const row = { empresa: 'Aurora', campanha: 'Antiga', date: '', enviados: 10, entregues: 9, canal: 'SMS' };
    const old = { version: 1, rows: [{ ...row, empresa: undefined }], events: [], source: 'imported' };
    await page.locator('#restore-input').setInputFiles({ name: 'antigo.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(old)) });
    await page.waitForFunction(() => document.querySelector('#campaign-table-body').textContent.includes('Empresa não informada'));
    assert.equal(await page.locator('#legacy-company-warning').isVisible(), true);
    const invalidBackup = { ...old, version: 2 };
    await page.locator('#restore-input').setInputFiles({ name: 'invalido.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(invalidBackup)) });
    await page.waitForFunction(() => document.querySelector('#toast').textContent.includes('não restaurado'));
    assert.match(await page.locator('#campaign-table-body').textContent(), /Empresa não informada/); pass('backup antigo migra com aviso; novo backup sem empresa é rejeitado');
    assert.deepEqual(errors, []); pass('zero erros JavaScript');
    fs.writeFileSync(path.join(output, 'companies-report.json'), JSON.stringify({ date: new Date().toISOString(), checks, errors }, null, 2));
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
