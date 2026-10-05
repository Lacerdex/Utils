# Campaign Pulse — aplicação local

## Abrir

Abra **index.html** com dois cliques no Microsoft Edge, Chrome ou Firefox atualizado. O funcionamento foi validado no Edge instalado neste computador.

Não precisa instalar Node.js, Python, pacotes, iniciar servidor ou ter conexão com a internet. Mantenha os arquivos desta pasta juntos, incluindo `vendor`. Para transportar a aplicação, copie a pasta inteira.

## O que está disponível

- Análise de disparos: filtros de empresas e colaboradores, indicadores, gráficos, busca, campanhas, período, canais e tabela ordenável. Três modos de dashboard e três tipos de listagem independentes.
- Importação de um ou vários arquivos `.xlsx`, `.xls` ou `.csv`, por seleção ou arrastar e soltar. Todas as abas compatíveis são lidas. A nova importação substitui os disparos atuais; não altera os eventos.
- Modelo Excel, exportação dos disparos filtrados e do resumo em Excel, relatório PDF offline.
- Pós-evento: cadastro, edição, exclusão, múltiplos investimentos, custo por presente, busca, período e seleção de eventos. Exportações do filtro ou da seleção, inclusive quando parte da seleção estiver fora do filtro.
- Tema claro e escuro, layout adaptável e navegação por teclado.
- Gravação automática no navegador e backup/restauração em JSON.

O projeto `marketing-campaign-dashboard` foi usado como referência e não foi modificado. Esta versão usa HTML, CSS e JavaScript convencional, sem React, TypeScript, Vite, servidor ou compilação.

## Preparar as planilhas

Use **Modelo Excel** na interface. As colunas `empresas`, `campanha` e `enviados` são obrigatórias. Cada linha exige uma empresa com até 200 caracteres. Aliases: `empresa`, `nome da empresa`, `company`, `companies` e `company name`. Espaços nas extremidades são removidos; use a mesma grafia para a mesma empresa (maiúsculas e acentos diferenciam empresas). As demais colunas são opcionais:

| Coluna | Conteúdo |
| --- | --- |
| colaboradores | Responsável pelo disparo, até 200 caracteres. Um responsável por linha |
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

Linhas em branco são ignoradas. Datas impossíveis, números inválidos, empresa vazia ou entregues maiores que enviados cancelam a importação inteira e preservam os dados anteriores. Abas sem campanha/enviados são ignoradas com aviso. Uma aba com campanha/enviados sem empresas cancela toda a importação, inclusive com vários arquivos. Um arquivo sem registros compatíveis cancela a operação.

Limites: 30 arquivos por vez, 20 MB por arquivo, 50 MB no total e 100.000 registros. Arquivos muito grandes podem demorar, pois o processamento ocorre no próprio navegador. Remova linhas de totais e subtotais antes de importar. Os registros não são deduplicados: selecione cada arquivo apenas uma vez.

## Empresas, desempenho e listagens

Selecione uma ou várias empresas e colaboradores. **Nenhuma seleção significa todos daquela categoria**. Empresa, colaborador, busca, campanhas, datas e canal se combinam e afetam indicadores, gráficos, listagens e exportações. Um responsável pode trabalhar em várias empresas; escolher empresa + responsável exibe a interseção.

Em **Visualização do dashboard**, escolha:

- **Desempenho por empresas** (inicial): consolida os disparos por empresa, somando seus canais e comparando abertura e CTR com taxas ponderadas pelas entregas.
- **Desempenho por campanhas**: compara todas as combinações de empresa, campanha, canal e responsável do recorte. Campanhas homônimas de empresas ou responsáveis diferentes permanecem separadas. Todos os resultados aparecem, com rolagem quando necessário.
- **Produção por colaboradores**: indicadores de disparos realizados, campanhas atendidas, empresas atendidas, mensagens enviadas, aberturas e cliques. O gráfico temporal conta disparos por responsável/dia; o comparativo ordena responsáveis por quantidade de disparos, com volume de mensagens exibido à parte. As cores dos colaboradores permanecem estáveis sob filtros.

O gráfico temporal mostra **duas séries por empresa**: quantidade de aberturas em linha contínua na cor principal e quantidade de cliques em linha tracejada no tom claro. EmpA usa vermelho, EmpB azul, EmpC verde, EmpD amarelo; as próximas usam roxo, laranja, turquesa, rosa e cores adicionais geradas automaticamente. Empresas com outros nomes recebem as cores disponíveis na ordem dos nomes do conjunto completo de dados. As cores permanecem estáveis ao alterar filtros e modos dentro desse conjunto.

