/* Regras de negócio independentes da interface e de bibliotecas. */
(function (root) {
  'use strict';
  const CHANNELS = ['E-mail', 'WhatsApp', 'SMS', 'Outros'];
  const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const sum = (rows, key) => rows.reduce((total, row) => total + (row[key] ?? 0), 0);
  const ratio = (a, b) => b > 0 ? a / b : 0;
  const blank = value => value === undefined || value === null || String(value).trim() === '' || value === '-';
  function number(value) {
    if (blank(value)) return null;
    if (typeof value === 'number') return Number.isFinite(value) ? value : NaN;
    let text = String(value).trim().replace(/^R\$\s*/, '').replace(/\s/g, '');
    if (/^[1-9]\d{0,2}(\.\d{3})+(,\d+)?$/.test(text)) text = text.replace(/\./g, '');
    text = text.replace(',', '.');
    return /^\d+(\.\d+)?$/.test(text) ? Number(text) : NaN;
  }
  function rate(value) {
    if (blank(value)) return null;
    const text = String(value).trim().replace(/%$/, '').trim().replace(',', '.');
    const raw = /^\d+(\.\d+)?$/.test(text) ? Number(text) : NaN;
    const result = String(value).includes('%') || raw > 1 ? raw / 100 : raw;
    return Number.isFinite(result) && result >= 0 && result <= 1 ? result : NaN;
  }
  function date(value) {
    if (blank(value)) return '';
    if (value instanceof Date) {
      if (Number.isNaN(value.getTime())) return null;
      return date(`${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`);
    }
    if (typeof value === 'number') {
      if (!Number.isFinite(value) || value < 1 || value > 2958465 || Math.floor(value) === 60) return null;
      const serial = Math.floor(value);
      return new Date(Date.UTC(1899, 11, 31) + (serial > 60 ? serial - 1 : serial) * 86400000).toISOString().slice(0, 10);
    }
    const text = String(value).trim();
    const iso = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T]\d{2}:\d{2}(?::\d{2})?(?:\.\d+)?Z?)?$/);
    const br = text.match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})(?: \d{2}:\d{2}(?::\d{2})?)?$/);
    if (!iso && !br) return null;
    const [y, m, d] = iso ? iso.slice(1, 4).map(Number) : [Number(br[3]), Number(br[2]), Number(br[1])];
    const check = new Date(Date.UTC(y, m - 1, d));
    if (y < 1900 || y > 9999 || check.getUTCFullYear() !== y || check.getUTCMonth() !== m - 1 || check.getUTCDate() !== d) return null;
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }
  function inferChannel(value, campaign) {
    const text = normalize(value || campaign);
    if (/whatsapp|whats app|wpp/.test(text)) return 'WhatsApp';
    if (/\bsms\b/.test(text)) return 'SMS';
    if (/email|e mail|newsletter/.test(text)) return 'E-mail';
    return value ? 'Outros' : 'E-mail';
  }
  const aliases = {
    campanha: ['campanha', 'nome da campanha', 'campaign', 'campaign name'],
    date: ['data de envio', 'data envio', 'sent date', 'send date', 'data', 'date'],
    enviados: ['enviados', 'total enviados', 'sent', 'sends'],
    entregues: ['entregues', 'delivered', 'delivered messages'],
    visualizacao: ['visualizacao', 'visualizacoes', 'views'],
    lidos: ['lidos', 'aberturas', 'opened', 'reads', 'read'],
    cliques: ['cliques', 'clicks', 'click'],
    optOut: ['opt out', 'optouts', 'opt out count', 'descadastros', 'descadastrados', 'descadastro', 'unsubscribe', 'unsubscribes', 'unsubscribe count', 'cancelamentos', 'saidas da lista'],
    taxaAbertura: ['taxa de abertura', 'taxa abertura', 'open rate', 'taxa de visualizacao'],
    taxaCliques: ['taxa de cliques', 'taxa cliques', 'click rate', 'ctr'],
    canal: ['canal', 'channel', 'plataforma', 'tipo de canal']
  };
  function parseGrid(grid, filename, sheetname) {
    const headerRow = grid.findIndex(cells => cells.some(cell => !blank(cell)));
    if (headerRow < 0) return { rows: [], warnings: [], skipped: true };
    const headers = grid[headerRow].map(normalize);
    const countKeys = new Set(['enviados', 'entregues', 'visualizacao', 'lidos', 'cliques', 'optOut']);
    const columns = Object.fromEntries(Object.entries(aliases).map(([key, names]) => [key, headers.findIndex((header, index) => names.includes(header) && !(countKeys.has(key) && String(grid[headerRow][index]).includes('%')))]));
    if (columns.campanha < 0 || columns.enviados < 0) return { rows: [], warnings: [`${sheetname}: aba ignorada, faltam as colunas campanha e/ou enviados.`], skipped: true };
    const rows = [], errors = [], warnings = [];
    grid.slice(headerRow + 1).forEach((cells, index) => {
      if (!cells.some(cell => !blank(cell))) return;
      const row = {}, line = `${filename} / ${sheetname}, linha ${headerRow + index + 2}`;
      const get = key => columns[key] < 0 ? null : cells[columns[key]];
      row.campanha = String(get('campanha') ?? '').trim();
      if (!row.campanha || row.campanha.length > 500) { errors.push(`${line}: campanha vazia ou com mais de 500 caracteres.`); return; }
      row.date = date(get('date'));
      if (row.date === null) { errors.push(`${line}: data inválida.`); return; }
      for (const key of ['enviados', 'entregues', 'visualizacao', 'lidos', 'cliques', 'optOut']) {
        row[key] = number(get(key));
        if (key === 'enviados' && row[key] === null) { errors.push(`${line}: informe enviados.`); return; }
        if (row[key] !== null && (!Number.isSafeInteger(row[key]) || row[key] < 0 || row[key] > 1e12)) { errors.push(`${line}: ${key} deve ser um inteiro entre 0 e 1 trilhão.`); return; }
      }
      row.entregues ??= 0;
      for (const key of ['taxaAbertura', 'taxaCliques']) {
        row[key] = rate(get(key));
        if (Number.isNaN(row[key])) { errors.push(`${line}: ${key} deve estar entre 0 e 100%.`); return; }
      }
      if (row.entregues > row.enviados) { errors.push(`${line}: entregues não pode superar enviados.`); return; }
      row.canal = inferChannel(get('canal'), row.campanha);
      row.arquivo = filename;
      row.id = `${filename}-${sheetname}-${index}`;
      rows.push(row);
    });
    if (errors.length) throw new Error(`${errors.length} linha(s) inválida(s). Nada foi importado.\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? '\nCorrija também as demais linhas inválidas.' : ''}`);
    const undated = rows.filter(row => !row.date).length;
    if (undated) warnings.push(`${undated} registro(s) sem data: excluídos de filtros por período e do gráfico temporal.`);
    return { rows, warnings, skipped: false };
  }
  // Contagens explícitas (inclusive zero) prevalecem sobre as taxas importadas.
  function opens(row) {
    if (row.lidos > 0) return row.lidos;
    if (row.visualizacao > 0) return row.visualizacao;
    if (row.lidos !== null && row.lidos !== undefined || row.visualizacao !== null && row.visualizacao !== undefined) return 0;
    return Math.round(row.entregues * (row.taxaAbertura ?? 0));
  }
  const clicks = row => row.cliques ?? Math.round(row.entregues * (row.taxaCliques ?? 0));
  function totals(rows) {
    const enviados = sum(rows, 'enviados'), entregues = sum(rows, 'entregues');
    const abertura = rows.reduce((total, row) => total + opens(row), 0), cliques = rows.reduce((total, row) => total + clicks(row), 0);
    return { enviados, entregues, abertura, cliques, falhas: Math.max(0, enviados - entregues), optOut: sum(rows, 'optOut'), hasOptOut: rows.some(row => row.optOut != null), partialOptOut: rows.some(row => row.optOut == null), taxaAbertura: ratio(abertura, entregues), taxaCliques: ratio(cliques, entregues), taxaEntrega: ratio(entregues, enviados) };
  }
  function summarize(rows) {
    const groups = new Map();
    for (const row of rows) {
      const key = JSON.stringify([row.campanha, row.canal]);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(row);
    }
    return Array.from(groups.values(), items => {
      const dates = items.map(row => row.date).filter(Boolean).sort();
      return { ...totals(items), campanha: items[0].campanha, canal: items[0].canal, registros: items.length, primeiraData: dates[0] || '', ultimaData: dates.at(-1) || '' };
    });
  }
  function filter(rows, criteria = {}) {
    const { query = '', selected = [], from = '', to = '', channel = 'Todos', event = false } = criteria;
    if (from && to && from > to) return [];
    return rows.filter(row => {
      const name = event ? row.nome : row.campanha, day = event ? row.data : row.date;
      return normalize(name).includes(normalize(query)) && (!selected.length || selected.includes(name)) && (!from || day && day >= from) && (!to || day && day <= to) && (event || channel === 'Todos' || row.canal === channel);
    });
  }
  function validateEvent(event) {
    if (!event || typeof event.nome !== 'string' || !event.nome.trim() || event.nome.trim().length > 100) throw new Error('Informe um nome de evento com até 100 caracteres.');
    if (!event.data || date(event.data) !== event.data) throw new Error('Informe uma data válida para o evento.');
    if (![event.inscritos, event.presentes].every(value => Number.isSafeInteger(value) && value >= 0 && value <= 1e12)) throw new Error('Inscritos e presentes devem ser inteiros não negativos.');
    if (event.presentes > event.inscritos) throw new Error('Presentes não pode superar o total de inscritos.');
    if (!Array.isArray(event.campanhas) || event.campanhas.length > 500 || !event.campanhas.every(item => item && typeof item.campanha === 'string' && item.campanha.trim() && item.campanha.length <= 500 && Number.isFinite(item.investimento) && item.investimento >= 0 && item.investimento <= 1e12)) throw new Error('Informe nome e investimento válido para cada campanha vinculada.');
    return event;
  }
  const spend = event => Math.round(event.campanhas.reduce((total, item) => total + Math.round(item.investimento * 100), 0)) / 100;
  function eventTotals(events) {
    const investimento = events.reduce((total, event) => total + spend(event), 0), presentes = sum(events, 'presentes'), inscritos = sum(events, 'inscritos');
    return { investimento, presentes, inscritos, custo: presentes ? investimento / presentes : null, comparecimento: ratio(presentes, inscritos) };
  }
  function validateBackup(data) {
    if (!data || data.version !== 1 || !Array.isArray(data.rows) || !Array.isArray(data.events) || data.rows.length > 100000 || data.events.length > 10000) throw new Error('Backup incompatível ou acima do limite de registros.');
    data.rows.forEach(row => {
      if (!row || typeof row.campanha !== 'string' || !row.campanha.trim() || row.campanha.length > 500 || typeof row.date !== 'string' || date(row.date) !== row.date || !CHANNELS.includes(row.canal) || !['enviados', 'entregues'].every(key => Number.isSafeInteger(row[key]) && row[key] >= 0 && row[key] <= 1e12) || row.entregues > row.enviados || !['lidos', 'visualizacao', 'cliques', 'optOut'].every(key => row[key] == null || Number.isSafeInteger(row[key]) && row[key] >= 0 && row[key] <= 1e12) || !['taxaAbertura', 'taxaCliques'].every(key => row[key] == null || Number.isFinite(row[key]) && row[key] >= 0 && row[key] <= 1)) throw new Error('O backup contém dados de campanha inválidos.');
    });
    const ids = new Set();
    data.events.forEach(event => {
      validateEvent(event);
      if (typeof event.id !== 'string' || !event.id || event.id.length > 150 || ids.has(event.id)) throw new Error('Identificadores de evento inválidos ou duplicados no backup.');
      ids.add(event.id);
    });
    if (!['demo', 'imported', 'empty'].includes(data.source)) data.source = 'imported';
    return data;
  }
  const api = { CHANNELS, normalize, number, rate, date, parseGrid, opens, clicks, ratio, totals, summarize, filter, validateEvent, spend, eventTotals, validateBackup };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.CampaignCore = api;
})(globalThis);
