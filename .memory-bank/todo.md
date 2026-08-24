# TASK — Cadastro e Gerenciamento Local de Planilhas

O projeto já está em desenvolvimento e possui diversas funcionalidades relacionadas à leitura, validação, cruzamento, categorização e exportação de planilhas.

Agora precisamos implementar uma nova funcionalidade de **Cadastro e Gerenciamento Local de Planilhas**.

Essa funcionalidade deverá permitir que o usuário cadastre arquivos `.xlsx`, `.xls` e `.csv`, mantendo-os organizados em uma estrutura de pastas localmente no computador.

O sistema deverá conseguir consultar essa estrutura posteriormente para listar, pesquisar e selecionar as planilhas cadastradas.

## REGRA PRINCIPAL

Não criar uma aplicação ou página independente.

A funcionalidade deve ser integrada ao projeto existente, respeitando:

* Estrutura HTML atual;
* Design System existente;
* CSS existente;
* Componentes existentes;
* Padrões de UX já utilizados;
* Organização atual de JavaScript;
* Backend existente;
* Rotas existentes;
* Sistema de leitura de Excel/CSV já implementado.

Antes de implementar, analisar a estrutura atual do projeto e reutilizar o máximo possível do que já existe.

---

# 1. Objetivo

Criar uma nova área:

```text
Cadastro de Planilhas
```

Essa área funcionará como um gerenciador local de arquivos de planilhas.

O usuário deverá conseguir:

* Cadastrar uma planilha;
* Armazenar a planilha localmente;
* Consultar as planilhas já cadastradas;
* Pesquisar por nome;
* Filtrar por extensão;
* Visualizar informações do arquivo;
* Selecionar uma planilha;
* Abrir/utilizar uma planilha nas funcionalidades do sistema;
* Excluir uma planilha cadastrada;
* Atualizar a listagem;
* Manter os arquivos organizados em pastas.

---

# 2. Formatos suportados

Inicialmente aceitar:

```text
.xlsx
.xls
.csv
```

Não permitir arquivos que não sejam desses formatos.

A validação deverá existir tanto no frontend quanto no backend.

Exemplo:

```text
.xlsx → permitido
.xls  → permitido
.csv  → permitido
.pdf  → rejeitado
.docx → rejeitado
.exe  → rejeitado
.png  → rejeitado
```

---

# 3. Estrutura local de armazenamento

Criar uma estrutura local para armazenamento das planilhas.

A estrutura deverá ficar isolada dos demais arquivos do sistema.

Sugestão:

```text
data/
└── planilhas/
    ├── excel/
    │   ├── arquivo1.xlsx
    │   ├── arquivo2.xlsx
    │   └── arquivo3.xls
    │
    └── csv/
        ├── clientes.csv
        └── produtos.csv
```

Porém, antes de criar essa estrutura, verificar se o projeto já possui uma pasta destinada a uploads/arquivos.

Se já existir uma estrutura consolidada, reutilizá-la em vez de criar outra estrutura paralela.

---

# 4. Organização por extensão

As extensões poderão ser organizadas em diretórios próprios.

Exemplo:

```text
planilhas/
├── excel/
└── csv/
```

Arquivos Excel:

```text
planilhas/excel/
```

Arquivos CSV:

```text
planilhas/csv/
```

Caso o projeto já possua uma estrutura melhor para isso, adaptar sem quebrar a organização existente.

---

# 5. Não armazenar o arquivo no banco

O arquivo físico não deverá ser armazenado como BLOB no banco de dados.

O arquivo deverá permanecer no sistema de arquivos local.

Caso seja necessário utilizar banco de dados para metadados, armazenar apenas informações como:

```text
id
nome_original
nome_arquivo
extensao
caminho_relativo
tamanho
data_cadastro
data_modificacao
```

Nunca armazenar o conteúdo completo da planilha no banco sem necessidade.

---

# 6. Cadastro

A interface deverá possuir uma área clara para cadastrar uma nova planilha.

Exemplo:

```text
┌─────────────────────────────────────────┐
│ Cadastrar planilha                      │
│                                         │
│ [ Selecionar arquivo ]                  │
│                                         │
│ Formatos aceitos: XLSX, XLS e CSV       │
│                                         │
│                [ Cadastrar ]            │
└─────────────────────────────────────────┘
```

