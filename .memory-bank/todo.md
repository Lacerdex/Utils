# Task — Validar, corrigir e atualizar o Validador de Duplicatas

O projeto já possui uma funcionalidade de **Validador de Duplicatas**.

Agora preciso realizar uma etapa de **validação, revisão e atualização dessa funcionalidade**, garantindo que ela esteja correta, consistente com as demais features do projeto e preparada para exportação em diferentes formatos.

**Não recriar a funcionalidade do zero.**

Primeiro analise a implementação existente, identifique o que já funciona, o que está incompleto e o que precisa ser alterado.

A implementação final deve manter compatibilidade com as demais funcionalidades do projeto.

---

# 1. Objetivo do Validador de Duplicatas

O Validador de Duplicatas deve permitir que o usuário importe uma planilha, identifique registros duplicados e escolha como deseja organizar e exportar o resultado.

A funcionalidade deverá trabalhar com:

* Excel (`.xlsx`);
* CSV (`.csv`).

O usuário deverá poder escolher:

1. Qual arquivo deseja analisar;
2. Qual aba deseja utilizar, quando for Excel;
3. Qual coluna será utilizada como referência/chave;
4. Se deseja trabalhar com:

   * Únicos;
   * Duplicados;
5. Qual método de extração deseja utilizar;
6. Qual formato de saída deseja:

   * Excel;
   * CSV.

---

# 2. Primeiro passo — analisar a implementação atual

Antes de alterar qualquer código:

1. Analise a estrutura atual do projeto.
2. Localize a implementação atual do Validador de Duplicatas.
3. Identifique frontend, backend, endpoints, funções e componentes relacionados.
4. Verifique como Excel e CSV são atualmente lidos.
5. Verifique como os dados são atualmente agrupados.
6. Verifique como as duplicidades estão sendo identificadas.
7. Verifique como a exportação atual funciona.
8. Verifique se já existem funções reutilizáveis das outras features.
9. Identifique possíveis conflitos com:

   * Validador de Cabeçalhos;
   * Cruzamento de Planilhas;
   * Excel → CSV;
   * Categorizador;
   * Sistema de aliases;
   * Normalização de dados.
10. Só depois implemente as alterações.

Não modificar funcionalidades não relacionadas sem necessidade.

---

# 3. Conceito de duplicata

É importante diferenciar:

### Registro completamente duplicado

Exemplo:

| Nome       | Email                                       | Telefone    |
| ---------- | ------------------------------------------- | ----------- |
| João Pedro | [teste1@gmail.com](mailto:teste1@gmail.com) | 11901234567 |
| João Pedro | [teste1@gmail.com](mailto:teste1@gmail.com) | 11901234567 |

Esses dois registros são **idênticos**.

A segunda ocorrência poderá ser considerada duplicada e removida quando o usuário selecionar:

```text
Únicos
```

### Registros com a mesma chave, mas informações diferentes

Exemplo:

| Nome       | Email                                       | Telefone    |
| ---------- | ------------------------------------------- | ----------- |
| João Pedro | [teste1@gmail.com](mailto:teste1@gmail.com) | 11901234567 |
| João Pedro | [teste2@gmail.com](mailto:teste2@gmail.com) | 11901234568 |

Esses registros **não são completamente duplicados**.

Eles possuem o mesmo `Nome`, porém possuem informações diferentes.

Portanto, não devem ser simplesmente excluídos.

Esses dados devem ser preservados e reorganizados conforme o método de extração escolhido.

---

# 4. Seleção de Únicos ou Duplicados

O usuário deverá possuir uma opção semelhante a:

```text
Tipo de resultado:

○ Únicos
○ Duplicados
```

## Únicos

Deve retornar os registros sem repetições completas.

Exemplo:

Entrada:

| Nome       | Email                                       | Telefone    |
| ---------- | ------------------------------------------- | ----------- |
| João Pedro | [teste1@gmail.com](mailto:teste1@gmail.com) | 11901234567 |
| João Pedro | [teste1@gmail.com](mailto:teste1@gmail.com) | 11901234567 |
| João Pedro | [teste2@gmail.com](mailto:teste2@gmail.com) | 11901234568 |