As quantidades são somadas por empresa e dia usando as mesmas regras de contagens efetivas dos indicadores. O eixo vertical é comum a todas as empresas. Pontos aparecem apenas nas datas com disparos; uma empresa com apenas uma data aparece como dois pontos. Registros sem data não entram neste gráfico. Todas as empresas com dados datados no recorte aparecem quando nenhuma é selecionada; filtros de campanha, canal, busca e período também limitam as séries. A legenda identifica empresa e métrica; passar sobre um ponto mostra empresa, data e quantidade. O comparativo de taxas usa a mesma cor principal para abertura e o tom claro para CTR, nos dois modos de desempenho.

Na tabela, **Tipo de listagem** oferece uma seleção independente:

- **Empresas e suas campanhas** (inicial): totais de cada empresa seguidos de suas campanhas por canal.
- **Listagem geral de campanhas**: tabela única de campanhas do recorte, identificando empresa, canal e responsável.
- **Colaboradores e seus disparos**: totais de cada responsável seguidos de suas campanhas, empresas e canais.

As três listagens mostram responsável, quantidade de disparos, aberturas e cliques, além de abertura percentual e CTR. Na listagem agrupada, a ordenação ordena empresas ou colaboradores pelos totais e campanhas dentro de cada grupo; na geral, ordena todas as campanhas. Trocar dashboard ou listagem preserva filtros e a outra seleção.

A seleção específica identifica empresa + nome de campanha e mostra apenas campanhas compatíveis com empresas e colaboradores escolhidos. Ao mudar esses filtros, seleções de campanhas incompatíveis são removidas. **Limpar filtros** remove empresas, colaboradores, busca, campanhas, datas e canal, mantendo dashboard e listagem.

Excel inclui `empresas` na aba **Disparos** e empresa em **Resumo**. O resumo e o PDF acompanham o modo de desempenho; o tipo de listagem organiza apenas a tabela na tela. O PDF informa os filtros. A demonstração contém **EmpA, EmpB e EmpC**, mantendo os 14 disparos e os totais anteriores.

Excel também inclui `colaboradores` em **Disparos** e responsável, empresas/campanhas atendidas e disparos em **Resumo**. No modo produção, o resumo e o PDF consolidam por responsável. Os filtros de colaboradores entram no PDF e limitam ambas as exportações.

### Medir a produção dos colaboradores

Preencha `colaboradores` com **um responsável por linha**, por exemplo Colab1. Aliases: colaborador, responsável, responsável pelo disparo, nome do colaborador, employee e owner. Nomes usam grafia exata após remover espaços nas extremidades. Use o mesmo nome para a mesma pessoa em todas as empresas.

**Um disparo = uma linha importada**; mensagens enviadas representam o volume dessa linha. Não há deduplicação automática. Campanhas atendidas contam combinações distintas de empresa + nome da campanha, sem multiplicar pelo canal ou responsável. Empresas atendidas são contadas uma vez por recorte. Os totais dessas categorias consolidadas podem ser menores que a soma por colaborador, quando há trabalho compartilhado.

Para compatibilidade, planilhas sem a coluna colaboradores são aceitas com aviso e recebem **Colaborador não informado**. Se a coluna existir, valores vazios, traços ou nomes acima de 200 caracteres cancelam toda a importação. Reimporte a planilha completa para associar as pessoas. Esse grupo preserva o volume histórico, mas não representa um colaborador identificado.

A demonstração inclui **Colab1, Colab2, Colab3, Colab4, Colab5 e Colab6**, distribuídos entre EmpA, EmpB e EmpC. Colab1 e Colab2 têm três disparos cada; os demais têm dois. Use Restaurar demonstração para carregar os novos exemplos.

As três empresas têm disparos nas mesmas quatro datas: **03, 10, 17 e 24/09/2026**. Assim, suas linhas de abertura e cliques podem ser comparadas nas mesmas datas. Use **Restaurar demonstração** para carregar essa versão quando já houver dados salvos no navegador; os eventos são preservados.

### Caixa de detalhes

Passe o mouse sobre pontos e linhas do gráfico, indicadores, barras do comparativo ou registros da tabela para abrir a caixa de detalhes. Nos pontos temporais, ela mostra **empresa, data, aberturas, cliques, taxas, enviados e entregues daquele dia**, após os filtros. Nas linhas, mostra o total da série no período; no comparativo e nas listagens, mostra os dados agregados do registro. Os indicadores de Pós-evento também têm detalhes.

Use **Tab** para focar os dados e abrir a caixa pelo teclado; **Escape** fecha. Ela acompanha o mouse, usa o tema atual e ajusta a posição para permanecer dentro da tela. Sair do dado, trocar filtros/modos, navegar ou redimensionar fecha a caixa. Na rolagem, ela permanece enquanto o mesmo dado estiver sob o mouse ou em foco visível; fecha quando sai desse contexto. Nomes importados são exibidos como texto, sem interpretar HTML. As caixas são detalhes da interface e não fazem parte dos arquivos exportados.

## Critérios dos cálculos

