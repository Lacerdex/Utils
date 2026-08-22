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
        buildExportRows

    };

})();