Também poderá suportar:

```text
Arraste e solte sua planilha aqui
```

com:

```text
ou
```

e um botão:

```text
[ Selecionar arquivo ]
```

---

# 7. Drag and Drop

Implementar uma área de Drag & Drop seguindo o padrão visual do projeto.

Exemplo:

```text
┌───────────────────────────────────────────┐
│                                           │
│        Arraste sua planilha aqui          │
│                                           │
│                 ou                        │
│                                           │
│          [ Selecionar arquivo ]           │
│                                           │
│       XLSX • XLS • CSV                    │
└───────────────────────────────────────────┘
```

Ao arrastar um arquivo para a área:

* destacar visualmente a região;
* informar que o arquivo pode ser solto;
* validar a extensão;
* mostrar o nome do arquivo após a seleção.

---

# 8. Validação antes do cadastro

Antes de salvar:

### Validar extensão

```text
.xlsx
.xls
.csv
```

### Validar arquivo

Não aceitar:

```text
arquivo.pdf
arquivo.docx
imagem.png
```

### Validar nome

O nome do arquivo deve ser tratado com segurança.

Não permitir que o nome fornecido pelo usuário consiga:

* navegar para diretórios superiores;
* criar caminhos arbitrários;
* sobrescrever arquivos fora da pasta de planilhas.

Utilizar o nome original apenas como informação de exibição quando necessário.

---

# 9. Nomes duplicados

Caso o usuário tente cadastrar:

```text
clientes.xlsx
```

e já exista:

```text
clientes.xlsx
```

não sobrescrever silenciosamente o arquivo existente.

Apresentar uma decisão clara.

Exemplo:

```text
A planilha "clientes.xlsx" já está cadastrada.

O que deseja fazer?

[ Cancelar ]

[ Cadastrar como nova versão ]

[ Substituir existente ]
```

Se a substituição for implementada, deverá exigir confirmação explícita.

---

# 10. Alternativa para nomes duplicados

Caso o projeto prefira não permitir substituição, gerar um nome seguro automaticamente.

Exemplo:

```text
clientes.xlsx
clientes (1).xlsx
clientes (2).xlsx
```

A escolha deverá seguir o padrão existente do projeto.

Não criar comportamentos diferentes entre funcionalidades.

---

# 11. Listagem de planilhas

Abaixo ou ao lado da área de cadastro deverá existir o leitor/listagem das planilhas cadastradas.

Exemplo:

```text
Planilhas cadastradas

┌─────────────────────────────────────────────┐
│ Nome             Tipo     Tamanho    Data   │
├─────────────────────────────────────────────┤
│ clientes.xlsx    XLSX     2.4 MB    24/08  │
│ vendas.csv       CSV      850 KB     23/08  │
│ produtos.xlsx    XLSX     1.2 MB    22/08  │
└─────────────────────────────────────────────┘
```

A interface deve respeitar o HTML e os componentes já utilizados no projeto.

---

# 12. Informações apresentadas

Cada arquivo deverá apresentar, quando disponível:

```text
Nome
Extensão
Tamanho
Data de cadastro
Data de modificação
```

Opcionalmente:

```text
Quantidade de linhas
Quantidade de colunas
Quantidade de abas
```

Essas informações adicionais só devem ser calculadas se não causarem impacto significativo no carregamento.

---

# 13. Filtro por nome

Adicionar um campo de busca:

```text
🔎 Pesquisar planilha...
```

A pesquisa deverá permitir procurar pelo nome do arquivo.

Exemplo:

Arquivos:

```text
clientes.xlsx
clientes_2026.xlsx
produtos.xlsx
vendas.csv
```

Pesquisa:

```text
clientes
```

Resultado:

```text
clientes.xlsx
clientes_2026.xlsx
```

A pesquisa deverá funcionar sem diferenciar maiúsculas/minúsculas.

Exemplo:

```text
CLIENTES
clientes
Clientes
```

devem produzir o mesmo resultado.

---

# 14. Filtro por extensão

Adicionar um filtro:

```text
Tipo:

[ Todos ▼ ]
```

Opções:

