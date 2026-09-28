# Validação da implementação

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
