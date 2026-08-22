/**
 * Data Validator
 * ---------------------------------------------------------
 * Responsável pela análise do conteúdo das planilhas.
 *
 * Funcionalidades:
 *
 * - Contagem de registros.
 * - Identificação de valores vazios.
 * - Percentual de preenchimento.
 * - Percentual de ausência.
 * - Validação de e-mail.
 * - Validação de celular.
 * - Validação de CPF.
 * - Identificação de valores inválidos.
 * - Geração de relatório por campo.
 *
 * IMPORTANTE:
 *
 * Este módulo depende do resultado do HeaderValidator.
 * Ele não tenta descobrir sozinho onde estão as colunas.
 */

const DataValidator = (() => {


    /* =====================================================
     * CONFIGURAÇÕES
     * ===================================================== */

    const DEFAULT_OPTIONS = {

        /**
         * Considera strings vazias como ausência.
         */
        trimValues: true,

        /**
         * Considera espaços como valores vazios.
         */
        ignoreWhitespace: true

    };


    /* =====================================================
     * UTILITÁRIOS
     * ===================================================== */

    /**
     * Verifica se um valor está vazio.
     *
     * @param {*} value
     * @returns {boolean}
     */
    function isEmpty(value) {

        if (
            value === null ||
            value === undefined
        ) {
            return true;
        }


        if (typeof value === 'string') {

            return value.trim() === '';

        }


        return false;

    }


    /**
     * Normaliza um valor para validação.
     *
     * @param {*} value
     * @returns {string}
     */
    function normalizeValue(value) {

        if (isEmpty(value)) {
            return '';
        }


        return String(value).trim();

    }


    /**
     * Calcula percentual.
     *
     * @param {number} value
     * @param {number} total
     *
     * @returns {number}
     */
    function percentage(value, total) {

        if (!total) {
            return 0;
        }


        return Number(
            ((value / total) * 100).toFixed(2)
        );

    }


    /* =====================================================
     * E-MAIL
     * ===================================================== */

    /**
     * Valida formato básico de e-mail.
     *
     * Não pretende validar se o endereço realmente existe.
     *
     * @param {*} value
     * @returns {boolean}
     */
    function isValidEmail(value) {

        const email =
            normalizeValue(value);


        if (!email) {
            return false;
        }


        /*
         * Validação básica:
         *
         * usuario@dominio.ext
         */
        const emailRegex =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


        return emailRegex.test(email);

    }


    /* =====================================================
     * CELULAR
     * ===================================================== */

    /**
     * Remove caracteres não numéricos.
     *
     * @param {*} value
     * @returns {string}
     */
    function onlyDigits(value) {

        return String(
            value ?? ''
        ).replace(/\D/g, '');

    }


    /**
     * Valida um telefone/celular brasileiro
     * de forma estrutural.
     *
     * Aceita números com DDD e variações de máscara.
     *
     * Exemplos:
     *
     * (11) 99999-9999
     * 11999999999
     * 11 99999-9999
     *
     * @param {*} value
     * @returns {boolean}
     */
    function isValidPhone(value) {

        const digits =
            onlyDigits(value);


        /*
         * Brasil:
         *
         * 10 dígitos:
         * DDD + telefone fixo
         *
         * 11 dígitos:
         * DDD + celular
         */

        if (
            digits.length !== 10 &&
            digits.length !== 11
        ) {

            return false;

        }


        /*
         * DDD brasileiro:
         *
         * 11 até 99
         */
        const ddd =
            Number(
                digits.substring(0, 2)
            );


        if (
            ddd < 11 ||
            ddd > 99
        ) {

            return false;

        }


        return true;

    }


    /* =====================================================
     * CPF
     * ===================================================== */

    /**
     * Valida CPF através dos dígitos verificadores.
     *
     * Aceita CPF com ou sem máscara.
     *
     * @param {*} value
     * @returns {boolean}
     */
    function isValidCPF(value) {

        const cpf =
            onlyDigits(value);


        if (cpf.length !== 11) {
            return false;
        }


        /*
         * Impede CPFs compostos pelo
         * mesmo número.
         */
        if (
            /^(\d)\1{10}$/.test(cpf)
        ) {

            return false;

        }


        /* ---------------------------------------------
         * PRIMEIRO DÍGITO
         * ------------------------------------------- */

        let sum = 0;


        for (
            let i = 0;
            i < 9;
            i++
        ) {

            sum +=
                Number(cpf[i]) *
                (10 - i);

        }


        let remainder =
            (sum * 10) % 11;


        if (remainder === 10) {
            remainder = 0;
        }


        if (
            remainder !==
            Number(cpf[9])
        ) {

            return false;

        }


        /* ---------------------------------------------
         * SEGUNDO DÍGITO
         * ------------------------------------------- */

        sum = 0;


        for (
            let i = 0;
            i < 10;
            i++
        ) {

            sum +=
                Number(cpf[i]) *
                (11 - i);

        }


        remainder =
            (sum * 10) % 11;


        if (remainder === 10) {
            remainder = 0;
        }


        return (
            remainder ===
            Number(cpf[10])
        );

    }


    /* =====================================================
     * VALIDAÇÃO DE CAMPO
     * ===================================================== */

    /**
     * Valida um valor conforme o tipo do campo.
     *
     * @param {*} value
     * @param {string} fieldId
     *
     * @returns {Object}
     */
    function validateValue(
        value,
        fieldId
    ) {

        const empty =
            isEmpty(value);


        /*
         * Valor vazio não é considerado
         * inválido por formato.
         *
         * A obrigatoriedade é tratada
         * separadamente.
         */

        if (empty) {

            return {

                valid: true,

                empty: true,

                reason: null

            };

        }


        switch (fieldId) {

            case 'email':

                return {

                    valid:
                        isValidEmail(value),

                    empty: false,

                    reason:
                        isValidEmail(value)
                            ? null
                            : 'Formato de e-mail inválido'

                };


            case 'celular':

                return {

                    valid:
                        isValidPhone(value),

                    empty: false,

                    reason:
                        isValidPhone(value)
                            ? null
                            : 'Formato de celular inválido'

                };


            case 'cpf':

                return {

                    valid:
                        isValidCPF(value),

                    empty: false,

                    reason:
                        isValidCPF(value)
                            ? null
                            : 'CPF inválido'

                };


            default:

                return {

                    valid: true,

                    empty: false,

                    reason: null

                };

        }

    }


    /* =====================================================
     * ANÁLISE DE CAMPO
     * ===================================================== */

    /**
     * Analisa uma coluna inteira.
     *
     * @param {Object[]} rows
     * @param {string} columnId
     * @param {string} columnName
     * @param {boolean} required
     *
     * @returns {Object}
     */
    function analyzeField(
        rows,
        columnId,
        columnName,
        required = false
    ) {

        const total =
            rows.length;


        let filled = 0;

        let empty = 0;

        let valid = 0;

        let invalid = 0;


        const emptyRows = [];

        const invalidRows = [];


        rows.forEach(
            (row, index) => {

                const value =
                    row?.[columnName];


                const result =
                    validateValue(
                        value,
                        columnId
                    );


                if (result.empty) {

                    empty++;


                    emptyRows.push(
                        index
                    );

                    return;

                }


                filled++;


                if (result.valid) {

                    valid++;

                } else {

                    invalid++;


                    invalidRows.push({

                        row: index,

                        value,

                        reason:
                            result.reason

                    });

                }

            }
        );


        return {

            id: columnId,

            column: columnName,

            required,

            total,

            filled,

            empty,

            valid,

            invalid,

            fillRate:
                percentage(
                    filled,
                    total
                ),

            emptyRate:
                percentage(
                    empty,
                    total
                ),

            validRate:
                percentage(
                    valid,
                    filled
                ),

            emptyRows,

            invalidRows

        };

    }


    /* =====================================================
     * VALIDAÇÃO DA PLANILHA
     * ===================================================== */

    function missingColumnResult(field, rows) {

        return {

            id: field.id,

            column: field.originalHeader,

            label: field.label || field.id,

            required: field.required === true,

            highlighted: true,

            status: 'column_missing',

            total: rows.length,

            filled: 0,

            empty: rows.length,

            valid: 0,

            invalid: 0,

            fillRate: 0,

            emptyRate: rows.length > 0 ? 100 : 0,

            validRate: 0,

            emptyRows: rows.map((_, index) => index),

            invalidRows: []

        };

    }


    /**
     * Analisa todas as colunas da planilha.
     *
     * Campos do modelo recebem destaque (highlighted),
     * mas as demais colunas também entram no relatório.
     *
     * @param {Object} sheet
     * @param {Object|null} headerResult
     *
     * @returns {Object}
     */
    function validate(
        sheet,
        headerResult = null
    ) {

        if (!sheet) {

            throw new Error(
                'Worksheet inválida.'
            );

        }


        const rows =
            Array.isArray(sheet.rows)
                ? sheet.rows
                : [];


        const headers =
            Array.isArray(sheet.headers)
                ? sheet.headers
                : [];


        const mappedByHeader = {};

        const schemaFields =
            headerResult && headerResult.fields
                ? headerResult.fields
                : {};


        Object.values(schemaFields).forEach(field => {

            if (field.status === 'found' && field.originalHeader) {

                mappedByHeader[field.originalHeader] = field;

            }

        });


        const fields = {};

        const columns = [];

        let requiredFieldsValid = true;


        headers.forEach(header => {

            const mapped = mappedByHeader[header] || null;

            const fieldId = mapped ? mapped.id : header;

            const result = analyzeField(
                rows,
                mapped ? mapped.id : header,
                header,
                mapped ? mapped.required === true : false
            );

            result.label = mapped ? mapped.label : header;
            result.highlighted = Boolean(mapped);
            result.status = 'present';

            fields[fieldId] = result;
            columns.push(result);

            if (mapped && mapped.required === true && result.empty > 0) {
                requiredFieldsValid = false;
            }

        });


        Object.values(schemaFields).forEach(field => {

            if (field.status === 'found') {
                return;
            }

            const missing = missingColumnResult(field, rows);

            fields[field.id] = missing;
            columns.push(missing);

            if (field.required === true) {
                requiredFieldsValid = false;
            }

        });


        const presentColumns =
            columns.filter(column => column.status === 'present');


        const fieldsWithData =
            presentColumns.filter(column => column.filled > 0).length;


        const fieldsWithInvalidData =
            columns.filter(column => column.invalid > 0).length;


        return {

            valid: requiredFieldsValid,

            status: requiredFieldsValid ? 'valid' : 'invalid',

            rows: {
                total: rows.length
            },

            summary: {

                fields: presentColumns.length,

                highlighted:
                    columns.filter(column => column.highlighted).length,

                fieldsWithData,

                fieldsWithInvalidData,

                requiredFieldsValid

            },

            fields,

            columns

        };

    }


    /* =====================================================
     * API PÚBLICA
     * ===================================================== */

    return {

        validate,

        analyzeField,

        validateValue,

        isValidEmail,

        isValidPhone,

        isValidCPF,

        onlyDigits

    };

})();