Resultado:

| Nome       | Email                                       | Telefone    |
| ---------- | ------------------------------------------- | ----------- |
| João Pedro | [teste1@gmail.com](mailto:teste1@gmail.com) | 11901234567 |
| João Pedro | [teste2@gmail.com](mailto:teste2@gmail.com) | 11901234568 |

A segunda linha idêntica foi ignorada.

**Importante:** não remover a segunda linha apenas porque o `Nome` é igual.

A comparação deve considerar o conjunto de dados definido para identificar uma duplicata.

---

# 5. Duplicados

Quando o usuário selecionar:

```text
Duplicados
```

o sistema deverá identificar os registros que possuem duplicidade conforme a regra estabelecida.

Exemplo:

| Nome       | Email                                       | Telefone    |
| ---------- | ------------------------------------------- | ----------- |
| João Pedro | [teste1@gmail.com](mailto:teste1@gmail.com) | 11901234567 |
| João Pedro | [teste1@gmail.com](mailto:teste1@gmail.com) | 11901234567 |
| João Pedro | [teste2@gmail.com](mailto:teste2@gmail.com) | 11901234568 |

O sistema deve identificar que:

```text
João Pedro + teste1@gmail.com + 11901234567
```

aparece mais de uma vez.

A interface deve deixar claro quais registros foram considerados duplicados.

---

# 6. Não confundir duplicidade completa com agrupamento

Esta regra é fundamental.

O sistema deverá diferenciar:

```text
Duplicidade completa
```

de:

```text
Mesmo valor na coluna-chave
```

Exemplo:

```text
João Pedro | teste1@gmail.com | 111
João Pedro | teste2@gmail.com | 222
```

Existe repetição em `Nome`, mas não existe duplicidade completa.

Portanto, os dois registros devem continuar sendo considerados dados válidos.

---

# 7. Coluna-chave

O usuário deverá poder selecionar uma coluna para servir como referência do agrupamento.

Exemplo:

```text
Coluna-chave:

[ Nome ▼ ]
```

Nesse caso:

```text
João Pedro
João Pedro
João Pedro
```

serão considerados registros pertencentes ao mesmo grupo.

Porém, o sistema deverá continuar comparando as demais colunas para determinar se os registros são realmente idênticos.

---

# 8. Métodos de extração

O usuário deverá poder escolher como deseja organizar o resultado.

Disponibilizar:

```text
Método de extração:

○ Quebra de linhas
○ Quebra de colunas
○ Concatenado
```

---

# 9. Método — Quebra de linhas

Este método deverá preservar os registros em linhas separadas.

Entrada:

| Nome       | Email                                       | Telefone    |
| ---------- | ------------------------------------------- | ----------- |
| João Pedro | [teste1@gmail.com](mailto:teste1@gmail.com) | 11901234567 |
| João Pedro | [teste2@gmail.com](mailto:teste2@gmail.com) | 11901234568 |

Resultado:

| Nome       | Email                                       | Telefone    |
| ---------- | ------------------------------------------- | ----------- |
| João Pedro | [teste1@gmail.com](mailto:teste1@gmail.com) | 11901234567 |
| João Pedro | [teste2@gmail.com](mailto:teste2@gmail.com) | 11901234568 |

Não realizar qualquer concatenação ou criação de novas colunas.

Esse método representa o formato mais próximo possível dos dados originais após a aplicação da regra de duplicidade.

---

# 10. Método — Quebra de colunas

Neste método, registros pertencentes à mesma chave deverão ser consolidados em uma única linha.

Exemplo:

Entrada:

| Nome       | Email                                       | Telefone    |
| ---------- | ------------------------------------------- | ----------- |
| João Pedro | [teste1@gmail.com](mailto:teste1@gmail.com) | 11901234567 |
| João Pedro | [teste2@gmail.com](mailto:teste2@gmail.com) | 11901234568 |

Resultado:

| Nome       | Email 1                                     | Email 2                                     | Telefone 1  | Telefone 2  |
| ---------- | ------------------------------------------- | ------------------------------------------- | ----------- | ----------- |
| João Pedro | [teste1@gmail.com](mailto:teste1@gmail.com) | [teste2@gmail.com](mailto:teste2@gmail.com) | 11901234567 | 11901234568 |

