# Active Context — Utils Excel

## Estado Atual (23/08/2026)

### Novas Funcionalidades Implementadas (v1.1)

#### 1. Schema de Indicadores
- Arquivo: `js/schemas/indicadores-schema.js`
- Campos: período, indicador, valor, meta, status, responsável, observações
- Aliases configurados para cada campo
- Registro automático no SchemaRegistry

#### 2. Download de Modelos
- Arquivo: `js/ui/model-downloader.js`
- Funcionalidade: gera planilhas modelo baseadas em schemas
- Modelos disponíveis: Cadastro, Indicadores
- Exporta como .xlsx com BOM UTF-8
- Integração com página "Modelos" (2 botões de download)
- **Status**: Pronto para produção

#### 3. Página Leitor (Nova)
- Arquivo: `js/ui/reader-ui.js`
- Funcionalidade: exploração de arquivos Excel
- Features:
  - Upload de arquivo via SheetWorkspace
  - Seleção e pré-visualização de aba
  - Tabela com primeiras 50 linhas
  - Grid de informações (aba, linhas, colunas)
  - Aviso quando há mais linhas que 50
- CSS: Estilos em `.reader-table`, `.reader-info-grid`, `.reader-notice`
- **Status**: Implementado e testado

#### 4. Categorizador Excel (Nova)
- Arquivo: `js/core/category-utils.js` e `js/ui/categorizer-ui.js`
- Funcionalidade: importação local de um Excel, escolha de aba e coluna-alvo, criação de categorias e marcação por checkbox
- Features:
  - criação de categorias independentes com contador por categoria
  - seleção por categoria ativa e preservação de Estado
  - busca por registros visíveis e seleção/desmarcação em massa da categoria ativa
  - exportação final em .xlsx com colunas originais preservadas + categorias adicionadas
- CSS: estilos em `.category-form`, `.category-pill`, `.category-stats`, `.categorizer-checkbox`
- **Status**: Implementado e validado junto ao conjunto de testes do projeto

#### 5. Cadastro e gerenciamento local de planilhas
- Arquivo: `Excel/js/core/planilha-storage.js` e `Excel/js/ui/planilha-cadastro-ui.js`
- Funcionalidade: catálogo local de arquivos `.xlsx`, `.xls` e `.csv` em navegador
- Recursos:
  - área de cadastro integrada ao shell principal
  - drag & drop + seleção tradicional
  - nome personalizado para o cadastro do arquivo e seleção de pasta (Excel/CSV)
  - conversão automática do arquivo para a pasta escolhida antes de salvar
  - validação de extensão no frontend
  - persistência local em IndexedDB com metadados e organização por tipo
  - busca por nome, filtro por extensão, atualização, download e exclusão com confirmação
  - integração para reutilizar a planilha em ferramentas do sistema
- Status: Implementado e validado

### Funcionalidades Existentes

#### 1. Validador de Cabeçalho
- Reconhecimento de colunas da planilha
- Comparação com modelo esperado (schema)
- Detecção de colunas faltantes e extras
- Console de log

#### 2. Validador de Dados (Análise de Qualidade)
- **Duas planilhas**: seleção de 2 arquivos .xlsx
- **Colunas em comum**: detecta automaticamente as colunas equivalentes entre as duas planilhas (usando `ExcelUtils.findColumn`)
- **Planilha espelho**: botões de check (radio) permitem escolher qual planilha serve de base para o resultado final
- **Validação automática**: qualidade das colunas em comum na planilha espelho (preenchimento, vazios, inválidos)
- **Extração final**: botão "Baixar planilha final" gera .xlsx com dados da planilha espelho + colunas das duas planilhas

#### 3. Validação de Formato
- Verifica CPF, e-mail e celular nos campos reconhecidos pelo modelo
- Exibe resumo e detalhes por campo

#### 4. Detecção de Duplicados
- Seleção de coluna chave
- **Índices de linhas**: para cada valor duplicado, mostra "Repetido nas linhas: linha X, linha Y" (base 1)
- Nova função utilitária: `ExcelUtils.findDuplicateOccurrences(rows, columnName)` retorna `{value, rowIndexes[]}`

#### 5. Cruzamento de Planilhas
- Duas planilhas + chaves de cruzamento (sugestão automática de pares equivalentes)
- Executa cruzamento: mostra "Nas duas", "Só na planilha 1", "Só na planilha 2"
- Extração .xlsx do conjunto selecionado
- **Apenas colunas-chave**: a seção de extração mostra apenas as colunas usadas como chaves, pré-selecionadas