```text
Todos
Excel
CSV
XLSX
XLS
```

Exemplo:

```text
Tipo: CSV
```

deverá mostrar somente:

```text
clientes.csv
vendas.csv
produtos.csv
```

---

# 15. Busca combinada

O filtro por nome e extensão deverá funcionar simultaneamente.

Exemplo:

```text
Pesquisa:
clientes

Tipo:
CSV
```

Resultado:

```text
clientes.csv
clientes_2026.csv
```

Não mostrar:

```text
clientes.xlsx
```

---

# 16. Limpar filtros

Adicionar uma ação:

```text
[ Limpar filtros ]
```

que restaure:

```text
Pesquisa → vazia
Tipo → Todos
```

e apresente novamente todas as planilhas.

---

# 17. Ordenação

Permitir ordenar a listagem.

Opções sugeridas:

```text
Nome
Data de cadastro
Data de modificação
Tamanho
Extensão
```

Exemplo:

```text
Ordenar por:

[ Nome ▼ ]

[ ↑ Crescente ]
[ ↓ Decrescente ]
```

Caso já exista componente de ordenação no projeto, reutilizá-lo.

---

# 18. Atualizar listagem

Adicionar um botão:

```text
↻ Atualizar
```

O objetivo é consultar novamente a estrutura local.

Ao clicar:

```text
estrutura local
      ↓
listar arquivos
      ↓
atualizar interface
```

Não depender exclusivamente do estado mantido no frontend.

A fonte de verdade deverá ser o armazenamento local.

---

# 19. Seleção de planilha

Cada item da listagem deverá possuir uma ação:

```text
[ Selecionar ]
```

ou permitir selecionar diretamente o registro.

Exemplo:

```text
☐ clientes.xlsx
☐ vendas.csv
☐ produtos.xlsx
```

Também poderá existir:

```text
[ Selecionar ]
```

na própria linha.

---

# 20. Utilização da planilha

Depois que uma planilha for selecionada, o sistema deverá permitir utilizá-la nas funcionalidades existentes.

Exemplo:

```text
clientes.xlsx
```

poderá ser enviado para:

```text
Validador de Cabeçalhos
Validador de Duplicatas
Cruzamento de Planilhas
Categorizador
Excel → CSV
```

Sempre que possível, as funcionalidades devem trabalhar com a referência do arquivo cadastrado em vez de exigir que o usuário selecione novamente o arquivo.

---

# 21. Integração com o Cruzamento de Planilhas

O Cadastro de Planilhas deverá permitir selecionar arquivos cadastrados para o cruzamento.

Exemplo:

```text
Planilha 1:
[ clientes.xlsx ▼ ]

Planilha 2:
[ contatos.csv ▼ ]
```

Isso deverá utilizar a mesma fonte de arquivos cadastrados.

Não criar outro sistema de armazenamento.

---

# 22. Integração com o Validador de Duplicatas

O usuário poderá selecionar:

```text
clientes.xlsx
```

diretamente do cadastro.

Depois escolher:

```text
Coluna-chave
Únicos/Duplicados
Método de extração
Formato de exportação
```

A funcionalidade deve utilizar o arquivo cadastrado.

---

# 23. Integração com o Categorizador

O Categorizador também deverá conseguir utilizar uma planilha cadastrada.

Fluxo:

```text
Cadastro
   ↓
Selecionar clientes.xlsx
   ↓
Categorizador
   ↓
Selecionar aba
   ↓
Selecionar coluna
   ↓
Categorizar
```

---

# 24. Visualização rápida

Considerar adicionar uma ação:

```text
[ Visualizar ]
```

que permita abrir uma prévia da planilha sem necessariamente entrar em uma ferramenta de processamento.

Exemplo:

```text
clientes.xlsx

Aba:
[ Clientes ▼ ]

Nome       | Email
-----------|------------------
João Pedro | teste@gmail.com
Maria      | maria@gmail.com
```

A visualização deverá ser somente leitura.

Não alterar o arquivo original.

---

# 25. Abrir detalhes

Opcionalmente, cada planilha poderá possuir uma área de detalhes:

