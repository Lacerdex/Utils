"use strict";

/*
 * ============================================================
 * CRUZAMENTO DE PLANILHAS
 *
 * Compara duas abas por uma ou mais chaves.
 * A extração de colunas é independente das chaves.
 * ============================================================
 */

const CrossValidator = (() => {

    function assertPairs(keyPairs) {

        if (!Array.isArray(keyPairs) || keyPairs.length === 0) {

            throw new Error(
                "Selecione ao menos uma chave de cruzamento."
            );

        }

        keyPairs.forEach((pair, index) => {

            if (!pair.left || !pair.right) {

                throw new Error(
                    `A chave ${index + 1} está incompleta.`
                );

            }

        });

    }


    function rowKey(row, columns) {

        const parts = columns.map(column =>
            ExcelUtils.normalizeForComparison(row?.[column])
        );

        if (parts.every(part => part === "")) {
            return null;
        }

        return parts.join("||");

    }


    function indexRows(rows, columns) {

        const index = new Map();

        rows.forEach((row, rowIndex) => {

            const key = rowKey(row, columns);

            if (!key) {
                return;
            }

            if (!index.has(key)) {
                index.set(key, []);
            }

            index.get(key).push(rowIndex);

        });

        return index;

    }


    function compare(sheetA, sheetB, keyPairs) {

        if (!sheetA || !sheetB) {

            throw new Error(
                "As duas planilhas precisam estar carregadas."
            );

        }

        assertPairs(keyPairs);

        const leftColumns = keyPairs.map(pair => pair.left);
        const rightColumns = keyPairs.map(pair => pair.right);

        const rowsA = Array.isArray(sheetA.rows) ? sheetA.rows : [];
        const rowsB = Array.isArray(sheetB.rows) ? sheetB.rows : [];

        const indexB = indexRows(rowsB, rightColumns);

        const matched = [];
        const onlyA = [];
        const matchedB = new Set();

        rowsA.forEach((rowA, indexA) => {

            const key = rowKey(rowA, leftColumns);

            if (!key) {

                onlyA.push({
                    index: indexA,
                    row: rowA,
                    key: null
                });

                return;

            }

            const hits = indexB.get(key);

            if (!hits || hits.length === 0) {

                onlyA.push({
                    index: indexA,
                    row: rowA,
                    key
                });

                return;

            }

            hits.forEach(indexB => {

                matchedB.add(indexB);

                matched.push({
                    key,
                    indexA,
                    indexB,
                    rowA,
                    rowB: rowsB[indexB]
                });

            });

        });

        const onlyB = [];

        rowsB.forEach((rowB, indexB) => {

            if (matchedB.has(indexB)) {
                return;
            }

            onlyB.push({
                index: indexB,
                row: rowB,
                key: rowKey(rowB, rightColumns)
            });

        });

        return {

            keyPairs,

            matched,
            onlyA,
            onlyB,

            summary: {

                rowsA: rowsA.length,
                rowsB: rowsB.length,
                matched: matched.length,
                onlyA: onlyA.length,
                onlyB: onlyB.length,
                keys: keyPairs.length

            }

        };

    }


    /**
     * Consolida duas planilhas em uma terceira, preservando
     * TODOS os registros das duas fontes (FULL OUTER JOIN).
     *
     * Regras:
     * - A primeira chave vira a coluna de cruzamento (uma única vez);
     * - Cada coluna não-chave recebe o sufixo de origem;
     * - Valores idênticos nas duas fontes são marcados na coluna
     *   "Duplicado";
     * - Registros exclusivos de cada planilha são preservados.
     *
     * @param {Object} sheetA
     * @param {Object} sheetB
     * @param {Object[]} keyPairs
     * @returns {Object}
     */
    function consolidate(sheetA, sheetB, keyPairs) {

        if (!sheetA || !sheetB) {

            throw new Error(
                "As duas planilhas precisam estar carregadas."
            );

        }

        assertPairs(keyPairs);

        const primaryPair = keyPairs[0];
        const leftCol = primaryPair.left;
        const rightCol = primaryPair.right;

        const labelA = "Planilha 1";
        const labelB = "Planilha 2";

        const headersA = Array.isArray(sheetA.headers) ? sheetA.headers : [];
        const headersB = Array.isArray(sheetB.headers) ? sheetB.headers : [];
        const rowsA = Array.isArray(sheetA.rows) ? sheetA.rows : [];
        const rowsB = Array.isArray(sheetB.rows) ? sheetB.rows : [];

        const leftColumns = keyPairs.map(pair => pair.left);
        const rightColumns = keyPairs.map(pair => pair.right);

        const isPrimaryKeyA = header =>
            areEqual(header, leftCol);

        const isPrimaryKeyB = header =>
            areEqual(header, rightCol);

        const keyHeader = `${leftCol} (Cruzamento)`;

        const columns = [];

        columns.push({
            header: keyHeader,
            source: "key",
            original: leftCol
        });

        headersA.forEach(header => {

            if (isPrimaryKeyA(header)) {
                return;
            }

            columns.push({
                header: `${header} (${labelA})`,
                source: "A",
                original: header
            });

        });

        headersB.forEach(header => {

            if (isPrimaryKeyB(header)) {
                return;
            }

            columns.push({
                header: `${header} (${labelB})`,
                source: "B",
                original: header
            });

        });

        columns.push({
            header: "Duplicado",
            source: "meta",
            original: null
        });

        function specForColumn(source, originalHeader) {

            return columns.find(column =>
                column.source === source &&
                areEqual(column.original, originalHeader)
            );

        }

        function blankRow() {

            const row = {};

            columns.forEach(column => {
                row[column.header] = "";
            });

            return row;

        }

        function setFromA(row, originalHeader, value) {

            const spec = specForColumn("A", originalHeader);

            if (spec) {
                row[spec.header] = value ?? "";
            }

        }

        function setFromB(row, originalHeader, value) {

            const spec = specForColumn("B", originalHeader);

            if (spec) {
                row[spec.header] = value ?? "";
            }

        }

        const indexB = indexRows(rowsB, rightColumns);

        const commonColumns = headersA.filter(headerA =>
            headersB.some(headerB =>
                areEqual(headerA, headerB)
            )
        );

        return buildConsolidatedRows();

        function markDuplicates(row, rowA, rowB) {

            const duplicated = [];

            commonColumns.forEach(column => {

                if (isPrimaryKeyA(column) || isPrimaryKeyB(column)) {
                    return;
                }

                const valueA = rowA?.[column];
                const valueB = rowB?.[column];

                if (isEmptyValue(valueA) || isEmptyValue(valueB)) {
                    return;
                }

                if (areEqual(valueA, valueB)) {
                    duplicated.push(column);
                }

            });

            row["Duplicado"] = duplicated.join(", ");

        }

        function buildOnlyA(rowA) {

            const row = blankRow();
            row[keyHeader] = rowA?.[leftCol] ?? "";

            headersA.forEach(header => {
                setFromA(row, header, rowA?.[header]);
            });

            return row;

        }

        function buildOnlyB(rowB) {

            const row = blankRow();
            row[keyHeader] = rowB?.[rightCol] ?? "";

            headersB.forEach(header => {
                setFromB(row, header, rowB?.[header]);
            });

            return row;

        }

        function buildMatched(rowA, rowB) {

            const row = blankRow();
            row[keyHeader] = rowA?.[leftCol] ?? "";

            headersA.forEach(header => {
                setFromA(row, header, rowA?.[header]);
            });

            headersB.forEach(header => {
                setFromB(row, header, rowB?.[header]);
            });

            markDuplicates(row, rowA, rowB);

            return row;

        }

        function buildConsolidatedRows() {

            const rows = [];
            const usedB = new Set();
            const matchedKeys = new Set();

            rowsA.forEach(rowA => {

                const key = rowKey(rowA, leftColumns);

                if (!key) {
                    rows.push(buildOnlyA(rowA));
                    return;
                }

                const hits = indexB.get(key);

                if (!hits || hits.length === 0) {
                    rows.push(buildOnlyA(rowA));
                    return;
                }

                matchedKeys.add(key);

                hits.forEach(indexBItem => {

                    usedB.add(indexBItem);
                    rows.push(buildMatched(rowA, rowsB[indexBItem]));

                });

            });

            rowsB.forEach((rowB, rowIndex) => {

                if (usedB.has(rowIndex)) {
                    return;
                }

                rows.push(buildOnlyB(rowB));

            });

            const summaryCompare = compare(sheetA, sheetB, keyPairs).summary;

            return {
                keyPairs,
                keyHeader,
                columns: columns.map(column => column.header),
                rows,
                summary: {
                    rowsA: rowsA.length,
                    rowsB: rowsB.length,
                    rows: rows.length,
                    matched: matchedKeys.size,
                    onlyA: summaryCompare.onlyA,
                    onlyB: summaryCompare.onlyB
                }
            };

        }

    }


    function uniqueHeader(name, used) {

        let candidate = name;
        let suffix = 2;

        while (used.has(candidate)) {

            candidate = `${name} (${suffix})`;
            suffix += 1;

        }

        used.add(candidate);

        return candidate;

    }


    function areEqual(valueA, valueB) {

        return ExcelUtils.normalizeForComparison(valueA) ===
               ExcelUtils.normalizeForComparison(valueB);

    }


    function isEmptyValue(value) {

        return value === null ||
               value === undefined ||
               String(value).trim() === "";

    }


    /**
     * Monta as linhas da extração.
     *
     * @param {Object} result
     * @param {Object} options
     * @param {"matched"|"onlyA"|"onlyB"} options.set
     * @param {string[]} options.columnsA
     * @param {string[]} options.columnsB
     */
    function buildExportRows(result, options) {

        const set = options.set || "matched";
        const columnsA = options.columnsA || [];
        const columnsB = options.columnsB || [];

        const used = new Set();

        const headersA = columnsA.map(column =>
            uniqueHeader(column, used)
        );

        const headersB = columnsB.map(column =>
            uniqueHeader(column, used)
        );

        const rows = [];

        function pushFromA(item) {

            const row = {};

            columnsA.forEach((column, index) => {
                row[headersA[index]] = item.row?.[column] ?? "";
            });

            columnsB.forEach((_, index) => {
                row[headersB[index]] = "";
            });

            rows.push(row);

        }

        function pushFromB(item) {

            const row = {};

            columnsA.forEach((_, index) => {
                row[headersA[index]] = "";
            });

            columnsB.forEach((column, index) => {
                row[headersB[index]] = item.row?.[column] ?? "";
            });

            rows.push(row);

        }

        function pushMatched(item) {

            const row = {};

            columnsA.forEach((column, index) => {
                row[headersA[index]] = item.rowA?.[column] ?? "";
            });

            columnsB.forEach((column, index) => {
                row[headersB[index]] = item.rowB?.[column] ?? "";
            });

            rows.push(row);

        }

        if (set === "matched") {

            if (columnsA.length === 0 && columnsB.length === 0) {

                throw new Error(
                    "Selecione as colunas que devem ir para a planilha extraída."
                );

            }

            result.matched.forEach(pushMatched);

        } else if (set === "onlyA") {

            if (columnsA.length === 0) {

                throw new Error(
                    "Selecione ao menos uma coluna da planilha 1 para extrair."
                );

            }

            result.onlyA.forEach(pushFromA);

        } else if (set === "onlyB") {

            if (columnsB.length === 0) {

                throw new Error(
                    "Selecione ao menos uma coluna da planilha 2 para extrair."
                );

            }

            result.onlyB.forEach(pushFromB);

        } else {

            throw new Error("Conjunto de extração inválido.");

        }

        return rows;

    }


    return {

        compare,
        buildExportRows,
        consolidate

    };

})();
