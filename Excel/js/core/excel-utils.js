/**
 * Excel Utils
 * ---------------------------------------------------------
 * Funções auxiliares para processamento de arquivos Excel.
 *
 * Responsabilidades:
 * - Normalização de cabeçalhos
 * - Normalização de valores
 * - Comparação de colunas
 * - Criação de mapas de colunas
 * - Busca de colunas
 * - Detecção de colunas duplicadas
 * - Verificação de linhas vazias
 * - Geração de identificadores
 *
 * Não contém regras específicas de validação.
 */

const ExcelUtils = (() => {

    /* =====================================================
     * NORMALIZAÇÃO
     * ===================================================== */

    /**
     * Normaliza um texto para comparação.
     *
     * Exemplos:
     *
     * " Nome do Cliente "
     *       ↓
     * "nome do cliente"
     *
     * "NOME_DO_CLIENTE"
     *       ↓
     * "nome do cliente"
     *
     * @param {*} value
     * @returns {string}
     */
    function normalizeText(value) {

        if (value === null || value === undefined) {
            return '';
        }

        return String(value)
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim()
            .toLowerCase()
            .replace(/[_-]+/g, ' ')
            .replace(/\s+/g, ' ');
    }


    /**
     * Normaliza um cabeçalho para comparação.
     *
     * @param {*} value
     * @returns {string}
     */
    function normalizeHeader(value) {

        return normalizeText(value);
    }


    /**
     * Normaliza um valor genérico.
     *
     * @param {*} value
     * @returns {string}
     */
    function normalizeValue(value) {

        if (value === null || value === undefined) {
            return '';
        }

        return String(value)
            .trim()
            .replace(/\s+/g, ' ');
    }


    /**
     * Normaliza um valor para comparação.
     *
     * Remove:
     * - espaços
     * - acentos
     * - diferenças de maiúsculas/minúsculas
     * - alguns caracteres especiais
     *
     * @param {*} value
     * @returns {string}
     */
    function normalizeForComparison(value) {

        return normalizeText(value)
            .replace(/[^a-z0-9]/g, '');
    }


    /* =====================================================
     * COMPARAÇÃO
     * ===================================================== */

    /**
     * Compara dois textos após normalização.
     *
     * @param {*} valueA
     * @param {*} valueB
     * @returns {boolean}
     */
    function areEqual(valueA, valueB) {

        return normalizeForComparison(valueA) ===
               normalizeForComparison(valueB);
    }


    /**
     * Verifica se um valor está vazio.
     *
     * @param {*} value
     * @returns {boolean}
     */
    function isEmpty(value) {

        return value === null ||
               value === undefined ||
               String(value).trim() === '';
    }


    /**
     * Verifica se uma linha está completamente vazia.
     *
     * @param {Object} row
     * @returns {boolean}
     */
    function isEmptyRow(row) {

        if (!row || typeof row !== 'object') {
            return true;
        }

        return Object.values(row)
            .every(value => isEmpty(value));
    }


    /* =====================================================
     * CABEÇALHOS
     * ===================================================== */

    /**
     * Cria um mapa de colunas.
     *
     * Exemplo:
     *
     * [
     *   "Nome",
     *   "CPF",
     *   "Data de Nascimento"
     * ]
     *
     * retorna:
     *
     * {
     *   "nome": {
     *      original: "Nome",
     *      index: 0
     *   },
     *
     *   "cpf": {
     *      original: "CPF",
     *      index: 1
     *   }
     * }
     *
     * @param {string[]} headers
     * @returns {Object}
     */
    function createColumnMap(headers) {

        if (!Array.isArray(headers)) {
            return {};
        }

        const map = {};

        headers.forEach((header, index) => {

            const normalized =
                normalizeHeader(header);

            if (!normalized) {
                return;
            }

            if (!map[normalized]) {

                map[normalized] = {
                    original: header,
                    index
                };

            }

        });

        return map;
    }


    /**
     * Retorna uma lista de cabeçalhos normalizados.
     *
     * @param {string[]} headers
     * @returns {string[]}
     */
    function normalizeHeaders(headers) {

        if (!Array.isArray(headers)) {
            return [];
        }

        return headers.map(
            header => normalizeHeader(header)
        );
    }


    /**
     * Procura uma coluna.
     *
     * Aceita:
     *
     * "CPF"
     *
     * ou:
     *
     * [
     *   "CPF",
     *   "Documento",
     *   "CPF Cliente"
     * ]
     *
     * @param {string[]} headers
     * @param {string|string[]} candidates
     *
     * @returns {Object|null}
     */
    function findColumn(headers, candidates) {

        if (!Array.isArray(headers)) {
            return null;
        }

        if (!Array.isArray(candidates)) {
            candidates = [candidates];
        }

        for (const candidate of candidates) {

            const candidateNormalized =
                normalizeForComparison(candidate);

            const index = headers.findIndex(
                header =>
                    normalizeForComparison(header) ===
                    candidateNormalized
            );

            if (index !== -1) {

                return {
                    original: headers[index],
                    index
                };

            }

        }

        return null;
    }


    /**
     * Verifica quais colunas estão faltando.
     *
     * @param {string[]} actualHeaders
     * @param {string[]} expectedHeaders
     *
     * @returns {string[]}
     */
    function findMissingColumns(
        actualHeaders,
        expectedHeaders
    ) {

        if (!Array.isArray(actualHeaders) ||
            !Array.isArray(expectedHeaders)) {

            return [];
        }

        return expectedHeaders.filter(
            expected => {

                return !actualHeaders.some(
                    actual =>
                        areEqual(actual, expected)
                );

            }
        );
    }


    /**
     * Verifica quais colunas são extras.
     *
     * @param {string[]} actualHeaders
     * @param {string[]} expectedHeaders
     *
     * @returns {string[]}
     */
    function findExtraColumns(
        actualHeaders,
        expectedHeaders
    ) {

        if (!Array.isArray(actualHeaders) ||
            !Array.isArray(expectedHeaders)) {

            return [];
        }

        return actualHeaders.filter(
            actual => {

                return !expectedHeaders.some(
                    expected =>
                        areEqual(actual, expected)
                );

            }
        );
    }


    /**
     * Detecta cabeçalhos duplicados.
     *
     * Exemplo:
     *
     * [
     *   "Nome",
     *   "CPF",
     *   "Nome"
     * ]
     *
     * retorna:
     *
     * [
     *   "Nome"
     * ]
     *
     * @param {string[]} headers
     * @returns {string[]}
     */
    function findDuplicateColumns(headers) {

        if (!Array.isArray(headers)) {
            return [];
        }

        const occurrences = {};
        const duplicates = [];

        headers.forEach(header => {

            const normalized =
                normalizeForComparison(header);

            if (!normalized) {
                return;
            }

            occurrences[normalized] =
                (occurrences[normalized] || 0) + 1;

        });


        headers.forEach(header => {

            const normalized =
                normalizeForComparison(header);

            if (
                normalized &&
                occurrences[normalized] > 1 &&
                !duplicates.some(
                    duplicate =>
                        areEqual(duplicate, header)
                )
            ) {

                duplicates.push(header);

            }

        });

        return duplicates;
    }


    /* =====================================================
     * COLUNAS / DADOS
     * ===================================================== */

    /**
     * Retorna o índice de uma coluna.
     *
     * @param {string[]} headers
     * @param {string} columnName
     *
     * @returns {number}
     */
    function getColumnIndex(headers, columnName) {

        const column =
            findColumn(
                headers,
                columnName
            );

        return column
            ? column.index
            : -1;
    }


    /**
     * Extrai uma coluna dos dados.
     *
     * @param {Object[]} rows
     * @param {string} columnName
     *
     * @returns {Array}
     */
    function getColumnValues(rows, columnName) {

        if (!Array.isArray(rows)) {
            return [];
        }

        return rows.map(
            row => row?.[columnName] ?? null
        );
    }


    /**
     * Remove linhas completamente vazias.
     *
     * @param {Object[]} rows
     *
     * @returns {Object[]}
     */
    function removeEmptyRows(rows) {

        if (!Array.isArray(rows)) {
            return [];
        }

        return rows.filter(
            row => !isEmptyRow(row)
        );
    }


    /**
     * Conta valores únicos de uma coluna.
     *
     * @param {Object[]} rows
     * @param {string} columnName
     *
     * @returns {number}
     */
    function countUniqueValues(rows, columnName) {

        const values =
            getColumnValues(
                rows,
                columnName
            );

        const normalized =
            values
                .filter(value => !isEmpty(value))
                .map(value =>
                    normalizeForComparison(value)
                );

        return new Set(normalized).size;
    }


    /**
     * Retorna os valores duplicados de uma coluna.
     *
     * @param {Object[]} rows
     * @param {string} columnName
     *
     * @returns {Array}
     */
    function findDuplicateValues(rows, columnName) {

        if (!Array.isArray(rows)) {
            return [];
        }

        const occurrences = {};

        rows.forEach(row => {

            const value =
                row?.[columnName];

            if (isEmpty(value)) {
                return;
            }

            const normalized =
                normalizeForComparison(value);

            occurrences[normalized] =
                (occurrences[normalized] || 0) + 1;

        });


        const duplicates = [];

        rows.forEach(row => {

            const value =
                row?.[columnName];

            if (isEmpty(value)) {
                return;
            }

            const normalized =
                normalizeForComparison(value);

            if (
                occurrences[normalized] > 1 &&
                !duplicates.some(
                    duplicate =>
                        areEqual(duplicate, value)
                )
            ) {

                duplicates.push(value);

            }

        });

        return duplicates;
    }


    /* =====================================================
     * ESTRUTURA
     * ===================================================== */

    /**
     * Analisa a estrutura básica de uma worksheet.
     *
     * @param {Object} sheet
     *
     * @returns {Object}
     */
    function analyzeSheet(sheet) {

        if (!sheet) {
            return null;
        }

        const headers =
            Array.isArray(sheet.headers)
                ? sheet.headers
                : [];

        const rows =
            Array.isArray(sheet.rows)
                ? sheet.rows
                : [];


        return {

            name: sheet.name,

            rowCount: rows.length,

            columnCount: headers.length,

            headers,

            normalizedHeaders:
                normalizeHeaders(headers),

            emptyHeaders:
                headers.filter(
                    header => isEmpty(header)
                ),

            duplicateHeaders:
                findDuplicateColumns(headers),

            emptyRows:
                rows.filter(
                    row => isEmptyRow(row)
                ).length

        };
    }


    /* =====================================================
     * IDENTIFICADORES
     * ===================================================== */

    /**
     * Gera um identificador simples.
     *
     * @param {string} prefix
     *
     * @returns {string}
     */
    function generateId(prefix = 'excel') {

        const timestamp =
            Date.now().toString(36);

        const random =
            Math.random()
                .toString(36)
                .substring(2, 8);

        return `${prefix}_${timestamp}_${random}`;
    }


    /* =====================================================
     * API PÚBLICA
     * ===================================================== */

    return {

        // Normalização
        normalizeText,
        normalizeHeader,
        normalizeValue,
        normalizeForComparison,

        // Comparação
        areEqual,
        isEmpty,
        isEmptyRow,

        // Cabeçalhos
        createColumnMap,
        normalizeHeaders,
        findColumn,
        findMissingColumns,
        findExtraColumns,
        findDuplicateColumns,

        // Dados
        getColumnIndex,
        getColumnValues,
        removeEmptyRows,
        countUniqueValues,
        findDuplicateValues,

        // Estrutura
        analyzeSheet,

        // Identificação
        generateId

    };

})();