#### 6. Consolidação de Planilhas (todo.md — FULL OUTER JOIN)
- Nova função `CrossValidator.consolidate(sheetA, sheetB, keyPairs)`:
  - Coluna-chave aparece **uma única vez** como `Nome (Cruzamento)`
  - Cada coluna recebe sufixo de origem: `E-mail (Planilha 1)` / `E-mail (Planilha 2)`
  - Colunas exclusivas preservadas: `Telefone (Planilha 1)`, `Departamento (Planilha 2)`
  - Valores iguais nas duas fontes marcados na coluna **`Duplicado`**
  - **Todos os registros** das duas planilhas são preservados (matched + onlyA + onlyB)
  - Comparação por equivalência normalizada (espaços extras), mas valores **originais** exportados sem alteração
  - Duplicidades na chave não sobrescrevem: cada combinação gera uma linha consolidada
- Botão "Consolidar planilhas" na UI do cruzamento
- Preview em tabela da planilha final (primeiras 20 linhas)
- Botão "Exportar resultado" gera `cruzamento-consolidado.xlsx`
- Teste automatizado: `Excel/test-consolidate.js` (cenário obrigatório do todo.md — 12 verificações OK)

#### 7. Conversão Excel → CSV (todo2.md)
- `js/schemas/column-aliases.js` — camada de aliases: categorias nome/email/telefone/cpf/cnpj/codigo/cidade;
  `findCategory`, `relatedHeaders` (match exato ou por inclusão), `suggestMainCategory`
- `js/core/csv-writer.js` — geração de CSV com escape RFC 4180 (aspas quando a célula contém qualquer
  separador conhecido `; , |`), **UTF-8 com BOM**, download local via Blob
- `js/validators/csv-transform-validator.js`:
  - `validateMainColumn`: existe, preenchidos, vazios, duplicidades, alias conhecido → mensagens ao usuário
  - `transform(sheet, {mainColumn, columns, mode, separator, removeDuplicates})`:
    - modo **concat**: agrupa pela coluna principal e une valores na mesma célula
    - modo **split**: cria colunas dinâmicas `Coluna 1..N` conforme maior quantidade de valores
    - dedupe opcional (padrão: manter todos) por equivalência normalizada
  - `suggestRelatedColumns`: sugere colunas da mesma categoria do principal
- `js/ui/csv-converter-ui.js` + página `page-validator-csv` + card "Excel → CSV" no grid
- Fluxo: arquivo → aba → cabeçalhos com badges de categoria → coluna principal validada →
  relacionadas pré-marcadas → formato/separadores/duplicados → prévia em tabela → exportar CSV
- Teste automatizado: `Excel/test-csv-transform.js` (cenário obrigatório do todo2.md — 21 verificações OK,
  CSVs idênticos aos exemplos concatenado e quebra de colunas)

### Páginas Disponíveis
- [x] Validações (6 validadores)
- [x] Modelos (Cadastro + Indicadores)
- [x] Leitor (Nova página implementada)
- [x] Categorização (nova página para classificação e exportação)
- [x] Documentação (Guia completo)
- [x] Sobre (Informações do projeto)

### Status de Validação
- [x] Categorizador Excel validado no diretório `Excel` com testes automatizados.
- [x] Trechos executados: `node Excel/test-categorizer.js`, `node Excel/test-consolidate.js`, `node Excel/test-csv-transform.js`.
- [x] O fluxo de importação, criação de categorias, marcação por checkbox e exportação do resultado está em conformidade com a spec do projeto.

### Próximos Passos
- [x] Testar downloads de modelos com arquivos reais
- [x] Testar página Leitor com .xlsx grandes (>100k linhas)
- [x] Documentar boas práticas de uso
- [x] Possível refatoração do `validate()` do DataValidator para aceitar lista de colunas diretamente

## Status do Memory Bank
- [x] Ler o arquivo .clinerules atual
- [x] Localizar a estrutura do memory bank no projeto
- [x] Criar a estrutura do memory bank (projectbrief)
- [x] Documentar o estado atual do projeto (activeContext)
- [x] Criar progress.md
- [x] Criar techContext.md
- [x] Criar systemPatterns.md
- [x] Concluir a atualização

### Atualização Final — Validador de Duplicatas
- [x] Revisão do `todo.md` concluída e implementação alinhada com a especificação.
- [x] Criação do módulo `DuplicateValidator` para deduplicação, agrupamento por chave e transformações por método.
- [x] Integração com a UI do validador de duplicatas em `Excel/index.html` e `Excel/js/ui/duplicate-validator-ui.js`.
- [x] Exportação local em Excel (.xlsx) e CSV (.csv) validada no fluxo.
- [x] Teste automatizado: `node Excel/test-duplicate-validator.js` executado com sucesso.