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
  let state = { version: 3, rows: structuredClone(window.DEMO_ROWS), events: [], source: 'demo' };
  let selectedCompanies = new Set(), selectedCollaborators = new Set(), performanceMode = 'empresas', listingMode = 'empresas', selectedCampaigns = new Set(), selectedEvents = new Set(), channel = 'Todos', sort = { key: 'enviados', direction: -1 };
  let editingId = null, dirty = false, importing = false, toastTimer, persistenceWarning = '', sessionOnly = false;
  let tooltipTarget = null;
  let tooltipNeedsMovement = false;
  let tooltipPosition = { x: 0, y: 0 };
  const tooltipAttrs = (title, lines) => `tabindex="0" data-tooltip-title="${escape(title)}" data-tooltip-lines="${escape(JSON.stringify(lines))}"`;
  const summaryTooltip = item => tooltipAttrs(item.grupo === 'colaboradores' ? item.colaborador : item.campanha ? `${item.empresa} · ${item.campanha}` : item.empresa, [
    `Colaboradores: ${item.colaborador}`, `Empresas: ${item.empresa}`,
    `Canal: ${item.canal}`, `${item.registros} disparos · ${dateLabel(item.primeiraData)} a ${dateLabel(item.ultimaData)}`,
    `Enviados: ${fmt(item.enviados)} · Entregues: ${fmt(item.entregues)}`,
    `Aberturas: ${fmt(item.abertura)} (${pct(item.taxaAbertura)})`, `Cliques: ${fmt(item.cliques)} (CTR ${pct(item.taxaCliques)})`,
    `Opt-out: ${item.hasOptOut ? fmt(item.optOut) + (item.partialOptOut ? ' · dados parciais' : '') : 'não informado'}`
  ]);
  function hideTooltip() {
    if (tooltipTarget) tooltipTarget.removeAttribute('aria-describedby');
    tooltipTarget = null; $('#dashboard-tooltip').hidden = true;
  }
  function positionTooltip(x, y) {
    tooltipPosition = { x, y };
    const box = $('#dashboard-tooltip'), size = box.getBoundingClientRect();
    const left = x + 14 + size.width <= innerWidth - 8 ? x + 14 : x - size.width - 14;
    const top = y + 14 + size.height <= innerHeight - 8 ? y + 14 : y - size.height - 14;
    box.style.left = `${Math.max(8, Math.min(left, innerWidth - size.width - 8))}px`;
    box.style.top = `${Math.max(8, Math.min(top, innerHeight - size.height - 8))}px`;
  }
  function showTooltip(target, x, y) {
    if (tooltipTarget !== target) hideTooltip();
    tooltipTarget = target;
    const box = $('#dashboard-tooltip'), title = document.createElement('strong');
    title.textContent = target.dataset.tooltipTitle;
    const lines = JSON.parse(target.dataset.tooltipLines);
    box.replaceChildren(title, ...lines.map(text => { const line = document.createElement('div'); line.textContent = text; return line; }));
    box.hidden = false; target.setAttribute('aria-describedby', box.id); positionTooltip(x, y);
  }
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
    return `<article class="metric-card" ${tooltipAttrs(label, [value, foot, 'Valores do recorte atual.'])}><div class="metric-top"><span class="metric-icon" aria-hidden="true">${icon}</span><span>${escape(label)}</span></div><div class="metric-value">${escape(value)}</div><div class="metric-foot">${escape(foot)}</div></article>`;
  }
  function criteria() { return { query: $('#campaign-search').value, companies: [...selectedCompanies], collaborators: [...selectedCollaborators], campaignKeys: [...selectedCampaigns], from: $('#start-date').value, to: $('#end-date').value, channel }; }
  const filteredRows = () => C.filter(state.rows, criteria());
  const filteredEvents = () => C.filter(state.events, { query: $('#event-search').value, from: $('#event-from').value, to: $('#event-to').value, event: true });
  const campaignNames = () => [...new Set(state.rows.map(row => row.campanha))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const companyNames = () => [...new Set(state.rows.map(row => row.empresa))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const collaboratorNames = () => [...new Set(state.rows.map(row => row.colaborador))].sort((a, b) => a.localeCompare(b, 'pt-BR', { numeric: true }));
  const COMPANY_PALETTE = [
    ['#d93645', '#ef9099'], ['#2563eb', '#85a8f5'], ['#16964f', '#7bce9d'], ['#b58a00', '#dfc15e'],
    ['#8651cc', '#bea0e6'], ['#d66c19', '#ecac79'], ['#168d99', '#78cbd2'], ['#c33b88', '#e595c2']
  ];
  let companyColorMap = new Map(), collaboratorColorMap = new Map();
  const collaboratorColors = name => collaboratorColorMap.get(name);
  function updateCompanyColors() {
    const names = companyNames(), used = new Set(), indexes = new Map();
    names.forEach(name => {
      const match = name.match(/^Emp([A-Z])$/i);
      if (match) {
        const index = match[1].toUpperCase().charCodeAt(0) - 65;
        if (!used.has(index)) { indexes.set(name, index); used.add(index); }
      }
    });
    names.forEach(name => {
      if (indexes.has(name)) return;
      let index = 0; while (used.has(index)) index++;
      indexes.set(name, index); used.add(index);
    });
    companyColorMap = new Map(names.map(name => {
      const index = indexes.get(name), hue = Math.round((index * 137.508) % 360);
      const [opening, clicks] = COMPANY_PALETTE[index] || [`hsl(${hue}, 65%, 43%)`, `hsl(${hue}, 65%, 72%)`];
      return [name, { opening, clicks }];
    }));
  }
  const campaignOptions = () => [...new Map(state.rows.filter(row => (!selectedCompanies.size || selectedCompanies.has(row.empresa)) && (!selectedCollaborators.size || selectedCollaborators.has(row.colaborador))).map(row => [C.campaignKey(row), row])).values()].sort((a, b) => a.empresa.localeCompare(b.empresa, 'pt-BR') || a.campanha.localeCompare(b.campanha, 'pt-BR'));
  function updateOptions() {
    updateCompanyColors();
    const names = campaignNames();
    const companies = companyNames(), campaigns = campaignOptions();
    const collaborators = collaboratorNames();
    collaboratorColorMap = new Map(collaborators.map((name, position) => {
      const match = name.match(/^Colab([1-9]\d{0,2})$/i), index = match ? Number(match[1]) - 1 : position + 26, hue = Math.round((index * 137.508) % 360);
      const [opening, clicks] = COMPANY_PALETTE[index] || [`hsl(${hue}, 65%, 43%)`, `hsl(${hue}, 65%, 72%)`];
      return [name, { opening, clicks }];
    }));
    $('#collaborator-options').innerHTML = collaborators.length ? collaborators.map((name, index) => `<label><input type="checkbox" value="${index}" ${selectedCollaborators.has(name) ? 'checked' : ''}>${escape(name)}</label>`).join('') : '<span>Nenhum colaborador disponível.</span>';
    $('#company-options').innerHTML = companies.length ? companies.map((name, index) => `<label><input type="checkbox" value="${index}" ${selectedCompanies.has(name) ? 'checked' : ''}>${escape(name)}</label>`).join('') : '<span>Nenhuma empresa disponível.</span>';
    $('#campaign-options').innerHTML = campaigns.length ? campaigns.map((row, index) => `<label><input type="checkbox" value="${index}" ${selectedCampaigns.has(C.campaignKey(row)) ? 'checked' : ''}>${escape(row.empresa)} · ${escape(row.campanha)}</label>`).join('') : '<span>Nenhuma campanha disponível.</span>';
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
    hideTooltip();
    tooltipNeedsMovement = true;
    const rows = filteredRows(), t = C.totals(rows), summaries = C.summarize(rows);
    const byCompany = performanceMode === 'empresas', byCollaborator = performanceMode === 'colaboradores';
    $('#company-selection-count').textContent = selectedCompanies.size ? `(${selectedCompanies.size} selecionadas)` : 'Todas as empresas';
    $('#collaborator-selection-count').textContent = selectedCollaborators.size ? `(${selectedCollaborators.size} selecionados)` : 'Todos os colaboradores';
    $('#legacy-company-warning').hidden = !state.rows.some(row => row.empresa === 'Empresa não informada');
    $('#legacy-collaborator-warning').hidden = !state.rows.some(row => row.colaborador === 'Colaborador não informado');
    $('#engagement-title').textContent = byCollaborator ? 'Produção por colaborador' : byCompany ? 'Engajamento por empresa' : 'Engajamento por campanha';
    $('#engagement-description').textContent = byCollaborator ? 'Quantidade de disparos realizados por responsável no recorte' : byCompany ? 'Abertura e cliques de todas as empresas do recorte' : 'Todas as campanhas do recorte, identificadas por empresa, canal e responsável';
    $('#summary-title').textContent = listingMode === 'colaboradores' ? 'Colaboradores e seus disparos' : listingMode === 'empresas' ? 'Empresas e suas campanhas' : 'Listagem geral de campanhas';
    $('#summary-description').textContent = listingMode === 'colaboradores' ? 'Produção de cada responsável e suas campanhas, com empresas e canais identificados.' : listingMode === 'empresas' ? 'Totais de cada empresa seguidos de suas campanhas, canais e responsáveis.' : 'Todas as campanhas do recorte, identificadas por empresa, canal e responsável.';
    $('#date-error').hidden = !(criteria().from && criteria().to && criteria().from > criteria().to);
    updateSourceLabel();
    $('#source-title').textContent = state.source === 'imported' ? 'Suas campanhas estão no dashboard' : 'Traga seus dados para o dashboard';
    $('#source-detail').textContent = state.source === 'imported' ? `${state.rows.length} registros · ${[...new Set(state.rows.map(row => row.arquivo || 'Backup'))].join(', ')} · importe para substituir` : 'Arraste arquivos .xlsx, .xls ou .csv. Empresas é obrigatória; preencha colaboradores para medir a produção.';
    $('#result-count').textContent = `Exibindo ${fmt(rows.length)} de ${fmt(state.rows.length)} envios`;
    $('#selection-count').textContent = selectedCampaigns.size ? `(${selectedCampaigns.size} selecionadas)` : '';
    const channelBase = C.filter(state.rows, { ...criteria(), channel: 'Todos' });
    $('#channel-tabs').innerHTML = ['Todos', ...C.CHANNELS].map(name => `<button class="${channel === name ? 'selected' : ''}" data-channel="${name}" aria-pressed="${channel === name}">${name}<span>${name === 'Todos' ? channelBase.length : channelBase.filter(row => row.canal === name).length}</span></button>`).join('');
    $('#dispatch-metrics').innerHTML = (byCollaborator ? [
      metric('Disparos realizados', fmt(rows.length), `${fmt(new Set(rows.filter(row => row.colaborador !== 'Colaborador não informado').map(row => row.colaborador)).size)} colaboradores identificados`, '↗'),
      metric('Campanhas atendidas', fmt(new Set(rows.map(C.campaignKey)).size), 'Campanhas distintas por empresa', '▦'),
      metric('Empresas atendidas', fmt(new Set(rows.map(row => row.empresa)).size), 'Empresas distintas no recorte', '▣'),
      metric('Mensagens enviadas', fmt(t.enviados), `${fmt(t.entregues)} entregues`, '✉'),
      metric('Aberturas registradas', fmt(t.abertura), `${pct(t.taxaAbertura)} das entregas`, '✓'),
      metric('Cliques registrados', fmt(t.cliques), `CTR ${pct(t.taxaCliques)}`, '↖')
    ] : [
      metric('Total de envios', fmt(t.enviados), `${fmt(rows.length)} disparos analisados`, '↗'),
      metric('Mensagens entregues', fmt(t.entregues), `${pct(t.taxaEntrega)} dos envios`, '✓'),
      metric('Abertura / visualização', fmt(t.abertura), `${pct(t.taxaAbertura)} das entregas`, '✉'),
      metric('Cliques registrados', fmt(t.cliques), `CTR ${pct(t.taxaCliques)}`, '↖'),
      metric('Falhas de entrega', fmt(t.falhas), `${pct(C.ratio(t.falhas, t.enviados))} dos envios`, '!'),
      metric('Opt-out', t.hasOptOut ? fmt(t.optOut) : '—', t.hasOptOut ? `${pct(C.ratio(t.optOut, t.entregues))} das entregas${t.partialOptOut ? ' · dados parciais' : ''}` : 'Coluna opcional ausente', '×')
    ]).join('');
    summaries.sort((a, b) => sort.direction * (typeof a[sort.key] === 'string' ? a[sort.key].localeCompare(b[sort.key], 'pt-BR') : a[sort.key] - b[sort.key]));
    $$('[data-sort]').forEach(button => button.closest('th').setAttribute('aria-sort', button.dataset.sort === sort.key ? (sort.direction === 1 ? 'ascending' : 'descending') : 'none'));
    const metricCells = item => `<td>${fmt(item.registros)}</td><td>${fmt(item.enviados)}</td><td>${fmt(item.entregues)}<small>${pct(item.taxaEntrega)}</small></td><td>${item.hasOptOut ? fmt(item.optOut) + (item.partialOptOut ? '*' : '') : '—'}</td><td>${fmt(item.abertura)}</td><td>${fmt(item.cliques)}</td><td>${rateBar(item.taxaAbertura, 'blue')}</td><td>${rateBar(item.taxaCliques, 'green')}</td><td>${dateLabel(item.ultimaData)}</td>`;
    const campaignRow = item => `<tr data-campaign-row ${summaryTooltip(item)}><td><strong>${escape(item.empresa)}</strong></td><td><strong>${escape(item.campanha)}</strong><small>${item.registros} disparo${item.registros === 1 ? '' : 's'} · ${dateLabel(item.primeiraData)}</small></td><td><span class="channel-badge ${C.normalize(item.canal).replace(' ', '')}">${escape(item.canal)}</span></td><td>${escape(item.colaborador)}</td>${metricCells(item)}</tr>`;
    const groupKey = listingMode === 'colaboradores' ? 'colaborador' : 'empresa';
    const listingGroups = C.summarize(rows, listingMode === 'colaboradores' ? 'colaboradores' : 'empresas').sort((a, b) => sort.direction * (typeof a[sort.key] === 'string' ? (a[sort.key] || a[groupKey]).localeCompare(b[sort.key] || b[groupKey], 'pt-BR') : a[sort.key] - b[sort.key]));
    const grouped = new Map(listingGroups.map(item => [item[groupKey], []]));
    summaries.forEach(item => grouped.get(item[groupKey]).push(item));
    $('#campaign-table-body').innerHTML = !summaries.length ? `<tr><td colspan="13">${empty('Nenhum resultado encontrado')}</td></tr>` : listingMode === 'campanhas' ? summaries.map(campaignRow).join('') : listingGroups.map(item => `<tr class="company-group-row" ${listingMode === 'colaboradores' ? 'data-collaborator-group' : 'data-company-group'} ${summaryTooltip(item)}><th scope="row" colspan="4"><strong>${escape(item[groupKey])}</strong><small>${item.registros} disparos · ${item.campanhasOperadas} campanhas · ${item.empresasAtendidas} empresas · ${escape(listingMode === 'colaboradores' ? item.empresa : item.colaborador)}</small></th>${metricCells(item)}</tr>${grouped.get(item[groupKey]).map(campaignRow).join('')}`).join('');
    $('#summary-count').textContent = `${new Set(rows.map(row => row.empresa)).size} empresas · ${new Set(rows.map(row => row.colaborador)).size} colaboradores · ${summaries.length} combinações de empresa, campanha, canal e responsável${t.hasOptOut && t.partialOptOut ? ' · * Opt-out com dados parciais' : ''}`;
    $$('[data-action="excel"], [data-action="pdf"]').forEach(button => { button.disabled = !rows.length; });
    $('#period-label').textContent = period(rows);
    renderTrend(rows);
    const top = C.summarize(rows, performanceMode).sort((a, b) => byCollaborator ? b.registros - a.registros || b.enviados - a.enviados : b.enviados - a.enviados);
    const maxDispatches = top.reduce((maximum, item) => Math.max(maximum, item.registros), 1);
    $('#engagement-chart').innerHTML = top.length ? top.map(item => {
      const colors = byCollaborator ? collaboratorColors(item.colaborador) : companyColorMap.get(item.empresa);
      if (byCollaborator) return `<div class="comparison-row" data-collaborator="${escape(item.colaborador)}" ${summaryTooltip(item)}><span class="comparison-label">${escape(item.colaborador)}<small> · ${item.campanhasOperadas} campanhas · ${item.empresasAtendidas} empresas</small></span><div class="comparison-bars"><div class="bar-line"><div class="bar-track"><i style="background:${colors.opening};width:${item.registros / maxDispatches * 100}%"></i></div><span>${fmt(item.registros)} disparos</span></div><small>${fmt(item.enviados)} mensagens enviadas</small></div></div>`;
      return `<div class="comparison-row" ${summaryTooltip(item)}><span class="comparison-label">${byCompany ? escape(item.empresa) : `${escape(item.empresa)} · ${escape(item.campanha)}`}<small> · ${escape(item.canal)}</small></span><div class="comparison-bars">${[['taxaAbertura', colors.opening, 'Abertura'], ['taxaCliques', colors.clicks, 'CTR']].map(([key, color, label]) => `<div class="bar-line" aria-label="${label}: ${pct(item[key])}"><div class="bar-track"><i style="background:${color};width:${Math.max(0, Math.min(100, item[key] * 100))}%"></i></div><span>${pct(item[key])}</span></div>`).join('')}</div></div>`;
    }).join('') : empty('Nenhum desempenho no recorte');
    $('#engagement-legend').textContent = byCollaborator ? 'Barras: quantidade de disparos · cada linha importada conta como um disparo' : 'Abertura: cor da empresa · CTR: tom claro da mesma cor';
  }
  function renderTrend(rows) {
    const production = performanceMode === 'colaboradores', dimension = production ? 'colaborador' : 'empresa';
    $('#trend-title').textContent = production ? 'Produção ao longo do tempo' : 'Desempenho ao longo do tempo';
    $('#trend-description').textContent = production ? 'Quantidade de disparos por colaborador e data' : 'Aberturas e cliques por empresa e data de disparo';
    $('#trend-note').textContent = production ? 'Cada linha da planilha conta como um disparo · totais por responsável e dia' : 'Quantidades por empresa e dia · aberturas: linha contínua · cliques: tom claro e tracejado';
    const groups = new Map();
    rows.forEach(row => {
      if (!row.date) return;
      if (!groups.has(row[dimension])) groups.set(row[dimension], new Map());
      const days = groups.get(row[dimension]);
      if (!days.has(row.date)) days.set(row.date, { date: row.date, registros: 0, abertura: 0, cliques: 0, enviados: 0, entregues: 0, empresas: new Set(), colaboradores: new Set() });
      const item = days.get(row.date); item.registros++; item.abertura += C.opens(row); item.cliques += C.clicks(row); item.enviados += row.enviados; item.entregues += row.entregues; item.empresas.add(row.empresa); item.colaboradores.add(row.colaborador);
    });
    const names = (production ? collaboratorNames() : companyNames()).filter(name => groups.has(name));
    $('#trend-legend').innerHTML = names.map(name => {
      const colors = production ? collaboratorColors(name) : companyColorMap.get(name);
      return `<div class="company-legend"><strong>${escape(name)}</strong><span><i style="background:${colors.opening}"></i>${production ? 'Disparos' : 'Aberturas'}</span>${production ? '' : `<span><i style="background:${colors.clicks}"></i>Cliques · tracejado</span>`}</div>`;
    }).join('');
    if (!names.length) { $('#trend-chart').innerHTML = empty('Sem dados datados para este período'); return; }
    const series = names.map(name => ({ name, values: [...groups.get(name).values()].sort((a, b) => a.date.localeCompare(b.date)) }));
    const days = [...new Set(series.flatMap(item => item.values.map(value => value.date)))].sort();
    const max = series.reduce((maximum, item) => item.values.reduce((current, value) => Math.max(current, ...(production ? [value.registros] : [value.abertura, value.cliques])), maximum), 1);
    const width = 600, height = 245, left = 48, top = 18, bottom = 209, right = 580;
    const times = days.map(day => Date.parse(day)), first = times[0], span = times.at(-1) - first;
    const x = day => span ? left + (Date.parse(day) - first) / span * (right - left) : (left + right) / 2;
    const y = amount => bottom - amount / max * (bottom - top);
    const compact = value => new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
    let grid = '';
    const ticks = production ? Math.min(4, max) : 4;
    for (let i = 0; i <= ticks; i++) { const amount = production ? Math.round(max * i / ticks) : max * i / ticks, yy = y(amount); grid += `<line x1="${left}" x2="${right}" y1="${yy}" y2="${yy}" stroke="var(--line)" stroke-dasharray="3 5"/><text x="${left - 9}" y="${yy + 4}" text-anchor="end" fill="var(--muted)" font-size="10">${compact(amount)}</text>`; }
    const labelIndices = [0];
    for (let i = 1; i < days.length - 1; i++) if (x(days[i]) - x(days[labelIndices.at(-1)]) >= 85 && x(days.at(-1)) - x(days[i]) >= 65) labelIndices.push(i);
    if (days.length > 1) labelIndices.push(days.length - 1);
    const labels = labelIndices.map(index => `<text x="${x(days[index])}" y="232" text-anchor="middle" fill="var(--muted)" font-size="10">${dateLabel(days[index]).slice(0, 5)}</text>`).join('');
    const paths = series.map(({ name, values }) => {
      const colors = production ? collaboratorColors(name) : companyColorMap.get(name);
      return (production ? [['registros', colors.opening, 'Disparos']] : [['abertura', colors.opening, 'Aberturas'], ['cliques', colors.clicks, 'Cliques']]).map(([key, color, label]) => {
        const line = values.map((item, index) => `${index ? 'L' : 'M'}${x(item.date).toFixed(2)},${y(item[key]).toFixed(2)}`).join(' ');
        const points = values.map(item => `<circle cx="${x(item.date)}" cy="${y(item[key])}" r="4" fill="${color}" ${tooltipAttrs(`${name} · ${dateLabel(item.date)}`, [`Disparos: ${item.registros}`, `Empresas: ${[...item.empresas].join(', ')}`, `Responsáveis: ${[...item.colaboradores].join(', ')}`, `Aberturas: ${fmt(item.abertura)} (${pct(C.ratio(item.abertura, item.entregues))})`, `Cliques: ${fmt(item.cliques)} (CTR ${pct(C.ratio(item.cliques, item.entregues))})`, `Enviados: ${fmt(item.enviados)} · Entregues: ${fmt(item.entregues)}`, `Série: ${label}`])} aria-label="${escape(name)} · ${dateLabel(item.date)} · ${label}: ${fmt(item[key])}"></circle>`).join('');
        return `<g ${production ? 'data-collaborator' : 'data-company'}="${escape(name)}" data-metric="${key}"><path d="${line}" fill="none" stroke="${color}" stroke-width="2.5" ${key === 'cliques' ? 'stroke-dasharray="6 4"' : ''} ${tooltipAttrs(`${name} · ${label}`, [`Total no período: ${fmt(values.reduce((total, item) => total + item[key], 0))}`, `${dateLabel(values[0].date)} a ${dateLabel(values.at(-1).date)}`, `${values.length} datas de disparo`])} aria-label="${escape(name)} · ${label}"></path>${points}</g>`;
      }).join('');
    }).join('');
    $('#trend-chart').innerHTML = `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${production ? 'Disparos por colaborador' : 'Aberturas e cliques por empresa'} entre ${dateLabel(days[0])} e ${dateLabel(days.at(-1))}"><title>${production ? 'Produção por colaborador' : 'Aberturas e cliques por empresa'}</title><desc>${escape(names.join(', '))}. ${production ? 'Quantidade de disparos por responsável e dia.' : 'Aberturas em cor principal e linha contínua; cliques no tom claro e linha tracejada.'} Pontos apenas em datas com disparos.</desc>${grid}${paths}${labels}</svg>`;
  }
  function clearFilters() { ['campaign-search', 'start-date', 'end-date'].forEach(id => { $(`#${id}`).value = ''; }); selectedCompanies.clear(); selectedCollaborators.clear(); selectedCampaigns.clear(); channel = 'Todos'; updateOptions(); renderDispatch(); }
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
        if (!fileRows) throw new Error(`${file.name}: nenhum registro válido. Use o modelo com as colunas empresas, campanha e enviados.`);
      }
      const saved = replaceRows(imported, 'imported');
      if (warnings.length) toast(`Importados ${imported.length} registros.${saved ? '' : ' O navegador não conseguiu salvá-los; use Salvar backup antes de fechar.'}\n${warnings.slice(0, 5).join('\n')}`, true);
    } catch (error) { toast(`Importação cancelada. Seus dados anteriores foram preservados.\n${error.message}`, true); }
    finally { importing = false; $$('[data-action="import"]').forEach(button => { button.disabled = false; }); $('#file-input').value = ''; }
  }
  const HEADERS = ['empresas', 'colaboradores', 'campanha', 'data de envio', 'enviados', 'entregues', 'visualização', 'lidos', 'cliques', 'taxa de abertura', 'taxa de cliques', 'canal', 'opt-out'];
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
  function template() { writeExcel([{ name: 'Campanhas', data: [HEADERS, ['EmpA', 'Colab1', 'Boas-vindas setembro', '2026-09-24', 12000, 11720, 0, 4680, 1280, 0.4, 0.109, 'E-mail', 16], ['EmpB', 'Colab2', 'Oferta WhatsApp', '2026-09-25', 3200, 3100, 2650, 0, 570, 0.855, 0.184, 'WhatsApp', 7]] }], 'modelo-campanhas.xlsx'); }
  function dispatchExcel() {
    const rows = filteredRows(); if (!rows.length) return;
    const raw = rows.map(row => [row.empresa, row.colaborador, row.campanha, row.date, row.enviados, row.entregues, row.visualizacao, row.lidos, row.cliques, row.taxaAbertura, row.taxaCliques, row.canal, row.optOut]);
    const summary = C.summarize(rows, performanceMode).map(item => [item.empresa, item.colaborador, item.campanha, item.canal, item.empresasAtendidas, item.campanhasOperadas, item.registros, item.enviados, item.entregues, item.abertura, item.cliques, item.taxaAbertura, item.taxaCliques, item.hasOptOut ? item.optOut : '', item.hasOptOut && item.partialOptOut ? 'Parcial' : item.hasOptOut ? 'Completo' : 'Ausente', item.ultimaData]);
    writeExcel([{ name: 'Disparos', data: [HEADERS, ...raw] }, { name: 'Resumo', data: [['Empresa', 'Colaborador', 'Campanha', 'Canal', 'Empresas atendidas', 'Campanhas atendidas', 'Disparos', 'Enviados', 'Entregues', 'Aberturas efetivas', 'Cliques efetivos', 'Taxa de abertura', 'CTR', 'Opt-out', 'Cobertura opt-out', 'Último envio'], ...summary] }], 'campaign-pulse-disparos.xlsx');
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
    const sections = [{ title: 'Indicadores consolidados', lines: [`Envios: ${fmt(t.enviados)} | Entregues: ${fmt(t.entregues)} (${pct(t.taxaEntrega)})`, `Aberturas / visualizações: ${fmt(t.abertura)} (${pct(t.taxaAbertura)}) | Cliques: ${fmt(t.cliques)} (CTR ${pct(t.taxaCliques)})`, `Falhas: ${fmt(t.falhas)} | Opt-out: ${t.hasOptOut ? fmt(t.optOut) + (t.partialOptOut ? ' (dados parciais)' : '') : 'não informado'}`, 'Taxas calculadas sobre entregues. Falhas = enviados - entregues.'] }, ...C.summarize(rows, performanceMode).sort((a, b) => b.enviados - a.enviados).map(item => ({ title: performanceMode === 'colaboradores' ? item.colaborador : performanceMode === 'empresas' ? item.empresa : `${item.empresa} · ${item.campanha} · ${item.canal} · ${item.colaborador}`, lines: [`Responsáveis: ${item.colaborador} | Empresas: ${item.empresa}`, `${item.campanhasOperadas} campanhas atendidas | ${item.empresasAtendidas} empresas atendidas`, `${item.registros} disparos | ${dateLabel(item.primeiraData)} a ${dateLabel(item.ultimaData)}`, `Enviados: ${fmt(item.enviados)} | Entregues: ${fmt(item.entregues)} | Falhas: ${fmt(item.falhas)}`, `Aberturas: ${fmt(item.abertura)} (${pct(item.taxaAbertura)}) | Cliques: ${fmt(item.cliques)} (CTR ${pct(item.taxaCliques)})`, `Opt-out: ${item.hasOptOut ? fmt(item.optOut) + (item.partialOptOut ? ' (dados parciais)' : '') : 'não informado'}`] }))];
    report('Análise de disparos', `${state.source === 'demo' ? 'DADOS DE DEMONSTRAÇÃO | ' : ''}${period(rows)} | ${rows.length} registros | Canal: ${channel}\nBusca: ${f.query || 'todas'} | Empresas: ${f.companies.join(', ') || 'todas'} | Colaboradores: ${f.collaborators.join(', ') || 'todos'} | Modo: ${performanceMode}\nCampanhas: ${campaignOptions().filter(row => selectedCampaigns.has(C.campaignKey(row))).map(row => `${row.empresa} / ${row.campanha}`).join(', ') || 'todas'} | Período informado: ${f.from || 'sem início'} a ${f.to || 'sem fim'}`, sections, 'campaign-pulse-relatorio.pdf');
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
    hideTooltip();
    tooltipNeedsMovement = true;
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
    hideTooltip();
    tooltipNeedsMovement = true;
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
  $('#campaign-options').addEventListener('change', event => { const name = C.campaignKey(campaignOptions()[Number(event.target.value)]); if (event.target.checked) selectedCampaigns.add(name); else selectedCampaigns.delete(name); renderDispatch(); });
  $('#company-options').addEventListener('change', event => {
    const name = companyNames()[Number(event.target.value)];
    if (event.target.checked) selectedCompanies.add(name); else selectedCompanies.delete(name);
    const available = new Set(campaignOptions().map(C.campaignKey));
    selectedCampaigns = new Set([...selectedCampaigns].filter(key => available.has(key)));
    updateOptions(); renderDispatch();
  });
  $('#collaborator-options').addEventListener('change', event => {
    const name = collaboratorNames()[Number(event.target.value)];
    if (event.target.checked) selectedCollaborators.add(name); else selectedCollaborators.delete(name);
    const available = new Set(campaignOptions().map(C.campaignKey));
    selectedCampaigns = new Set([...selectedCampaigns].filter(key => available.has(key)));
    updateOptions(); renderDispatch();
  });
  $('#performance-mode').addEventListener('change', event => { performanceMode = event.target.value; renderDispatch(); });
  $('#listing-mode').addEventListener('change', event => { listingMode = event.target.value; renderDispatch(); });
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
      state = { version: 3, rows: restored.rows, events: restored.events, source: restored.source };
      selectedEvents.clear(); clearFilters(); resetForm(); renderEvents(); commit('Backup restaurado.');
    } catch (error) { toast(`Backup não restaurado: ${error.message}`, true); }
    finally { $('#restore-input').value = ''; }
  });
  window.addEventListener('hashchange', navigate);
  $('#main').addEventListener('pointerover', event => {
    if (event.pointerType === 'touch' || tooltipNeedsMovement) return;
    const target = event.target.closest('[data-tooltip-title]');
    if (target && tooltipTarget !== target) showTooltip(target, event.clientX, event.clientY);
  });
  $('#main').addEventListener('pointermove', event => {
    if (event.pointerType === 'touch') return;
    tooltipNeedsMovement = false;
    const target = event.target.closest('[data-tooltip-title]');
    if (target && tooltipTarget !== target) showTooltip(target, event.clientX, event.clientY);
    else if (tooltipTarget) positionTooltip(event.clientX, event.clientY);
  });
  $('#main').addEventListener('pointerout', event => { if (tooltipTarget && !tooltipTarget.contains(event.relatedTarget)) hideTooltip(); });
  $('#main').addEventListener('focusin', event => {
    const target = event.target.closest('[data-tooltip-title]');
    if (target) { tooltipNeedsMovement = false; const rect = target.getBoundingClientRect(); showTooltip(target, rect.left + rect.width / 2, rect.bottom); }
  });
  $('#main').addEventListener('focusout', hideTooltip);
  document.addEventListener('keydown', event => { if (event.key === 'Escape') hideTooltip(); });
  window.addEventListener('resize', hideTooltip);
  window.addEventListener('scroll', () => {
    if (!tooltipTarget) return;
    if (document.activeElement === tooltipTarget) {
      const rect = tooltipTarget.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > innerHeight) hideTooltip();
      else positionTooltip(rect.left + rect.width / 2, rect.bottom);
    } else if (document.elementFromPoint(tooltipPosition.x, tooltipPosition.y)?.closest('[data-tooltip-title]') !== tooltipTarget) hideTooltip();
  }, true);
  window.addEventListener('beforeunload', event => { if (dirty || sessionOnly) { event.preventDefault(); event.returnValue = ''; } });
  updateOptions(); resetForm(); renderDispatch(); renderEvents(); navigate(); updateThemeLabel();
  if (persistenceWarning) toast(persistenceWarning, true);
})();