- Falhas de entrega = enviados − entregues. Isso não indica a causa da falha.
- Aberturas efetivas: lidos quando maior que zero; caso contrário, visualizações quando maior que zero. As duas contagens não são somadas.
- Taxas importadas só estimam contagens quando as respectivas contagens estiverem ausentes. Um zero informado prevalece sobre uma taxa. A estimativa é arredondada por disparo.
- Abertura e CTR agregados = contagem efetiva total ÷ entregues totais. Não é feita média simples das porcentagens.
- Percentuais são exibidos com duas casas decimais na interface e nos PDFs. No Excel, as células percentuais usam o formato `0.00%`, preservando a precisão dos valores numéricos para cálculos.
- Campanhas de empresas, canais ou responsáveis diferentes aparecem separadas nas listagens e no desempenho por campanhas. O desempenho por empresas consolida seus canais e responsáveis; produção por colaboradores consolida empresas/canais do responsável.
- Opt-out ausente aparece como “—”. Quando apenas parte do recorte tem opt-out, o total disponível é indicado como parcial e a taxa usa todas as entregas do recorte.
- Disparos sem data participam do total sem filtros de período, mas não entram no gráfico temporal nem em filtros por datas.
- Custo por presente = soma dos investimentos ÷ pessoas presentes. Sem presentes, o custo é “—”. Presentes não pode ser maior que inscritos.
- Exportações de disparos respeitam todos os filtros. O Excel inclui os dados originais e uma aba de resumo com valores efetivos. Os relatórios PDF apresentam os indicadores e os registros em texto, com paginação automática.

## Onde os dados ficam

A aplicação grava os dados no armazenamento local do navegador, quando permitido. Nenhum arquivo original de planilha é alterado. O navegador não permite que uma página aberta por arquivo grave silenciosamente de volta em uma pasta: **Salvar backup** baixa um arquivo JSON, e as exportações baixam novos arquivos Excel/PDF.

Faça backups regularmente. Trocar de navegador, mudar o caminho da pasta, limpar dados de navegação ou usar uma janela privada pode impedir a recuperação automática. Em caso de falta de espaço ou bloqueio de armazenamento, a aplicação avisa para salvar um backup da sessão.

**Restaurar backup** valida o arquivo e solicita confirmação antes de substituir disparos e eventos. O backup contém todos os registros salvos, independentemente dos filtros. Alterações ainda não salvas no formulário não entram no backup.

Os novos backups usam versão 3 e exigem `empresa` e `colaborador` em cada disparo. Backups e dados locais antigos (versões 1 e 2) são convertidos ao carregar, preservando disparos e eventos. Versão 1 sem empresa recebe **Empresa não informada**; versões 1/2 sem responsável recebem **Colaborador não informado**, com avisos. Reimporte a planilha completa para associá-los corretamente. A chave `campaign-pulse-local-v1` foi mantida para recuperar dados existentes; o próximo salvamento grava versão 3. Filtros, dashboard e listagem são escolhas da sessão e não entram no backup. Pós-evento mantém seus filtros próprios.

## Arquivos

| Arquivo | Responsabilidade |
| --- | --- |
| index.html | Estrutura e navegação |
| styles.css | Layout, temas e responsividade |
| core.js | Leitura de dados tabulares, validação e cálculos |
| app.js | Interface, armazenamento, importação e exportação |
| demo.js | Demonstração de três empresas com datas de disparo compartilhadas |
| vendor/ | Bibliotecas JavaScript locais de Excel e PDF e licenças |
| tests/ | Testes e evidências de validação; desnecessários para uso diário |

Os scripts são carregados diretamente, sem módulos ES e sem `fetch`, para permitir abertura por `file://`. Fontes do sistema e gráficos SVG gerados pela aplicação evitam dependências externas. A política de conteúdo bloqueia conexões de rede.

## Desenvolvimento e testes (opcional)

Somente para repetir a validação de desenvolvimento, use Node.js e Playwright com Microsoft Edge. Eles **não são necessários para usar a aplicação**.

```text
node --test tests/core.test.cjs
node tests/browser.test.cjs
node tests/advanced.test.cjs
node tests/companies.test.cjs
node tests/company-charts.test.cjs
node tests/tooltips.test.cjs
node --test tests/collaborators-core.test.cjs
node tests/collaborators.test.cjs
```

Os testes de navegador usam o Playwright disponível no ambiente de desenvolvimento deste computador. Em outro computador, defina `PLAYWRIGHT_PATH` com o caminho para o pacote instalado. As verificações abrem diretamente o arquivo HTML; não iniciam servidor.

As evidências em `tests/results/` são geradas pelos testes. Os scripts de teste, as bibliotecas em `vendor/` e suas licenças devem permanecer no repositório.

Consulte **VALIDACAO.md** para os resultados e limitações da verificação.
