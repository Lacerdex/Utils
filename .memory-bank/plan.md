Plano de Infraestrutura e Implementação — Excel Tools

Visão geral
- Objetivo: Implementar e integrar um conjunto de ferramentas para processamento de planilhas Excel na aplicação existente (SPA estática). Funcionalidades alvo: Validação de Cabeçalhos, Análise de Qualidade, Detecção de Duplicados, Cruzamento de Planilhas e Conversão Excel -> CSV com regras de concatenação/quebra.
- Abordagem: Priorizar integração com os módulos frontend já presentes no repositório (ver ".memory-bank/agent.md"). Onde for necessário, implementar um backend leve para processamentos pesados/streaming; inicialmente focar em aprimorar e testar os módulos client-side.

Estado atual (resumo do memory bank)
- Existe uma SPA com arquivos-chave sob Excel/: [Excel/index.html] (estrutura da SPA), [Excel/js/app.js] (navegação), [Excel/js/core/excel-reader.js], [Excel/js/core/excel-writer.js], [Excel/js/core/excel-utils.js] (inclui utilitários como findDuplicateOccurrences), e UIs: [Excel/js/ui/sheet-workspace.js], [Excel/js/ui/validator-registry.js], além de validadores específicos (`data-validator-ui.js`, `cross-validator-ui.js`, `csv-converter-ui.js`).
- O conversor Excel → CSV já está parcialmente implementado (csv-converter-ui.js) com pré-visualização, aliases de colunas e opções de concatenação/quebra mencionadas no memory bank.
- Há validação e cruzamento já modelados (DataValidator, CrossValidator) e utilitários para normalização e detecção de duplicados.

Ajustes no plano (conformidade)
Com base no que existe, o plano foi ajustado para:
1) Priorizar integração e testes das implementações client-side existentes antes de reimplementar do zero.
2) Transformar alguns itens do "novo" plano em tarefas de integração/refatoração (em vez de criação completa).
3) Deixar o backend como opcional/incremental: implementar apenas se operações em memória no navegador não suportarem cargas alvo.

Lista de todos (atualizada e mapeada para o que já existe)
- validation-headers: Integrar e padronizar o módulo de extração de cabeçalhos (usar Excel/js/core/excel-reader.js + SheetWorkspace). (existente — integrar/testar)
- quality-analysis: Implementar/adaptar análise de qualidade usando estruturas existentes (criar endpoint UI e funções em excel-utils.js). (novo/integração)
- duplicate-detection: Reusar findDuplicateOccurrences em excel-utils.js; criar UI na tela de Duplicados para seleção de coluna, agrupamento e export. (existente — ampliar UI/export)
- cross-sheet-matching: Ver `cross-validator-ui.js` e CrossValidator; focar em testes, documentação e ajustes de export (consolidação FULL OUTER JOIN). (existente — testar/ajustar)
- conversion-excel-csv: Revisar `csv-converter-ui.js` e implementar regras faltantes: seleção de coluna mãe, escolha de colunas a extrair, opções de concatenação com delimitador configurável, e quebra (expandir em linhas ou colunas). Garantir pré-visualização e export via CsvWriter.download. (parcialmente existente — completar/robustecer)
- ui-headers-screen: Garantir que a tela de validação de cabeçalhos consuma o fluxo do SheetWorkspace e permita mapeamento e normalização. (integração)
- ui-quality-screen: Construir tela que consome quality-analysis e apresenta métricas e export. (novo)
- ui-duplicates-screen: Criar/ligar UI de detecção de duplicados usando excel-utils e suportar export concatenado/expandido. (ampliar existente)
- ui-conversion-screen: Ajustar `csv-converter-ui.js` para suportar os casos de concatenação ⇄ quebra descritos (gerar CSV com BOM UTF-8 e delimitador configurável). (completar)
- backend-api: Adiar implementação completa; documentar interface desejada. Se necessário, implementar um micro-serviço para processamento assíncrono e streaming de CSV. (opcional)
- storage-temp: Se backend for necessário, padronizar armazenamento temporário (TTL). No cliente, garantir não reter dados além da sessão do navegador.
- tests-unit: Priorizar testes unitários para excel-utils (parsers, concat/quebra, duplicates) e CrossValidator.
- tests-e2e: Criar fluxos E2E que exercitem upload → validação → conversão → download usando os componentes frontend existentes.
- docs: Atualizar README e criar manual com exemplos práticos das regras de conversão (concat/queima/quebra) e mapeamento para os ficheiros atuais.
- infra-deploy: Anotar opções (deploy estático para frontend; backend micro-serviço opcional). Containerização só se backend for implementado.

Notas e considerações técnicas (detalhadas)
- Regras de conversão: suportar concatenação (delimitador configurável, padrão ";") e quebra para linhas (explodir concatenação em múltiplas linhas mantendo a coluna mãe) ou quebra para colunas (gerar Email1, Email2...). Definir limite máximo de splits (ex.: 10) e comportamento para campos vazios (ignorar entradas vazias ao splitar).
- Integração cliente: usar as implementações em Excel/js/core/* e Excel/js/ui/*; evitar duplicar código — preferir refatorar e expor funções utilitárias testáveis.
- UX: garantir pré-visualização paginada (para arquivos grandes) e opção de escolher delimitador e modo (Concat / ExpandRows / ExpandCols).
- Performance: para arquivos grandes (>100k linhas) considerar fallback para backend stream; documentar limites no README.
- Segurança: validar tipo MIME e tamanho no input; sanitizar aliases/campos; não persistir uploads sem consentimento.

Próximos passos sugeridos (curto prazo)
1. Executar leitura do código existente nas paths listadas em .memory-bank para identificar pontos de integração concretos (sheet workspace, csv-converter-ui.js, excel-utils.js, cross-validator-ui.js).
2. Criar testes unitários para excel-utils (duplicados, concat/quebra) e executar localmente.
3. Ajustar/implementar a UI de conversão para contemplar os exemplos de concatenação/breaking descritos no plano do projeto.
4. Atualizar este arquivo com um mapeamento exato de funções e arquivos modificados após a inspeção do código.

Observação final
- O plano foi corrigido para refletir o estado existente do repositório conforme o .memory-bank (muitos componentes frontend já existem). A estratégia passa por integrar e robustecer essas peças antes de adicionar um backend.