```text
clientes.xlsx

Tipo: Excel
Tamanho: 2.4 MB
Cadastrada: 24/08/2026
Modificada: 24/08/2026

Abas:
- Clientes
- Histórico
- Configurações

[ Visualizar ]
[ Usar planilha ]
[ Excluir ]
```

---

# 26. Exclusão

Permitir excluir uma planilha cadastrada.

Porém, nunca excluir sem confirmação.

Exemplo:

```text
Deseja realmente excluir:

clientes.xlsx

Esta ação removerá o arquivo da estrutura local.

[ Cancelar ] [ Excluir ]
```

Após a exclusão:

```text
arquivo físico
      ↓
removido
      ↓
listagem atualizada
```

---

# 27. Proteção contra exclusão acidental

O botão de exclusão não deve estar excessivamente próximo de ações comuns sem diferenciação visual.

Exemplo:

```text
[ Usar ] [ Visualizar ] [ ⋮ ]
```

Dentro do menu:

```text
Visualizar
Renomear
Usar
Excluir
```

Isso reduz a possibilidade de exclusão acidental.

---

# 28. Renomear

Considerar permitir renomear o arquivo através da interface.

Exemplo:

```text
clientes.xlsx

[ Renomear ]
```

Novo nome:

```text
clientes_2026.xlsx
```

A extensão deverá ser preservada ou validada.

Não permitir que o usuário altere `.xlsx` para uma extensão incompatível sem confirmação.

---

# 29. Estrutura de diretórios

A implementação deverá possuir uma função central responsável por garantir que as pastas existam.

Conceitualmente:

```text
ensure_storage_structure()
```

Ela deverá verificar:

```text
data/
└── planilhas/
    ├── excel/
    └── csv/
```

e criar os diretórios quando necessário.

Não depender de criação manual das pastas.

---

# 30. Consulta das pastas

A listagem deverá ser construída a partir dos arquivos realmente existentes na estrutura local.

Exemplo:

```text
data/planilhas/excel/
data/planilhas/csv/
```

O backend deverá consultar essas pastas e retornar os arquivos encontrados.

Não utilizar somente uma lista armazenada no frontend.

---

# 31. Sincronização

Caso um arquivo seja removido manualmente da pasta local, ao clicar:

```text
[ Atualizar ]
```

o arquivo não deverá continuar aparecendo como disponível.

Exemplo:

```text
arquivo existe
      ↓
aparece na interface
```

Se for removido:

```text
arquivo não existe
      ↓
atualizar
      ↓
remove da listagem
```

A interface deverá refletir o estado real do armazenamento.

---

# 32. Arquivos adicionados externamente

Se um arquivo compatível for colocado diretamente na pasta:

```text
data/planilhas/excel/
```

ou:

```text
data/planilhas/csv/
```

ao atualizar a listagem, ele deverá ser identificado.

Exemplo:

```text
arquivo colocado manualmente
        ↓
[ Atualizar ]
        ↓
arquivo aparece no sistema
```

Não assumir que somente arquivos cadastrados pela interface podem existir.

---

# 33. UX — Estado vazio

Quando não houver planilhas:

```text
┌──────────────────────────────────────┐
│                                      │
│         Nenhuma planilha cadastrada  │
│                                      │
│   Comece adicionando um arquivo      │
│                                      │
│       [ Cadastrar planilha ]         │
│                                      │
└──────────────────────────────────────┘
```

Não mostrar uma tabela vazia sem explicação.

---

# 34. UX — Carregamento

Durante a leitura:

```text
Carregando planilhas...
```

Utilizar loading/skeleton já existente no projeto, caso exista.

Evitar congelamento visual da interface.

---

# 35. UX — Erros

Erros devem ser apresentados de maneira amigável.

Exemplo:

```text
Não foi possível cadastrar a planilha.

Verifique se:
• o arquivo está acessível;
• possui uma extensão suportada;
• não está sendo utilizado por outro programa.
```

Evitar apresentar somente:

```text
500 Internal Server Error
```

ao usuário.

O erro técnico poderá ser registrado nos logs.

---

# 36. UX — sucesso

Após cadastro:

```text
✓ Planilha cadastrada com sucesso.

clientes.xlsx
```

A nova planilha deverá aparecer automaticamente na listagem.

Não obrigar o usuário a atualizar manualmente.

---

