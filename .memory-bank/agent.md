# Agent — Utils Excel

## Diretrizes para o Agente

### Idioma
- **Sempre responder em pt-PT** (Português de Portugal)
- Comentários e documentação do código em português brasileiro (padrão do projeto)

### Contexto do Projeto
Este é um sistema **utilitário local** para manipulação de Excel. O foco atual está nas ferramentas de validação e cruzamento de planilhas.

## Arquivos-Chave a Consultar Primeiro

| Arquivo | Propósito |
|---------|-----------|
| `Excel/index.html` | Estrutura completa da SPA (todas as páginas de validação) |
| `Excel/js/app.js` | Navegação e ciclo de vida dos validadores |
| `Excel/js/core/excel-reader.js` | Leitura de arquivos .xlsx |
| `Excel/js/core/excel-writer.js` | Exportação de arquivos .xlsx |
| `Excel/js/core/excel-utils.js` | Utilitários de normalização/comparação (inclui `findDuplicateOccurrences`) |
| `Excel/js/ui/sheet-workspace.js` | Fluxo comum de upload/aba |
| `Excel/js/ui/validator-registry.js` | Registro de validadores |
| `Excel/css/validators.css` | Estilos das páginas de validação |

## Validador: Dados vs Cruzamento

### Validador de Dados (`data-validator-ui.js`)
- **Duas planilhas obrigatórias**
- Encontra **colunas em comum** automaticamente
- **Planilha espelho**: radio (left/right) escolhe base do resultado final
- Valida qualidade das colunas em comum na planilha espelho (`DataValidator.validate`)
- **Extração final**: usa dados da planilha espelho + colunas selecionadas das duas planilhas

### Validador de Cruzamento (`cross-validator-ui.js`)
- **Duas planilhas obrigatórias**
- **Chaves de cruzamento**: pares de colunas (esquerda ↔ direita)
- Mostra apenas as **colunas-chave** pré-selecionadas na extração
- Extração por conjunto (nas duas / só na 1 / só na 2)
- Usa `CrossValidator.compare()` e `CrossValidator.buildExportRows()`
- **Consolidação** (todo.md): `CrossValidator.consolidate()` gera FULL OUTER JOIN com
  coluna-chave única, sufixos de origem e coluna "Duplicado"; exportado como
  `cruzamento-consolidado.xlsx`

### Conversor Excel → CSV (`csv-converter-ui.js`, todo2.md)
- **Uma planilha** (fluxo padrão do SheetWorkspace)
- Cabeçalhos exibidos com **badges de categoria** (aliases via `ColumnAliases`)
- **Coluna principal** validada com mensagens (vazios, duplicados, alias)
- Colunas relacionadas **pré-marcadas** por alias
- Formato: Concatenado (separador interno `; , |`) ou Quebra de colunas (dinâmicas `X 1..N`)
- Duplicados: Manter todos (padrão) / Remover iguais
- Separador do CSV configurável (`,` padrão)
- Prévia em tabela + exportação `CsvWriter.download` (UTF-8 BOM)

## Armadilhas Comuns

1. **Upload**: O `<input type="file">` DEVE estar aninhado dentro do `<label>` para o clique funcionar. Nunca usar `<label for="">` vazio.
2. **SheetWorkspace**: Requer os `data-role` certos no HTML (`excel-file`, `file-status`, `file-section`, `file-name`, `file-size`, `sheet-count`, `sheet-section`, `sheet-select`, `sheet-info`).
3. **DataValidator.validate**: Espera `headerResult.fields` com `{id, name, label, column, originalHeader, required, status: 'found'}`.
4. **Múltiplos workspaces**: Para dois arquivos, cada um precisa de um container com `data-data-source="left"/"right"` (dados) ou `data-cross-source` (cruzamento) — NÃO usar o root da página no `SheetWorkspace.bind`.
5. **Índices**: `findDuplicateOccurrences` retorna índices base 0 — exibir como `index + 1` (base 1, como Excel).
6. **Escolha do espelho**: Ao recarregar páginas, `currentMirror` deve resetar para `"left"`.

## Comunicação com Usuário
- Priorize explicar mudanças por funcionalidade (validador a validador)
- Seja claro sobre efeitos colaterais nas edições
- Para validações de Excel, confirme arquivos reais .xlsx ao testar

## Regras de Código
- IIFE (padrão imediatamente invocada)
- Comentários por seção em português
- Indentação de 4 espaços
- Sem frameworks externos (manter estático)

## Status Final
- [x] O memory bank foi revisado e validado contra a implementação em `Excel/`.
- [x] A documentação foi sincronizada com a funcionalidade real do projeto.
- [x] A atualização do memory bank foi concluída.