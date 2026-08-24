/*
 * Teste do Validador de Duplicatas — cenário obrigatório do todo.md.
 * Executar com: node test-duplicate-validator.js
 */

const fs = require("fs");
const path = require("path");

const utilsSrc = fs.readFileSync(
    path.join(__dirname, "js/core/excel-utils.js"),
    "utf8"
);

const validatorSrc = fs.readFileSync(
    path.join(__dirname, "js/validators/duplicate-validator.js"),
    "utf8"
);

const writerSrc = fs.readFileSync(
    path.join(__dirname, "js/core/csv-writer.js"),
    "utf8"
);

const { ExcelUtils, DuplicateValidator, CsvWriter } = (() => {

    const moduleObject = { exports: {} };

    const loader = new Function(
        "module",
        `${utilsSrc}\n${validatorSrc}\n${writerSrc}\n` +
        `module.exports = { ExcelUtils, DuplicateValidator, CsvWriter };`
    );

    loader(moduleObject);

    return moduleObject.exports;

})();

const sheet = {
    name: "Clientes",
    headers: ["Nome", "Email", "Telefone"],
    rows: [
        { Nome: "João Pedro", Email: "teste1@gmail.com", Telefone: "11901234567" },
        { Nome: "João Pedro", Email: "teste1@gmail.com", Telefone: "11901234567" },
        { Nome: "João Pedro", Email: "teste2@gmail.com", Telefone: "11901234568" }
    ],
    rowCount: 3,
    columnCount: 3
};

let failures = 0;

function check(name, condition) {
    if (condition) {
        console.log(`[OK] ${name}`);
    } else {
        console.error(`[FALHOU] ${name}`);
        failures++;
    }
}

console.log("=== VALIDAÇÃO DO VALIDADOR DE DUPLICATAS ===");

const keyValidation = DuplicateValidator.validateKeyColumn(sheet, "Nome");
check("Coluna-chave validada", keyValidation.valid === true);
check("Duplicata completa detectada", keyValidation.duplicatesFound === 1);

const uniqueRows = DuplicateValidator.transform(sheet, {
    keyColumn: "Nome",
    resultType: "unique",
    method: "rows"
});

check("Modo Únicos remove duplicata completa", uniqueRows.rows.length === 2);
check("Registros diferentes com mesma chave são preservados", uniqueRows.rows[1][1] === "teste2@gmail.com");

const rowsResult = DuplicateValidator.transform(sheet, {
    keyColumn: "Nome",
    resultType: "duplicate",
    method: "rows"
});
check("Modo Duplicados preserva todos os registros do grupo repetido", rowsResult.rows.length === 3);

const columnsResult = DuplicateValidator.transform(sheet, {
    keyColumn: "Nome",
    resultType: "unique",
    method: "columns"
});
check("Quebra de colunas cria headers dinâmicos", columnsResult.headers[1] === "Email 1");
check("Quebra de colunas preserva valores distintos", columnsResult.rows[0][1] === "teste1@gmail.com");
check("Quebra de colunas preserva segundo valor", columnsResult.rows[0][2] === "teste2@gmail.com");

const concatResult = DuplicateValidator.transform(sheet, {
    keyColumn: "Nome",
    resultType: "unique",
    method: "concat"
});
check("Concatenado consolida e-mails em mesma célula", concatResult.rows[0][1] === "teste1@gmail.com;teste2@gmail.com");
check("Concatenado consolida telefones em mesma célula", concatResult.rows[0][2] === "11901234567;11901234568");

const csvText = CsvWriter.buildCsv(concatResult.headers, concatResult.rows, ";");
check("CSV exportado com BOM UTF-8", csvText.startsWith("\uFEFF"));
check("CSV preserva colunas e valores concatenados", csvText.includes("teste1@gmail.com;teste2@gmail.com"));

console.log("\nResumo:");
console.log(JSON.stringify({
    uniqueRows: uniqueRows.rows.length,
    duplicateRows: rowsResult.rows.length,
    columnsHeaders: columnsResult.headers,
    concatRow: concatResult.rows[0]
}, null, 2));

if (failures > 0) {
    process.exitCode = 1;
}
