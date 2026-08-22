/* ========================================================
 * HEADER VALIDATOR UI
 * ====================================================== */

const HeaderValidatorUI = (() => {

    let workbook = null;
    let currentSheet = null;
    let validationResult = null;


    /* ====================================================
     * ELEMENTOS
     * ================================================== */

    const elements = {

        file:
            document.getElementById(
                "headerExcelFile"
            ),

        fileStatus:
            document.getElementById(
                "headerFileStatus"
            ),

        fileSection:
            document.getElementById(
                "headerFileSection"
            ),

        fileName:
            document.getElementById(
                "headerFileName"
            ),

        fileSize:
            document.getElementById(
                "headerFileSize"
            ),

        sheetCount:
            document.getElementById(
                "headerSheetCount"
            ),

        sheetSection:
            document.getElementById(
                "headerSheetSection"
            ),

        sheetSelect:
            document.getElementById(
                "headerSheetSelect"
            ),

        sheetInfo:
            document.getElementById(
                "headerSheetInfo"
            ),

        detectedSection:
            document.getElementById(
                "headerDetectedSection"
            ),

        detected:
            document.getElementById(
                "headerDetected"
            ),

        resultSection:
            document.getElementById(
                "headerResultSection"
            ),

        resultSummary:
            document.getElementById(
                "headerResultSummary"
            ),

        resultFields:
            document.getElementById(
                "headerResultFields"
            ),

        extraColumns:
            document.getElementById(
                "headerExtraColumns"
            ),

        log:
            document.getElementById(
                "headerLog"
            ),

        backButton:
            document.getElementById(
                "headerBackButton"
            )

    };


    /* ====================================================
     * LOG
     * ================================================== */

    function log(message) {

        const time =
            new Date()
                .toLocaleTimeString();


        elements.log.textContent +=
            `[${time}] ${message}\n`;

    }


    /* ====================================================
     * FORMATA TAMANHO
     * ================================================== */

    function formatFileSize(bytes) {

        if (bytes < 1024) {

            return `${bytes} B`;

        }


        if (bytes < 1024 * 1024) {

            return `${(
                bytes / 1024
            ).toFixed(2)} KB`;

        }


        return `${(
            bytes /
            1024 /
            1024
        ).toFixed(2)} MB`;

    }


    /* ====================================================
     * ESCAPE HTML
     * ================================================== */

    function escapeHtml(value) {

        if (
            value === null ||
            value === undefined
        ) {

            return "";

        }


        return String(value)

            .replace(
                /&/g,
                "&amp;"
            )

            .replace(
                /</g,
                "&lt;"
            )

            .replace(
                />/g,
                "&gt;"
            )

            .replace(
                /"/g,
                "&quot;"
            )

            .replace(
                /'/g,
                "&#039;"
            );

    }


    /* ====================================================
     * RESET
     * ================================================== */

    function reset() {

        workbook = null;
        currentSheet = null;
        validationResult = null;


        elements.fileStatus.textContent =
            "Nenhum arquivo selecionado.";


        elements.fileStatus.className =
            "validator-status";


        elements.fileSection.hidden = true;

        elements.sheetSection.hidden = true;

        elements.detectedSection.hidden = true;

        elements.resultSection.hidden = true;


        elements.sheetSelect.innerHTML = `
            <option value="">
                Selecione uma aba
            </option>
        `;


        elements.detected.innerHTML = "";

        elements.resultSummary.innerHTML = "";

        elements.resultFields.innerHTML = "";

        elements.extraColumns.innerHTML = "";

        elements.sheetInfo.innerHTML = "";

        elements.log.textContent = "";

    }


    /* ====================================================
     * UPLOAD
     * ================================================== */

    async function handleFile(file) {

        reset();


        if (!file) {

            return;

        }


        elements.fileStatus.textContent =
            `Lendo ${file.name}...`;


        try {

            log(
                `Iniciando leitura: ${file.name}`
            );


            workbook =
                await ExcelReader.read(
                    file
                );


            elements.fileName.textContent =
                file.name;


            elements.fileSize.textContent =
                formatFileSize(
                    file.size
                );


            elements.sheetCount.textContent =
                workbook.sheetCount;


            elements.fileSection.hidden =
                false;


            elements.sheetSection.hidden =
                false;


            elements.fileStatus.textContent =
                "Arquivo carregado com sucesso.";


            elements.fileStatus.classList.add(
                "success"
            );


            workbook.sheetNames.forEach(
                sheetName => {

                    const option =
                        document.createElement(
                            "option"
                        );


                    option.value =
                        sheetName;


                    option.textContent =
                        sheetName;


                    elements.sheetSelect
                        .appendChild(
                            option
                        );

                }
            );


            log(
                `${workbook.sheetCount} aba(s) encontrada(s).`
            );


        } catch (error) {

            elements.fileStatus.textContent =
                `Erro: ${error.message}`;


            elements.fileStatus.classList.add(
                "error"
            );


            log(
                `ERRO: ${error.message}`
            );


            console.error(error);

        }

    }


    /* ====================================================
     * ABA
     * ================================================== */

    function handleSheet(sheetName) {

        if (!sheetName) {

            return;

        }


        try {

            currentSheet =
                ExcelReader.getSheet(
                    workbook,
                    sheetName
                );


            if (!currentSheet) {

                throw new Error(
                    "Aba não encontrada."
                );

            }


            log(
                `Aba selecionada: ${sheetName}`
            );


            renderSheetInfo();

            renderHeaders();

            validateHeader();


        } catch (error) {

            log(
                `ERRO: ${error.message}`
            );


            console.error(error);

        }

    }


    /* ====================================================
     * INFORMAÇÕES DA ABA
     * ================================================== */

    function renderSheetInfo() {

        elements.sheetInfo.innerHTML = `

            <div class="sheet-info-content">

                <strong>
                    ${escapeHtml(
                        currentSheet.name
                    )}
                </strong>

                <span>
                    ${currentSheet.rowCount}
                    linhas
                    ·
                    ${currentSheet.columnCount}
                    colunas
                </span>

            </div>

        `;

    }


    /* ====================================================
     * CABEÇALHOS
     * ================================================== */

    function renderHeaders() {

        elements.detected.innerHTML = "";


        currentSheet.headers
            .forEach(
                (header, index) => {

                    const element =
                        document.createElement(
                            "div"
                        );


                    element.className =
                        "detected-header";


                    element.innerHTML = `

                        <span
                            class="detected-header-index"
                        >
                            ${index + 1}
                        </span>

                        <span
                            class="detected-header-name"
                        >
                            ${escapeHtml(
                                header ||
                                "(vazio)"
                            )}
                        </span>

                    `;


                    elements.detected
                        .appendChild(
                            element
                        );

                }
            );


        elements.detectedSection.hidden =
            false;

    }


    /* ====================================================
     * VALIDA CABEÇALHO
     * ================================================== */

    function validateHeader() {

        if (
            typeof HeaderValidator ===
            "undefined"
        ) {

            log(
                "HeaderValidator não encontrado."
            );

            return;

        }


        if (
            typeof CadastroSchema ===
            "undefined"
        ) {

            log(
                "CadastroSchema não encontrado."
            );

            return;

        }


        validationResult =
            HeaderValidator.validate(
                currentSheet,
                CadastroSchema
            );


        renderResult();


        log(
            validationResult.valid
                ? "Cabeçalho válido."
                : "Cabeçalho possui inconsistências."
        );

    }


    /* ====================================================
     * RESULTADO
     * ================================================== */

    function renderResult() {

        elements.resultSection.hidden =
            false;


        renderSummary();

        renderFields();

        renderExtraColumns();

    }


    /* ====================================================
     * RESUMO
     * ================================================== */

    function renderSummary() {

        const summary =
            validationResult.summary;


        elements.resultSummary.innerHTML = `

            <div class="validation-summary-item">

                <span>
                    Campos esperados
                </span>

                <strong>
                    ${summary.expected}
                </strong>

            </div>


            <div class="validation-summary-item">

                <span>
                    Encontrados
                </span>

                <strong class="success">
                    ${summary.found}
                </strong>

            </div>


            <div class="validation-summary-item">

                <span>
                    Ausentes
                </span>

                <strong class="${
                    summary.missing > 0
                        ? "warning"
                        : "success"
                }">

                    ${summary.missing}

                </strong>

            </div>


            <div class="validation-summary-item">

                <span>
                    Obrigatórios ausentes
                </span>

                <strong class="${
                    summary.requiredMissing > 0
                        ? "danger"
                        : "success"
                }">

                    ${summary.requiredMissing}

                </strong>

            </div>


            <div class="validation-summary-item">

                <span>
                    Colunas extras
                </span>

                <strong>
                    ${summary.extra}
                </strong>

            </div>


            <div class="validation-summary-item">

                <span>
                    Duplicados
                </span>

                <strong>
                    ${summary.duplicates}
                </strong>

            </div>

        `;

    }


    /* ====================================================
     * CAMPOS
     * ================================================== */

    function renderFields() {

        elements.resultFields.innerHTML = "";


        Object.values(
            validationResult.fields
        )
        .forEach(
            field => {

                const element =
                    document.createElement(
                        "div"
                    );


                element.className =
                    "validation-field";


                let statusClass;
                let statusText;


                if (
                    field.status ===
                    "found"
                ) {

                    statusClass =
                        "valid";

                    statusText =
                        "ENCONTRADO";

                }

                else if (
                    field.required
                ) {

                    statusClass =
                        "invalid";

                    statusText =
                        "OBRIGATÓRIO";

                }

                else {

                    statusClass =
                        "optional";

                    statusText =
                        "OPCIONAL";

                }


                element.innerHTML = `

                    <div
                        class="validation-field-main"
                    >

                        <div
                            class="validation-field-name"
                        >

                            ${escapeHtml(
                                field.label
                            )}

                        </div>


                        <div
                            class="validation-field-detail"
                        >

                            ${
                                field.status ===
                                "found"

                                ?

                                `
                                Coluna encontrada:
                                <strong>
                                    ${escapeHtml(
                                        field.originalHeader
                                    )}
                                </strong>
                                `

                                :

                                `
                                Coluna não encontrada.
                                `
                            }

                        </div>

                    </div>


                    <span
                        class="
                            validation-field-status
                            ${statusClass}
                        "
                    >

                        ${statusText}

                    </span>

                `;


                elements.resultFields
                    .appendChild(
                        element
                    );

            }
        );

    }


    /* ====================================================
     * EXTRAS
     * ================================================== */

    function renderExtraColumns() {

        const columns =
            validationResult.extraColumns;


        if (!columns.length) {

            elements.extraColumns.innerHTML =
                "";

            return;

        }


        elements.extraColumns.innerHTML = `

            <h3>
                Colunas não reconhecidas
            </h3>

            <div
                class="extra-column-list"
            >

                ${columns
                    .map(
                        column => `
                            <span
                                class="extra-column"
                            >
                                ${escapeHtml(
                                    column.header
                                )}
                            </span>
                        `
                    )
                    .join("")
                }

            </div>

        `;

    }


    /* ====================================================
     * EVENTOS
     * ================================================== */

    elements.file.addEventListener(
        "change",
        event => {

            const file =
                event.target.files[0];


            handleFile(file);

        }
    );


    elements.sheetSelect.addEventListener(
        "change",
        event => {

            handleSheet(
                event.target.value
            );

        }
    );


    elements.backButton.addEventListener(
        "click",
        () => {

            /*
             * O app principal controla
             * a navegação.
             */

            document
                .querySelector(
                    '[data-page="validators"]'
                )
                ?.click();

        }
    );


    /* ====================================================
     * API PÚBLICA
     * ================================================== */

    return {

        reset,

        handleFile,

        handleSheet

    };

})();