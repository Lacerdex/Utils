"use strict";

/*
 * ============================================================
 * MODELO DOWNLOADER
 * Gerencia o download de modelos de planilhas
 * ============================================================
 */

const ModelDownloader = (() => {

    // Definições dos modelos disponíveis
    const models = {

        cadastro: {
            name: "Cadastro de Pessoas",
            filename: "cadastro-modelo.xlsx"
        },

        indicadores: {
            name: "Registro de Indicadores",
            filename: "indicadores-modelo.xlsx"
        }

    };


    /*
     * Cria uma planilha modelo baseada no schema
     */
    function createModelSheet(schema) {

        if (!schema || !schema.fields) {
            throw new Error("Schema inválido: campos não definidos");
        }

        // Extrair nomes dos campos do schema
        const headers = Object.keys(schema.fields).map(key => {
            const field = schema.fields[key];
            return field.label || key;
        });

        // Criar linha de dados de exemplo
        const exampleRow = {};
        Object.keys(schema.fields).forEach(key => {
            exampleRow[headers[Object.keys(schema.fields).indexOf(key)]] = "";
        });

        // Retornar estrutura de sheet normalizada
        return {
            name: schema.label || schema.name,
            headers: headers,
            rows: [exampleRow],
            rowCount: 1,
            columnCount: headers.length
        };

    }


    /*
     * Converte sheet normalizada para formato SheetJS
     */
    function sheetToWorkbook(sheet) {

        const workbook = XLSX.utils.book_new();

        // Criar array de arrays (formato esperado pelo SheetJS)
        const data = [sheet.headers];
        
        sheet.rows.forEach(row => {
            const rowData = sheet.headers.map(header => row[header] || "");
            data.push(rowData);
        });

        // Converter para worksheet
        const worksheet = XLSX.utils.aoa_to_sheet(data);

        // Adicionar ao workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);

        return workbook;

    }


    /*
     * Download do modelo como arquivo XLSX
     */
    function downloadModel(modelKey) {

        if (!models[modelKey]) {
            console.error("Modelo não encontrado:", modelKey);
            return;
        }

        if (typeof XLSX === "undefined") {
            console.error("SheetJS não carregado. Verifique vendor/xlsx.full.min.js");
            return;
        }

        try {

            // Obter schema
            const schema = SchemaRegistry.get(modelKey);
            if (!schema) {
                throw new Error(`Schema '${modelKey}' não encontrado no registry`);
            }

            // Criar sheet do modelo
            const sheet = createModelSheet(schema);

            // Converter para workbook
            const workbook = sheetToWorkbook(sheet);

            // Download
            const filename = models[modelKey].filename;
            XLSX.writeFile(workbook, filename);

        } catch (error) {

            console.error("Erro ao gerar modelo:", error.message);
            alert("Erro ao gerar modelo: " + error.message);

        }

    }


    /*
     * Inicializa listeners dos botões de download
     */
    function init() {

        const buttons = document.querySelectorAll(".model-card button");

        buttons.forEach((button, index) => {

            const modelKeys = Object.keys(models);

            if (index < modelKeys.length) {

                const modelKey = modelKeys[index];

                button.addEventListener("click", () => {
                    downloadModel(modelKey);
                });

            }

        });

    }


    return {
        init,
        downloadModel
    };

})();

// Inicializar quando DOM estiver pronto
document.addEventListener("DOMContentLoaded", () => {
    if (typeof ModelDownloader !== "undefined") {
        ModelDownloader.init();
    }
});
