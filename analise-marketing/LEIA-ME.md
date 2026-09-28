# Campaign Pulse — aplicação local

## Abrir

Abra **index.html** com dois cliques no Microsoft Edge, Chrome ou Firefox atualizado. O funcionamento foi validado no Edge instalado neste computador.

Não precisa instalar Node.js, Python, pacotes, iniciar servidor ou ter conexão com a internet. Mantenha os arquivos desta pasta juntos, incluindo `vendor`. Para transportar a aplicação, copie a pasta inteira.

## O que está disponível

- Análise de disparos: indicadores, gráficos, busca sem distinção de acentos, seleção de várias campanhas, período, canais e tabela ordenável.
- Importação de um ou vários arquivos `.xlsx`, `.xls` ou `.csv`, por seleção ou arrastar e soltar. Todas as abas compatíveis são lidas. A nova importação substitui os disparos atuais; não altera os eventos.
- Modelo Excel, exportação dos disparos filtrados e do resumo em Excel, relatório PDF offline.
- Pós-evento: cadastro, edição, exclusão, múltiplos investimentos, custo por presente, busca, período e seleção de eventos. Exportações do filtro ou da seleção, inclusive quando parte da seleção estiver fora do filtro.
- Tema claro e escuro, layout adaptável e navegação por teclado.
- Gravação automática no navegador e backup/restauração em JSON.

O projeto `marketing-campaign-dashboard` foi usado como referência e não foi modificado. Esta versão usa HTML, CSS e JavaScript convencional, sem React, TypeScript, Vite, servidor ou compilação.

## Preparar as planilhas

Use **Modelo Excel** na interface. As colunas `campanha` e `enviados` são obrigatórias. As demais são opcionais:

| Coluna | Conteúdo |
| --- | --- |
| data de envio | Data do Excel, `dd/mm/aaaa` ou `aaaa-mm-dd` |
| entregues | Quantidade inteira não negativa; ausente = 0 |
| visualização | Quantidade inteira; usada quando lidos não é maior que zero |
| lidos | Quantidade inteira de aberturas/leitura |
| cliques | Quantidade inteira; zero explícito é preservado |
| taxa de abertura | Por exemplo, `40%`, `40` ou `0,4` |
| taxa de cliques | Por exemplo, `10%`, `10` ou `0,1` |
| canal | E-mail, WhatsApp, SMS ou Outros |
| opt-out | Quantidade inteira; não informe uma taxa nesta coluna |

CSV deve estar em UTF-8. O leitor reconhece separadores usuais, inclusive ponto e vírgula. Números brasileiros como `1.234` e `1.234,56` são aceitos, respeitando o tipo de cada coluna. Contagens precisam ser inteiras. Cabeçalhos em inglês comuns também são aceitos.

Linhas em branco são ignoradas. Datas impossíveis, números inválidos ou entregues maiores que enviados cancelam a importação inteira e preservam os dados anteriores. Abas sem os cabeçalhos necessários são ignoradas com aviso. Um arquivo sem registros compatíveis cancela a operação.

Limites: 30 arquivos por vez, 20 MB por arquivo, 50 MB no total e 100.000 registros. Arquivos muito grandes podem demorar, pois o processamento ocorre no próprio navegador. Remova linhas de totais e subtotais antes de importar. Os registros não são deduplicados: selecione cada arquivo apenas uma vez.

## Critérios dos cálculos

- Falhas de entrega = enviados − entregues. Isso não indica a causa da falha.
- Aberturas efetivas: lidos quando maior que zero; caso contrário, visualizações quando maior que zero. As duas contagens não são somadas.
- Taxas importadas só estimam contagens quando as respectivas contagens estiverem ausentes. Um zero informado prevalece sobre uma taxa. A estimativa é arredondada por disparo.
- Abertura e CTR agregados = contagem efetiva total ÷ entregues totais. Não é feita média simples das porcentagens.
- Percentuais são exibidos com duas casas decimais na interface e nos PDFs. No Excel, as células percentuais usam o formato `0.00%`, preservando a precisão dos valores numéricos para cálculos.
- Campanhas com o mesmo nome, mas canais diferentes, aparecem em linhas separadas.
- Opt-out ausente aparece como “—”. Quando apenas parte do recorte tem opt-out, o total disponível é indicado como parcial e a taxa usa todas as entregas do recorte.
- Disparos sem data participam do total sem filtros de período, mas não entram no gráfico temporal nem em filtros por datas.
- Custo por presente = soma dos investimentos ÷ pessoas presentes. Sem presentes, o custo é “—”. Presentes não pode ser maior que inscritos.
- Exportações de disparos respeitam todos os filtros. O Excel inclui os dados originais e uma aba de resumo com valores efetivos. Os relatórios PDF apresentam os indicadores e os registros em texto, com paginação automática.

## Onde os dados ficam

A aplicação grava os dados no armazenamento local do navegador, quando permitido. Nenhum arquivo original de planilha é alterado. O navegador não permite que uma página aberta por arquivo grave silenciosamente de volta em uma pasta: **Salvar backup** baixa um arquivo JSON, e as exportações baixam novos arquivos Excel/PDF.

Faça backups regularmente. Trocar de navegador, mudar o caminho da pasta, limpar dados de navegação ou usar uma janela privada pode impedir a recuperação automática. Em caso de falta de espaço ou bloqueio de armazenamento, a aplicação avisa para salvar um backup da sessão.

**Restaurar backup** valida o arquivo e solicita confirmação antes de substituir disparos e eventos. O backup contém todos os registros salvos, independentemente dos filtros. Alterações ainda não salvas no formulário não entram no backup.

## Arquivos

| Arquivo | Responsabilidade |
| --- | --- |
| index.html | Estrutura e navegação |
| styles.css | Layout, temas e responsividade |
| core.js | Leitura de dados tabulares, validação e cálculos |
| app.js | Interface, armazenamento, importação e exportação |
| demo.js | Dados de demonstração do projeto original |
| vendor/ | Bibliotecas JavaScript locais de Excel e PDF e licenças |
| tests/ | Testes e evidências de validação; desnecessários para uso diário |

Os scripts são carregados diretamente, sem módulos ES e sem `fetch`, para permitir abertura por `file://`. Fontes do sistema e gráficos SVG gerados pela aplicação evitam dependências externas. A política de conteúdo bloqueia conexões de rede.

## Desenvolvimento e testes (opcional)

Somente para repetir a validação de desenvolvimento, use Node.js e Playwright com Microsoft Edge. Eles **não são necessários para usar a aplicação**.

```text
node --test tests/core.test.cjs
node tests/browser.test.cjs
node tests/advanced.test.cjs
```

Os testes de navegador usam o Playwright disponível no ambiente de desenvolvimento deste computador. Em outro computador, defina `PLAYWRIGHT_PATH` com o caminho para o pacote instalado. As verificações abrem diretamente o arquivo HTML; não iniciam servidor.

As evidências em `tests/results/` são geradas pelos testes e ignoradas pelo Git. Os scripts de teste, as bibliotecas em `vendor/` e suas licenças devem permanecer no repositório.

Consulte **VALIDACAO.md** para os resultados e limitações da verificação.
