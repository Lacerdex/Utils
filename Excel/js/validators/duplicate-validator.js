"use strict";

/*
 * ============================================================
 * DUPLICATE VALIDATOR
 *
 * Responsável por:
 * - identificar duplicatas completas;
 * - distinguir duplicidade por chave de registros diferentes;
 * - agrupar dados por uma coluna-chave;
 * - transformar o resultado em linhas, colunas ou concatenado;
 * - exportar o resultado em CSV ou XLSX.
 *
 * Reaproveita ExcelUtils, CsvWriter e ExcelWriter.
 * ============================================================
 */

const DuplicateValidator = (() => {

    function normalizeValue(value) {

        return ExcelUtils.normalizeForComparison(value);

    }

    function isEmptyValue(value) {

        return ExcelUtils.isEmpty(value);

    }

    function getRowSignature(row) {

        if (!row || typeof row !== "object") {
            return "";
        }

        return Object.keys(row)
            .map(key => `${key}:${normalizeValue(row[key])}`)
            .join("|");

    }

    function getHeaderNames(sheet) {

        if (!sheet || !Array.isArray(sheet.headers)) {
            return [];
        }

        return sheet.headers.slice();

    }

    function deduplicateCompleteRows(rows) {

        if (!Array.isArray(rows)) {
            return [];
        }

        const deduplicated = [];
        const seen = new Set();

        rows.forEach(row => {

            const signature = getRowSignature(row);

            if (!signature || seen.has(signature)) {
                return;
            }

            seen.add(signature);
            deduplicated.push({ ...row });

        });

        return deduplicated;

    }

    function groupRowsByKey(rows, keyColumn) {

        if (!Array.isArray(rows) || !keyColumn) {
            return [];
        }

        const groups = [];
        const index = new Map();

        rows.forEach((row, rowIndex) => {

            if (!row || typeof row !== "object") {
                return;
            }

            const rawKey = row[keyColumn];
            const normalizedKey = normalizeValue(rawKey);

            if (!normalizedKey) {
                return;
            }

            let group = index.get(normalizedKey);

            if (!group) {
                group = {
                    key: rawKey,
                    keyNormalized: normalizedKey,
                    rows: [],
                    rowIndexes: []
                };

                index.set(normalizedKey, group);
                groups.push(group);
            }

            group.rows.push({ ...row });
            group.rowIndexes.push(rowIndex);

        });

        return groups;

    }

    function getRepeatedRows(rows, keyColumn) {

        const groups = groupRowsByKey(rows, keyColumn);

        return groups
            .filter(group => group.rows.length > 1)
            .flatMap(group => group.rows);

    }

    function getResultRows(rows, keyColumn, resultType) {

        if (resultType === "duplicate") {
            return getRepeatedRows(rows, keyColumn);
        }

        return deduplicateCompleteRows(rows);

    }

    function formatSplitHeader(columnName, index) {

        return `${columnName} ${index}`;

    }

    function formatConcatHeader(columnName) {

        const normalized = String(columnName || "").trim();

        if (!normalized) {
            return "Valores";
        }

        const lower = normalized.toLowerCase();

        if (lower.includes("email") || lower.includes("e-mail")) {
            return "Emails";
        }

        if (lower.includes("telefone") || lower.includes("tel") || lower.includes("celular")) {
            return "Telefones";
        }

        if (normalized.endsWith("s")) {
            return normalized;
        }

        return `${normalized}s`;

    }

    function buildRowsResult(sheet, keyColumn, resultType) {

        const filteredRows = getResultRows(sheet.rows, keyColumn, resultType);
        const headers = getHeaderNames(sheet);

        return {
            method: "rows",
            headers,
            rows: filteredRows.map(row => headers.map(header => row?.[header] ?? "")),
            summary: {
                originalCount: sheet.rows.length,
                resultCount: filteredRows.length,
                duplicateGroups: groupRowsByKey(sheet.rows, keyColumn).filter(group => group.rows.length > 1).length,
                duplicatesFound: Math.max(0, sheet.rows.length - deduplicateCompleteRows(sheet.rows).length),
                groupsFound: groupRowsByKey(filteredRows, keyColumn).length,
                resultType
            }
        };

    }

    function buildColumnsResult(sheet, keyColumn, resultType) {

        const filteredRows = getResultRows(sheet.rows, keyColumn, resultType);
        const groups = groupRowsByKey(filteredRows, keyColumn);
        const headers = getHeaderNames(sheet);
        const otherColumns = headers.filter(header => !ExcelUtils.areEqual(header, keyColumn));

        if (!otherColumns.length) {
            return {
                method: "columns",
                headers: [keyColumn],
                rows: groups.map(group => [group.key]),
                summary: {
                    originalCount: sheet.rows.length,
                    resultCount: filteredRows.length,
                    duplicateGroups: groupRowsByKey(sheet.rows, keyColumn).filter(group => group.rows.length > 1).length,
                    duplicatesFound: Math.max(0, sheet.rows.length - deduplicateCompleteRows(sheet.rows).length),
                    groupsFound: groups.length,
                    resultType
                }
            };
        }

        const generatedHeaders = [keyColumn];
        const dynamicColumns = {};

        otherColumns.forEach(column => {
            const maxCount = groups.reduce((max, group) => {
                const values = group.rows
                    .map(row => row?.[column])
                    .filter(value => !isEmptyValue(value));

                return Math.max(max, values.length);
            }, 0);

            dynamicColumns[column] = maxCount;

            for (let index = 1; index <= maxCount; index++) {
                generatedHeaders.push(formatSplitHeader(column, index));
            }

        });

        const rows = groups.map(group => {
            const row = [group.key];

            otherColumns.forEach(column => {
                const values = group.rows
                    .map(entry => entry?.[column])
                    .filter(value => !isEmptyValue(value));

                for (let index = 0; index < dynamicColumns[column]; index++) {
                    row.push(values[index] ?? "");
                }

            });

            return row;
        });

        return {
            method: "columns",
            headers: generatedHeaders,
            rows,
            summary: {
                originalCount: sheet.rows.length,
                resultCount: filteredRows.length,
                duplicateGroups: groupRowsByKey(sheet.rows, keyColumn).filter(group => group.rows.length > 1).length,
                duplicatesFound: Math.max(0, sheet.rows.length - deduplicateCompleteRows(sheet.rows).length),
                groupsFound: groups.length,
                resultType
            }
        };

    }

    function buildConcatResult(sheet, keyColumn, resultType, separator = ";") {

        const filteredRows = getResultRows(sheet.rows, keyColumn, resultType);
        const groups = groupRowsByKey(filteredRows, keyColumn);
        const headers = getHeaderNames(sheet);
        const otherColumns = headers.filter(header => !ExcelUtils.areEqual(header, keyColumn));

        const outputHeaders = [keyColumn, ...otherColumns.map(formatConcatHeader)];

        const rows = groups.map(group => {
            const row = [group.key];

            otherColumns.forEach(column => {
                const values = group.rows
                    .map(entry => entry?.[column])
                    .filter(value => !isEmptyValue(value));

                row.push(values.join(separator));
            });

            return row;
        });

        return {
            method: "concat",
            headers: outputHeaders,
            rows,
            summary: {
                originalCount: sheet.rows.length,
                resultCount: filteredRows.length,
                duplicateGroups: groupRowsByKey(sheet.rows, keyColumn).filter(group => group.rows.length > 1).length,
                duplicatesFound: Math.max(0, sheet.rows.length - deduplicateCompleteRows(sheet.rows).length),
                groupsFound: groups.length,
                resultType
            }
        };

    }

    function validateKeyColumn(sheet, keyColumn) {

        if (!sheet || !Array.isArray(sheet.rows)) {
            return {
                valid: false,
                exists: false,
                message: "Selecione uma aba válida."
            };
        }

        const exists = Array.isArray(sheet.headers) && sheet.headers.some(header =>
            ExcelUtils.areEqual(header, keyColumn)
        );

        if (!exists) {
            return {
                valid: false,
                exists: false,
                message: "A coluna-chave selecionada não existe na planilha."
            };
        }

        const normalizedValues = sheet.rows
            .map(row => row?.[keyColumn])
            .filter(value => !isEmptyValue(value))
            .map(value => normalizeValue(value));

        const unique = new Set(normalizedValues).size;

        return {
            valid: true,
            exists: true,
            message: "Coluna-chave válida.",
            uniqueValues: unique,
            duplicateGroups: groupRowsByKey(sheet.rows, keyColumn).filter(group => group.rows.length > 1).length,
            duplicatesFound: Math.max(0, sheet.rows.length - deduplicateCompleteRows(sheet.rows).length)
        };

    }

    function transform(sheet, options = {}) {

        if (!sheet || !Array.isArray(sheet.rows)) {
            throw new Error("Selecione uma aba válida antes de processar duplicatas.");
        }

        const keyColumn = options.keyColumn || options.columnKey;

        if (!keyColumn) {
            throw new Error("Selecione a coluna-chave antes de transformar os dados.");
        }

        const validation = validateKeyColumn(sheet, keyColumn);
        if (!validation.valid) {
            throw new Error(validation.message);
        }

        const resultType = options.resultType === "duplicate" ? "duplicate" : "unique";
        const method = options.method === "columns"
            ? "columns"
            : options.method === "concat"
                ? "concat"
                : "rows";

        const separator = options.separator || ";";

        if (method === "columns") {
            return buildColumnsResult(sheet, keyColumn, resultType);
        }

        if (method === "concat") {
            return buildConcatResult(sheet, keyColumn, resultType, separator);
        }

        return buildRowsResult(sheet, keyColumn, resultType);

    }

    function exportResult(result, options = {}) {

        const outputFormat = options.format === "csv" ? "csv" : "xlsx";
        const fileName = (options.fileName || "duplicatas").trim() || "duplicatas";

        if (outputFormat === "csv") {
            const csvText = CsvWriter.buildCsv(
                result.headers,
                result.rows,
                options.separator || ";"
            );
            CsvWriter.download(csvText, `${fileName}.csv`);
            return { format: "csv", fileName: `${fileName}.csv` };
        }

        if (typeof XLSX === "undefined") {
            throw new Error("A biblioteca XLSX não está disponível no navegador.");
        }

        const workbook = ExcelWriter.createWorkbook();
        const worksheet = ExcelWriter.createSheetFromArray([
            result.headers,
            ...result.rows
        ]);

        ExcelWriter.addSheet(workbook, worksheet, options.sheetName || "Duplicatas");
        ExcelWriter.download(workbook, `${fileName}.xlsx`);

        return { format: "xlsx", fileName: `${fileName}.xlsx` };

    }

    return {
        normalizeValue,
        deduplicateCompleteRows,
        groupRowsByKey,
        getRepeatedRows,
        validateKeyColumn,
        transform,
        exportResult,
        buildRowsResult,
        buildColumnsResult,
        buildConcatResult,
        formatConcatHeader,
        formatSplitHeader
    };

})();
