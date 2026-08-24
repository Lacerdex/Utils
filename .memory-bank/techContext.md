# Tech Context — Utils Excel

## Stack Tecnológica
- **HTML5** — estrutura da aplicação
- **CSS3** — estilos (main.css + validators.css)
- **JavaScript** (vanilla, IIFE modules) — toda a lógica
- **SheetJS (XLSX)** — biblioteca para leitura/escrita de .xlsx (carregada via CDN, processamento local no navegador)
- **Sem framework**: sem React, Vue, Angular ou build tools
- **Sem servidor**: arquivos abertos diretamente via `file://` ou servidor estático
- **Sem banco de dados**: nenhum armazenamento persistente

## Estrutura de Diretórios

```
Excel/
├── index.html           # Página principal (SPA com navegação por abas)
├── css/
│   ├── main.css         # Layout global, sidebar, cards
│   └── validators.css   # Estilos das páginas de validação
├── js/
│   ├── app.js           # Shell: navegação + ciclo de vida dos validadores
│   ├── core/
│   │   ├── excel-reader.js   # Leitura de .xlsx → documento normalizado
│   │   ├── excel-writer.js   # Exportação de dados → .xlsx
│   │   └── excel-utils.js    # Funções utilitárias (normalização, comparação, etc.)
│   ├── schemas/
│   │   ├── schema-registry.js  # Registro de modelos
│   │   └── cadastro-schema.js  # Modelo "Cadastro"
│   ├── ui/
│   │   ├── dom.js                 # Helpers de DOM (escapeHtml, fillSelect, etc.)
│   │   ├── validator-registry.js  # Registro dos validadores
│   │   ├── sheet-workspace.js     # Fluxo comum: arquivo → abas → aba selecionada
│   │   ├── header-validator-ui.js
│   │   ├── data-validator-ui.js
│   │   ├── format-validator-ui.js
│   │   ├── duplicate-validator-ui.js
│   │   └── cross-validator-ui.js
│   └── validators/
│       ├── header-validator.js    # Lógica de validação de cabeçalho
│       ├── data-validator.js      # Lógica de análise de qualidade
│       └── cross-validator.js     # Lógica de cruzamento entre planilhas
├── modelos/              # Modelos de planilha
└── assets/               # Recursos estáticos
```

## Dependência Crítica
- `XLSX` (SheetJS): usada em `excel-reader.js` e `excel-writer.js`. Se não carregada, apresenta erro explícito.

## Formato Normalizado de Sheet
```js
{
  name: "Planilha1",
  headers: ["Nome", "CPF", ...],
  rows: [{ Nome: "João", CPF: "123" }, ...],
  rowCount: number,
  columnCount: number
}
```

## Formato de Documento
```js
{
  workbook: Object,          // Workbook bruto do SheetJS
  sheetCount: number,
  sheetNames: [...],
  sheets: [SheetNormalizada, ...]
}
```

## Status da Atualização
- [x] A estrutura do memory bank foi validada.
- [x] O conjunto de arquivos em `Excel/` foi consultado para confirmar o estado real da implementação.
- [x] O memory bank foi alinhado com a execução dos testes existentes.