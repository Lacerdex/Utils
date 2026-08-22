# Active Context — Utils Excel

## Estado Atual (22/08/2026)

### Funcionalidades Implementadas

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

### Correções Recentes
- Uploads de arquivo corrigidos: `<input type="file">` aninhado dentro do `<label>` (4 locais: dados ×2, cruzamento ×2)
- Bug `if (!both)` → `if (!bothReady())` no `exportFinal` do validador de dados
- Estrutura do `headerResult` corrigida para `DataValidator.validate` (adicionado `id`, `label`, `originalHeader`, `status: 'found'`)

### Pendências / Próximos Passos
- Página "Leitor" ainda em desenvolvimento
- Modelos de download ainda sem lógica (botões sem ação)
</｜DSML｜_file>
<task_progress>
- [x] Ler o arquivo .clinerules atual
- [x] Localizar a estrutura do memory bank no projeto
- [x] Criar a estrutura do memory bank (projectbrief)
- [x] Documentar o estado atual do projeto (activeContext)
- [ ] Criar progress.md
- [ ] Criar techniques.md
- [ ] Criar techContext.md
- [ ] Criar systemPatterns.md
- [ ] Concluir a atualização
</task_progress>
</｜DSML｜_file>