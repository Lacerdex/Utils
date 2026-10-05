# Análise de disparos

## Acesso e entrada

Abra `index.html` na raiz do projeto e selecione **Análise de disparos** (`#disparos`, seção `#dispatch-page`). Funciona offline e por `file://`.

Baixe **Modelo Excel** e preencha as colunas obrigatórias `empresas`, `campanha` e `enviados`. Cada linha exige empresa com até 200 caracteres. Aliases: empresa, nome da empresa, company, companies e company name. Campo interno: `empresa`. Espaços nas extremidades são removidos; a identidade usa grafia exata, incluindo maiúsculas e acentos.

Opcionais: data de envio, entregues, visualização, lidos, cliques, taxa de abertura, taxa de cliques, canal e opt-out. CSV usa UTF-8, números brasileiros e datas brasileiras, ISO ou seriais Excel. Contagens são inteiras não negativas; entregues não supera enviados.

`colaboradores` identifica um responsável por linha, com até 200 caracteres. Aliases: colaborador, responsável, responsável pelo disparo, nome do colaborador, employee e owner. Cabeçalho ausente recebe **Colaborador não informado**, com aviso, para compatibilidade. Quando presente, valores vazios, traços ou nomes acima do limite cancelam toda a importação. Campo interno: `colaborador`; identidade por nome exato após remover espaços nas extremidades.

Nova importação substitui disparos e preserva eventos. Abas sem campanha/enviados são ignoradas com aviso. Abas de disparos sem empresas e linhas com empresa vazia rejeitam toda a importação, preservando dados anteriores. Valores inválidos também cancelam. Linhas vazias são ignoradas; não há deduplicação. Limites: 30 arquivos, 20 MB por arquivo, 50 MB no total, 100.000 registros.

## Filtros

Empresas e colaboradores permitem seleção múltipla. **Nenhuma seleção significa todos naquela categoria**. Empresa, colaborador, busca, campanhas, datas e canal se combinam antes dos cálculos, inclusive nas contagens dos canais. Responsáveis podem atuar em várias empresas; os filtros se intersectam. Busca ignora acentos; datas são inclusivas. Intervalo invertido exibe aviso e nenhum resultado. Disparos sem data entram em totais sem período, mas ficam fora de recortes datados e do gráfico temporal.

Selecionar campanhas usa chave JSON `[empresa, campanha]`, independente de canal/responsável. Apenas campanhas compatíveis com empresas e colaboradores escolhidos aparecem. Ao mudar esses filtros, seleções incompatíveis são removidas. Trocar dashboard ou listagem preserva filtros. Limpar filtros mantém os modos e remove empresas, colaboradores, campanhas, busca, canal e datas. Canais: Todos, E-mail, WhatsApp, SMS e Outros.

## Desempenho e listagens

As seleções são independentes e começam em empresas:

| Controle | Opção | Resultado |
| --- | --- | --- |
| Visualização do dashboard | Desempenho por empresas | Comparativo por empresa, somando canais |
| Visualização do dashboard | Desempenho por campanhas | Comparativo por empresa + campanha + canal + responsável |
| Visualização do dashboard | Produção por colaboradores | Quantidade de disparos por responsável e dia; comparativo de produção |
| Tipo de listagem | Empresas e suas campanhas | Totais da empresa seguidos de suas campanhas por canal |
| Tipo de listagem | Listagem geral de campanhas | Tabela única com empresa, canal e responsável identificados |
| Tipo de listagem | Colaboradores e seus disparos | Totais por responsável seguidos das suas campanhas e empresas |

O comparativo inclui todos os grupos do recorte, ordenados por envios, com rolagem após 420 px. Compara abertura e CTR. A tabela mostra contagens de abertura/cliques e taxas; a linha de empresa consolida métricas. A ordenação funciona por grupos de empresas e dentro deles, ou globalmente na listagem geral. Estados vazios desabilitam exportações.

### Séries e cores por empresa

O gráfico temporal agrega **contagens efetivas de aberturas e cliques por empresa e dia**, em eixo vertical comum. Cada empresa tem duas séries: abertura contínua na cor principal e cliques tracejados no tom claro. Legenda e pontos identificam empresa/métrica; pontos incluem data e quantidade ao passar o mouse. Datas sem disparos da empresa não recebem zeros artificiais; uma única data gera pontos. Empresa sem registros datados no recorte fica fora do gráfico e da legenda.

`COMPANY_PALETTE`, `updateCompanyColors` e `companyColorMap` em `app.js` atribuem as cores pelo conjunto completo de empresas, antes do recorte. EmpA = vermelho, EmpB = azul, EmpC = verde, EmpD = amarelo. Seguem roxo, laranja, turquesa e rosa; além da paleta, pares de cores HSL são gerados. Nomes EmpA a EmpZ reservam seus índices; demais nomes ocupam os índices disponíveis em ordem alfabética. Filtrar ou trocar modo não muda as cores; substituir o conjunto importado pode mudar a atribuição de nomes livres.

`renderTrend` recebe apenas os registros filtrados. A mesma atribuição colore as barras de abertura/CTR do comparativo em empresas e campanhas. `tests/company-charts.test.cjs` verifica cores, somas diárias, zeros, estimativas, datas ausentes, filtros, modo, estados vazios, temas e responsividade.

### Caixa de detalhes (tooltip)

`tooltipAttrs` e `summaryTooltip` em `app.js` adicionam metadados de detalhes aos indicadores, pontos/linhas SVG, comparativo e linhas de tabela. O elemento único `#dashboard-tooltip` usa `role="tooltip"`, posição fixa, limites da tela e tema atual. `showTooltip` cria o conteúdo com `textContent`, preservando texto importado sem execução de HTML.

