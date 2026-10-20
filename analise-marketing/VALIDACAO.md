# Validação — seletor de falhas/opt-out e departamento opcional

Atualização de 05/10/2026 (horário de São Paulo). **107 verificações aprovadas**: 25 testes de regras de negócio e 82 verificações de navegador. A aplicação continua em HTML/CSS/JavaScript, offline, aberta diretamente por `file://`, sem servidor ou instalação para uso.

## Comportamento validado

- Quarta opção **Falhas de entrega e opt-out por campanha** no seletor existente. O painel separado foi removido; permanecem os dois gráficos do dashboard.
- Tendência em linhas por empresa + campanha + dia: falhas contínuas, opt-out tracejado, eixo comum de quantidades, cores estáveis sob filtros e legenda rolável.
- Campanhas com uma data aparecem como pontos. Datas sem registros não recebem valores artificiais. Opt-out ausente interrompe a linha; zero explícito permanece zero. Registros sem data ficam fora da tendência, mas participam dos demais totais sem filtro de período.
- Comparativo por empresa + campanha com quantidades, taxas, cobertura parcial e denominadores explícitos. Falhas = enviados − entregues; taxa de falhas sobre enviados; opt-out sobre entregues. Falhas e opt-out não são somados.
- Departamento como coluna ordenável e filtro múltiplo, combinado com empresa, colaborador, campanha, busca, datas e canal. Nenhuma seleção significa todos. Mudanças removem campanhas específicas incompatíveis.
- Modelo Excel com coluna `departamento` opcional. Excel com células vazias, CSV sem coluna e backups versões 1/2/3 sem campo são aceitos como **Departamento não informado**.
- Excel/PDF incluem departamento e respeitam o filtro e agrupamento do dashboard. Backup e recarga preservam o campo; dados importados não recebem departamentos fictícios.
- Demonstração de 17 disparos, seis colaboradores e Marketing/Comercial/Relacionamento: 92.080 enviados, 89.728 entregues, 2.352 falhas e 330 opt-outs. Campanhas repetidas em outra data permitem testar linhas. Restaurar demonstração carrega os novos registros e mantém eventos.
- Card de produção **Mensagens entregues** preservado. Regressões cobrem os demais modos, listagens, eventos, importações, exportações e backups.
- Zero erros JavaScript/console e zero requisições HTTP/HTTPS na suíte específica. Revisão visual dos gráficos em desktop/celular e temas claro/escuro; ausência de transbordamento em 390, 768 e 1440 px.

## Execução

| Suíte | Verificações aprovadas |
| --- | ---: |
| core.test.cjs + collaborators-core.test.cjs | 18 |
| departments-core.test.cjs | 7 |
| browser.test.cjs | 16 |
| advanced.test.cjs | 11 |
| companies.test.cjs | 16 |
| company-charts.test.cjs | 9 |
| tooltips.test.cjs | 7 |
| collaborators.test.cjs | 10 |
| delivery-quality.test.cjs | 13 |
| **Total** | **107** |

Sintaxe de app.js, core.js e demo.js verificada com `node --check`. Os testes de navegador usam Microsoft Edge headless e abrem o HTML diretamente, sem servidor. Node/Playwright são apenas ferramentas de validação e não são necessários para usar a aplicação.

Evidências desta correção: `tests/results/validacao-select-departamentos/`, incluindo relatórios JSON, Excel/PDF de teste, backups e capturas `quality-select-390.png`, `quality-select-768.png`, `quality-select-1440.png` e `quality-select-dark.png`. Novas execuções geram resultados em `tests/results/`. Instruções para repetir constam no LEIA-ME.md.

Limites: navegador testado foi o Edge; larguras móveis foram simuladas. Não houve teste de carga com 100.000 linhas nem validação com dados reais da equipe. Armazenamento de arquivos locais depende das regras do navegador; mantenha backups. A demonstração não é acrescentada aos dados importados ou históricos: use Restaurar demonstração para trocar os disparos por exemplos.

Aplicação atual: `C:/Users/gabri/Desktop/Projetos/Utils/analise-marketing`. Alterações preparadas e verificadas em cópia local antes da atualização. Documentação de uso e técnica atualizada para o quarto modo e departamento opcional.

---

# Histórico — validação anterior ao ajuste do seletor

As seções abaixo registram versões anteriores. O comportamento e a validação atuais são os descritos acima.

# Validação — atualização de 05/10/2026

**98 verificações aprovadas**, incluindo regras de negócio e suítes em Microsoft Edge por `file://`. A aplicação continua offline, sem servidor ou instalação para uso.

## Alterações verificadas

- Novo comparativo de falhas de entrega e opt-out por empresa, campanha e colaborador, respeitando todos os filtros.
- Quantidades, taxas ponderadas, escala compartilhada, cobertura parcial, zero explícito e ausência de denominador/dados.
- Card Mensagens entregues na produção usando entregues, incluindo detalhes das barras e desempate por entregas.
- Demonstração com os seis colaboradores: 86.251 entregues, 2.229 falhas e 319 opt-outs. Preservação de importações e eventos ao complementar exemplos antigos.
- Gráficos revisados visualmente em 390 e 1440 px, temas claro e escuro; verificações de transbordamento em 390, 768 e 1440 px.
- Zero erros JavaScript/console e zero requisições HTTP/HTTPS na suíte do novo comparativo.

## Execução das suítes

