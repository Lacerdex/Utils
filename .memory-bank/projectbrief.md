# Project Brief — Utils Excel

## Visão Geral
Sistema **100% local** para manipulação de arquivos Excel (.xlsx) diretamente no navegador, **sem conexão externa** e **sem ambiente de execução** (apenas HTML/CSS/JavaScript estático). O projeto também mantém um catálogo local de arquivos em navegador, armazenando metadados e conteúdo em IndexedDB para permitir cadastro, busca e reutilização sem criar backend ou banco de dados externo.

## Objetivo
Fornecer ferramentas para:
- Validação de planilhas (cabeçalho, dados, formato, duplicados)
- Cruzamento de planilhas (comparação por chaves)
- Extração de resultados finais
- Verificação de atendimento de métricas de qualidade

## Requisitos Principais
1. **Local**: nenhuma chamada de rede para processamento (a biblioteca SheetJS é carregada via CDN, mas o processamento é 100% no navegador)
2. **Sem servidor**: arquivos `.html` abertos diretamente
3. **Formatos**: suporte apenas `.xlsx`
4. **Língua**: interface em pt-BR

## Validação Atual
- O projeto foi validado no diretório `Excel` usando os testes existentes do repositório.
- O módulo de categorização e os fluxos relacionados estão presentes e operando conforme o objetivo do produto.
- O memory bank foi alinhado com o estado real do projeto e com os testes executados.

## Status do Memory Bank
- [x] Ler o arquivo .clinerules atual
- [x] Localizar a estrutura do memory bank no projeto
- [x] Criar a estrutura do memory bank
- [x] Documentar o estado atual do projeto
- [x] Registrar as funcionalidades implementadas
- [x] Concluir a atualização