A criação das colunas deverá ser dinâmica.

Se existirem:

```text
3 e-mails
```

criar:

```text
Email 1
Email 2
Email 3
```

Se existirem:

```text
5 telefones
```

criar:

```text
Telefone 1
Telefone 2
Telefone 3
Telefone 4
Telefone 5
```

---

# 11. Método — Concatenado

Criar um método:

```text
Concatenado
```

Nesse método, os registros pertencentes à mesma chave deverão ser consolidados em uma linha e os valores diferentes deverão ser concatenados.

Exemplo:

Entrada:

| Nome       | Email                                       | Telefone    |
| ---------- | ------------------------------------------- | ----------- |
| João Pedro | [teste1@gmail.com](mailto:teste1@gmail.com) | 11901234567 |
| João Pedro | [teste2@gmail.com](mailto:teste2@gmail.com) | 11901234568 |

Resultado:

| Nome       | Emails                                                                                  | Telefones               |
| ---------- | --------------------------------------------------------------------------------------- | ----------------------- |
| João Pedro | [teste1@gmail.com](mailto:teste1@gmail.com);[teste2@gmail.com](mailto:teste2@gmail.com) | 11901234567;11901234568 |

O separador padrão deverá ser:

```text
;
```

Mas, se já existir no projeto uma configuração de separador, reutilizá-la.

---

# 12. Remoção de duplicatas no modo Únicos

Considerar:

Entrada:

| Nome       | Email                                       | Telefone    |
| ---------- | ------------------------------------------- | ----------- |
| João Pedro | [teste1@gmail.com](mailto:teste1@gmail.com) | 11901234567 |
| João Pedro | [teste1@gmail.com](mailto:teste1@gmail.com) | 11901234567 |
| João Pedro | [teste2@gmail.com](mailto:teste2@gmail.com) | 11901234568 |

As duas primeiras linhas são completamente iguais.

Quando o usuário selecionar:

```text
Únicos
```

elas deverão resultar em apenas uma ocorrência.

Resultado intermediário:

| Nome       | Email                                       | Telefone    |
| ---------- | ------------------------------------------- | ----------- |
| João Pedro | [teste1@gmail.com](mailto:teste1@gmail.com) | 11901234567 |
| João Pedro | [teste2@gmail.com](mailto:teste2@gmail.com) | 11901234568 |

---

# 13. Aplicação do método de extração após a remoção de duplicatas

Depois de remover as duplicatas completas, o sistema deverá aplicar o método de extração escolhido.

Exemplo:

### Dados originais

```text
João Pedro | teste1@gmail.com | 11901234567
João Pedro | teste1@gmail.com | 11901234567
João Pedro | teste2@gmail.com | 11901234568
```

### Remoção da duplicata

```text
João Pedro | teste1@gmail.com | 11901234567
João Pedro | teste2@gmail.com | 11901234568
```

### Método Concatenado

Resultado:

```text
Nome | Emails | Telefones
João Pedro | teste1@gmail.com;teste2@gmail.com | 11901234567;11901234568
```

### Método Quebra de colunas

Resultado:

```text
Nome | Email 1 | Email 2 | Telefone 1 | Telefone 2
João Pedro | teste1@gmail.com | teste2@gmail.com | 11901234567 | 11901234568
```

### Método Quebra de linhas

Resultado:

```text
Nome | Email | Telefone
João Pedro | teste1@gmail.com | 11901234567
João Pedro | teste2@gmail.com | 11901234568
```

---

# 14. Exportação para Excel

O usuário deverá poder escolher:

```text
Formato de saída:

○ Excel (.xlsx)
○ CSV (.csv)
```

Quando selecionar Excel:

```text
[ Exportar Excel ]
```

deverá ser criado um novo arquivo `.xlsx`.

O arquivo original nunca deverá ser alterado.

---

# 15. Exportação para CSV

Quando selecionar:

```text
CSV (.csv)
```

deverá ser criado um arquivo `.csv`.

