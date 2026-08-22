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