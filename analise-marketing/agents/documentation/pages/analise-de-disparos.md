# Análise de disparos

## Objetivo e acesso

A página consolida o desempenho dos envios de campanhas por período e canal. Abra `Campanha-Marketing/index.html` e selecione **Análise de disparos**. A rota é `#disparos`, vinculada à seção `#dispatch-page`; não existe um HTML separado para esta tela.

## Fluxo de uso

1. Baixe **Modelo Excel** e preencha os dados ou prepare um arquivo `.xlsx`, `.xls` ou `.csv` compatível.
2. Use **Importar planilha**, **Escolher arquivo** ou arraste os arquivos para a área de importação.
3. Refine o painel por nome, campanhas selecionadas, datas e canal.
4. Consulte indicadores, gráficos e a tabela ordenável.
5. Exporte o recorte atual em Excel ou PDF.

Uma nova importação substitui os disparos existentes e preserva os eventos. Quando já existem dados importados, a substituição pede confirmação. Limpar dados ou restaurar a demonstração também preserva os eventos e solicita confirmação.

## Entrada e validação

As colunas `campanha` e `enviados` são obrigatórias. São opcionais: `data de envio`, `entregues`, `visualização`, `lidos`, `cliques`, `taxa de abertura`, `taxa de cliques`, `canal` e `opt-out`. O modelo fornece os cabeçalhos esperados; os aliases aceitos estão em `core.js`.

- CSV deve estar em UTF-8; números brasileiros são aceitos.
- Contagens devem ser inteiras e não negativas. Entregues não pode superar enviados.
- Datas inválidas ou valores incompatíveis cancelam toda a importação e preservam os dados anteriores.
- Linhas vazias são ignoradas. Abas incompatíveis são ignoradas com aviso; arquivos sem registros compatíveis cancelam a operação.
- Limites: 30 arquivos, 20 MB por arquivo, 50 MB no total e 100.000 registros.
- Não há deduplicação automática de registros.

## Indicadores e regras

| Indicador | Cálculo |
| --- | --- |
| Total de envios | Soma de enviados |
| Mensagens entregues | Soma de entregues; taxa = entregues ÷ enviados |
| Abertura / visualização | Lidos positivos; caso contrário, visualizações positivas |
| Cliques registrados | Cliques explícitos ou estimados pela taxa quando a contagem está ausente |
| Falhas de entrega | Enviados − entregues |
| Opt-out | Soma das contagens informadas; taxa = opt-out ÷ entregues |

Taxas de abertura e CTR consolidadas dividem as contagens efetivas pelo total de entregues, sem média simples das taxas. Taxas importadas estimam contagens apenas quando as respectivas contagens estão ausentes; zero explícito prevalece. Aberturas e visualizações não são somadas. Sem denominador positivo, a taxa é zero.

Opt-out ausente aparece como “—”; cobertura incompleta é marcada como parcial. Percentuais na interface e nos PDFs têm duas casas decimais, por exemplo `40,00%`. No Excel, o formato `0.00%` mantém o valor numérico original para cálculos.

## Filtros e visualizações

A busca ignora acentos. Os filtros de data são inclusivos; intervalos invertidos exibem aviso e nenhum resultado. Registros sem data participam do total sem filtro de período, mas não entram no gráfico temporal nem em recortes por datas.

Os canais são Todos, E-mail, WhatsApp, SMS e Outros. A tabela agrupa por campanha e canal e permite ordenar pelos cabeçalhos. O gráfico temporal soma envios e cliques por dia; o comparativo apresenta abertura e CTR das cinco combinações de campanha/canal com mais envios. Estados vazios são exibidos quando não há resultados, e as exportações ficam desabilitadas.

## Exportação e persistência

O Excel contém as abas **Disparos** (dados originais do recorte) e **Resumo** (agregações). O PDF inclui indicadores e resumos por campanha/canal, com paginação automática. Ambos respeitam os filtros ativos.

Os dados são salvos no `localStorage`, na chave `campaign-pulse-local-v1`. **Salvar backup** inclui todos os disparos e eventos, independentemente do filtro. **Restaurar backup** valida o JSON e pede confirmação antes de substituir os dados. Em falhas de armazenamento, a interface orienta salvar um backup da sessão.

## Referências para manutenção

- `Campanha-Marketing/index.html`: estrutura da seção `dispatch-page`.
- `Campanha-Marketing/app.js`: `renderDispatch`, `renderTrend`, `importFiles`, `dispatchExcel`, `dispatchPdf` e `writeExcel`.
- `Campanha-Marketing/core.js`: parsing, validação, filtros, contagens efetivas, totais e agrupamento.
- `Campanha-Marketing/styles.css`: apresentação e responsividade.
- `Campanha-Marketing/tests/core.test.cjs`, `browser.test.cjs` e `advanced.test.cjs`: regras e fluxos automatizados (os dois últimos também ficam em `tests/`).

A aplicação abre por `file://`, sem servidor ou conexão de rede. As bibliotecas de `vendor/` e suas licenças fazem parte da distribuição. Resultados gerados em `Campanha-Marketing/tests/results/` são locais e ignorados pelo Git.