O CSV deverá preservar corretamente:

* Acentuação;
* Caracteres especiais;
* Valores com espaços;
* Separadores internos;
* Valores concatenados.

Dar preferência à codificação:

```text
UTF-8 com BOM
```

para manter compatibilidade com Excel no Windows.

---

# 16. Configurações da exportação

A interface deverá apresentar claramente as opções:

```text
Arquivo:
[ clientes.xlsx ]

Aba:
[ Clientes ▼ ]

Coluna-chave:
[ Nome ▼ ]

Resultado:
○ Únicos
○ Duplicados

Método:
○ Quebra de linhas
○ Quebra de colunas
○ Concatenado

Formato:
○ Excel
○ CSV
```

E então:

```text
[ Visualizar resultado ]

[ Exportar ]
```

---

# 17. Pré-visualização

Antes da exportação, apresentar uma prévia do resultado.

Exemplo:

```text
Método: Concatenado
Filtro: Únicos

Nome        | Emails                         | Telefones
João Pedro  | teste1@gmail.com;teste2@gmail.com | 11901234567;11901234568
```

Também mostrar informações como:

```text
Registros originais: 3
Duplicatas encontradas: 1
Registros após deduplicação: 2
Grupos encontrados: 1
```

Isso ajuda o usuário a validar o resultado antes de exportar.

---

# 18. Integridade dos dados

Esta é uma regra obrigatória.

Durante qualquer etapa:

```text
Importação
↓
Validação
↓
Identificação de duplicatas
↓
Agrupamento
↓
Transformação
↓
Exportação
```

nenhum dado válido deverá ser perdido.

A única remoção permitida ocorrerá quando:

1. O usuário selecionar `Únicos`;
2. O registro for realmente duplicado segundo a regra de duplicidade completa.

Mesmo nesse caso, a ocorrência removida não deverá fazer com que informações diferentes sejam perdidas.

---

# 19. Colunas duplicadas

Caso existam colunas com o mesmo nome, não sobrescrever valores.

Exemplo:

```text
Nome | Email | Email
```

deverá ser tratado como:

```text
Nome | Email 1 | Email 2
```

ou utilizando identificação de origem quando disponível.

Nunca executar uma operação que resulte em:

```text
Email → último valor sobrescreve o primeiro
```

---

# 20. Valores diferentes devem ser preservados

Exemplo:

```text
João Pedro | teste1@gmail.com | 111
João Pedro | teste2@gmail.com | 222
```

Não pode resultar em:

```text
João Pedro | teste2@gmail.com | 222
```

perdendo o primeiro registro.

Dependendo do método:

### Quebra de linhas

```text
João Pedro | teste1@gmail.com | 111
João Pedro | teste2@gmail.com | 222
```

### Quebra de colunas

```text
João Pedro | teste1@gmail.com | teste2@gmail.com | 111 | 222
```

### Concatenado

```text
João Pedro | teste1@gmail.com;teste2@gmail.com | 111;222
```

---

# 21. Integração com o sistema de aliases

Verificar se o Validador de Duplicatas pode reutilizar o sistema de aliases existente.

Exemplo:

```text
Nome
Nome Completo
Nome do Cliente
Cliente
```

podem ser reconhecidos como relacionados.

Da mesma forma:

```text
Email
E-mail
E-Mail
Correio Eletrônico
```

podem ser identificados como equivalentes.

Não duplicar a implementação de aliases se já existir uma estrutura central no projeto.

---

# 22. Integração com as demais funcionalidades

Verificar se a implementação final permanece coerente com:

* Validador de Cabeçalhos;
* Cruzamento de Planilhas;
* Conversor Excel → CSV;
* Categorizador;
* Sistema de aliases;
* Normalização de dados;
* Exportação Excel;
* Exportação CSV.

Sempre que possível, centralizar funções comuns como:

```text
normalização de cabeçalhos
normalização de valores
identificação de aliases
detecção de duplicidades
tratamento de colunas
geração de nomes de colunas
exportação Excel
exportação CSV
```

Evitar criar múltiplas versões da mesma lógica.

---

# 23. Regra sobre duplicidade completa

