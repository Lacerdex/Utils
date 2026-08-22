"use strict";

/*
 * ============================================================
 * CSV TRANSFORM VALIDATOR
 *
 * Responsável pela transformação de planilhas para CSV:
 * - Validação da coluna principal (mãe/alvo)
 * - Agrupamento de registros relacionados
 * - Modo Concatenado: múltiplos valores na mesma célula
 * - Modo Quebra de colunas: colunas dinâmicas por quantidade
 * - Tratamento opcional de duplicados (padrão: manter todos)
 *
 * Reaproveita ExcelUtils e ColumnAliases.
 * ============================================================
 */

const CsvTransformValidator = (() => {

    /**
     * Valida a coluna principal escolhida.
     *
     * Verifica existência, dados preenchidos, vazios,
     * duplicidades e categoria de alias conhecida.
     *
     * @param {Object} sheet
     * @param {string} columnName
     * @returns {Object}
     */
    function validateMainColumn(sheet, columnName) {

        if (!sheet || !Array.isArray(sheet.rows)) {

            throw new Error(
                "Selecione uma aba válida antes de validar a coluna."
            );

        }

        const exists =
            Array.isArray(sheet.headers) &&
            sheet.headers.some(header =>
                ExcelUtils.areEqual(header, columnName)
            );

        if (!exists) {

            return {
                valid: false,
                exists: false,
                messages: [
                    "A coluna selecionada não existe na planilha."
                ]
            };

        }

        const actualHeader =
            sheet.headers.find(header =>
                ExcelUtils.areEqual(header, columnName)
            ) || columnName;

        const rows = sheet.rows;
        const total = rows.length;

        let empty = 0;

        const normalizedValues = [];

        rows.forEach(row => {

            const value =
                row?.[actualHeader];

            if (ExcelUtils.isEmpty(value)) {
                empty++;
                return;
            }

            normalizedValues.push(
                ExcelUtils.normalizeForComparison(value)
            );

        });

        const filled =
            normalizedValues.length;

        const uniqueValues =
            new Set(normalizedValues);

        const duplicates =
            filled - uniqueValues.size;

        const categoryInfo =
            ColumnAliases.findCategory(actualHeader);

        const messages = [];

        let valid = true;

        if (filled === 0) {

            valid = false;
            messages.push(
                "A coluna selecionada não possui dados."
            );

        }

        if (empty > 0) {
            messages.push(
                `A coluna possui ${empty} registro(s) vazio(s).`
            );
        }

        if (duplicates > 0) {
            messages.push(
                `A coluna possui ${duplicates} valor(es) repetido(s). ` +
                `Registros com a mesma chave serão consolidados.`
            );
        }

        if (categoryInfo) {
            messages.push(
                `Categoria identificada via aliases: ${categoryInfo.category}.`
            );
        } else {
            messages.push(
                "Nenhum alias conhecido corresponde a esta coluna."
            );
        }

        if (valid && empty === 0) {
            messages.push("Coluna validada com sucesso.");
        }

        return {
            valid,
            exists: true,
            column: actualHeader,
            total,
            filled,
            empty,
            unique: uniqueValues.size,
            duplicates,
            hasDuplicates: duplicates > 0,
            category: categoryInfo?.category || null,
            messages
        };

    }

    /**
     * Remove duplicados exatamente equivalentes,
     * preservando o primeiro valor original.
     */
    function deduplicate(values) {

        const seen = new Set();
        const result = [];

        values.forEach(value => {

            const key =
                ExcelUtils.normalizeForComparison(value);

            if (seen.has(key)) {
                return;
            }

            seen.add(key);
            result.push(value);

        });

        return result;

    }

    /**
     * Agrupa as linhas pelo valor da coluna principal.
     *
     * A ordem de primeira aparição é preservada e o rótulo
     * do grupo mantém o valor original.
     */
    function groupRows(rows, mainColumn, selectedColumns) {

        const groups = [];
        const index = new Map();

        rows.forEach(row => {

            const rawValue =
                row?.[mainColumn] ?? "";

            const key =
                ExcelUtils.normalizeForComparison(rawValue);

            let group =
                index.get(key);

            if (!group) {

                group = {
                    label: rawValue,
                    values: {}
                };

                selectedColumns.forEach(column => {
                    group.values[column] = [];
                });

                index.set(key, group);
                groups.push(group);

            }

            selectedColumns.forEach(column => {

                const value =
                    row?.[column];

                /*
                 * Células vazias não entram no agrupamento
                 * para não gerar entradas fantasma.
                 */
                if (!ExcelUtils.isEmpty(value)) {
                    group.values[column].push(value);
                }

            });

        });

        return groups;

    }

    /**
     * Transforma a planilha conforme o formato escolhido.
     *
     * @param {Object} sheet
     * @param {Object} options
     * @param {string} options.mainColumn
     * @param {string[]} options.columns
     * @param {"concat"|"split"} options.mode
     * @param {string} options.separator — separador interno do modo concatenado
     * @param {boolean} options.removeDuplicates
     */
    function transform(sheet, options) {

        if (!sheet || !Array.isArray(sheet.rows)) {

            throw new Error(
                "Selecione uma aba válida antes de transformar."
            );

        }

        const mainColumn =
            options.mainColumn;

        if (!mainColumn) {

            throw new Error(
                "Selecione a coluna principal."
            );

        }

        const selectedColumns =
            Array.isArray(options.columns)
                ? options.columns.filter(Boolean)
                : [];

        if (selectedColumns.length === 0) {

            throw new Error(
                "Selecione ao menos uma coluna relacionada."
            );

        }

        const separator =
            options.separator || ";";

        const removeDuplicates =
            options.removeDuplicates === true;

        const groups =
            groupRows(sheet.rows, mainColumn, selectedColumns);

        if (groups.length === 0) {

            throw new Error(
                "Não há registros para transformar."
            );

        }

        function prepareValues(values) {

            return removeDuplicates
                ? deduplicate(values)
                : values.slice();

        }

        if (options.mode === "split") {

            /*
             * QUEBRA DE COLUNAS:
             * quantidade de colunas por campo definida pelo
             * maior número de valores encontrado nos grupos.
             */
            const counts = {};

            selectedColumns.forEach(column => {

                counts[column] = groups.reduce((max, group) =>
                    Math.max(max, group.values[column].length),
                    0
                );

            });

            const headers =
                [mainColumn];

            const columnSlots = {};

            selectedColumns.forEach(column => {

                columnSlots[column] = [];

                for (let i = 1; i <= counts[column]; i++) {
                    const header = `${column} ${i}`;
                    headers.push(header);
                    columnSlots[column].push(header);
                }

            });

            const rows =
                groups.map(group => {

                    const row = [group.label];

                    selectedColumns.forEach(column => {

                        const values =
                            prepareValues(group.values[column]);

                        columnSlots[column].forEach((header, slotIndex) => {
                            row.push(values[slotIndex] ?? "");
                        });

                    });

                    return row;

                });

            return {
                mode: "split",
                headers,
                rows,
                summary: {
                    groups: groups.length,
                    columns: selectedColumns.length,
                    removedDuplicates: removeDuplicates
                }
            };

        }

        /*
         * CONCATENADO:
         * múltiplos valores unidos na mesma célula.
         */
        const headers =
            [mainColumn, ...selectedColumns];

        const rows =
            groups.map(group => {

                const row = [group.label];

                selectedColumns.forEach(column => {

                    const values =
                        prepareValues(group.values[column]);

                    row.push(values.join(separator));

                });

                return row;

            });

        return {
            mode: "concat",
            headers,
            rows,
            summary: {
                groups: groups.length,
                columns: selectedColumns.length,
                removedDuplicates: removeDuplicates
            }
        };

    }

    /**
     * Sugere colunas relacionadas à coluna principal
     * usando a camada de aliases.
     */
    function suggestRelatedColumns(headers, mainColumn) {

        const info =
            ColumnAliases.findCategory(mainColumn);

        if (!info) {
            return [];
        }

        return ColumnAliases
            .relatedHeaders(headers, info.category)
            .map(item => item.header)
            .filter(header =>
                !ExcelUtils.areEqual(header, mainColumn)
            );

    }

    return {
        validateMainColumn,
        transform,
        suggestRelatedColumns
    };

})();