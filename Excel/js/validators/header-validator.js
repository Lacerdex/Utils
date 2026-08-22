/**
 * Header Validator
 * ---------------------------------------------------------
 * Valida a estrutura de cabeçalhos de uma worksheet
 * utilizando um Schema.
 *
 * Responsabilidades:
 *
 * - Reconhecer colunas através de aliases.
 * - Identificar colunas esperadas.
 * - Identificar colunas ausentes.
 * - Identificar colunas obrigatórias ausentes.
 * - Identificar colunas extras.
 * - Identificar duplicidades.
 * - Gerar um relatório estruturado.
 *
 * Este módulo NÃO valida o conteúdo das células.
 */

const HeaderValidator = (() => {


    /* =====================================================
     * RECONHECIMENTO DE COLUNA
     * ===================================================== */

    /**
     * Procura uma coluna do schema dentro dos headers
     * encontrados na planilha.
     *
     * @param {string[]} headers
     * @param {Object} columnDefinition
     *
     * @returns {Object|null}
     */
    function findSchemaColumn(
        headers,
        columnDefinition
    ) {

        if (!Array.isArray(headers)) {
            return null;
        }


        const candidates = [

            columnDefinition.label,

            ...(columnDefinition.aliases || [])

        ];


        for (const candidate of candidates) {

            const result =
                ExcelUtils.findColumn(
                    headers,
                    candidate
                );


            if (result) {

                return {

                    ...result,

                    matchedBy: candidate

                };

            }

        }


        return null;

    }


    /* =====================================================
     * VALIDAÇÃO
     * ===================================================== */

    /**
     * Valida os cabeçalhos de uma worksheet.
     *
     * @param {Object} sheet
     * @param {Object} schema
     *
     * @returns {Object}
     */
    function validate(
        sheet,
        schema
    ) {

        if (!sheet) {

            throw new Error(
                'Worksheet inválida.'
            );

        }


        if (!schema) {

            throw new Error(
                'Schema inválido.'
            );

        }


        const schemaFields =
            schema.columns ||
            schema.fields;


        if (
            !schemaFields ||
            typeof schemaFields !== "object"
        ) {

            throw new Error(
                "Schema sem campos definidos."
            );

        }


        const headers =
            Array.isArray(sheet.headers)
                ? sheet.headers
                : [];


        const fields = {};


        const matchedIndexes = new Set();


        let foundCount = 0;

        let missingCount = 0;

        let requiredMissingCount = 0;


        /* ---------------------------------------------
         * CAMPOS DO SCHEMA
         * ------------------------------------------- */

        Object.entries(
            schemaFields
        ).forEach(
            ([columnId, definition]) => {

                const match =
                    findSchemaColumn(
                        headers,
                        definition
                    );


                if (match) {

                    foundCount++;

                    matchedIndexes.add(
                        match.index
                    );


                    fields[columnId] = {

                        id: columnId,

                        label:
                            definition.label,

                        required:
                            definition.required === true,

                        status:
                            'found',

                        originalHeader:
                            match.original,

                        index:
                            match.index,

                        matchedBy:
                            match.matchedBy

                    };

                } else {

                    missingCount++;


                    if (
                        definition.required === true
                    ) {

                        requiredMissingCount++;

                    }


                    fields[columnId] = {

                        id: columnId,

                        label:
                            definition.label,

                        required:
                            definition.required === true,

                        status:
                            'missing',

                        originalHeader:
                            null,

                        index:
                            -1,

                        matchedBy:
                            null

                    };

                }

            }
        );


        /* ---------------------------------------------
         * COLUNAS EXTRAS
         * ------------------------------------------- */

        const extraColumns = [];


        headers.forEach(
            (header, index) => {

                if (
                    !matchedIndexes.has(index)
                ) {

                    extraColumns.push({

                        header,

                        index

                    });

                }

            }
        );


        /* ---------------------------------------------
         * DUPLICIDADES
         * ------------------------------------------- */

        const duplicateColumns =
            ExcelUtils.findDuplicateColumns(
                headers
            );


        /* ---------------------------------------------
         * CABEÇALHOS VAZIOS
         * ------------------------------------------- */

        const emptyHeaders =
            headers.filter(
                header =>
                    ExcelUtils.isEmpty(header)
            );


        /* ---------------------------------------------
         * RESULTADO
         * ------------------------------------------- */

        const isValid =
            requiredMissingCount === 0;


        return {

            valid: isValid,

            status:
                isValid
                    ? 'valid'
                    : 'invalid',


            sheet: {

                name: sheet.name,

                rowCount:
                    sheet.rowCount,

                columnCount:
                    sheet.columnCount

            },


            summary: {

                expected:
                    Object.keys(
                        schemaFields
                    ).length,

                found:
                    foundCount,

                missing:
                    missingCount,

                requiredMissing:
                    requiredMissingCount,

                extra:
                    extraColumns.length,

                duplicates:
                    duplicateColumns.length,

                emptyHeaders:
                    emptyHeaders.length

            },


            fields,


            extraColumns,


            duplicateColumns,


            emptyHeaders

        };

    }


    /* =====================================================
     * VALIDAÇÃO DE ARQUIVO
     * ===================================================== */

    /**
     * Valida todas as abas de um arquivo.
     *
     * @param {Object} excel
     * @param {Object} schema
     *
     * @returns {Object}
     */
    function validateWorkbook(
        excel,
        schema
    ) {

        if (!excel) {

            throw new Error(
                'Arquivo Excel inválido.'
            );

        }


        const results =
            excel.sheets.map(
                sheet =>
                    validate(
                        sheet,
                        schema
                    )
            );


        const validSheets =
            results.filter(
                result =>
                    result.valid
            );


        return {

            valid:
                results.length > 0 &&
                validSheets.length === results.length,


            sheetCount:
                results.length,


            validCount:
                validSheets.length,


            invalidCount:
                results.length -
                validSheets.length,


            sheets:
                results

        };

    }


    /* =====================================================
     * API PÚBLICA
     * ===================================================== */

    return {

        validate,

        validateWorkbook

    };

})();