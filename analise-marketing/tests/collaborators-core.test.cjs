const { test } = require('node:test');
const assert = require('node:assert/strict');
const C = require('../core.js');
const headers = ['empresas', 'colaboradores', 'campanha', 'data de envio', 'enviados', 'entregues', 'lidos', 'cliques', 'canal'];
const rows = () => C.parseGrid([headers, ['EmpA', 'Colab1', 'Igual', '2026-09-01', 100, 100, 50, 10, 'E-mail'], ['EmpA', 'Colab2', 'Igual', '2026-09-01', 900, 900, 90, 9, 'E-mail'], ['EmpB', 'Colab1', 'Igual', '2026-09-02', 100, 100, 20, 2, 'SMS']], 'teste', 'Disparos').rows;
test('colaboradores: aliases, validação e compatibilidade com planilhas antigas', () => {
  for (const header of ['colaboradores', 'colaborador', 'responsável', 'responsável pelo disparo', 'employee', 'owner']) assert.equal(C.parseGrid([['empresas', header, 'campanha', 'enviados'], ['EmpA', ' Colab1 ', 'C', 1]], 'x', 'y').rows[0].colaborador, 'Colab1');
  for (const value of ['', ' ', '-', 'x'.repeat(201)]) assert.throws(() => C.parseGrid([['empresas', 'colaboradores', 'campanha', 'enviados'], ['EmpA', 'Colab1', 'A', 1], ['EmpA', value, 'B', 2]], 'x', 'y'), /colaborador/);
  const old = C.parseGrid([['empresas', 'campanha', 'enviados'], ['EmpA', 'C', 1]], 'x', 'y');
  assert.equal(old.rows[0].colaborador, 'Colaborador não informado'); assert.match(old.warnings.join(' '), /sem a coluna colaboradores/);
});
test('produção conta registros, campanhas por empresa e empresas atendidas sem dupla atribuição', () => {
  const data = rows(); assert.equal(C.summarize(data).length, 3);
  const grouped = C.summarize(data, 'colaboradores'); assert.equal(grouped.length, 2);
  const c1 = grouped.find(item => item.colaborador === 'Colab1');
  assert.equal(c1.registros, 2); assert.equal(c1.empresasAtendidas, 2); assert.equal(c1.campanhasOperadas, 2); assert.equal(c1.enviados, 200); assert.equal(c1.taxaAbertura, .35);
  assert.equal(grouped.reduce((total, item) => total + item.registros, 0), data.length);
  assert.equal(C.summarize(data, 'empresas')[0].enviados, 1000);
});
test('filtros de colaborador combinam empresas, campanhas, canal e datas', () => {
  const data = rows(); assert.equal(C.filter(data, { collaborators: [] }).length, 3);
  assert.equal(C.filter(data, { collaborators: ['Colab1'] }).length, 2);
  assert.equal(C.filter(data, { collaborators: ['Colab1', 'Colab2'] }).length, 3);
  assert.equal(C.filter(data, { collaborators: ['Colab1'], companies: ['EmpA'], campaignKeys: [C.campaignKey(data[0])], channel: 'E-mail', from: '2026-09-01', to: '2026-09-01' }).length, 1);
  assert.equal(C.filter(data, { collaborators: ['Colab2'], companies: ['EmpB'] }).length, 0);
});
test('backups v1/v2 migram colaboradores; v3 valida o responsável', () => {
  for (const version of [1, 2]) {
    const row = rows()[0]; delete row.colaborador;
    const backup = C.validateBackup({ version, rows: [row], events: [], source: 'imported' });
    assert.equal(backup.version, 3); assert.equal(backup.rows[0].colaborador, 'Colaborador não informado'); assert.equal(backup.rows[0].enviados, 100);
  }
  const row = rows()[0]; C.validateBackup({ version: 3, rows: [row], events: [] });
  for (const colaborador of [undefined, '', '-', 1, 'x'.repeat(201)]) assert.throws(() => C.validateBackup({ version: 3, rows: [{ ...row, colaborador }], events: [] }), /colaborador/);
});