# 37. Contador

Mostrar uma informação como:

```text
Planilhas cadastradas: 24
```

Opcionalmente:

```text
Excel: 18
CSV: 6
```

Os números deverão respeitar os filtros quando fizer sentido.

Exemplo:

```text
24 planilhas encontradas
```

---

# 38. Layout responsivo

A interface deve respeitar o layout existente.

Não criar elementos que quebrem:

* desktop;
* resoluções menores;
* tabelas;
* sidebar;
* header;
* cards;
* espaçamentos.

Caso o projeto já tenha breakpoints, reutilizá-los.

---

# 39. Respeitar HTML existente

Não modificar indiscriminadamente o HTML atual.

Antes de criar novos elementos:

1. verificar componentes existentes;
2. verificar classes existentes;
3. verificar padrões de cards;
4. verificar botões;
5. verificar modais;
6. verificar inputs;
7. verificar tabelas;
8. verificar mensagens de feedback.

Reutilizar a estrutura existente sempre que possível.

---

# 40. CSS

Não criar um novo Design System.

Reutilizar:

```text
variáveis CSS
cores
tipografia
bordas
sombras
botões
inputs
cards
modais
tabelas
```

já existentes.

Se uma nova classe for necessária, seguir o padrão de nomenclatura atual.

Não utilizar estilos inline desnecessariamente.

---

# 41. JavaScript

Organizar a lógica seguindo a arquitetura existente.

Separar responsabilidades entre:

```text
upload
listagem
filtro
ordenação
seleção
exclusão
visualização
renomeação
atualização
```

Evitar criar um único arquivo JS gigante se o projeto já possui organização modular.

---

# 42. Backend

Criar/reutilizar endpoints adequados para:

```text
listar planilhas
cadastrar planilha
excluir planilha
renomear planilha
consultar informações
visualizar planilha
```

Exemplo conceitual:

```text
GET  /api/planilhas
POST /api/planilhas
DELETE /api/planilhas/<id>
PUT /api/planilhas/<id>
GET /api/planilhas/<id>/preview
```

Os nomes devem seguir o padrão de rotas já existente no projeto.

Não criar endpoints duplicados se já existir uma estrutura equivalente.

---

# 43. Segurança do caminho

Nunca confiar diretamente no nome/caminho enviado pelo frontend.

O backend deverá controlar:

```text
diretório permitido
nome permitido
extensão permitida
```

Impedir caminhos como:

```text
../../arquivo.xlsx
..\..\arquivo.xlsx
C:\arquivo.xlsx
```

O usuário deverá conseguir trabalhar apenas dentro da estrutura destinada às planilhas.

---

# 44. Não sobrescrever arquivos

Nunca sobrescrever automaticamente um arquivo existente sem uma ação explícita.

Exemplo:

```text
clientes.xlsx
```

já existe.

Novo upload:

```text
clientes.xlsx
```

deve gerar:

```text
conflito
```

e apresentar uma decisão ao usuário.

---

# 45. Metadados

Caso seja útil para o sistema, manter metadados derivados do arquivo.

Exemplo:

```text
{
    nome: "clientes.xlsx",
    extensao: ".xlsx",
    caminho: "excel/clientes.xlsx",
    tamanho: 2450000,
    data_cadastro: "...",
    data_modificacao: "..."
}
```

Não duplicar o conteúdo da planilha em banco de dados.

---

# 46. Compatibilidade com execução local

O projeto será executado em um computador local.

Portanto, a implementação deverá funcionar sem depender de serviços externos.

A estrutura deverá ser criada automaticamente no primeiro uso.

Exemplo:

```text
primeira execução
       ↓
verificar data/planilhas
       ↓
não existe
       ↓
criar diretórios
       ↓
sistema pronto
```

---

# 47. Regra de integridade

O Cadastro de Planilhas não deve modificar o conteúdo da planilha durante o cadastro.

Cadastrar significa:

```text
arquivo original
      ↓
armazenar
      ↓
indexar/listar
```

Não significa:

```text
arquivo original
      ↓
alterar dados
      ↓
armazenar
```

A planilha deverá permanecer intacta.

---

# 48. Integração com o princípio geral do projeto

Essa nova funcionalidade deverá respeitar a regra geral já estabelecida:

