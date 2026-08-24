# System Patterns — Utils Excel

## Arquitetura

### Padrão de Módulos (IIFE)
Todos os módulos JavaScript usam o padrão **IIFE (Immediately Invoked Function Expression)** com retorno de API pública:

```js
const Modulo = (() => {
    // estado interno privado
    function funcaoPrivada() { ... }
    return {
        funcaoPublica
    };
})();
```

### Registro de Validadores
Cada validador se registra no `ValidatorRegistry` com:
- `id` — data-validator no card
- `pageId` — id da seção em index.html
- `title`
- `ready` — se a UI está implementada
- `init()` — chamado ao abrir o validador
- `reset()` — chamado ao sair/voltar

### Fluxo Comum (SheetWorkspace)
`SheetWorkspace.bind(root, options)` padroniza o fluxo de upload:
1. Selecionar arquivo .xlsx
2. Ler com `ExcelReader.read(file)` → documento
3. Selecionar aba (`sheet-select`)
4. Dispara `onSheetSelected(context)` com `{document, sheet, file, schema, log}`

### Navegação (app.js)
- `.nav-item[data-page]` → navega entre páginas principais (validators, models, reader, about)
- `[data-validator]` → abre um validador específico
- `[data-back-page]` → volta para a página principal
- Ao trocar de validador, chama `reset()` do atual

## Componentes Reutilizáveis
- `.validator-card` — bloco de conteúdo de validação
- `.validator-infinity-upload` — upload de arquivo estilizado (input dentro do label)
- `.validation-summary` — contadores em cards
- `.validation-field` — linha de campo com status
- `.validator-log` — console de log escuro
- `.column-checks` / `.column-check` — checkboxes de colunas para exportação
- `.mirror-option` — seleção de planilha espelho
- `.common-columns-list` — listagem de colunas em comum entre planilhas

## Convenções
- `data-role` é usado como seletor padrão para interação via JS (`data-role="excel-file"`, etc.)
- `data-validator` no botão do card → abre o validador
- `data-cross-source` / `data-data-source` → identifica o workspace de planilha (left/right) no HTML
- Indentação: 4 espaços
- Comentários em português
- String quotes: aspas simples no núcleo, duplas nas camadas UI do Excel/js/ui (consistente em cada arquivo)

## Status Final
- [x] O memory bank foi revisado contra a implementação real em `Excel/`.
- [x] As convenções documentadas continuam válidas para o projeto atual.
- [x] A atualização do memory bank foi concluída.