| Suíte | Verificações aprovadas |
| --- | ---: |
| core.test.cjs + collaborators-core.test.cjs | 18 |
| browser.test.cjs | 16 |
| advanced.test.cjs | 11 |
| companies.test.cjs | 16 |
| company-charts.test.cjs | 9 |
| tooltips.test.cjs | 7 |
| collaborators.test.cjs | 10 |
| delivery-quality.test.cjs | 11 |
| **Total** | **98** |

Verificação de sintaxe em app.js e core.js aprovada. Regressões incluem importação, exportações, eventos, backups, filtros, listagens, gráficos anteriores e detalhes acessíveis por teclado. A mudança final de escala visual foi retestada com a suíte específica.

Evidências desta execução ficam em `tests/results/validacao-2026-10-05/`: relatórios JSON e capturas `quality-390.png`, `quality-768.png`, `quality-1440.png` e `quality-dark.png`. O teste específico pode ser repetido com `node tests/delivery-quality.test.cjs`; novas execuções gravam em `tests/results/`.

Limites: navegador real testado foi o Edge; tamanhos móveis foram simulados. Não houve teste de carga de 100.000 linhas nem validação com planilhas reais da equipe. Armazenamento continua sujeito às regras do navegador para arquivos locais; mantenha backups.

Aplicação atual: `C:/Users/gabri/Desktop/Projetos/Utils/analise-marketing`. Alterações preparadas e verificadas em cópia local antes de atualizar esse diretório.

---

## Histórico da validação inicial

Validação concluída em 27/09/2026 (horário de São Paulo).

## Resultado

**38 verificações automatizadas aprovadas:** 11 testes de regras de negócio, 16 verificações principais no navegador e 11 verificações adicionais. Os scripts JavaScript também passaram pela verificação de sintaxe do Node.js.

A aplicação foi aberta diretamente por **file:// no Microsoft Edge**, sem servidor. A suíte principal registrou **zero erros no console e zero requisições HTTP/HTTPS**.

## Cobertura

| Área | Verificações realizadas |
| --- | --- |
| Inicialização | Carregamento local, 14 registros de demonstração, 6 indicadores e navegação |
| Cálculos | Totais, contagens explícitas, taxas ponderadas, estimativas, zeros, dados ausentes, opt-out e agrupamento por campanha/canal |
| Filtros | Busca sem acentos, seleção de campanhas, canais, datas inclusivas, intervalos inválidos, limpeza e estados vazios |
| Importação | Modelo Excel, XLSX, XLS legado, CSV UTF-8 com aspas e ponto e vírgula, números brasileiros, datas seriais, múltiplos arquivos e abas, arrastar e soltar |
| Erros de importação | Números e datas inválidos, ausência de dados, abas incompatíveis, preservação dos registros anteriores e cancelamento da substituição |
| Exportação Excel | Leitura do arquivo exportado para conferir o recorte, custo por presente e a aba de investimentos |
| Exportação PDF | Arquivos válidos, relatório completo de disparos com 2 páginas, relatório individual de evento com 60 investimentos e 3 páginas |
| Pós-evento | Cadastro, edição, exclusão, cancelamento, múltiplos investimentos, campos incompletos, presença maior que inscrições, zero presentes, filtros e seleção fora do filtro |
| Armazenamento | Persistência após recarregar, tema salvo, backup completo, restauração, rejeição de backup inválido e falha simulada de armazenamento |
| Conteúdo importado | Texto com marcação HTML não é executado nem inserido como elemento |
| Interface | Temas claro/escuro, ajuda com Escape, ordenação, capturas de tela e ausência de transbordamento horizontal da página em 390, 768 e 1440 px |

## Revisão visual

Capturas das duas telas foram geradas e inspecionadas. As tabelas usam rolagem horizontal própria em telas pequenas. A revisão identificou sobreposição de datas no gráfico; o espaçamento dos rótulos foi corrigido.

Os PDFs foram renderizados com Poppler para conferir alinhamento, margens, cabeçalhos, rodapés, acentuação e quebra de páginas. Também foi conferido, por extração de texto, que o relatório longo preserva os 60 investimentos, o total de R$ 7.530,00 e o custo por presente de R$ 37,65. A paginação mantém cada parágrafo curto de investimento na mesma página.

## Evidências e reprodução

- `tests/core.test.cjs`: testes de domínio com o executor nativo do Node.js.
- `tests/browser.test.cjs`: fluxo principal em navegador real com Playwright.
- `tests/advanced.test.cjs`: formatos adicionais, validações, armazenamento e paginação.
- `tests/results/report.json` e `tests/results/advanced-report.json`: resultados das suítes de navegador.
- `tests/results/`: capturas, planilhas, backups e PDFs produzidos exclusivamente para teste.

As ferramentas de teste não são dependências da aplicação. Para o uso diário basta abrir `index.html`.

## Limites da validação

- Execução real verificada no Edge deste computador. Chrome, Firefox, Safari e dispositivos físicos não foram testados; as larguras móveis foram simuladas no navegador.
- Foram utilizadas planilhas de demonstração e arquivos de teste. Planilhas reais com cabeçalhos diferentes dos documentados precisam ser ajustadas ao modelo.
- Os limites máximos de volume são proteções de entrada; não foi realizado teste de carga com 100.000 registros.
- Armazenamento de páginas `file://` depende do navegador e do caminho da pasta. Backup continua necessário para portabilidade e recuperação.

O projeto original foi preservado. A nova implementação está integralmente na pasta `Campanha-Marketing`.
