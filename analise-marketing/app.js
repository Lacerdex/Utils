(function () {
  'use strict';
  const C = window.CampaignCore;
  const $ = selector => document.querySelector(selector);
  const $$ = selector => Array.from(document.querySelectorAll(selector));
  const escape = text => String(text ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
  const fmt = value => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(value);
  const pct = value => new Intl.NumberFormat('pt-BR', { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value || 0);
  const money = value => value === null ? '—' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  const dateLabel = value => value ? value.split('-').reverse().join('/') : 'Sem data';
  const KEY = 'campaign-pulse-local-v1';
  const uid = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  let state = { version: 1, rows: structuredClone(window.DEMO_ROWS), events: [], source: 'demo' };
  let selectedCampaigns = new Set(), selectedEvents = new Set(), channel = 'Todos', sort = { key: 'enviados', direction: -1 };
  let editingId = null, dirty = false, importing = false, toastTimer, persistenceWarning = '', sessionOnly = false;
  function toast(message, error = false) {
    clearTimeout(toastTimer);
    $('#toast').textContent = message;
    $('#toast').classList.toggle('error', error);
    $('#toast').hidden = false;
    toastTimer = setTimeout(() => { $('#toast').hidden = true; }, error ? 18000 : 6500);
  }
  try {
    const stored = localStorage.getItem(KEY);
    if (stored) state = C.validateBackup(JSON.parse(stored));
    document.body.classList.toggle('dark', localStorage.getItem('campaign-pulse-theme') === 'dark');
  } catch { persistenceWarning = 'Não foi possível carregar os dados salvos. A demonstração está aberta; importe um backup se necessário.'; }
  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); sessionOnly = false; updateSourceLabel(); return true; }
    catch { sessionOnly = true; updateSourceLabel(); toast('Os dados estão disponíveis nesta sessão, mas o navegador não conseguiu salvá-los. Use Salvar backup antes de fechar.', true); return false; }
  }
  function commit(message) { const saved = persist(); if (saved) toast(message); return saved; }
  function download(blob, filename) {
    const url = URL.createObjectURL(blob), link = document.createElement('a');
    link.href = url; link.download = filename; document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }
  const empty = (title, hint = 'Experimente remover ou alterar os filtros.') => `<div class="empty"><strong>${escape(title)}</strong><p>${escape(hint)}</p></div>`;
  function metric(label, value, foot, icon) {
    return `<article class="metric-card"><div class="metric-top"><span class="metric-icon" aria-hidden="true">${icon}</span><span>${escape(label)}</span></div><div class="metric-value">${escape(value)}</div><div class="metric-foot">${escape(foot)}</div></article>`;
  }
  function criteria() { return { query: $('#campaign-search').value, selected: [...selectedCampaigns], from: $('#start-date').value, to: $('#end-date').value, channel }; }
  const filteredRows = () => C.filter(state.rows, criteria());
  const filteredEvents = () => C.filter(state.events, { query: $('#event-search').value, from: $('#event-from').value, to: $('#event-to').value, event: true });
  const campaignNames = () => [...new Set(state.rows.map(row => row.campanha))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  function updateOptions() {
    const names = campaignNames();
    $('#campaign-options').innerHTML = names.length ? names.map((name, index) => `<label><input type="checkbox" value="${index}" ${selectedCampaigns.has(name) ? 'checked' : ''}>${escape(name)}</label>`).join('') : '<span>Nenhuma campanha disponível.</span>';
    $('#campaign-suggestions').innerHTML = names.map(name => `<option value="${escape(name)}"></option>`).join('');
  }
  function rateBar(value, color) {
    return `<div class="rate-cell"><span class="bar-track"><i class="${color}" style="width:${Math.max(0, Math.min(100, value * 100))}%"></i></span>${pct(value)}</div>`;
  }
  function period(rows) {
    const days = rows.map(row => row.date).filter(Boolean).sort();
    return days.length ? `${dateLabel(days[0])} – ${dateLabel(days.at(-1))}` : 'Sem datas';
  }
  function updateSourceLabel() {
    $('#data-source').textContent = sessionOnly ? 'Dados apenas nesta sessão · salve um backup' : state.source === 'demo' ? 'Dados de demonstração' : state.source === 'empty' ? 'Nenhum dado importado' : 'Dados importados · salvos neste navegador';
  }
  function renderDispatch() {
    const rows = filteredRows(), t = C.totals(rows), summaries = C.summarize(rows);
    $('#date-error').hidden = !(criteria().from && criteria().to && criteria().from > criteria().to);
    updateSourceLabel();
    $('#source-title').textContent = state.source === 'imported' ? 'Suas campanhas estão no dashboard' : 'Traga seus dados para o dashboard';
    $('#source-detail').textContent = state.source === 'imported' ? `${state.rows.length} registros · ${[...new Set(state.rows.map(row => row.arquivo || 'Backup'))].join(', ')} · importe para substituir` : 'Arraste arquivos .xlsx, .xls ou .csv. A coluna opt-out é opcional.';
    $('#result-count').textContent = `Exibindo ${fmt(rows.length)} de ${fmt(state.rows.length)} envios`;
    $('#selection-count').textContent = selectedCampaigns.size ? `(${selectedCampaigns.size} selecionadas)` : '';
    const channelBase = C.filter(state.rows, { ...criteria(), channel: 'Todos' });
    $('#channel-tabs').innerHTML = ['Todos', ...C.CHANNELS].map(name => `<button class="${channel === name ? 'selected' : ''}" data-channel="${name}" aria-pressed="${channel === name}">${name}<span>${name === 'Todos' ? channelBase.length : channelBase.filter(row => row.canal === name).length}</span></button>`).join('');
    $('#dispatch-metrics').innerHTML = [
      metric('Total de envios', fmt(t.enviados), `${fmt(rows.length)} disparos analisados`, '↗'),
      metric('Mensagens entregues', fmt(t.entregues), `${pct(t.taxaEntrega)} dos envios`, '✓'),
      metric('Abertura / visualização', fmt(t.abertura), `${pct(t.taxaAbertura)} das entregas`, '✉'),
      metric('Cliques registrados', fmt(t.cliques), `CTR ${pct(t.taxaCliques)}`, '↖'),
      metric('Falhas de entrega', fmt(t.falhas), `${pct(C.ratio(t.falhas, t.enviados))} dos envios`, '!'),
      metric('Opt-out', t.hasOptOut ? fmt(t.optOut) : '—', t.hasOptOut ? `${pct(C.ratio(t.optOut, t.entregues))} das entregas${t.partialOptOut ? ' · dados parciais' : ''}` : 'Coluna opcional ausente', '×')
    ].join('');
    summaries.sort((a, b) => sort.direction * (typeof a[sort.key] === 'string' ? a[sort.key].localeCompare(b[sort.key], 'pt-BR') : a[sort.key] - b[sort.key]));
    $$('[data-sort]').forEach(button => button.closest('th').setAttribute('aria-sort', button.dataset.sort === sort.key ? (sort.direction === 1 ? 'ascending' : 'descending') : 'none'));
    $('#campaign-table-body').innerHTML = summaries.length ? summaries.map(item => `<tr><td><strong>${escape(item.campanha)}</strong><small>${item.registros} disparo${item.registros === 1 ? '' : 's'} · ${dateLabel(item.primeiraData)}</small></td><td><span class="channel-badge ${C.normalize(item.canal).replace(' ', '')}">${escape(item.canal)}</span></td><td>${fmt(item.enviados)}</td><td>${fmt(item.entregues)}<small>${pct(item.taxaEntrega)}</small></td><td>${item.hasOptOut ? fmt(item.optOut) + (item.partialOptOut ? '*' : '') : '—'}</td><td>${rateBar(item.taxaAbertura, 'blue')}</td><td>${rateBar(item.taxaCliques, 'green')}</td><td>${dateLabel(item.ultimaData)}</td></tr>`).join('') : `<tr><td colspan="8">${empty('Nenhum resultado encontrado')}</td></tr>`;
    $('#summary-count').textContent = `${summaries.length} combinações de campanha e canal${t.hasOptOut && t.partialOptOut ? ' · * Opt-out com dados parciais' : ''}`;
    $$('[data-action="excel"], [data-action="pdf"]').forEach(button => { button.disabled = !rows.length; });
    $('#period-label').textContent = period(rows);
    renderTrend(rows);
    const top = [...summaries].sort((a, b) => b.enviados - a.enviados).slice(0, 5);
    $('#engagement-chart').innerHTML = top.length ? top.map(item => `<div class="comparison-row"><span class="comparison-label" title="${escape(item.campanha)} · ${escape(item.canal)}">${escape(item.campanha)}<small> · ${escape(item.canal)}</small></span><div class="comparison-bars">${[['taxaAbertura', 'blue', 'Abertura'], ['taxaCliques', 'green', 'CTR']].map(([key, color, label]) => `<div class="bar-line" aria-label="${label}: ${pct(item[key])}"><div class="bar-track"><i class="${color}" style="width:${Math.max(0, Math.min(100, item[key] * 100))}%"></i></div><span>${pct(item[key])}</span></div>`).join('')}</div></div>`).join('') : empty('Nenhuma campanha no recorte');
  }
  function renderTrend(rows) {
    const groups = new Map();
    rows.forEach(row => { if (!row.date) return; if (!groups.has(row.date)) groups.set(row.date, { date: row.date, enviados: 0, cliques: 0 }); const item = groups.get(row.date); item.enviados += row.enviados; item.cliques += C.clicks(row); });
    const values = [...groups.values()].sort((a, b) => a.date.localeCompare(b.date));
    if (!values.length) { $('#trend-chart').innerHTML = empty('Sem dados datados para este período'); return; }
    const max = Math.max(1, ...values.map(item => Math.max(item.enviados, item.cliques)));
    const width = 600, height = 245, left = 48, top = 18, bottom = 209, right = 580;
    const times = values.map(item => Date.parse(item.date)), first = times[0], span = times.at(-1) - first;
    const x = index => span ? left + (times[index] - first) / span * (right - left) : (left + right) / 2;
    const y = amount => bottom - amount / max * (bottom - top);
    const line = key => values.map((item, index) => `${index ? 'L' : 'M'}${x(index).toFixed(2)},${y(item[key]).toFixed(2)}`).join(' ');
    const compact = value => new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
    let grid = '';
    for (let i = 0; i <= 4; i++) { const amount = max * i / 4, yy = y(amount); grid += `<line x1="${left}" x2="${right}" y1="${yy}" y2="${yy}" stroke="var(--line)" stroke-dasharray="3 5"/><text x="${left - 9}" y="${yy + 4}" text-anchor="end" fill="var(--muted)" font-size="10">${compact(amount)}</text>`; }
    const labelIndices = [0];
    for (let i = 1; i < values.length - 1; i++) if (x(i) - x(labelIndices.at(-1)) >= 85 && x(values.length - 1) - x(i) >= 65) labelIndices.push(i);
    if (values.length > 1) labelIndices.push(values.length - 1);
    const labels = labelIndices.map(index => `<text x="${x(index)}" y="232" text-anchor="middle" fill="var(--muted)" font-size="10">${dateLabel(values[index].date).slice(0, 5)}</text>`).join('');
    const points = values.map((item, index) => `<g><title>${dateLabel(item.date)}: ${fmt(item.enviados)} envios; ${fmt(item.cliques)} cliques</title><circle cx="${x(index)}" cy="${y(item.enviados)}" r="3" fill="#4a8cf5"/><circle cx="${x(index)}" cy="${y(item.cliques)}" r="2.5" fill="#35bd8d"/></g>`).join('');
    $('#trend-chart').innerHTML = `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Evolução de envios e cliques entre ${dateLabel(values[0].date)} e ${dateLabel(values.at(-1).date)}"><defs><linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#4a8cf5" stop-opacity=".2"/><stop offset="1" stop-color="#4a8cf5" stop-opacity="0"/></linearGradient></defs>${grid}<path d="${line('enviados')} L${x(values.length - 1)},${bottom} L${x(0)},${bottom} Z" fill="url(#trend-fill)"/><path d="${line('enviados')}" fill="none" stroke="#4a8cf5" stroke-width="2.5"/><path d="${line('cliques')}" fill="none" stroke="#35bd8d" stroke-width="2.5"/>${points}${labels}</svg>`;
  }
  function clearFilters() { ['campaign-search', 'start-date', 'end-date'].forEach(id => { $(`#${id}`).value = ''; }); selectedCampaigns.clear(); channel = 'Todos'; updateOptions(); renderDispatch(); }
  function replaceRows(rows, source) { state.rows = rows; state.source = source; clearFilters(); return commit(source === 'demo' ? 'Demonstração restaurada. Os eventos foram preservados.' : 'Dados de disparos atualizados.'); }
  async function importFiles(files) {
    if (!files.length || importing) return;
    if (files.length > 30 || files.some(file => file.size > 20 * 1024 * 1024) || files.reduce((total, file) => total + file.size, 0) > 50 * 1024 * 1024) return toast('Importe até 30 arquivos, com até 20 MB cada e 50 MB no total.', true);
    if (!window.XLSX) return toast('A biblioteca Excel não foi encontrada. Mantenha a pasta vendor junto do index.html.', true);
    if (state.source === 'imported' && state.rows.length && !confirm('Substituir os disparos atuais pelos arquivos selecionados? Os eventos serão preservados.')) return;
    importing = true;
    $$('[data-action="import"]').forEach(button => { button.disabled = true; });
    toast('Lendo e validando as planilhas…');
    try {
      const imported = [], warnings = [];
      for (const file of files) {
        if (!/\.(xlsx|xls|csv)$/i.test(file.name)) throw new Error(`Formato não suportado: ${file.name}. Use .xlsx, .xls ou .csv.`);
        const csv = /\.csv$/i.test(file.name);
        const workbook = csv ? XLSX.read(await file.text(), { type: 'string', raw: true, cellDates: false }) : XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: false });
        let fileRows = 0;
        for (const name of workbook.SheetNames) {
          const grid = XLSX.utils.sheet_to_json(workbook.Sheets[name], { header: 1, defval: null, raw: true, blankrows: true });
          const result = C.parseGrid(grid, file.name, name);
          result.rows.forEach(row => imported.push(row)); fileRows += result.rows.length; warnings.push(...result.warnings);
          if (imported.length > 100000) throw new Error('Limite de 100.000 registros por importação excedido. Divida a planilha.');
        }
        if (!fileRows) throw new Error(`${file.name}: nenhum registro válido. Use o modelo com as colunas campanha e enviados.`);
      }
      const saved = replaceRows(imported, 'imported');
      if (warnings.length) toast(`Importados ${imported.length} registros.${saved ? '' : ' O navegador não conseguiu salvá-los; use Salvar backup antes de fechar.'}\n${warnings.slice(0, 5).join('\n')}`, true);
    } catch (error) { toast(`Importação cancelada. Seus dados anteriores foram preservados.\n${error.message}`, true); }
    finally { importing = false; $$('[data-action="import"]').forEach(button => { button.disabled = false; }); $('#file-input').value = ''; }
  }
  const HEADERS = ['campanha', 'data de envio', 'enviados', 'entregues', 'visualização', 'lidos', 'cliques', 'taxa de abertura', 'taxa de cliques', 'canal', 'opt-out'];
  function writeExcel(sheets, filename) {
    if (!window.XLSX) throw new Error('Biblioteca Excel indisponível. Verifique a pasta vendor.');
    const book = XLSX.utils.book_new();
    sheets.forEach(({ name, data }) => {
      const sheet = XLSX.utils.aoa_to_sheet(data);
      data[0].forEach((header, column) => {
        if (!['taxa de abertura', 'taxa de cliques', 'ctr', 'comparecimento'].includes(String(header).toLowerCase())) return;
        for (let row = 1; row < data.length; row++) {
          const cell = sheet[XLSX.utils.encode_cell({ r: row, c: column })];
          if (cell?.t === 'n') cell.z = '0.00%';
        }
      });
      sheet['!cols'] = data[0].map((_, index) => ({ wch: index === 0 ? 38 : 21 }));
      sheet['!autofilter'] = { ref: sheet['!ref'] };
      XLSX.utils.book_append_sheet(book, sheet, name);
    });
    download(new Blob([XLSX.write(book, { bookType: 'xlsx', type: 'array' })], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), filename);
    toast('Arquivo Excel gerado.');
  }
  function template() { writeExcel([{ name: 'Campanhas', data: [HEADERS, ['Boas-vindas setembro', '2026-09-24', 12000, 11720, 0, 4680, 1280, 0.4, 0.109, 'E-mail', 16], ['Oferta WhatsApp', '2026-09-25', 3200, 3100, 2650, 0, 570, 0.855, 0.184, 'WhatsApp', 7]] }], 'modelo-campanhas.xlsx'); }
  function dispatchExcel() {
    const rows = filteredRows(); if (!rows.length) return;
    const raw = rows.map(row => [row.campanha, row.date, row.enviados, row.entregues, row.visualizacao, row.lidos, row.cliques, row.taxaAbertura, row.taxaCliques, row.canal, row.optOut]);
    const summary = C.summarize(rows).map(item => [item.campanha, item.canal, item.registros, item.enviados, item.entregues, item.abertura, item.cliques, item.taxaAbertura, item.taxaCliques, item.hasOptOut ? item.optOut : '', item.hasOptOut && item.partialOptOut ? 'Parcial' : item.hasOptOut ? 'Completo' : 'Ausente', item.ultimaData]);
    writeExcel([{ name: 'Disparos', data: [HEADERS, ...raw] }, { name: 'Resumo', data: [['Campanha', 'Canal', 'Disparos', 'Enviados', 'Entregues', 'Aberturas efetivas', 'Cliques efetivos', 'Taxa de abertura', 'CTR', 'Opt-out', 'Cobertura opt-out', 'Último envio'], ...summary] }], 'campaign-pulse-disparos.xlsx');
  }
  function eventExcel(records) {
    if (!records.length) return toast('Selecione ao menos um evento.', true);
    writeExcel([{ name: 'Eventos', data: [['Evento', 'Data', 'Inscritos', 'Presentes', 'Investimento (R$)', 'Custo por presente (R$)', 'Comparecimento'], ...records.map(event => { const t = C.eventTotals([event]); return [event.nome, event.data, event.inscritos, event.presentes, t.investimento, t.custo, t.comparecimento]; })] }, { name: 'Investimentos', data: [['Evento', 'Data', 'Campanha', 'Investimento (R$)'], ...records.flatMap(event => event.campanhas.map(item => [event.nome, event.data, item.campanha, item.investimento]))] }], 'campaign-pulse-pos-evento.xlsx');
  }
  // Relatórios desenhados como texto/vetores: geração offline, sem captura de HTML.
  function report(title, subtitle, sections, filename) {
    if (!window.jspdf) throw new Error('Biblioteca PDF indisponível. Verifique a pasta vendor.');
    const doc = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4' });
    const clean = text => String(text).replace(/[\u2010-\u2015]/g, '-').replace(/\u2026/g, '...').replace(/[^\u0020-\u00ff\n]/g, '?');
    let y = 0;
    function header() {
      doc.setFillColor(21, 47, 73); doc.rect(0, 0, 210, 29, 'F'); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(17); doc.text('campaignpulse', 15, 14); doc.setFontSize(9); doc.text(clean(title), 15, 22); y = 39;
    }
    function space(height) { if (y + height > 277) { doc.addPage(); header(); } }
    function paragraph(text, bold = false, size = 9, color = [73, 92, 110]) {
      doc.setFont('helvetica', bold ? 'bold' : 'normal'); doc.setFontSize(size);
      const lines = doc.splitTextToSize(clean(text), 180);
      if (lines.length * 5 <= 238) space(lines.length * 5);
      lines.forEach(line => { space(5); doc.setFont('helvetica', bold ? 'bold' : 'normal'); doc.setFontSize(size); doc.setTextColor(...color); doc.text(line, 15, y); y += 5; });
    }
    header(); paragraph(subtitle); y += 4;
    sections.forEach(section => {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
      const titleHeight = doc.splitTextToSize(clean(section.title), 180).length * 5;
      space(titleHeight + 18); doc.setFillColor(240, 245, 251); doc.roundedRect(13, y - 4, 184, titleHeight + 4, 1, 1, 'F');
      paragraph(section.title, true, 10, [28, 74, 125]); y += 5;
      section.lines.forEach(line => paragraph(line)); y += 7;
    });
    const pages = doc.getNumberOfPages();
    for (let i = 1; i <= pages; i++) { doc.setPage(i); doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(120, 138, 157); doc.text(`Campaign Pulse | Gerado localmente | ${i}/${pages}`, 15, 289); }
    download(doc.output('blob'), filename); toast('Relatório PDF gerado.');
  }
  function dispatchPdf() {
    const rows = filteredRows(); if (!rows.length) return;
    const t = C.totals(rows), f = criteria();
    const sections = [{ title: 'Indicadores consolidados', lines: [`Envios: ${fmt(t.enviados)} | Entregues: ${fmt(t.entregues)} (${pct(t.taxaEntrega)})`, `Aberturas / visualizações: ${fmt(t.abertura)} (${pct(t.taxaAbertura)}) | Cliques: ${fmt(t.cliques)} (CTR ${pct(t.taxaCliques)})`, `Falhas: ${fmt(t.falhas)} | Opt-out: ${t.hasOptOut ? fmt(t.optOut) + (t.partialOptOut ? ' (dados parciais)' : '') : 'não informado'}`, 'Taxas calculadas sobre entregues. Falhas = enviados - entregues.'] }, ...C.summarize(rows).sort((a, b) => b.enviados - a.enviados).map(item => ({ title: `${item.campanha} · ${item.canal}`, lines: [`${item.registros} disparos | ${dateLabel(item.primeiraData)} a ${dateLabel(item.ultimaData)}`, `Enviados: ${fmt(item.enviados)} | Entregues: ${fmt(item.entregues)} | Falhas: ${fmt(item.falhas)}`, `Aberturas: ${fmt(item.abertura)} (${pct(item.taxaAbertura)}) | Cliques: ${fmt(item.cliques)} (CTR ${pct(item.taxaCliques)})`, `Opt-out: ${item.hasOptOut ? fmt(item.optOut) + (item.partialOptOut ? ' (dados parciais)' : '') : 'não informado'}`] }))];
    report('Análise de disparos', `${state.source === 'demo' ? 'DADOS DE DEMONSTRAÇÃO | ' : ''}${period(rows)} | ${rows.length} registros | Canal: ${channel}\nBusca: ${f.query || 'todas'} | Campanhas: ${f.selected.join(', ') || 'todas'}`, sections, 'campaign-pulse-relatorio.pdf');
  }
  function eventPdf(records) {
    if (!records.length) return toast('Selecione ao menos um evento.', true);
    const t = C.eventTotals(records);
    report('Análise pós-evento', `${records.length} evento(s) | Gerado em ${new Date().toLocaleDateString('pt-BR')}`, [{ title: 'Resultado consolidado', lines: [`Investimento: ${money(t.investimento)} | Inscritos: ${fmt(t.inscritos)} | Presentes: ${fmt(t.presentes)}`, `Comparecimento: ${pct(t.comparecimento)} | Custo por presente: ${money(t.custo)}`] }, ...records.map(event => { const v = C.eventTotals([event]); return { title: event.nome, lines: [`Data: ${dateLabel(event.data)} | Inscritos: ${fmt(event.inscritos)} | Presentes: ${fmt(event.presentes)}`, `Investimento: ${money(v.investimento)} | Custo por presente: ${money(v.custo)} | Comparecimento: ${pct(v.comparecimento)}`, ...event.campanhas.map(item => `${item.campanha}: ${money(item.investimento)}`), 'Custo por presente = investimento de divulgação / pessoas presentes.'] }; })], 'campaign-pulse-pos-evento.pdf');
  }
  function addInvestment(item = {}) {
    const div = document.createElement('div'); div.className = 'investment-row';
    div.innerHTML = `<label>Campanha<input class="investment-name" list="campaign-suggestions" maxlength="500" placeholder="Selecione ou digite" value="${escape(item.campanha || '')}"></label><label>Investimento (R$)<input class="investment-cost" type="number" min="0" max="1000000000000" step="0.01" placeholder="0,00" value="${item.investimento ?? ''}"></label><button type="button" class="remove-investment" aria-label="Remover campanha vinculada">×</button>`;
    $('#investments').append(div);
  }
  function draftPreview() {
    const total = $$('.investment-cost').reduce((value, input) => value + Math.round((Number(input.value) || 0) * 100), 0) / 100;
    const attendees = Number($('#event-attendees').value);
    $('#draft-total').textContent = money(total);
    $('#draft-cost').textContent = money(attendees > 0 ? total / attendees : null);
    const registered = $('#event-registered').value;
    if (registered !== '') $('#event-attendees').max = registered; else $('#event-attendees').removeAttribute('max');
  }
  function resetForm() {
    $('#event-form').reset(); editingId = null; dirty = false;
    $('#investments').innerHTML = ''; addInvestment();
    $('#event-form-title').textContent = 'Dados do evento'; $('#event-form-eyebrow').textContent = 'NOVO REGISTRO';
    $('#cancel-edit').hidden = true; $('#save-event').textContent = 'Salvar análise'; $('#event-form-error').hidden = true; draftPreview();
  }
  function saveEvent(event) {
    event.preventDefault();
    try {
      const campaigns = [];
      $$('.investment-row').forEach(row => {
        const name = row.querySelector('.investment-name').value.trim(), value = row.querySelector('.investment-cost').value;
        if (!name && value === '') return;
        if (!name || value === '') throw new Error('Informe nome e investimento de cada campanha vinculada (use 0 quando não houve custo).');
        campaigns.push({ campanha: name, investimento: Math.round(Number(value) * 100) / 100 });
      });
      const record = C.validateEvent({ id: editingId || uid(), nome: $('#event-name').value.trim(), data: $('#event-date').value, inscritos: Number($('#event-registered').value), presentes: Number($('#event-attendees').value), campanhas: campaigns });
      if (editingId) state.events = state.events.map(item => item.id === editingId ? record : item); else state.events.push(record);
      state.events.sort((a, b) => b.data.localeCompare(a.data)); resetForm(); renderEvents(); commit('Análise salva neste navegador.');
    } catch (error) { $('#event-form-error').textContent = error.message; $('#event-form-error').hidden = false; }
  }
  function editEvent(id) {
    if (dirty && !confirm('Substituir as alterações não salvas pelos dados deste evento?')) return;
    const event = state.events.find(item => item.id === id); if (!event) return;
    resetForm(); editingId = id;
    $('#event-name').value = event.nome; $('#event-date').value = event.data; $('#event-registered').value = event.inscritos; $('#event-attendees').value = event.presentes;
    $('#investments').innerHTML = ''; (event.campanhas.length ? event.campanhas : [{}]).forEach(addInvestment);
    $('#event-form-title').textContent = 'Editar análise'; $('#event-form-eyebrow').textContent = 'EDIÇÃO EM ANDAMENTO'; $('#cancel-edit').hidden = false; $('#save-event').textContent = 'Salvar alterações';
    draftPreview(); $('#event-name').focus(); $('#event-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function renderEvents() {
    const events = filteredEvents(), t = C.eventTotals(events);
    $('#event-date-error').hidden = !($('#event-from').value && $('#event-to').value && $('#event-from').value > $('#event-to').value);
    $('#event-metrics').innerHTML = [metric('Eventos analisados', fmt(events.length), 'No período e busca atuais', '▣'), metric('Investimento total', money(t.investimento), `${events.reduce((total, event) => total + event.campanhas.length, 0)} vínculos de campanha`, '$'), metric('Pessoas presentes', fmt(t.presentes), `${pct(t.comparecimento)} dos inscritos`, '♙'), metric('Custo por presente', money(t.custo), 'Investimento ÷ presentes', '◎')].join('');
    $('#event-count').textContent = `${events.length} de ${state.events.length} eventos`;
    const visibleSelection = events.filter(event => selectedEvents.has(event.id)).length, hiddenSelection = selectedEvents.size - visibleSelection;
    $('#event-selection-status').textContent = `${selectedEvents.size} selecionados${hiddenSelection ? ` · ${hiddenSelection} fora do filtro` : ''}`;
    $('#select-all-events').checked = events.length > 0 && visibleSelection === events.length; $('#select-all-events').indeterminate = visibleSelection > 0 && visibleSelection < events.length; $('#select-all-events').disabled = !events.length;
    $('#export-event-filter').disabled = !events.length;
    ['export-event-selected', 'pdf-event-selected', 'clear-event-selection'].forEach(id => { $(`#${id}`).disabled = !selectedEvents.size; });
    $('#event-list').innerHTML = events.length ? events.map(event => {
      const v = C.eventTotals([event]), id = escape(event.id);
      return `<article class="panel event-record ${selectedEvents.has(event.id) ? 'selected' : ''}"><header><label class="check-label"><input type="checkbox" data-event-select="${id}" ${selectedEvents.has(event.id) ? 'checked' : ''} aria-label="Selecionar ${escape(event.nome)}"><span><strong>${escape(event.nome)}</strong><small>${dateLabel(event.data)} · ${event.campanhas.length} campanhas</small></span></label><div class="actions"><button data-edit="${id}" aria-label="Editar ${escape(event.nome)}">Editar</button><button data-event-pdf="${id}" aria-label="PDF de ${escape(event.nome)}">PDF</button><button data-delete="${id}" aria-label="Remover ${escape(event.nome)}">×</button></div></header><div class="event-record-metrics"><div><small>Investimento</small><strong>${money(v.investimento)}</strong></div><div><small>Inscritos</small><strong>${fmt(event.inscritos)}</strong></div><div><small>Presentes</small><strong>${fmt(event.presentes)}</strong><small>${pct(v.comparecimento)} comparecimento</small></div><div><small>Custo por presente</small><strong>${money(v.custo)}</strong></div></div><div class="event-breakdown"><span class="eyebrow">INVESTIMENTO POR CAMPANHA</span>${event.campanhas.length ? event.campanhas.map(item => `<div><span>${escape(item.campanha)}</span><strong>${money(item.investimento)}</strong></div>`).join('') : '<p>Nenhum investimento vinculado.</p>'}</div></article>`;
    }).join('') : empty(state.events.length ? 'Nenhum evento encontrado' : 'Nenhum evento analisado ainda', state.events.length ? 'Altere os filtros para visualizar outros eventos.' : 'Preencha o formulário acima para começar sua análise.');
  }
  function navigate() {
    const events = location.hash === '#pos-evento';
    $('#dispatch-page').hidden = events; $('#events-page').hidden = !events;
    $('#breadcrumb-title').textContent = events ? 'Pós-evento' : 'Análise de disparos';
    $$('[data-page]').forEach(link => { const active = link.dataset.page === (events ? 'pos-evento' : 'disparos'); link.classList.toggle('active', active); if (active) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current'); });
  }
  function guarded(action) { return (...args) => { try { action(...args); } catch (error) { toast(error.message, true); } }; }
  $$('[data-action]').forEach(button => button.addEventListener('click', guarded(() => ({ template, import: () => $('#file-input').click(), excel: dispatchExcel, pdf: dispatchPdf })[button.dataset.action]())));
  $('#file-input').addEventListener('change', event => { const files = [...event.target.files]; event.target.value = ''; importFiles(files); });
  $('#drop-zone').addEventListener('dragover', event => { event.preventDefault(); $('#drop-zone').classList.add('dragging'); });
  $('#drop-zone').addEventListener('dragleave', event => { if (!$('#drop-zone').contains(event.relatedTarget)) $('#drop-zone').classList.remove('dragging'); });
  $('#drop-zone').addEventListener('drop', event => { event.preventDefault(); $('#drop-zone').classList.remove('dragging'); importFiles([...event.dataTransfer.files]); });
  ['campaign-search', 'start-date', 'end-date'].forEach(id => $(`#${id}`).addEventListener('input', renderDispatch));
  $('#campaign-options').addEventListener('change', event => { const name = campaignNames()[Number(event.target.value)]; if (event.target.checked) selectedCampaigns.add(name); else selectedCampaigns.delete(name); renderDispatch(); });
  $('#channel-tabs').addEventListener('click', event => { const button = event.target.closest('[data-channel]'); if (button) { channel = button.dataset.channel; renderDispatch(); } });
  $('#clear-filters').addEventListener('click', clearFilters);
  $$('[data-sort]').forEach(button => button.addEventListener('click', () => { sort = { key: button.dataset.sort, direction: sort.key === button.dataset.sort ? -sort.direction : 1 }; renderDispatch(); }));
  $('#demo-button').addEventListener('click', () => { if (confirm('Substituir os disparos atuais pelos dados de demonstração? Os eventos serão preservados.')) replaceRows(structuredClone(window.DEMO_ROWS), 'demo'); });
  $('#clear-data-button').addEventListener('click', () => { if (confirm('Remover todos os disparos deste painel? Salve um backup antes, se precisar recuperá-los. Os eventos serão preservados.')) replaceRows([], 'empty'); });
  $('#theme-button').addEventListener('click', () => { document.body.classList.toggle('dark'); updateThemeLabel(); try { localStorage.setItem('campaign-pulse-theme', document.body.classList.contains('dark') ? 'dark' : 'light'); } catch { /* O tema continua válido na sessão. */ } });
  function updateThemeLabel() { $('#theme-button').setAttribute('aria-label', `Ativar tema ${document.body.classList.contains('dark') ? 'claro' : 'escuro'}`); }
  $('#help-button').addEventListener('click', () => $('#help-dialog').showModal()); $('#close-help').addEventListener('click', () => $('#help-dialog').close());
  $('#event-form').addEventListener('submit', saveEvent);
  $('#event-form').addEventListener('input', () => { dirty = true; draftPreview(); });
  $('#add-investment').addEventListener('click', () => { if ($$('.investment-row').length >= 500) return toast('Limite de 500 campanhas por evento.', true); addInvestment(); dirty = true; $$('.investment-name').at(-1).focus(); });
  $('#investments').addEventListener('click', event => { if (event.target.closest('.remove-investment')) { event.target.closest('.investment-row').remove(); dirty = true; if (!$$('.investment-row').length) addInvestment(); draftPreview(); } });
  function newEvent() { if (dirty && !confirm('Descartar as alterações não salvas no formulário?')) return; resetForm(); $('#event-name').focus(); }
  $('#new-event-button').addEventListener('click', newEvent); $('#cancel-edit').addEventListener('click', newEvent);
  ['event-search', 'event-from', 'event-to'].forEach(id => $(`#${id}`).addEventListener('input', renderEvents));
  $('#clear-event-filters').addEventListener('click', () => { ['event-search', 'event-from', 'event-to'].forEach(id => { $(`#${id}`).value = ''; }); renderEvents(); });
  $('#event-list').addEventListener('change', event => { const id = event.target.dataset.eventSelect; if (id) { if (event.target.checked) selectedEvents.add(id); else selectedEvents.delete(id); renderEvents(); } });
  $('#event-list').addEventListener('click', guarded(event => {
    const button = event.target.closest('button'); if (!button) return;
    if (button.dataset.edit) editEvent(button.dataset.edit);
    if (button.dataset.eventPdf) eventPdf(state.events.filter(item => item.id === button.dataset.eventPdf));
    if (button.dataset.delete) {
      const record = state.events.find(item => item.id === button.dataset.delete);
      if (record && confirm(`Remover a análise de “${record.nome}”?${editingId === record.id && dirty ? ' As alterações não salvas desta análise também serão descartadas.' : ''}`)) { state.events = state.events.filter(item => item.id !== record.id); selectedEvents.delete(record.id); if (editingId === record.id) resetForm(); renderEvents(); commit('Análise removida.'); }
    }
  }));
  $('#select-all-events').addEventListener('change', event => { filteredEvents().forEach(item => { if (event.target.checked) selectedEvents.add(item.id); else selectedEvents.delete(item.id); }); renderEvents(); });
  $('#clear-event-selection').addEventListener('click', () => { selectedEvents.clear(); renderEvents(); });
  $('#export-event-filter').addEventListener('click', guarded(() => eventExcel(filteredEvents())));
  $('#export-event-selected').addEventListener('click', guarded(() => eventExcel(state.events.filter(event => selectedEvents.has(event.id)))));
  $('#pdf-event-selected').addEventListener('click', guarded(() => eventPdf(state.events.filter(event => selectedEvents.has(event.id)))));
  $('#backup-button').addEventListener('click', () => { download(new Blob([JSON.stringify({ ...state, exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' }), 'campaign-pulse-backup.json'); toast('Backup gerado com todos os disparos e eventos salvos.'); });
  $('#restore-button').addEventListener('click', () => $('#restore-input').click());
  $('#restore-input').addEventListener('change', async event => {
    const file = event.target.files[0]; if (!file) return;
    try {
      if (file.size > 50 * 1024 * 1024) throw new Error('O backup deve ter até 50 MB.');
      const restored = C.validateBackup(JSON.parse(await file.text()));
      if (!confirm(`Restaurar ${restored.rows.length} disparos e ${restored.events.length} eventos? Isso substitui todos os dados atuais e descarta alterações não salvas.`)) return;
      state = { version: 1, rows: restored.rows, events: restored.events, source: restored.source };
      selectedEvents.clear(); clearFilters(); resetForm(); renderEvents(); commit('Backup restaurado.');
    } catch (error) { toast(`Backup não restaurado: ${error.message}`, true); }
    finally { $('#restore-input').value = ''; }
  });
  window.addEventListener('hashchange', navigate);
  window.addEventListener('beforeunload', event => { if (dirty || sessionOnly) { event.preventDefault(); event.returnValue = ''; } });
  updateOptions(); resetForm(); renderDispatch(); renderEvents(); navigate(); updateThemeLabel();
  if (persistenceWarning) toast(persistenceWarning, true);
})();
