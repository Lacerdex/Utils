# Changelog — Utils Excel v1.1

Data: 23/08/2026

## Resumo das Mudanças

### Novas Funcionalidades
1. **Schema de Indicadores** - Modelo de planilha para registro de indicadores
2. **Download de Modelos** - Geração automática de modelos Excel baseados em schemas
3. **Página Leitor** - Exploração interativa de arquivos Excel

## Detalhes Técnicos

### 1. Schema de Indicadores
**Arquivo**: `js/schemas/indicadores-schema.js`

Novo schema com os seguintes campos:
- período (required): Período/mês do indicador
- indicador (required): Nome do indicador
- valor (required): Valor/resultado do indicador
- meta (optional): Meta esperada
- status (optional): Status do indicador
- responsável (optional): Pessoa responsável
- observações (optional): Notas adicionais

Aliases configurados para cada campo para melhor reconhecimento automático.

**Integração**: Registrado automaticamente no `SchemaRegistry` ao carregar o HTML.

### 2. Download de Modelos
**Arquivo**: `js/ui/model-downloader.js`

Módulo `ModelDownloader` com funcionalidades:
- `downloadModel(modelKey)` - Gera e faz download de um modelo
- `init()` - Inicializa listeners dos botões

**Fluxo**:
1. Botão clicado → `downloadModel()` chamado
2. Schema obtido do `SchemaRegistry.get(modelKey)`
3. Sheet criada com headers do schema
4. Convertida para workbook SheetJS
5. Exportada como .xlsx via `XLSX.writeFile()`

**Bugfix**: Corrigido de `SchemaRegistry.getByName()` para `SchemaRegistry.get()` (API correta do registry).

**Modelos Disponíveis**:
- cadastro-modelo.xlsx (Cadastro de Pessoas)
- indicadores-modelo.xlsx (Registro de Indicadores)

### 3. Página Leitor
**Arquivo**: `js/ui/reader-ui.js`

Novo módulo `ReaderUI` para exploração de arquivos Excel com:

**Features**:
- Upload de arquivo via `SheetWorkspace.bind()`
- Seleção de aba com informações do arquivo
- Tabela com primeiras 50 linhas
- Grid mostrando: aba, número de linhas, número de colunas
- Aviso quando há mais de 50 linhas (sugestão de export)

**Funções Principais**:
- `handleSheetSelected(context)` - Processado quando aba é selecionada
- `renderSheetInfo(sheet, sheetName)` - Exibe informações da aba
- `renderSheetPreview(sheet)` - Exibe tabela com dados
- `escapeHtml(text)` - Sanitização de dados para segurança

**Integração no HTML**:
```html
<section id="page-reader" data-reader-source>
  <!-- Upload via SheetWorkspace -->
  <!-- Informações da aba -->
  <!-- Pré-visualização de tabela -->
</section>
```

### 4. CSS para Leitor
**Arquivo**: `css/validators.css`

Novas classes de estilo:
- `.reader-table` - Tabela com estilo consistente com consolidate-table
- `.reader-info-grid` - Grid de informações (3 colunas adaptáveis)
- `.reader-notice` - Notice informativo (primárias em azul)
- Media queries para responsividade em telas menores

## Arquivos Modificados

### HTML (`index.html`)
- Adicionado referência: `js/schemas/indicadores-schema.js`
- Adicionado referência: `js/ui/model-downloader.js`
- Adicionado referência: `js/ui/reader-ui.js`
- Substituída página Leitor: removido empty-state, adicionada estrutura funcional

### CSS (`css/validators.css`)
- Adicionados estilos para leitor
- Adicionadas media queries para responsividade

## Testes Realizados

✓ SchemaRegistry carregando corretamente
✓ Ambos os schemas (cadastro, indicadores) registrados
✓ Página de Modelos navegável
✓ Página de Leitor navegável
✓ Estrutura HTML completa e sem erros

## Próximas Melhorias

1. **Testes com Arquivos Reais**
   - Validar downloads com dados reais
   - Testar Leitor com arquivos >100k linhas
   - Verificar performance em navegadores

2. **Funcionalidades Adicionais**
   - Export de dados do Leitor (copiar para clipboard, download CSV)
   - Busca/filtro na visualização do Leitor
   - Estatísticas básicas (média, máximo, mínimo) para colunas numéricas

3. **Documentação de Usuário**
   - Guia de uso do Leitor
   - Exemplos de modelos baixados
   - Boas práticas para estrutura de dados

## Notas de Implementação

### Padrão de Código
- Mantém IIFE (Immediately Invoked Function Expression)
- Sem frameworks externos
- Indentação de 4 espaços
- Comentários em português brasileiro

### Compatibilidade
- Funciona com SheetJS (XLSX)
- Sem dependências de servidor
- Processamento 100% no navegador

### Performance
- Limita visualização a 50 linhas (evita travamentos)
- Sugere export para análise completa
- Schemas registram por referência (não por cópia)

## Validação da Versão

Todos os critérios de qualidade atendidos:
- ✓ Sem erros de sintaxe
- ✓ Padrão de código consistente
- ✓ Documentação em memory-bank
- ✓ Testes básicos de funcionalidade
- ✓ Responsividade testada
