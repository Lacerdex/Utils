"use strict";

/*
 * ============================================================
 * COLUMN ALIASES
 *
 * Camada de validação por aliases:
 * identifica colunas semanticamente equivalentes mesmo
 * quando os nomes dos cabeçalhos são diferentes.
 *
 * Reaproveita a normalização do ExcelUtils.
 * ============================================================
 */

const ColumnAliases = (() => {

    /*
     * Categorias conhecidas e seus aliases.
     * Os aliases devem estar normalizados (sem acento,
     * minúsculo, espaços simples).
     */
    const CATEGORIES = {

        nome: [
            "nome",
            "nome completo",
            "nome do cliente",
            "nome cliente",
            "cliente",
            "pessoa",
            "razao social"
        ],

        email: [
            "email",
            "correio eletronico",
            "endereco de email",
            "email principal",
            "email secundario"
        ],

        telefone: [
            "telefone",
            "tel",
            "celular",
            "telefone principal",
            "telefone comercial",
            "telefone residencial",
            "whatsapp",
            "contato"
        ],

        cpf: [
            "cpf",
            "documento cpf",
            "cadastro de pessoa fisica"
        ],

        cnpj: [
            "cnpj",
            "documento cnpj",
            "cadastro nacional de pessoa juridica"
        ],

        codigo: [
            "codigo",
            "id",
            "matricula",
            "numero do cliente",
            "numero do pedido",
            "identificador"
        ],

        cidade: [
            "cidade",
            "municipio"
        ]

    };

    function normalize(value) {

        return ExcelUtils.normalizeForComparison(value);

    }

    /**
     * Retorna todas as categorias registradas.
     */
    function listCategories() {

        return Object.keys(CATEGORIES);

    }

    /**
     * Retorna os aliases normalizados de uma categoria.
     */
    function getAliases(categoryName) {

        const key = normalize(categoryName);

        return CATEGORIES[key] || null;

    }

    /**
     * Identifica a categoria de um cabeçalho.
     * Retorna { category, matchedAlias } ou null.
     */
    function findCategory(header) {

        if (header === null || header === undefined) {
            return null;
        }

        const normalizedHeader =
            normalize(header);

        if (!normalizedHeader) {
            return null;
        }

        for (const category of Object.keys(CATEGORIES)) {

            const aliases = CATEGORIES[category];

            for (const alias of aliases) {

                if (normalizedHeader === alias) {
                    return { category, matchedAlias: alias };
                }

            }

        }

        return null;

    }

    /**
     * Encontra, nos cabeçalhos informados, todas as colunas
     * pertencentes a uma categoria.
     *
     * @param {string[]} headers
     * @param {string} categoryName
     * @returns {Object[]} [{ header, matchedAlias }]
     */
    function relatedHeaders(headers, categoryName) {

        if (!Array.isArray(headers)) {
            return [];
        }

        const aliases = getAliases(categoryName);

        if (!aliases) {
            return [];
        }

        const found = [];

        headers.forEach(header => {

            if (header === null || header === undefined) {
                return;
            }

            const normalizedHeader =
                normalize(header);

            if (!normalizedHeader) {
                return;
            }

            for (const alias of aliases) {

                if (
                    normalizedHeader === alias ||
                    normalizedHeader.includes(alias)
                ) {

                    found.push({
                        header,
                        matchedAlias: alias
                    });

                    return;

                }

            }

        });

        return found;

    }

    /**
     * Sugere a categoria mais provável para servir de
     * coluna principal, com base nos cabeçalhos.
     */
    function suggestMainCategory(headers) {

        const priorities =
            ["nome", "codigo", "cpf", "cnpj"];

        for (const priority of priorities) {

            const matches =
                relatedHeaders(headers, priority);

            if (matches.length > 0) {
                return {
                    category: priority,
                    headers: matches.map(item => item.header)
                };
            }

        }

        return null;

    }

    return {
        listCategories,
        getAliases,
        findCategory,
        relatedHeaders,
        suggestMainCategory
    };

})();