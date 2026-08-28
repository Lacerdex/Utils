# Utils Excel — Documentação Completa

> **Versão:** 1.0.0  
> **Execução:** 100% local no navegador  
> **Stack:** HTML5 + CSS3 + JavaScript Vanilla (IIFE) + SheetJS  
> **Idioma:** pt-BR

---

## Índice

1. [Visão geral](#1-visão-geral)
2. [Arquitetura](#2-arquitetura)
3. [Estrutura de diretórios](#3-estrutura-de-diretórios)
4. [Formato normalizado de dados](#4-formato-normalizado-de-dados)
5. [Ferramentas de validação](#5-ferramentas-de-validação)
   - 5.1 [Validação de cabeçalho](#51-validação-de-cabeçalho)
   - 5.2 [Análise de qualidade](#52-análise-de-qualidade)
   - 5.3 [Validação de formato](#53-validação-de-formato)
   - 5.4 [Detecção de duplicados](#54-detecção-de-duplicados)
   - 5.5 [Cruzamento de planilhas](#55-cruzamento-de-planilhas)
   - 5.6 [Conversão Excel → CSV](#56-conversão-excel--csv)
6. [Ferramentas auxiliares](#6-ferramentas-auxiliares)
   - 6.1 [Categorizador](#61-categorizador)
   - 6.2 [Cadastro de planilhas](#62-cadastro-de-planilhas)
   - 6.3 [Leitor](#63-leitor)
   - 6.4 [Modelos](#64-modelos)
7. [Schemas](#7-schemas)
   - 7.1 [Schema de Cadastro](#71-schema-de-cadastro)
   - 7.2 [Schema de Indicadores](#72-schema-de-indicadores)
8. [Camada de aliases](#8-camada-de-aliases)
9. [Núcleo (core)](#9-núcleo-core)
10. [Testes](#10-testes)
11. [Regras e limites do projeto](#11-regras-e-limites-do-projeto)
12. [Perguntas frequentes](#12-perguntas-frequentes)

---

## 1. Visão geral

**Utils Excel** é uma suíte local de ferramentas para manipulação, validação e cruzamento de planilhas Excel (.xlsx), executada diretamente no navegador. O projeto foi concebido para operar **sem banco de dados, sem backend e sem ambiente de execução obrigatório**. Toda a lógica de processamento é feita localmente na máquina do usuário.

### Objetivo do produto

A ferramenta foi criada para apoiar atividades de controle de qualidade e consolidação de dados em arquivos Excel, com foco em:

- Validação de cabeçalhos (comparação com modelo esperado)
- Análise de qualidade de dados (preenchimento e consistência)
- Validação de formato de campos (CPF, e-mail, celular)
- Detecção de duplicidades
- Cruzamento de planilhas (comparação por chaves)
- Conversão Excel → CSV (concatenação ou quebra de colunas)
- Categorização de registros
- Cadastro e reutilização de planilhas locais

---

## 2. Arquitetura

A aplicação é uma **SPA (Single Page Application)** estática composta por HTML, CSS e JavaScript vanilla, sem frameworks externos.

### Padrão de módulos (IIFE)

Todos os módulos JavaScript utilizam o padrão **IIFE (Immediately Invoked Function Expression)** com retorno de API pública:

```js
const Modulo = (() => {
    // estado interno privado
    function funcaoPrivada() { ... }
    return {
        funcaoPublica
    };
})();
```

### Registro de validadores

Cada validador se registra no `ValidatorRegistry` com:

| Propriedade | Descrição |
|---|---|
| `id` | Identificador usado no atributo `data-validator` do card |
| `pageId` | ID da seção correspondente no `index.html` |
| `title` | Título do validador |
| `ready` | Indica se a UI está implementada |
| `init()` | Chamado ao abrir o validador |
| `reset()` | Chamado ao sair/voltar |

### Fluxo comum (SheetWorkspace)

`SheetWorkspace.bind(root, options)` padroniza o fluxo de upload:

1. Selecionar arquivo .xlsx
2. Ler com `ExcelReader.read(file)` → documento normalizado
3. Selecionar aba (`sheet-select`)
4. Dispara `onSheetSelected(context)` com `{document, sheet, file, schema, log}`

### Navegação (app.js)

- `.nav-item[data-page]` → navega entre páginas principais (validators, models, reader, cadastro-planilhas, categorizer, docs, about)
- `[data-validator]` → abre um validador específico
- `[data-back-page]` → volta para a página principal
- Ao trocar de validador, chama `reset()` do atual

### Dependência externa

A única dependência externa é a biblioteca **SheetJS (XLSX)**, carregada via arquivo local em `vendor/xlsx.full.min.js`. O processamento é 100% no navegador — não há chamadas de rede.

---

## 3. Estrutura de diretórios

```
Utils/
├── Excel/
│   ├── index.html                  # Página principal (SPA)
│   ├── teste.html                  # Página de teste auxiliar
│   ├── css/
│   │   ├── main.css                # Layout global, sidebar, cards
│   │   └── validators.css          # Estilos das páginas de validação
│   ├── js/
│   │   ├── app.js                  # Shell: navegação + ciclo de vida
│   │   ├── core/
│   │   │   ├── excel-reader.js     # Leitura de .xlsx → documento normalizado
│   │   │   ├── excel-writer.js     # Exportação de dados → .xlsx
│   │   │   ├── excel-utils.js      # Funções utilitárias (normalização, etc.)
│   │   │   ├── csv-writer.js       # Construção e download de CSV (RFC 4180)
│   │   │   ├── category-utils.js   # Utilitários de categorização
│   │   │   └── planilha-storage.js # Armazenamento IndexedDB para cadastro
│   │   ├── schemas/
│   │   │   ├── schema-registry.js  # Registro de modelos de planilha
│   │   │   ├── cadastro-schema.js  # Schema "Cadastro de Pessoas"
│   │   │   ├── indicadores-schema.js # Schema "Registro de Indicadores"
│   │   │   └── column-aliases.js   # Aliases semânticos de colunas
│   │   ├── ui/
│   │   │   ├── dom.js              # Helpers de DOM (escapeHtml, fillSelect)
│   │   │   ├── validator-registry.js # Registro central de validadores
│   │   │   ├── sheet-workspace.js  # Fluxo comum arquivo → aba → dados
│   │   │   ├── header-validator-ui.js
│   │   │   ├── data-validator-ui.js
│   │   │   ├── format-validator-ui.js
│   │   │   ├── duplicate-validator-ui.js
│   │   │   ├── cross-validator-ui.js
│   │   │   ├── csv-converter-ui.js
│   │   │   ├── categorizer-ui.js
│   │   │   ├── planilha-cadastro-ui.js
│   │   │   ├── reader-ui.js
│   │   │   └── model-downloader.js
│   │   └── validators/
│   │       ├── header-validator.js     # Lógica de validação de cabeçalho
│   │       ├── data-validator.js       # Lógica de análise de qualidade
│   │       ├── format-validator.js     # Lógica de validação de formato
│   │       ├── duplicate-validator.js  # Lógica de detecção de duplicados
│   │       ├── cross-validator.js      # Lógica de cruzamento entre planilhas
│   │       └── csv-transform-validator.js # Lógica de transformação Excel → CSV
│   ├── validators/
│   │   └── header-validtor.html       # Validador de cabeçalho (página avulsa)
│   ├── modelos/
│   │   ├── cadastro_teste.xlsx        # Modelo de cadastro para testes
│   │   └── teste.xlsx                 # Planilha de teste
│   ├── testes/
│   │   ├── test-categorizer.js        # Teste do módulo de categorização
│   │   ├── test-consolidate.js        # Teste da função consolidate()
│   │   ├── test-csv-transform.js      # Teste da conversão Excel → CSV
│   │   └── test-duplicate-validator.js # Teste do validador de duplicatas
│   └── vendor/
│       └── xlsx.full.min.js           # SheetJS (biblioteca de leitura/escrita XLSX)
├── .memory-bank/                      # Memória do projeto (contexto para IA)
├── .github/                           # Configurações GitHub
├── README.md                          # README principal
├── DOCUMENTATION.md                   # Este documento
└── .gitignore
```

---

## 4. Formato normalizado de dados

Toda planilha lida pelo sistema é convertida para um formato padronizado.

### Sheet (aba normalizada)

```js
{
    name: "Planilha1",
    headers: ["Nome", "CPF", "E-mail"],
    rows: [
        { "Nome": "João", "CPF": "123", "E-mail": "joao@email.com" },
        { "Nome": "Maria", "CPF": "456", "E-mail": "maria@email.com" }
    ],
    rowCount: 2,
    columnCount: 3
}
```

### Documento (arquivo completo)

```js
{
    workbook: Object,           // Workbook bruto do SheetJS
    sheetCount: number,
    sheetNames: ["Planilha1", "Planilha2"],
    sheets: [SheetNormalizada, ...]
}
```

---

## 5. Ferramentas de validação

### 5.1 Validação de cabeçalho

**Arquivos:** `js/validators/header-validator.js`, `js/ui/header-validator-ui.js`  
**Card:** Validações → Estrutura

Reconhece automaticamente as colunas da planilha e compara com o modelo esperado (schema). A comparação ignora maiúsculas/minúsculas, acentos e espaços extras.

**Como usar:**

1. Em **Modelo**, escolha o schema de referência (ex.: Cadastro)
2. Selecione o arquivo .xlsx e aguarde a leitura
3. Escolha a aba que contém os dados
4. Confira os cabeçalhos detectados e o resultado: campos encontrados, ausentes e colunas extras

**Indicadores do resultado:**

| Indicador | Descrição |
|---|---|
| Campos esperados | Total de campos no schema selecionado |
| Encontrados | Campos reconhecidos na planilha |
| Ausentes | Campos do schema não encontrados |
| Obrigatórios ausentes | Campos marcados como `required: true` que não foram encontrados |
| Colunas extras | Colunas na planilha que não pertencem ao schema |
| Duplicados | Cabeçalhos duplicados na planilha |

---

### 5.2 Análise de qualidade

**Arquivos:** `js/validators/data-validator.js`, `js/ui/data-validator-ui.js`  
**Card:** Validações → Qualidade

Compara duas planilhas, identifica colunas equivalentes e avalia o volume de preenchimento e inconsistências por campo.

**Como usar:**

1. Selecione a **Planilha 1** e a aba desejada
2. Selecione a **Planilha 2** e a aba desejada
3. Escolha a **planilha espelho** (base para o resultado final)
4. Confira as colunas em comum e o resultado da validação
5. Selecione as colunas desejadas de cada planilha e exporte o resultado

**Funcionalidades:**

- Identificação automática de colunas equivalentes entre as duas planilhas
- Métricas de preenchimento por campo (percentual de valores preenchidos)
- Seleção de planilha espelho para definir a base do resultado
- Exportação do resultado final em .xlsx com colunas selecionáveis

---

### 5.3 Validação de formato

**Arquivos:** `js/validators/format-validator.js`, `js/ui/format-validator-ui.js`  
**Card:** Validações → Formato

Verifica se os valores das colunas estão no formato esperado, como CPF, e-mail e celular.

**Formatos reconhecidos:**

| Formato | Critério de validação |
|---|---|
| CPF | 11 dígitos numéricos (ignora pontuação) |
| E-mail | Presença de `@` e domínio válido |
| Celular | Código de área + 9 dígitos (padrão brasileiro) |

**Como usar:**

1. Selecione o schema/modelo de referência
2. Carregue o arquivo .xlsx e escolha a aba
3. Visualize o resultado: cada campo é classificado como válido ou inválido

---

### 5.4 Detecção de duplicados

**Arquivos:** `js/validators/duplicate-validator.js`, `js/ui/duplicate-validator-ui.js`  
**Card:** Validações → Consistência

Identifica registros duplicados utilizando uma coluna-chave selecionada.

**Modos de resultado:**

| Modo | Descrição |
|---|---|
| **Únicos** | Remove registros duplicados completos (mesmo valor em todas as colunas) |
| **Duplicados** | Preserva todos os registros do grupo repetido |
| **Quebra de colunas** | Cria colunas dinâmicas numeradas (ex.: `Email 1`, `Email 2`) |
| **Concatenação** | Consolida valores em mesma célula com separador `;` |

**Como usar:**

1. Carregue o arquivo .xlsx e escolha a aba
2. Selecione a **coluna-chave** para detecção
3. Configure o modo de resultado e visualize a prévia
4. Exporte o resultado em .xlsx ou CSV

---

### 5.5 Cruzamento de planilhas

**Arquivos:** `js/validators/cross-validator.js`, `js/ui/cross-validator-ui.js`  
**Card:** Validações → Comparação

Comparação por chave entre duas bases, com categorização de registros existentes nas duas, apenas na primeira ou apenas na segunda.

**Como usar:**

1. Selecione a **Planilha 1** e a aba desejada
2. Selecione a **Planilha 2** e a aba desejada
3. Defina as **chaves de cruzamento** (até 3 pares equivalentes sugeridos automaticamente)
4. Clique em **Cruzar planilhas** para ver o resumo
5. Extraia o resultado escolhendo o conjunto (nas duas / só 1 / só 2) e as colunas de cada lado
6. Opcionalmente, gere a **planilha consolidada**: todos os registros em uma tabela única, indicando a origem de cada informação e possíveis duplicidades

**Funcionalidades:**

- Sugestão automática de pares de chave por equivalência semântica (aliases)
- Correspondência por normalização (espaços extras, maiúsculas/minúsculas)
- Registros com chave vazia ficam no conjunto "só na planilha" de origem
- Consolidação: mescla todas as colunas das duas planilhas em uma única tabela, com sufixos `(Planilha 1)` / `(Planilha 2)` e coluna `Duplicado` indicando campos iguais

---

### 5.6 Conversão Excel → CSV

**Arquivos:** `js/validators/csv-transform-validator.js`, `js/ui/csv-converter-ui.js`, `js/core/csv-writer.js`  
**Card:** Validações → Conversão

Converte uma aba da planilha para CSV consolidando registros repetidos da coluna principal.

**Formatos de saída:**

| Formato | Descrição |
|---|---|
| **Concatenado** | Vários valores na mesma célula, unidos por um separador interno (`;`, `,`, `\|`) |
| **Quebra de colunas** | Uma coluna numerada por valor (`Telefone 1`, `Telefone 2`, ...) |

**Funcionalidades:**

- Validação da coluna principal (vazios, duplicados, categoria via alias)
- Sugestão automática de colunas relacionadas (mesma categoria da principal)
- Remoção opcional de duplicados internos
- CSV em UTF-8 com BOM e escape conforme RFC 4180

**Como usar:**

1. Selecione o arquivo .xlsx e a aba desejada
2. Confira os cabeçalhos identificados (colunas com alias conhecido recebem rótulo)
3. Escolha a **coluna principal** (mãe/alvo)
4. Marque as colunas relacionadas
5. Defina o formato (concatenado ou quebra), separadores e tratamento de duplicados
6. Gere a **prévia** e exporte o CSV

---

## 6. Ferramentas auxiliares

### 6.1 Categorizador

**Arquivos:** `js/core/category-utils.js`, `js/ui/categorizer-ui.js`  
**Página:** Categorização (sidebar)

Importe uma planilha, organize categorias e marque os registros por classificação sem perder nenhum dado original.

**Funcionalidades:**

- Criação de categorias com validação (nome vazio, duplicado)
- Marcação/desmarcação individual de registros por categoria
- Contagem de registros por categoria
- Exportação com colunas extras de categoria (marcado com "X" ou vazio)
- Preservação integral dos dados originais

**Como usar:**

1. Importe um arquivo .xlsx
2. Selecione a aba e a coluna-alvo (referência visual)
3. Crie categorias (ex.: "Clientes VIP", "Newsletter")
4. Marque os registros em cada categoria
5. Exporte o resultado com as colunas de categoria

---

### 6.2 Cadastro de planilhas

**Arquivos:** `js/core/planilha-storage.js`, `js/ui/planilha-cadastro-ui.js`  
**Página:** Cadastro (sidebar)

Registre planilhas locais em um catálogo seguro usando **IndexedDB**, mantendo a estrutura por extensão e reutilizando os arquivos já cadastrados nas ferramentas existentes.

**Funcionalidades:**

- Upload por arrastar/soltar ou seletor de arquivos
- Suporte a .xlsx, .xls e .csv
- Armazenamento em IndexedDB (persistente no navegador)
- Busca e filtro por nome e tipo de arquivo
- Ações de visualização e exclusão

**Como usar:**

1. Arraste uma planilha para a área de upload ou clique para selecionar
2. Dê um nome para o cadastro e escolha a pasta de destino
3. Clique em **Cadastrar**
4. Navegue pelas planilhas cadastradas usando busca e filtros

---

### 6.3 Leitor

**Arquivos:** `js/ui/reader-ui.js`  
**Página:** Leitor (sidebar)

Leitura e exploração simples de arquivos Excel, com visualização em tabela das primeiras 50 linhas.

**Como usar:**

1. Selecione o arquivo .xlsx
2. Escolha a aba desejada
3. Visualize as informações da aba (nome, linhas, colunas)
4. Confira a prévia dos dados em tabela

---

### 6.4 Modelos

**Arquivos:** `js/ui/model-downloader.js`  
**Página:** Modelos (sidebar)

Planilhas prontas para download, geradas a partir dos schemas registrados.

**Modelos disponíveis:**

| Modelo | Schema | Campos |
|---|---|---|
| Cadastro | `CadastroSchema` | Nome, E-mail, Celular, CPF, Cargo, Empresa |
| Indicadores | `IndicadoresSchema` | Período, Indicador, Valor, Meta, Status, Responsável, Observações |

---

## 7. Schemas

Os schemas definem a estrutura esperada das planilhas e são usados pelos validadores de cabeçalho e formato.

### 7.1 Schema de Cadastro

**Arquivo:** `js/schemas/cadastro-schema.js`

```js
{
    name: "cadastro",
    label: "Cadastro de Pessoas",
    fields: {
        nome:     { label: "Nome",     required: true  },
        email:    { label: "E-mail",   required: false },
        celular:  { label: "Celular",  required: false },
        cpf:      { label: "CPF",      required: false },
        cargo:    { label: "Cargo",    required: false },
        empresa:  { label: "Empresa",  required: false }
    }
}
```

Cada campo possui:
- `label`: nome de exibição
- `required`: se o campo é obrigatório
- `aliases`: lista de variações de nome reconhecidas

### 7.2 Schema de Indicadores

**Arquivo:** `js/schemas/indicadores-schema.js`

```js
{
    name: "indicadores",
    label: "Registro de Indicadores",
    fields: {
        periodo:      { label: "Período",      required: true  },
        indicador:    { label: "Indicador",    required: true  },
        valor:        { label: "Valor",        required: true  },
        meta:         { label: "Meta",         required: false },
        status:       { label: "Status",       required: false },
        responsavel:  { label: "Responsável",  required: false },
        observacoes:  { label: "Observações",  required: false }
    }
}
```

---

## 8. Camada de aliases

**Arquivo:** `js/schemas/column-aliases.js`

A camada de aliases identifica colunas semanticamente equivalentes mesmo quando os nomes dos cabeçalhos são diferentes. Ela alimenta as sugestões do cruzamento, os rótulos da conversão CSV e a escolha da coluna principal.

### Categorias reconhecidas

| Categoria | Exemplos de nomes reconhecidos |
|---|---|
| **Nome** | nome, nome completo, cliente, pessoa, razão social |
| **E-mail** | email, correio eletrônico, endereço de email |
| **Telefone** | telefone, tel, celular, whatsapp, contato |
| **CPF** | cpf, documento cpf, cadastro de pessoa física |
| **CNPJ** | cnpj, documento cnpj, cadastro nacional de pessoa jurídica |
| **Código** | codigo, id, matrícula, número do cliente, identificador |
| **Cidade** | cidade, município |

### Funções da API

| Função | Descrição |
|---|---|
| `findCategory(header)` | Identifica a categoria de um cabeçalho |
| `relatedHeaders(headers, category)` | Encontra colunas de uma categoria em uma lista |
| `suggestMainCategory(headers)` | Sugere a categoria mais provável para coluna principal |
| `listCategories()` | Lista todas as categorias registradas |
| `getAliases(categoryName)` | Retorna os aliases de uma categoria |

---

## 9. Núcleo (core)

### ExcelReader (`js/core/excel-reader.js`)

Leitura de arquivos .xlsx utilizando SheetJS. Retorna um documento normalizado com todas as abas e seus dados em formato padronizado.

### ExcelWriter (`js/core/excel-writer.js`)

Exportação de dados para .xlsx. Suporta:

- Criação de workbook e worksheets
- Exportação a partir de array de objetos (JSON) ou matriz (array de arrays)
- Exportação de worksheet avulsa
- Download automático do arquivo

### ExcelUtils (`js/core/excel-utils.js`)

Funções utilitárias compartilhadas:

- `normalizeForComparison(value)`: normaliza string (minúsculas, sem acentos, espaços simples) para comparação
- `findColumn(headers, target)`: encontra coluna por nome com normalização
- `findCommonColumns(headersA, headersB)`: identifica colunas em comum entre duas planilhas
- `findMatchingColumns(headersA, headersB)`: encontra pares equivalentes entre duas listas de cabeçalhos

### CsvWriter (`js/core/csv-writer.js`)

Construção e download de arquivos CSV conforme RFC 4180:

- Escape automático de células com separadores, aspas ou quebras de linha
- UTF-8 com BOM para preservar acentos ao abrir no Excel
- Download via Blob URL

### CategoryUtils (`js/core/category-utils.js`)

Utilitários para o módulo de categorização:

- `normalizeCategoryName(value)`: normaliza nome de categoria
- `validateCategoryName(value, existingNames)`: valida nome (vazio, duplicado)
- `createSelectionMap(categories)`: cria mapa de seleção
- `setSelectionState(map, category, rowIndex, selected)`: marca/desmarca registro
- `buildExportRows(originalRows, categories, selectionMap)`: gera linhas exportáveis com colunas de categoria

### PlanilhaStorage (`js/core/planilha-storage.js`)

Armazenamento persistente via IndexedDB para o módulo de cadastro de planilhas:

- `save(record)`: salva uma planilha no banco local
- `list()`: lista todas as planilhas cadastradas
- `search(query)`: busca planilhas por nome
- `remove(id)`: remove uma planilha do cadastro

---

## 10. Testes

O projeto inclui testes automatizados executáveis com Node.js na pasta `Excel/testes/`.

### Teste de categorização (`test-categorizer.js`)

```bash
node Excel/testes/test-categorizer.js
```

Verifica:
- Validação de nomes de categoria (vazio, duplicado)
- Criação e manipulação de mapa de seleção
- Exportação com colunas de categoria
- Preservação dos dados originais

### Teste de consolidação (`test-consolidate.js`)

```bash
node Excel/testes/test-consolidate.js
```

Verifica:
- Consolidação de duas planilhas por chave
- Identificação de colunas de origem com sufixos
- Preservação de todos os registros
- Detecção de campos duplicados entre fontes
- Correspondência por normalização (espaços extras)

### Teste de conversão CSV (`test-csv-transform.js`)

```bash
node Excel/testes/test-csv-transform.js
```

Verifica:
- Reconhecimento de aliases
- Validação da coluna principal
- Formato concatenado com separador
- Formato de quebra de colunas
- Remoção opcional de duplicados
- Geração de CSV com UTF-8 BOM

### Teste de duplicados (`test-duplicate-validator.js`)

```bash
node Excel/testes/test-duplicate-validator.js
```

Verifica:
- Validação da coluna-chave
- Modo únicos (remove duplicatas completas)
- Modo duplicados (preserva todos)
- Quebra de colunas (headers dinâmicos)
- Concatenação (consolidação em mesma célula)
- Exportação CSV

---

## 11. Regras e limites do projeto

- **Sem banco de dados** — exceto IndexedDB para o cadastro opcional de planilhas
- **Sem backend** — toda a lógica é processada no navegador
- **Sem servidor de aplicação obrigatório** — arquivos .html podem ser abertos diretamente via `file://`
- **Suporte principal para arquivos .xlsx** — .xls e .csv têm suporte parcial no cadastro
- **Dados processados e entregues localmente** — nenhum dado sai da máquina do usuário
- **Interface em português** (pt-BR)
- **Sem frameworks externos obrigatórios** — única dependência é SheetJS (XLSX)
- **Processamento em memória** — dados não persistem automaticamente após recarga da página
- **Cabeçalho na primeira linha** — todas as ferramentas assumem que a primeira linha contém os nomes das colunas

---

## 12. Perguntas frequentes

### Preciso instalar algo?

Não. Basta abrir o arquivo `Excel/index.html` em qualquer navegador moderno (Chrome, Edge, Firefox). O SheetJS já está incluído em `vendor/xlsx.full.min.js`.

### Meus dados são enviados para algum servidor?

Não. Todo o processamento ocorre localmente no navegador. Nenhum dado é enviado para a internet.

### Posso usar arquivos .xls ou .csv?

O suporte principal é para .xlsx. O cadastro de planilhas aceita .xls e .csv, mas os validadores principais funcionam apenas com .xlsx.

### Os dados persistem entre sessões?

Não automaticamente. O cadastro de planilhas utiliza IndexedDB e persiste os metadados no navegador. Os demais validadores processam em memória — ao recarregar a página, os dados são perdidos.

### Qual o limite de tamanho de arquivo?

Não há limite imposto pelo sistema, mas navegadores podem ter limitações de memória para arquivos muito grandes (centenas de MB). Recomenda-se arquivos de até ~50 MB para desempenho adequado.

### O que significa "planilha espelho"?

É a planilha usada como base (referência) para o resultado final na análise de qualidade. As colunas em comum são avaliadas contra essa planilha.

### Como funciona a correspondência por aliases?

A camada de aliases normaliza os nomes das colunas (remove acentos, converte para minúsculas, remove espaços extras) e compara com uma lista de variações conhecidas. Por exemplo, "E-mail", "email" e "correio eletrônico" são todos reconhecidos como pertencentes à categoria "email".