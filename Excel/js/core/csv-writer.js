"use strict";

/*
 * ============================================================
 * CSV WRITER
 *
 * Responsável por:
 * - Construir texto CSV a partir de matriz de dados
 * - Escapar células conforme RFC 4180
 * - Gerar arquivo com UTF-8 BOM
 * - Disparar download local
 *
 * Não contém regras de transformação.
 * ============================================================
 */

const CsvWriter = (() => {

    /**
     * Escapa uma célula para CSV.
     * Células que contêm separadores (do CSV ou internos),
     * aspas ou quebra de linha são envolvidas em aspas duplas.
     *
     * @param {*} value
     * @param {string} separator
     * @returns {string}
     */
    function escapeCell(value, separator) {

        if (value === null || value === undefined) {
            return "";
        }

        const text = String(value);

        /*
         * Qualquer separador conhecido dentro da célula
         * gera escape, evitando ambiguidade ao abrir no Excel
         * independente da configuração regional.
         */
        const knownSeparators =
            [separator, ";", ",", "|"];

        const needsQuotes =
            knownSeparators.some(sep => text.includes(sep)) ||
            text.includes('"') ||
            text.includes("\n") ||
            text.includes("\r");

        if (!needsQuotes) {
            return text;
        }

        return `"${text.replace(/"/g, '""')}"`;

    }

    /**
     * Constrói o conteúdo CSV.
     *
     * @param {string[]} headers
     * @param {Array[]} rows — matriz de linhas
     * @param {string} separator — separador de colunas do CSV
     * @returns {string} texto com UTF-8 BOM
     */
    function buildCsv(headers, rows, separator = ",") {

        const lines = [];

        lines.push(
            (headers || [])
                .map(header => escapeCell(header, separator))
                .join(separator)
        );

        (rows || []).forEach(row => {

            lines.push(
                (row || [])
                    .map(cell => escapeCell(cell, separator))
                    .join(separator)
            );

        });

        /*
         * UTF-8 com BOM preserva acentos ao abrir no Excel.
         */
        return "\uFEFF" + lines.join("\r\n");

    }

    /**
     * Dispara o download local do CSV.
     *
     * @param {string} csvText
     * @param {string} fileName
     */
    function download(csvText, fileName = "resultado.csv") {

        if (!fileName.toLowerCase().endsWith(".csv")) {
            fileName += ".csv";
        }

        const blob = new Blob(
            [csvText],
            { type: "text/csv;charset=utf-8;" }
        );

        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");

        link.href = url;
        link.download = fileName;

        document.body.appendChild(link);
        link.click();

        document.body.removeChild(link);
        URL.revokeObjectURL(url);

    }

    return {
        buildCsv,
        download,
        escapeCell
    };

})();