> **Transformar, organizar ou cadastrar uma planilha nunca deve significar perder dados.**

Todas as funcionalidades devem trabalhar com o arquivo original preservado.

Quando uma ferramenta gerar um resultado:

```text
Planilha original
       ↓
Processamento
       ↓
Novo arquivo
```

e nunca:

```text
Planilha original
       ↓
sobrescrever
```

a menos que o usuário solicite explicitamente uma substituição.

---

# 49. Critérios de aceitação

A implementação será considerada concluída quando:

* [ ] Existir uma nova área de Cadastro de Planilhas.
* [ ] O usuário conseguir cadastrar `.xlsx`.
* [ ] O usuário conseguir cadastrar `.xls`.
* [ ] O usuário conseguir cadastrar `.csv`.
* [ ] Arquivos inválidos forem rejeitados.
* [ ] Existir Drag & Drop.
* [ ] Existir seleção tradicional de arquivo.
* [ ] Os arquivos forem armazenados localmente.
* [ ] A estrutura de pastas for criada automaticamente.
* [ ] O sistema conseguir consultar a estrutura local.
* [ ] A listagem mostrar os arquivos existentes.
* [ ] Existir busca por nome.
* [ ] Existir filtro por extensão.
* [ ] Busca e extensão puderem ser utilizadas simultaneamente.
* [ ] Existir opção de limpar filtros.
* [ ] Existir atualização da listagem.
* [ ] Arquivos removidos externamente desaparecerem após atualização.
* [ ] Arquivos adicionados externamente aparecerem após atualização.
* [ ] Existir seleção de arquivo.
* [ ] Arquivos puderem ser utilizados nas demais ferramentas.
* [ ] Existir confirmação antes de exclusão.
* [ ] Não ocorrer exclusão acidental.
* [ ] Não ocorrer sobrescrita silenciosa.
* [ ] O arquivo original permanecer intacto.
* [ ] A interface respeitar o HTML existente.
* [ ] A interface respeitar o CSS existente.
* [ ] O Design System existente seja reutilizado.
* [ ] A UX seja consistente com o restante do projeto.
* [ ] O funcionamento seja local.
* [ ] Nenhuma funcionalidade existente seja quebrada.

---

# 50. Validação final obrigatória

Depois da implementação, não apenas informar que a funcionalidade foi criada.

Realizar uma validação completa.

Testar:

### Cadastro

```text
clientes.xlsx
clientes.csv
produtos.xlsx
```

### Pesquisa

```text
clientes
```

### Filtro

```text
CSV
```

### Pesquisa + filtro

```text
clientes + CSV
```

### Exclusão

Excluir uma planilha e atualizar.

### Inclusão externa

Adicionar uma planilha diretamente na pasta e atualizar.

### Duplicidade

Cadastrar um arquivo com o mesmo nome.

### Integração

Selecionar uma planilha cadastrada e utilizá-la em:

```text
Validador de Cabeçalhos
Validador de Duplicatas
Cruzamento de Planilhas
Categorizador
Conversor Excel → CSV
```

### Integridade

Confirmar que:

* nenhum arquivo original foi alterado;
* nenhum dado da planilha foi perdido;
* os arquivos continuam acessíveis;
* a listagem representa o estado real das pastas;
* as funcionalidades existentes continuam funcionando.

---

# 51. Entrega esperada

Ao finalizar, apresentar um relatório objetivo contendo:

```text
1. Estrutura de armazenamento criada
2. Arquivos alterados
3. Arquivos criados
4. Endpoints criados/alterados
5. Componentes reutilizados
6. Funcionalidades implementadas
7. Regras de segurança aplicadas
8. Testes executados
9. Resultado dos testes
10. Problemas encontrados
11. Problemas corrigidos
12. Impacto nas funcionalidades existentes
13. Confirmação de que a integridade dos dados foi preservada
```

**Não considerar a tarefa concluída apenas porque a interface está funcionando.**

A implementação somente estará concluída quando:

> **A interface, armazenamento local, consulta dos arquivos, filtros, UX, backend, exportações e integração com as demais funcionalidades estiverem funcionando de maneira consistente dentro da arquitetura existente do projeto.**