Nos pontos, os dados são agregados por empresa/dia após os filtros: aberturas, cliques, respectivas taxas, enviados e entregues. Nas linhas, total da série e intervalo. Comparativo e listagens usam resumos filtrados; indicadores mostram valor e contexto, inclusive em Pós-evento.

Eventos de ponteiro e foco no `#main` abrem a caixa; `aria-describedby` associa o alvo à descrição. Tab permite acesso; Escape fecha. Sair do alvo, trocar filtros/modos, atualizar eventos, navegar ou redimensionar remove os detalhes. Rolagem mantém a caixa apenas se o mesmo alvo continuar sob o mouse ou em foco visível. A caixa não participa das exportações. Testes: `tests/tooltips.test.cjs`; capturas e relatório em `tests/results/`.

## Cálculos

### Produção

Um registro importado representa um disparo; `enviados` representa seu volume de mensagens. O modo colaboradores apresenta disparos realizados, campanhas atendidas, empresas atendidas, mensagens enviadas, aberturas e cliques. Campanhas atendidas contam chaves `[empresa, campanha]` distintas; empresas atendidas contam nomes distintos. Categorias compartilhadas não são somadas entre responsáveis no consolidado. Não há deduplicação de registros.

`summarize(rows, 'colaboradores')` agrega por responsável, inclusive entre empresas/canais, e retorna `registros`, `campanhasOperadas` e `empresasAtendidas`. Agrupamento padrão inclui o responsável para separar a mesma campanha operada por pessoas diferentes. Empresa consolida seus responsáveis sem duplicar volume.

No modo produção, `renderTrend` usa `colaborador` como dimensão e `registros` como série, com eixo inteiro e tooltip com empresas, responsável, volume e engajamento do dia. O comparativo ordena por número de disparos (desempate: mensagens), com cores estáveis atribuídas ao conjunto completo de responsáveis. Demais modos mantêm as séries por empresa, limitadas também pelo filtro de colaboradores. A coluna Disparos e o responsável aparecem nas três listagens. Seletores continuam independentes.

Registros sem atribuição são preservados em **Colaborador não informado**; aparecem como grupo separado e não entram na contagem de colaboradores identificados. O aviso solicita reimportação para associação correta.

- Envios e entregues: somas; taxa de entrega = entregues ÷ enviados.
- Aberturas: lidos positivos, senão visualizações positivas; não são somados.
- Contagens explícitas, inclusive zero, prevalecem. Quando ausentes, taxa × entregues estima contagem, arredondada por disparo.
- Abertura e CTR: contagens efetivas totais ÷ entregues totais. Sem denominador, zero. Não há média simples de percentuais.
- Falhas: enviados − entregues, sem indicar causa.
- Opt-out: soma disponível; ausente é “—”; cobertura incompleta é parcial. Taxa usa todas as entregas do recorte.
- Percentuais: duas casas na tela/PDF; Excel preserva valores numéricos e formato `0.00%`.

## Exportação e persistência

Excel contém **Disparos** (originais incluindo empresas/colaboradores) e **Resumo** (agregado conforme dashboard, incluindo responsável e quantidades de produção). PDF inclui indicadores, filtros de colaboradores e resumos conforme dashboard, com paginação. Tipo de listagem organiza apenas a tabela da interface. Ambos respeitam filtros.

Demonstração: **EmpA, EmpB e EmpC** nos 14 disparos, mantendo totais anteriores. Todas têm disparos em **03, 10, 17 e 24/09/2026**, permitindo comparar as seis séries nas mesmas datas. Restaurar demonstração carrega a versão atual mesmo se a versão anterior estiver salva no navegador. Restaurar demonstração e limpar disparos preservam eventos.

Responsáveis fictícios: **Colab1 a Colab6** distribuídos entre empresas. Colab1 e Colab2 têm três registros; Colab3 a Colab6 têm dois cada. Valores, datas e 88.480 mensagens enviadas foram preservados.

Backup atual: versão 3, exige `empresa` e `colaborador`. Versões 1/2 são migradas ao carregar dados locais ou restaurar: responsável ausente recebe **Colaborador não informado**; versão 1 sem empresa recebe **Empresa não informada**. Avisos solicitam reimportar a planilha completa para atribuição. Eventos e métricas são preservados. Versão 3 rejeita responsáveis e empresas ausentes/inválidos.

A chave `campaign-pulse-local-v1` foi mantida; o próximo salvamento grava versão 3. Salvar backup inclui todos os dados. Restaurar valida e pede confirmação. Falha de armazenamento orienta salvar backup da sessão. Modo, listagem e filtros não são persistidos. Pós-evento mantém cadastro e filtros próprios.

## Manutenção e testes

- `index.html`: filtros, seletores e tabela.
- `core.js`: `parseGrid`, `filter`, `campaignKey`, `summarize(rows, mode)`, `totals`, `validateBackup`.
- `app.js`: seleções, `renderDispatch`, importação e exportações.
- `demo.js`: empresas fictícias.
- `styles.css`: controles, grupos e responsividade.
- `tests/core.test.cjs`, `browser.test.cjs`, `advanced.test.cjs`, `companies.test.cjs`: regras, regressões e novos fluxos; evidências em `tests/results/`.
- `tests/collaborators-core.test.cjs` e `collaborators.test.cjs`: atribuição, produção, filtros, exportação, migração, demonstração, estados vazios e responsividade.

Consulte `LEIA-ME.md` para uso e `VALIDACAO.md` para resultados e limites.
