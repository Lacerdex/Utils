"use strict";

/*
 * ============================================================
 * UTILS EXCEL
 * EXCEL READER
 *
 * Responsável por:
 * - Ler arquivos .xlsx
 * - Trabalhar com múltiplas abas
 * - Converter abas para JSON
 * - Identificar cabeçalhos
 * - Fornecer informações básicas da planilha
 *
 * Dependência:
 * SheetJS / XLSX
 * ============================================================
 */

const ExcelReader = (() => {

    /*
     * ========================================================
     * VALIDAR ARQUIVO
     * ========================================================
     */

    function validateFile(file) {

        if (!file) {
            throw new Error(
                "Nenhum arquivo foi selecionado."
            );
        }


        const fileName =
            file.name.toLowerCase();


        if (!fileName.endsWith(".xlsx")) {

            throw new Error(
                "Formato inválido. Selecione um arquivo .xlsx."
            );

        }

    }


    /*
     * ========================================================
     * LER ARQUIVO
     * ========================================================
     */

    async function readFile(file) {

        validateFile(file);


        /*
         * O navegador consegue ler o arquivo
         * diretamente como ArrayBuffer.
         *
         * Nenhum servidor é necessário.
         */

        const arrayBuffer =
            await file.arrayBuffer();


        /*
         * O XLSX é fornecido pelo SheetJS
         * carregado no index.html.
         */

        if (
            typeof XLSX === "undefined"
        ) {

            throw new Error(
                "A biblioteca SheetJS (XLSX) não foi carregada."
            );

        }


        /*
         * Converte o arquivo binário
         * em um Workbook.
         */

        const workbook =
            XLSX.read(
                arrayBuffer,
                {
                    type: "array"
                }
            );


        return workbook;

    }


    /*
     * ========================================================
     * OBTER ABAS
     * ========================================================
     */

    function getSheets(workbook) {

        if (!workbook) {

            throw new Error(
                "Workbook não informado."
            );

        }


        return workbook.SheetNames || [];

    }


    /*
     * ========================================================
     * OBTER ABA
     * ========================================================
     */

    function getRawSheet(workbook, sheetName) {

        if (!workbook) {

            throw new Error(
                "Workbook não informado."
            );

        }


        if (!sheetName) {

            throw new Error(
                "Nome da aba não informado."
            );

        }


        const sheet =
            workbook.Sheets[sheetName];


        if (!sheet) {

            throw new Error(
                `A aba "${sheetName}" não foi encontrada.`
            );

        }


        return sheet;

    }


    /*
     * Aceita:
     * - Workbook bruto do SheetJS
     * - Documento normalizado (retorno de read)
     */
    function getSheet(source, sheetName) {

        if (
            source &&
            Array.isArray(source.sheets)
        ) {

            const sheet =
                source.sheets.find(
                    item => item.name === sheetName
                );


            if (!sheet) {

                throw new Error(
                    `A aba "${sheetName}" não foi encontrada.`
                );

            }


            return sheet;

        }


        return getRawSheet(source, sheetName);

    }


    /*
     * ========================================================
     * CONVERTER ABA PARA JSON
     * ========================================================
     */

    function sheetToJSON(
        workbook,
        sheetName,
        options = {}
    ) {

        const sheet =
            getRawSheet(
                workbook,
                sheetName
            );


        return XLSX.utils.sheet_to_json(
            sheet,
            {
                defval: "",
                ...options
            }
        );

    }


    /*
     * ========================================================
     * OBTER CABEÇALHOS
     * ========================================================
     */

    function getHeaders(
        workbook,
        sheetName
    ) {

        const sheet =
            getRawSheet(
                workbook,
                sheetName
            );


        const matrix =
            XLSX.utils.sheet_to_json(
                sheet,
                {
                    header: 1,
                    defval: ""
                }
            );


        const firstRow =
            Array.isArray(matrix[0])
                ? matrix[0]
                : [];


        return firstRow.map(
            cell => String(cell ?? "")
        );

    }


    /*
     * ========================================================
     * ABA NORMALIZADA
     * ========================================================
     *
     * Formato usado pelos validadores:
     *
     * {
     *   name,
     *   headers,
     *   rows,
     *   rowCount,
     *   columnCount
     * }
     */

    function toSheet(workbook, sheetName) {

        const headers =
            getHeaders(
                workbook,
                sheetName
            );


        const rows =
            sheetToJSON(
                workbook,
                sheetName
            );


        return {

            name: sheetName,

            headers,

            rows,

            rowCount: rows.length,

            columnCount: headers.length

        };

    }


    /*
     * ========================================================
     * DOCUMENTO NORMALIZADO
     * ========================================================
     */

    async function read(file) {

        const workbook =
            await readFile(file);


        const sheetNames =
            getSheets(workbook);


        const sheets =
            sheetNames.map(
                name =>
                    toSheet(
                        workbook,
                        name
                    )
            );


        return {

            workbook,

            sheetCount: sheetNames.length,

            sheetNames,

            sheets

        };

    }


    /*
     * ========================================================
     * CONTAR LINHAS
     * ========================================================
     */

    function getRowCount(
        workbook,
        sheetName
    ) {

        const data =
            sheetToJSON(
                workbook,
                sheetName
            );


        return data.length;

    }


    /*
     * ========================================================
     * INFORMAÇÕES DA ABA
     * ========================================================
     */

    function getSheetInfo(
        workbook,
        sheetName
    ) {

        const data =
            sheetToJSON(
                workbook,
                sheetName
            );


        const headers =
            getHeaders(
                workbook,
                sheetName
            );


        return {

            name: sheetName,

            rows: data.length,

            columns: headers.length,

            headers: headers

        };

    }


    /*
     * ========================================================
     * INFORMAÇÕES DO WORKBOOK
     * ========================================================
     */

    function getWorkbookInfo(workbook) {

        const sheets =
            getSheets(workbook);


        return {

            sheetCount: sheets.length,

            sheets: sheets.map(
                sheetName =>
                    getSheetInfo(
                        workbook,
                        sheetName
                    )
            )

        };

    }


    /*
     * ========================================================
     * API PÚBLICA
     * ========================================================
     */

    return {

        readFile,

        read,

        toSheet,

        getSheets,

        getSheet,

        sheetToJSON,

        getHeaders,

        getRowCount,

        getSheetInfo,

        getWorkbookInfo

    };

})();