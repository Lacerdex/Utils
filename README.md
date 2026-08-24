# Utils Excel

## Visão geral
Utils Excel é uma suíte local de ferramentas para manipulação, validação e cruzamento de planilhas Excel (.xlsx), executada diretamente no navegador. O projeto foi pensado para operar sem banco de dados, sem backend e sem ambiente de execução obrigatório. Toda a lógica de processamento é feita localmente na máquina do usuário.

## Objetivo do produto
A ferramenta foi criada para apoiar atividades de controle de qualidade e consolidação de dados em arquivos Excel, com foco em:

- validação de cabeçalhos;
- análise de qualidade de dados;
- validação de formato de campos;
- detecção de duplicidades;
- cruzamento de planilhas;
- geração de arquivos finais exportáveis.

## Arquitetura
A aplicação é uma SPA estática composta por HTML, CSS e JavaScript vanilla.

### Estrutura principal

```text
Utils/
├── Excel/
│   ├── index.html
│   ├── css/
│   │   ├── main.css
│   │   └── validators.css
│   ├── js/
│   │   ├── app.js
│   │   ├── core/
│   │   │   ├── excel-reader.js
│   │   │   ├── excel-writer.js
│   │   │   ├── excel-utils.js
│   │   │   └── csv-writer.js
│   │   ├── schemas/
│   │   │   ├── cadastro-schema.js
│   │   │   ├── column-aliases.js
│   │   │   └── schema-registry.js
│   │   ├── ui/
│   │   │   ├── header-validator-ui.js
│   │   │   ├── data-validator-ui.js
│   │   │   ├── format-validator-ui.js
│   │   │   ├── duplicate-validator-ui.js
│   │   │   ├── cross-validator-ui.js
│   │   │   ├── csv-converter-ui.js
│   │   │   ├── validator-registry.js
│   │   │   ├── sheet-workspace.js
│   │   │   └── dom.js
│   │   ├── validators/
│   │   │   ├── header-validator.js
│   │   │   ├── data-validator.js
│   │   │   ├── format-validator.js
│   │   │   ├── cross-validator.js
│   │   │   ├── csv-transform-validator.js
│   │   │   └── duplicate-validator.js
│   │   └── test-*.js
│   └── vendor/
│       └── xlsx.full.min.js
├── .memory-bank/
├── .github/
├── todo.md
├── todo2.md
├── README.md
└── .gitignore
```

## Fluxos de funcionamento

### 1. Validação de cabeçalho
Reconhece os campos observados na planilha, compara com o modelo esperado e aponta divergências como colunas faltantes ou extras.

### 2. Análise de qualidade
Compara duas planilhas, identifica colunas equivalentes e avalia o volume de preenchimento e inconsistências por campo.

### 3. Validação de formato
Checa padrões de CPF, e-mail, celular e demais campos reconhecidos, destacando valores fora do formato esperado.

### 4. Detecção de duplicados
Seleciona uma coluna-chave e indica registros repetidos com base em valores equivalentes normalizados.

### 5. Cruzamento de planilhas
Comparação por chave entre duas bases, com categorização de registros existentes nas duas, apenas na primeira ou apenas na segunda.

### 6. Exportação e conversão
Gera XLSX/CSV locais para uso posterior, permitindo a extração de resultados consolidados.

## Regras e limites do projeto

- Sem banco de dados.
- Sem backend.
- Sem servidor de aplicação obrigatório.
- Suporte principal para arquivos `.xlsx`.
- Dados processados e entregues localmente.
- Interface em português.
- Sem frameworks externos obrigatórios.

## Páginas do produto
O shell principal em `Excel/index.html` organiza a aplicação em páginas de:

- Validações;
- Modelos;
- Leitor;
- Documentação;
- Sobre.

### Páginas implementadas no fluxo atual
- Validação de cabeçalho
- Análise de qualidade
- Validação de formato
- Detecção de duplicados
- Cruzamento de planilhas
- Conversão Excel → CSV

## Observações de implementação
- O projeto é estático e depende de leitura local de arquivos do navegador.
- O processamento acontece em memória e não persiste automaticamente após recarga da página.
- A documentação e as páginas de sistema devem refletir o comportamento real, evitando promessas que não estejam implementadas ou que dependam de infraestrutura externa.

## Prompt para IA
Este repositório pode ser interpretado como um utilitário local de data quality para planilhas Excel. Quando uma IA estiver trabalhando nele, ela deve considerar:

1. que o projeto é 100% local, sem backend e sem banco;
2. que a interface é uma SPA em JavaScript puro;
3. que o foco atual é validação, cruzamento, qualidade e transformação de dados;
4. que os dados são processados do arquivo do usuário para a memória do navegador e exportados localmente;
5. que a documentação deve permanecer alinhada com o que foi implementado, sem inventar serviços, integrações ou persistência que não existem.

## Conclusão
Utils Excel é um data tool de apoio operacional para análise e cruzamento de dados em planilhas, com arquitetura leve, offline e direcionada a tarefas de padronização, comparação e qualidade. A documentação deste projeto deve ser mantida clara, técnica e funcional, destacando a natureza local e a ausência de infraestrutura externa.
