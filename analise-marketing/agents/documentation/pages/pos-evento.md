# Pós-evento

## Objetivo e acesso

A página registra resultados de eventos e consolida o investimento de divulgação e o custo por pessoa presente. Abra `Campanha-Marketing/index.html` e selecione **Pós-evento**. A rota é `#pos-evento`, vinculada à seção `#events-page` do mesmo HTML.

## Cadastro e edição

1. Selecione **Nova análise** e informe nome, data, inscritos e presentes.
2. Adicione os nomes das campanhas e seus respectivos investimentos. As campanhas existentes nos disparos aparecem como sugestões; também é possível informar outros nomes.
3. Confira o investimento consolidado e a prévia do custo por presente.
4. Use **Salvar análise** para gravar o registro.
5. Na lista, use **Editar**, **PDF** ou o botão de remoção do evento.

Os investimentos são informados manualmente; escolher uma sugestão de campanha não importa custos nem cria uma vinculação automática com os registros de disparos. Podem ser incluídos outros custos como uma campanha chamada “Produção do evento”. A edição mantém o identificador do registro. Descartar um formulário alterado e excluir um evento exigem confirmação na interface.

## Campos e validações

| Campo | Regra |
| --- | --- |
| Nome | Obrigatório, até 100 caracteres |
| Data | Obrigatória e válida |
| Inscritos e presentes | Inteiros não negativos, até 1 trilhão |
| Presentes | Não pode superar inscritos |
| Campanha de investimento | Nome não vazio, até 500 caracteres |
| Investimento | Número não negativo, até 1 trilhão |

Cada evento aceita até 500 campanhas de investimento. Linhas totalmente vazias do formulário são desconsideradas; linhas parcialmente preenchidas são rejeitadas. É permitido salvar eventos sem investimentos ou sem presentes. As mensagens de erro orientam corrigir o formulário antes de salvar.

## Métricas

| Indicador | Cálculo |
| --- | --- |
| Eventos analisados | Quantidade de eventos no filtro |
| Investimento total | Soma dos investimentos das campanhas dos eventos filtrados |
| Pessoas presentes | Soma dos presentes; comparecimento = presentes ÷ inscritos |
| Custo por presente | Investimento total ÷ total de presentes |

O custo consolidado é calculado a partir dos totais, sem média simples dos custos individuais. Os investimentos são consolidados em centavos. Sem presentes, o custo aparece como “—”; sem inscritos, o comparecimento é `0,00%`.

Valores monetários seguem o formato brasileiro. Percentuais têm duas casas decimais na interface e nos PDFs, como `60,00%`. A coluna de comparecimento no Excel usa `0.00%`, preservando a precisão numérica.

## Filtros e seleção

A busca por nome ignora acentos e o período inclui as datas inicial e final. Um período invertido mostra aviso e nenhum resultado. Os indicadores e a lista acompanham os filtros.

Cada evento pode ser selecionado individualmente. **Selecionar filtrados** marca ou desmarca os eventos do recorte atual. Seleções fora do filtro são preservadas e indicadas na interface; **Limpar seleção** remove todas as seleções.

## Exportações

- **Excel do filtro** exporta os eventos que atendem aos filtros atuais.
- **Excel selecionados** e **PDF selecionados** incluem todos os eventos selecionados, inclusive os que estejam fora do filtro.
- **PDF** no cartão exporta somente aquele evento.

O Excel contém as abas **Eventos**, com indicadores por evento, e **Investimentos**, com os custos discriminados por campanha. O PDF apresenta totais consolidados, detalhes de cada evento e seus investimentos, com paginação automática. As ações de exportação são desabilitadas quando não há registros aplicáveis.

## Persistência e recursos compartilhados

Os eventos compartilham o estado `campaign-pulse-local-v1` no `localStorage` com os disparos. Importar, limpar ou restaurar a demonstração de disparos preserva os eventos. O backup JSON inclui todos os registros salvos; rascunhos do formulário não são incluídos. Restaurar um backup substitui disparos e eventos após validação e confirmação.

Tema claro/escuro, ajuda e backup estão disponíveis nas duas páginas. A aplicação funciona offline; falhas ao salvar no navegador geram um aviso para exportar o backup. Mudar a pasta, o navegador ou limpar os dados de navegação pode impedir a recuperação automática dos registros.

## Referências para manutenção

- `Campanha-Marketing/index.html`: seção `events-page`, formulário e lista de eventos.
- `Campanha-Marketing/app.js`: `addInvestment`, `draftPreview`, `saveEvent`, `editEvent`, `renderEvents`, `eventExcel` e `eventPdf`.
- `Campanha-Marketing/core.js`: `validateEvent`, `spend`, `eventTotals`, `filter` e `validateBackup`.
- `Campanha-Marketing/styles.css`: formulário, cartões, temas e responsividade.
- `Campanha-Marketing/tests/`: testes de regras, cadastro, edição, exclusão, filtros, seleção, exportações e armazenamento.

Os scripts de teste devem ser versionados. Os arquivos produzidos em `Campanha-Marketing/tests/results/` são ignorados pelo Git; esta documentação deve permanecer versionável.
