/*
 * Teste da conversão Excel → CSV — cenário obrigatório do todo2.md (seção 26).
 * Executar com: node test-csv-transform.js
 */

const fs = require("fs");
const path = require("path");

const utilsSrc = fs.readFileSync(
    path.join(__dirname, "js/core/excel-utils.js"),
    "utf8"
);

const aliasesSrc = fs.readFileSync(
    path.join(__dirname, "js/schemas/column-aliases.js"),
    "utf8"
);

const validatorSrc = fs.readFileSync(
    path.join(__dirname, "js/validators/csv-transform-validator.js"),
    "utf8"
);

const writerSrc = fs.readFileSync(
    path.join(__dirname, "js/core/csv-writer.js"),
    "utf8"
);

// Carrega todos os módulos no mesmo escopo
const { ExcelUtils, ColumnAliases, CsvTransformValidator, CsvWriter } = (() => {

    const moduleObject = { exports: {} };

    const loader = new Function(
        "module",
        `${utilsSrc}\n${aliasesSrc}\n${validatorSrc}\n${writerSrc}\n` +
        `module.exports = { ExcelUtils, ColumnAliases, CsvTransformValidator, CsvWriter };`
    );

    loader(moduleObject);

    return moduleObject.exports;

})();

// ============================================================
// Cenário do todo2.md (seção 26)
// ============================================================

