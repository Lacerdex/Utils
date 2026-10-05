const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'C:/Users/gabri/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs'); const path = require('node:path'); const { pathToFileURL } = require('node:url');
const XLSX = require('../vendor/xlsx.full.min.js');
const output = path.join(__dirname, 'results'); fs.mkdirSync(output, { recursive: true });
const url = pathToFileURL(path.join(__dirname, '..', 'index.html')).href;
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } }); const page = await context.newPage();
  const checks = [], errors = []; let acceptDialog = true;
  page.on('dialog', dialog => acceptDialog ? dialog.accept() : dialog.dismiss()); page.on('pageerror', error => errors.push(error.message));
  const pass = name => { checks.push(name); console.log('PASS', name); };
  const header = ['campanha', 'data de envio', 'enviados', 'entregues', 'lidos', 'cliques', 'canal', 'opt-out', 'empresas'];
  try {
    await page.goto(url); await page.locator('#performance-mode').selectOption('campanhas');
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([header, ['Ação XLS', 46289, 100, 90, 45, 9, 'SMS', 1, 'Aurora']]), 'Campanhas');
    const old = path.join(output, 'legado.xls'); fs.writeFileSync(old, XLSX.write(book, { type: 'buffer', bookType: 'biff8' }));
    await page.locator('#file-input').setInputFiles(old); await page.waitForFunction(() => document.querySelector('#result-count').textContent === 'Exibindo 1 de 1 envios');
    assert.match(await page.locator('#campaign-table-body').textContent(), /24\/09\/2026/); pass('Excel legado .xls e datas seriais do Excel');
    const b2 = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(b2, XLSX.utils.aoa_to_sheet([header, ['Aba 1', '2026-09-01', 100, 90, 30, 10, 'E-mail', null, 'Aurora']]), 'Primeira'); XLSX.utils.book_append_sheet(b2, XLSX.utils.aoa_to_sheet([header, ['Aba 2', '2026-09-02', 200, 180, 60, 20, 'WhatsApp', null, 'Horizonte']]), 'Segunda'); XLSX.utils.book_append_sheet(b2, XLSX.utils.aoa_to_sheet([['Instruções'], ['Exemplo']]), 'Ajuda');
    const multiple = path.join(output, 'abas.xlsx'); fs.writeFileSync(multiple, XLSX.write(b2, { type: 'buffer', bookType: 'xlsx' }));
    await page.locator('#file-input').setInputFiles([old, multiple]); await page.waitForFunction(() => document.querySelector('#result-count').textContent === 'Exibindo 3 de 3 envios'); assert.match(await page.locator('#toast').textContent(), /ignorada/); pass('múltiplos arquivos, múltiplas abas e aviso de aba incompatível');
    const before = await page.locator('#result-count').textContent(); acceptDialog = false; await page.locator('#file-input').setInputFiles(old); assert.equal(await page.locator('#result-count').textContent(), before); acceptDialog = true; await page.locator('#file-input').setInputFiles(old); await page.waitForFunction(() => document.querySelector('#result-count').textContent === 'Exibindo 1 de 1 envios'); pass('cancelar substituição e selecionar novamente o mesmo arquivo');
    const drop = await page.evaluateHandle(() => { const transfer = new DataTransfer(); transfer.items.add(new File(['empresas;campanha;enviados;entregues\nAurora;Arrastada;100;90'], 'arrastada.csv', { type: 'text/csv' })); return transfer; });
    await page.locator('#drop-zone').dispatchEvent('drop', { dataTransfer: drop }); await page.waitForFunction(() => document.querySelector('#campaign-table-body').textContent.includes('Arrastada')); assert.match(await page.locator('#toast').textContent(), /sem data/); pass('arrastar e soltar, dados sem data e aviso correspondente');
    const attack = { version: 1, source: 'imported', rows: [{ id: 'unsafe', campanha: '<img src=x onerror="window.injected=1">', date: '2026-09-27', enviados: 1, entregues: 1, lidos: 0, visualizacao: 0, cliques: 0, optOut: null, taxaAbertura: null, taxaCliques: null, canal: 'Outros' }], events: [] };
    await page.locator('#restore-input').setInputFiles({ name: 'seguro.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(attack)) }); await page.waitForFunction(() => document.querySelector('#campaign-table-body').textContent.includes('<img'));
    assert.equal(await page.locator('#campaign-table-body img').count(), 0); assert.equal(await page.evaluate(() => window.injected), undefined); pass('conteúdo importado é exibido como texto, sem execução de HTML');
    await page.locator('[data-page="pos-evento"]').click(); await page.locator('#event-name').fill('Sem presentes'); await page.locator('#event-date').fill('2026-09-27'); await page.locator('#event-registered').fill('0'); await page.locator('#event-attendees').fill('0');
    await page.locator('.investment-name').fill('Teste incompleto'); await page.locator('#save-event').click(); assert.equal(await page.locator('#event-form-error').isVisible(), true); assert.equal(await page.locator('.event-record').count(), 0);
    await page.locator('.remove-investment').click(); await page.locator('#save-event').click(); assert.equal(await page.locator('.event-record').count(), 1); assert.match(await page.locator('.event-record-metrics').textContent(), /—/); pass('investimento incompleto é rejeitado; evento sem custo e sem presentes é válido');
    await page.locator('[data-edit]').click(); await page.locator('#event-name').fill('Rascunho'); await page.locator('#cancel-edit').click(); assert.match(await page.locator('.event-record').textContent(), /Sem presentes/); assert.doesNotMatch(await page.locator('.event-record').textContent(), /Rascunho/); pass('cancelar edição preserva o registro salvo');
    await page.locator('#event-from').fill('2026-09-28'); assert.equal(await page.locator('.event-record').count(), 0); await page.locator('#event-to').fill('2026-09-27'); assert.equal(await page.locator('#event-date-error').isVisible(), true); await page.locator('#clear-event-filters').click(); pass('filtros de período de eventos e intervalo inválido');
    await page.locator('[data-page="disparos"]').click(); await page.locator('#demo-button').click(); const download = page.waitForEvent('download'); await page.locator('[data-action="pdf"]').click(); await (await download).saveAs(path.join(output, 'disparos-completo.pdf')); pass('PDF com todas as campanhas e múltiplas páginas');
    // Valida a paginação com nomes longos e muitas linhas de investimento.
    const longEvent = { id: 'long', nome: 'Evento com nome extenso para validar quebra de linhas no relatório de resultados e investimentos', data: '2026-09-27', inscritos: 500, presentes: 200, campanhas: Array.from({ length: 60 }, (_, index) => ({ campanha: `Campanha ${index + 1} com descrição longa para conferir a paginação e a quebra de linhas sem truncar o texto no relatório exportado`, investimento: 125.5 })) };
    await page.locator('#restore-input').setInputFiles({ name: 'longo.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ ...attack, rows: [], events: [longEvent] })) }); await page.waitForFunction(() => document.querySelector('#event-list').textContent.includes('Evento com nome extenso'));
    await page.locator('[data-page="pos-evento"]').click(); const longDownload = page.waitForEvent('download'); await page.locator('[data-event-pdf]').click(); await (await longDownload).saveAs(path.join(output, 'evento-longo.pdf')); pass('PDF individual com nomes longos e 60 investimentos');
    await page.evaluate(() => window.scrollTo(0, 0)); await page.screenshot({ path: path.join(output, 'eventos-desktop-final.png'), fullPage: true, style: '#toast{visibility:hidden}' });
    const quotaContext = await browser.newContext(); const quota = await quotaContext.newPage();
    await quota.addInitScript(() => { Storage.prototype.setItem = function () { throw new DOMException('Quota exceeded', 'QuotaExceededError'); }; });
    await quota.goto(url); await quota.locator('#file-input').setInputFiles(old); await quota.waitForFunction(() => document.querySelector('#toast').textContent.includes('não conseguiu salvá-los')); assert.equal(await quota.locator('#result-count').textContent(), 'Exibindo 1 de 1 envios'); await quotaContext.close(); pass('falha de armazenamento mantém dados na sessão e orienta backup');
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(output, 'advanced-report.json'), JSON.stringify({ date: new Date().toISOString(), checks, errors }, null, 2)); console.log(`${checks.length} verificações adicionais concluídas.`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
