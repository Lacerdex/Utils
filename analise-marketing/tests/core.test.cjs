const { test } = require('node:test');
const assert = require('node:assert/strict');
const C = require('../core.js');
const grid = (rows, extra = []) => [['campanha', 'data de envio', 'enviados', 'entregues', 'lidos', 'cliques', 'canal', ...extra], ...rows];
test('números brasileiros, zeros e ausência de dados', () => {
  assert.equal(C.number('1.234'), 1234); assert.equal(C.number('1.234,56'), 1234.56); assert.equal(C.number(1234.56), 1234.56);
  assert.equal(C.number('0'), 0); assert.equal(C.number(''), null); assert.ok(Number.isNaN(C.number('texto'))); assert.ok(Number.isNaN(C.number('12abc')));
  assert.equal(C.rate('40%'), .4); assert.equal(C.rate('0,4'), .4); assert.equal(C.rate(40), .4); assert.equal(C.rate(0.109), .109); assert.equal(C.rate('0.855'), .855); assert.ok(Number.isNaN(C.rate('101%')));
});
test('datas brasileiras, ISO e Excel, incluindo datas impossíveis', () => {
  assert.equal(C.date('24/09/2026'), '2026-09-24'); assert.equal(C.date('2026-09-24'), '2026-09-24'); assert.equal(C.date(46289), '2026-09-24');
  assert.equal(C.date('31/02/2026'), null); assert.equal(C.date('29/02/2024'), '2024-02-29'); assert.equal(C.date('29/02/2025'), null); assert.equal(C.date(60), null); assert.equal(C.date(''), '');
});
test('importação mapeia cabeçalhos e mantém zero distinto de vazio', () => {
  const result = C.parseGrid(grid([['Teste', '24/09/2026', '1.000', 900, 0, null, 'WhatsApp', '50%', '10%']], ['taxa de abertura', 'taxa de cliques']), 'teste.csv', 'Aba');
  const row = result.rows[0]; assert.equal(row.enviados, 1000); assert.equal(C.opens(row), 0); assert.equal(C.clicks(row), 90);
  assert.equal(row.optOut, null); assert.equal(row.canal, 'WhatsApp');
});
test('taxas agregadas são ponderadas e consistentes com contagens efetivas', () => {
  const rows = C.parseGrid(grid([['Teste', '2026-09-01', 100, 100, 50, 10, 'E-mail'], ['Teste', '2026-09-02', 900, 900, 90, 9, 'E-mail']]), 'x', 'y').rows;
  assert.equal(C.totals(rows).taxaAbertura, .14); assert.equal(C.totals(rows).taxaCliques, .019);
  assert.deepEqual(C.summarize(rows)[0].taxaAbertura, C.totals(rows).taxaAbertura);
});
test('contagens ausentes usam taxas; lidos e visualizações não são somados', () => {
  assert.equal(C.opens({ entregues: 100, lidos: null, visualizacao: null, taxaAbertura: .4 }), 40);
  assert.equal(C.opens({ entregues: 100, lidos: 30, visualizacao: 40 }), 30);
  assert.equal(C.opens({ entregues: 100, lidos: 0, visualizacao: 40 }), 40);
  assert.equal(C.clicks({ entregues: 100, cliques: 0, taxaCliques: .5 }), 0);
});
test('mesmo nome em canais distintos permanece separado', () => {
  const rows = C.parseGrid(grid([['Campanha', '', 10, 10, 5, 2, 'E-mail'], ['Campanha', '', 10, 10, 5, 2, 'SMS']]), 'x', 'y').rows;
  assert.equal(C.summarize(rows).length, 2); assert.equal(C.filter(rows, { to: '2026-09-24' }).length, 0);
});
test('filtros combinam busca sem acentos, seleção, datas inclusivas e canal', () => {
  const rows = C.parseGrid(grid([['Reativação', '2026-09-01', 10, 9, 4, 1, 'E-mail'], ['Campanha', '2026-09-02', 10, 9, 4, 1, 'SMS']]), 'x', 'y').rows;
  assert.equal(C.filter(rows, { query: 'reativacao', selected: ['Reativação'], from: '2026-09-01', to: '2026-09-01', channel: 'E-mail' }).length, 1);
  assert.equal(C.filter(rows, { from: '2026-10-01', to: '2026-09-01' }).length, 0);
});
test('importação rejeita linhas inválidas sem aceitar dados parcialmente', () => {
  for (const row of [['Teste', '2026-09-01', -1, 0], ['Teste', '31/02/2026', 10, 10], ['Teste', '', 1, 2], ['Teste', '', 1.5, 1], ['', '', 10, 9]]) assert.throws(() => C.parseGrid(grid([row]), 'x', 'y'), /inválida/);
  assert.equal(C.parseGrid([['aleatório'], [1]], 'x', 'y').skipped, true);
});
test('opt-out percentual nunca é confundido com contagem', () => {
  const result = C.parseGrid([['campanha', 'enviados', 'taxa de opt-out'], ['A', 100, '10%']], 'x', 'y');
  assert.equal(result.rows[0].optOut, null); assert.equal(C.totals(result.rows).hasOptOut, false);
  assert.equal(C.parseGrid([['campanha', 'enviados', 'opt-out (%)'], ['A', 100, .1]], 'x', 'y').rows[0].optOut, null);
});
test('eventos validam presença e consolidam investimentos com precisão monetária', () => {
  const event = { id: '1', nome: 'Evento', data: '2026-09-27', inscritos: 100, presentes: 50, campanhas: [{ campanha: 'A', investimento: 100 }, { campanha: 'B', investimento: 200 }] };
  C.validateEvent(event); assert.equal(C.eventTotals([event]).custo, 6); assert.equal(C.eventTotals([event]).comparecimento, .5);
  assert.throws(() => C.validateEvent({ ...event, presentes: 101 })); assert.throws(() => C.validateEvent({ ...event, inscritos: -1 }));
  assert.equal(C.eventTotals([{ ...event, presentes: 0 }]).custo, null);
  assert.equal(C.spend({ campanhas: [{ investimento: .1 }, { investimento: .2 }] }), .3);
});
test('backup valida estrutura, campos numéricos e IDs duplicados', () => {
  const data = { version: 1, rows: [], events: [], source: 'empty' }; assert.equal(C.validateBackup(data), data);
  assert.throws(() => C.validateBackup({ version: 2 }));
  assert.throws(() => C.validateBackup({ ...data, rows: [{ campanha: 'A' }] }));
  const event = { id: '1', nome: 'A', data: '2026-09-27', inscritos: 0, presentes: 0, campanhas: [] };
  assert.throws(() => C.validateBackup({ ...data, events: [event, event] }));
});