const sheet = {
    name: "Planilha1",
    headers: ["Nome", "E-mail", "Telefone"],
    rows: [
        { "Nome": "João Pedro", "E-mail": "teste1@gmail.com", "Telefone": "111111" },
        { "Nome": "João Pedro", "E-mail": "teste2@gmail.com", "Telefone": "222222" },
        { "Nome": "Maria Silva", "E-mail": "maria@gmail.com", "Telefone": "333333" }
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

// ============================================================
// Validação por aliases
// ============================================================

console.log("=== ALIASES ===");

check(
    "'Nome' reconhecido como categoria nome",
    ColumnAliases.findCategory("Nome")?.category === "nome"
);

check(
    "'E-mail' reconhecido como categoria email",
    ColumnAliases.findCategory("E-mail")?.category === "email"
);

check(
    "'Email Secundário' relacionado à categoria email",
    ColumnAliases.relatedHeaders(["Email Secundário"], "email").length === 1
);

// ============================================================
// Validação da coluna principal
// ============================================================

console.log("\n=== VALIDAÇÃO DA COLUNA PRINCIPAL ===");

const validation =
    CsvTransformValidator.validateMainColumn(sheet, "Nome");

console.log(JSON.stringify(validation, null, 2));

check("Coluna principal existe e é válida", validation.valid === true);
check("Duplicidades detectadas", validation.duplicates === 1);
check("Categoria 'nome' identificada via alias", validation.category === "nome");
check(
    "Coluna inexistente retorna inválida",
    CsvTransformValidator.validateMainColumn(sheet, "Inexistente").valid === false
);

// ============================================================
// Formato CONCATENADO
// ============================================================

console.log("\n=== FORMATO CONCATENADO ===");

const concatResult =
    CsvTransformValidator.transform(
        sheet,
        {
            mainColumn: "Nome",
            columns: ["E-mail", "Telefone"],
            mode: "concat",
            separator: ";",
            removeDuplicates: false
        }
    );

console.table(concatResult.rows.map(row => ({ ...row })));

check("Concatenado: 2 grupos (João Pedro, Maria Silva)", concatResult.rows.length === 2);
check(
    "Concatenado: e-mails unidos com ;",
    concatResult.rows[0][1] === "teste1@gmail.com;teste2@gmail.com"
);
check(
    "Concatenado: telefones unidos com ;",
    concatResult.rows[0][2] === "111111;222222"
);
check(
    "Concatenado: Maria preservada intacta",
    concatResult.rows[1].join(",") === "Maria Silva,maria@gmail.com,333333"
);

// ============================================================
// Formato QUEBRA DE COLUNAS
// ============================================================

console.log("\n=== FORMATO QUEBRA DE COLUNAS ===");

const splitResult =
    CsvTransformValidator.transform(
        sheet,
        {
            mainColumn: "Nome",
            columns: ["E-mail", "Telefone"],
            mode: "split"
        }
    );

console.log("Headers:", splitResult.headers.join(" | "));
console.table(splitResult.rows.map(row => ({ ...row })));

check(
    "Quebra: colunas dinâmicas criadas",
    JSON.stringify(splitResult.headers) ===
    JSON.stringify(["Nome", "E-mail 1", "E-mail 2", "Telefone 1", "Telefone 2"])
);

check(
    "Quebra: João Pedro distribuído nas duas colunas de e-mail",
    splitResult.rows[0][1] === "teste1@gmail.com" &&
    splitResult.rows[0][2] === "teste2@gmail.com"
);

check(
    "Quebra: células restantes vazias para Maria Silva",
    splitResult.rows[1][2] === "" && splitResult.rows[1][4] === ""
);

check(
    "Quebra: nenhum valor perdido (3 e-mails)",
    splitResult.rows.flat().filter(v => String(v).includes("@")).length === 3
);

// ============================================================
// Remoção opcional de duplicados
// ============================================================

console.log("\n=== REMOÇÃO DE DUPLICADOS (opcional) ===");

const citySheet = {
    name: "Cidades",
    headers: ["Nome", "Cidade"],
    rows: [
        { "Nome": "João Pedro", "Cidade": "São Paulo" },
        { "Nome": "João Pedro", "Cidade": "São Paulo" },
        { "Nome": "João Pedro", "Cidade": "Campinas" }
    ],
    rowCount: 3,
    columnCount: 2
};

const keptAll =
    CsvTransformValidator.transform(citySheet, {
        mainColumn: "Nome",
        columns: ["Cidade"],
        mode: "concat",
        separator: ";",
        removeDuplicates: false
    });

const removedDup =
    CsvTransformValidator.transform(citySheet, {
        mainColumn: "Nome",
        columns: ["Cidade"],
        mode: "concat",
        separator: ";",
        removeDuplicates: true
    });

check(
    "Manter duplicados (padrão): São Paulo;São Paulo;Campinas",
    keptAll.rows[0][1] === "São Paulo;São Paulo;Campinas"
);

check(
    "Remover duplicados: São Paulo;Campinas",
    removedDup.rows[0][1] === "São Paulo;Campinas"
);

// ============================================================
// CSV Writer
// ============================================================

console.log("\n=== CSV WRITER ===");

const csvText =
    CsvWriter.buildCsv(concatResult.headers, concatResult.rows, ",");

console.log(csvText.replace("\uFEFF", ""));

check("CSV começa com UTF-8 BOM", csvText.charCodeAt(0) === 0xFEFF);

check(
    "CSV concatenado igual ao exemplo do todo2.md",
    csvText.replace("\uFEFF", "") ===
    'Nome,E-mail,Telefone\r\n' +
    'João Pedro,"teste1@gmail.com;teste2@gmail.com","111111;222222"\r\n' +
    'Maria Silva,maria@gmail.com,333333'
);

const splitCsv =
    CsvWriter.buildCsv(splitResult.headers, splitResult.rows, ",");

check(
    "CSV quebra igual ao exemplo do todo2.md",
    splitCsv.replace("\uFEFF", "") ===
    'Nome,E-mail 1,E-mail 2,Telefone 1,Telefone 2\r\n' +
    'João Pedro,teste1@gmail.com,teste2@gmail.com,111111,222222\r\n' +
    'Maria Silva,maria@gmail.com,,333333,'
);

console.log("");

if (failures > 0) {
    console.error(`${failures} verificação(ões) falharam.`);
    process.exit(1);
} else {
    console.log("Todas as verificações passaram.");
}