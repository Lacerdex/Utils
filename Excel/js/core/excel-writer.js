/**
 * Excel Writer
 * ---------------------------------------------------------
 * Responsável por:
 * - Criar workbooks
 * - Criar worksheets
 * - Exportar dados para .xlsx
 * - Exportar uma worksheet específica
 * - Exportar múltiplas worksheets
 *
 * Não contém regras de validação.
 */

const ExcelWriter = (() => {

    /**
     * Cria um novo workbook vazio.
     *
     * @returns {Object}
     */
    function createWorkbook() {
        return XLSX.utils.book_new();
    }


    /**
     * Cria uma worksheet a partir de um array de objetos.
     *
     * Exemplo:
     *
     * [
     *   {
     *      Nome: "João",
     *      CPF: "123"
     *   }
     * ]
     *
     * @param {Object[]} data
     * @returns {Object}
     */
    function createSheetFromJson(data) {

        if (!Array.isArray(data)) {
            throw new Error(
                'Os dados precisam ser um array.'
            );
        }

        return XLSX.utils.json_to_sheet(data);
    }


    /**
     * Cria uma worksheet a partir de uma matriz.
     *
     * Exemplo:
     *
     * [
     *   ["Nome", "CPF"],
     *   ["João", "123"],
     *   ["Maria", "456"]
     * ]
     *
     * @param {Array[]} data
     * @returns {Object}
     */
    function createSheetFromArray(data) {

        if (!Array.isArray(data)) {
            throw new Error(
                'Os dados precisam ser um array.'
            );
        }

        return XLSX.utils.aoa_to_sheet(data);
    }


    /**
     * Adiciona uma worksheet ao workbook.
     *
     * @param {Object} workbook
     * @param {Object} worksheet
     * @param {string} sheetName
     */
    function addSheet(workbook, worksheet, sheetName) {

        if (!workbook) {
            throw new Error('Workbook inválido.');
        }

        if (!worksheet) {
            throw new Error('Worksheet inválida.');
        }

        if (!sheetName || !sheetName.trim()) {
            throw new Error(
                'O nome da aba não pode estar vazio.'
            );
        }

        XLSX.utils.book_append_sheet(
            workbook,
            worksheet,
            sheetName.substring(0, 31)
        );
    }


    /**
     * Gera um arquivo XLSX e inicia o download.
     *
     * @param {Object} workbook
     * @param {string} fileName
     */
    function download(workbook, fileName = 'resultado.xlsx') {

        if (!workbook) {
            throw new Error('Workbook inválido.');
        }

        if (!fileName.toLowerCase().endsWith('.xlsx')) {
            fileName += '.xlsx';
        }

        XLSX.writeFile(workbook, fileName);
    }


    /**
     * Exporta um array de objetos diretamente para XLSX.
     *
     * @param {Object[]} data
     * @param {string} sheetName
     * @param {string} fileName
     */
    function exportJson(
        data,
        sheetName = 'Dados',
        fileName = 'resultado.xlsx'
    ) {

        const workbook = createWorkbook();

        const worksheet = createSheetFromJson(data);

        addSheet(
            workbook,
            worksheet,
            sheetName
        );

        download(
            workbook,
            fileName
        );
    }


    /**
     * Exporta uma matriz diretamente para XLSX.
     *
     * @param {Array[]} data
     * @param {string} sheetName
     * @param {string} fileName
     */
    function exportArray(
        data,
        sheetName = 'Dados',
        fileName = 'resultado.xlsx'
    ) {

        const workbook = createWorkbook();

        const worksheet = createSheetFromArray(data);

        addSheet(
            workbook,
            worksheet,
            sheetName
        );

        download(
            workbook,
            fileName
        );
    }


    /**
     * Exporta uma worksheet existente.
     *
     * @param {Object} worksheet
     * @param {string} sheetName
     * @param {string} fileName
     */
    function exportSheet(
        worksheet,
        sheetName = 'Dados',
        fileName = 'resultado.xlsx'
    ) {

        const workbook = createWorkbook();

        addSheet(
            workbook,
            worksheet,
            sheetName
        );

        download(
            workbook,
            fileName
        );
    }


    /**
     * API pública.
     */
    return {
        createWorkbook,
        createSheetFromJson,
        createSheetFromArray,
        addSheet,
        download,
        exportJson,
        exportArray,
        exportSheet
    };

})();