A definição padrão de duplicata deverá considerar o conjunto de dados do registro.

Exemplo:

```text
Nome = João Pedro
Email = teste1@gmail.com
Telefone = 11901234567
```

e:

```text
Nome = João Pedro
Email = teste1@gmail.com
Telefone = 11901234567
```

→ duplicados.

Porém:

```text
Nome = João Pedro
Email = teste1@gmail.com
Telefone = 11901234567
```

e:

```text
Nome = João Pedro
Email = teste2@gmail.com
Telefone = 11901234568
```

→ não são duplicados completos.

Os dois devem ser preservados.

---

# 24. Registros com valores parcialmente iguais

Exemplo:

```text
João Pedro | teste1@gmail.com | 111
João Pedro | teste1@gmail.com | 222
```

Esses registros não são completamente iguais.

Portanto:

```text
Únicos
```

deve manter ambos.

Resultado em quebra de linhas:

```text
João Pedro | teste1@gmail.com | 111
João Pedro | teste1@gmail.com | 222
```

Resultado concatenado:

```text
João Pedro | teste1@gmail.com | 111;222
```

Resultado em quebra de colunas:

```text
João Pedro | teste1@gmail.com | teste1@gmail.com | 111 | 222
```

Caso existam valores iguais que possam ser deduplicados durante a consolidação, essa decisão deverá respeitar a opção selecionada pelo usuário.

---

# 25. UX

A interface deve deixar extremamente claro que existem duas decisões diferentes:

### O que mostrar?

```text
Únicos
Duplicados
```

### Como organizar?

```text
Quebra de linhas
Quebra de colunas
Concatenado
```

Não misturar esses conceitos na interface.

Exemplo:

```text
┌─────────────────────────────────────┐
│ VALIDAÇÃO                           │
│                                     │
│ Mostrar:                            │
│ ○ Únicos                            │
│ ○ Duplicados                        │
│                                     │
│ Método de extração:                 │
│ ○ Quebra de linhas                  │
│ ○ Quebra de colunas                 │
│ ○ Concatenado                       │
│                                     │
│ Formato:                            │
│ ○ Excel                             │
│ ○ CSV                               │
└─────────────────────────────────────┘
```

---

# 26. Execução local

A funcionalidade deverá continuar seguindo a arquitetura local do projeto.

Não utilizar:

* APIs externas;
* serviços de conversão online;
* armazenamento em nuvem;
* upload dos arquivos para servidores externos.

Todo processamento deverá ocorrer no computador do usuário.

---

# 27. Testes obrigatórios

## Teste 1 — duplicata completa

Entrada:

| Nome       | Email                                       | Telefone    |
| ---------- | ------------------------------------------- | ----------- |
| João Pedro | [teste1@gmail.com](mailto:teste1@gmail.com) | 11901234567 |
| João Pedro | [teste1@gmail.com](mailto:teste1@gmail.com) | 11901234567 |
| João Pedro | [teste2@gmail.com](mailto:teste2@gmail.com) | 11901234568 |

Selecionar:

```text
Únicos
```

Resultado intermediário:

| Nome       | Email                                       | Telefone    |
| ---------- | ------------------------------------------- | ----------- |
| João Pedro | [teste1@gmail.com](mailto:teste1@gmail.com) | 11901234567 |
| João Pedro | [teste2@gmail.com](mailto:teste2@gmail.com) | 11901234568 |

---

## Teste 2 — Quebra de linhas

Resultado:

| Nome       | Email                                       | Telefone    |
| ---------- | ------------------------------------------- | ----------- |
| João Pedro | [teste1@gmail.com](mailto:teste1@gmail.com) | 11901234567 |
| João Pedro | [teste2@gmail.com](mailto:teste2@gmail.com) | 11901234568 |

---

## Teste 3 — Quebra de colunas

Resultado:

| Nome       | Email 1                                     | Email 2                                     | Telefone 1  | Telefone 2  |
| ---------- | ------------------------------------------- | ------------------------------------------- | ----------- | ----------- |
| João Pedro | [teste1@gmail.com](mailto:teste1@gmail.com) | [teste2@gmail.com](mailto:teste2@gmail.com) | 11901234567 | 11901234568 |

