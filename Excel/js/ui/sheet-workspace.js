"use strict";

/*
 * ============================================================
 * WORKSPACE DE PLANILHA
 *
 * Fluxo comum a todos os validadores:
 * arquivo → abas → aba selecionada
 *
 * O HTML precisa ter estes data-role dentro do root:
 * - excel-file
 * - file-status
 * - file-section
 * - file-name
 * - file-size
 * - sheet-count
 * - sheet-section
 * - sheet-select
 * - sheet-info
 * - schema-select   (opcional)
 * ============================================================
 */

const SheetWorkspace = (() => {

    function query(root, role) {

        return root.querySelector(`[data-role="${role}"]`);

    }


    function bind(root, options = {}) {

        const elements = {

            file: query(root, "excel-file"),
            fileStatus: query(root, "file-status"),
            fileSection: query(root, "file-section"),
            fileName: query(root, "file-name"),
            fileSize: query(root, "file-size"),
            sheetCount: query(root, "sheet-count"),
            sheetSection: query(root, "sheet-section"),
            sheetSelect: query(root, "sheet-select"),
            sheetInfo: query(root, "sheet-info"),
            schemaSelect: query(root, "schema-select"),
            log: options.logElement || query(root, "log")

        };


        const state = {

            document: null,
            sheet: null,
            file: null,
            schema: null

        };


        function log(message) {

            if (!elements.log) {
                return;
            }

            elements.log.textContent +=
                `[${DomUtils.timestamp()}] ${message}\n`;

        }


        function populateSchemas() {

            if (!elements.schemaSelect) {
                return;
            }

            const schemas =
                typeof SchemaRegistry !== "undefined"
                    ? SchemaRegistry.list()
                    : [];

            DomUtils.fillSelect(
                elements.schemaSelect,
                schemas.map(schema => ({
                    value: schema.name,
                    label: schema.label || schema.name
                })),
                "Selecione um modelo"
            );

            const defaultSchema =
                SchemaRegistry.getDefault();

            if (defaultSchema) {

                elements.schemaSelect.value =
                    defaultSchema.name;

                state.schema = defaultSchema;

            }

        }


        function resetView() {

            state.document = null;
            state.sheet = null;
            state.file = null;

            if (elements.fileStatus) {

                elements.fileStatus.textContent =
                    "Nenhum arquivo selecionado.";

                elements.fileStatus.className =
                    "validator-status";

            }

            if (elements.fileSection) {
                elements.fileSection.hidden = true;
            }

            if (elements.sheetSection) {
                elements.sheetSection.hidden = true;
            }

            if (elements.sheetSelect) {

                elements.sheetSelect.innerHTML = `
                    <option value="">
                        Selecione uma aba
                    </option>
                `;

            }

            if (elements.sheetInfo) {
                elements.sheetInfo.innerHTML = "";
            }

            if (elements.log) {
                elements.log.textContent = "";
            }

            if (typeof options.onReset === "function") {
                options.onReset();
            }

        }


        async function handleFile(file) {

            resetView();

            if (!file) {
                return;
            }

            state.file = file;

            elements.fileStatus.textContent =
                `Lendo ${file.name}...`;

            try {

                log(`Iniciando leitura: ${file.name}`);

                state.document =
                    await ExcelReader.read(file);

                if (elements.fileName) {
                    elements.fileName.textContent = file.name;
                }

                if (elements.fileSize) {

                    elements.fileSize.textContent =
                        DomUtils.formatFileSize(file.size);

                }

                if (elements.sheetCount) {

                    elements.sheetCount.textContent =
                        state.document.sheetCount;

                }

                elements.fileSection.hidden = false;
                elements.sheetSection.hidden = false;

                elements.fileStatus.textContent =
                    "Arquivo carregado com sucesso.";

                elements.fileStatus.classList.add("success");

                DomUtils.fillSelect(
                    elements.sheetSelect,
                    state.document.sheetNames.map(name => ({
                        value: name,
                        label: name
                    })),
                    "Selecione uma aba"
                );

                log(
                    `${state.document.sheetCount} aba(s) encontrada(s).`
                );

                if (state.document.sheetNames.length === 1) {

                    elements.sheetSelect.value =
                        state.document.sheetNames[0];

                    handleSheet(state.document.sheetNames[0]);

                }

            } catch (error) {

                elements.fileStatus.textContent =
                    `Erro: ${error.message}`;

                elements.fileStatus.classList.add("error");

                log(`ERRO: ${error.message}`);

                console.error(error);

            }

        }


        function handleSheet(sheetName) {

            if (!sheetName || !state.document) {
                return;
            }

            try {

                state.sheet =
                    ExcelReader.getSheet(
                        state.document,
                        sheetName
                    );

                log(`Aba selecionada: ${sheetName}`);

                if (elements.sheetInfo) {

                    elements.sheetInfo.innerHTML = `
                        <div class="sheet-info-content">
                            <strong>
                                ${DomUtils.escapeHtml(state.sheet.name)}
                            </strong>
                            <span>
                                ${state.sheet.rowCount} linhas
                                ·
                                ${state.sheet.columnCount} colunas
                            </span>
                        </div>
                    `;

                }

                if (typeof options.onSheetSelected === "function") {

                    options.onSheetSelected({
                        document: state.document,
                        sheet: state.sheet,
                        file: state.file,
                        schema: state.schema,
                        log
                    });

                }

            } catch (error) {

                log(`ERRO: ${error.message}`);
                console.error(error);

            }

        }


        function handleSchema(name) {

            if (typeof SchemaRegistry === "undefined") {
                return;
            }

            state.schema = SchemaRegistry.get(name);

            if (state.sheet && typeof options.onSheetSelected === "function") {

                options.onSheetSelected({
                    document: state.document,
                    sheet: state.sheet,
                    file: state.file,
                    schema: state.schema,
                    log
                });

            }

        }


        populateSchemas();


        if (elements.file) {

            elements.file.addEventListener("change", event => {
                handleFile(event.target.files[0]);
            });

        }


        if (elements.sheetSelect) {

            elements.sheetSelect.addEventListener("change", event => {
                handleSheet(event.target.value);
            });

        }


        if (elements.schemaSelect) {

            elements.schemaSelect.addEventListener("change", event => {
                handleSchema(event.target.value);
            });

        }


        return {

            reset: resetView,
            getState: () => state,
            log

        };

    }


    return {

        bind

    };

})();