---

## Teste 4 — Concatenado

Resultado:

| Nome       | Emails                                                                                  | Telefones               |
| ---------- | --------------------------------------------------------------------------------------- | ----------------------- |
| João Pedro | [teste1@gmail.com](mailto:teste1@gmail.com);[teste2@gmail.com](mailto:teste2@gmail.com) | 11901234567;11901234568 |

---

## Teste 5 — CSV

Executar os três métodos de extração e confirmar que todos podem ser exportados para CSV.

---

## Teste 6 — Excel

Executar os três métodos de extração e confirmar que todos podem ser exportados para Excel.

---

## Teste 7 — valores parcialmente iguais

Entrada:

```text
João Pedro | teste1@gmail.com | 111
João Pedro | teste1@gmail.com | 222
```

Confirmar que os dois registros são preservados em `Únicos`.

---

## Teste 8 — vários valores

Entrada:

```text
João Pedro | email1 | telefone1
João Pedro | email2 | telefone2
João Pedro | email3 | telefone3
João Pedro | email4 | telefone4
```

Confirmar:

### Quebra de colunas

```text
Email 1
Email 2
Email 3
Email 4
```

### Concatenado

```text
email1;email2;email3;email4
```

---

# 28. Validação final de toda a implementação

Depois de implementar a atualização do Validador de Duplicatas, realizar uma **auditoria da feature e do contexto geral do projeto**.

Verificar:

### Validador de Duplicatas

* [ ] Excel funciona.
* [ ] CSV funciona.
* [ ] Únicos funciona.
* [ ] Duplicados funciona.
* [ ] Quebra de linhas funciona.
* [ ] Quebra de colunas funciona.
* [ ] Concatenado funciona.
* [ ] Duplicatas completas são identificadas corretamente.
* [ ] Registros apenas parcialmente iguais não são removidos.
* [ ] Valores diferentes são preservados.
* [ ] Colunas duplicadas são tratadas corretamente.
* [ ] Exportação Excel funciona.
* [ ] Exportação CSV funciona.

### Integração

* [ ] Não existe código duplicado desnecessariamente.
* [ ] Aliases são reutilizados.
* [ ] Normalização é reutilizada.
* [ ] Exportadores existentes são reutilizados quando possível.
* [ ] O Validador de Cabeçalhos continua funcionando.
* [ ] O Cruzamento de Planilhas continua funcionando.
* [ ] O Conversor Excel → CSV continua funcionando.
* [ ] O Categorizador continua funcionando.
* [ ] Nenhuma rota existente foi quebrada.
* [ ] Nenhuma funcionalidade existente foi removida.

### Integridade

* [ ] Nenhuma coluna original é perdida.
* [ ] Nenhum registro válido é perdido.
* [ ] Duplicatas completas só são removidas quando `Únicos` estiver selecionado.
* [ ] Valores diferentes nunca são sobrescritos.
* [ ] Exportações representam corretamente o resultado exibido na prévia.

---

# 29. Regra final do projeto

Após implementar e validar essa feature, considere esta regra como princípio geral para todas as funcionalidades relacionadas a planilhas:

> **Transformar a estrutura dos dados não significa perder os dados.**

Sempre preservar:

* registros;
* colunas;
* valores;
* duplicidades relevantes;
* informações diferentes;
* origem das informações quando aplicável.

Uma informação somente poderá ser removida quando houver uma ação explícita do usuário solicitando isso, como:

```text
Únicos → remover ocorrências completamente duplicadas
```

Mesmo nesse caso, nunca remover uma informação que seja diferente ou que esteja presente somente em uma ocorrência.

Ao final da implementação, apresente:

1. Arquivos alterados;
2. Funções criadas;
3. Funções reutilizadas;
4. Regras de duplicidade implementadas;
5. Métodos de extração implementados;
6. Formatos de exportação implementados;
7. Testes realizados;
8. Resultado dos testes;
9. Possíveis problemas encontrados;
10. Confirmação de que a regra de **preservação integral dos dados** está sendo respeitada em todo o contexto do projeto.
