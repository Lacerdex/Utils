/*
 * Teste da função consolidate() — cenário obrigatório do todo.md (seção 22).
 * Executar com: node test-consolidate.js
 */

const fs = require("fs");
const path = require("path");

// Carrega excel-utils.js e cross-validator.js no mesmo escopo
const utilsSrc = fs.readFileSync(
    path.join(__dirname, "js/core/excel-utils.js"),
    "utf8"
);

const validatorSrc = fs.readFileSync(
    path.join(__dirname, "js/validators/cross-validator.js"),
    "utf8"
);

// Carrega ambos os módulos no mesmo escopo e exporta
const { CrossValidator } = (() => {

    const moduleObject = { exports: {} };

    const loader = new Function(
        "module",
        `${utilsSrc}\n${validatorSrc}\nmodule.exports = { CrossValidator };`
    );

    loader(moduleObject);

    return moduleObject.exports;

})();

// ============================================================
// Cenário do todo.md
// ============================================================

const sheetA = {
    name: "Planilha1",
    headers: ["Nome", "E-mail", "Telefone", "Cidade"],
    rows: [
        { "Nome": "João Pedro", "E-mail": "teste1@gmail.com", "Telefone": "111111", "Cidade": "São Paulo" },
        { "Nome": "Maria Silva", "E-mail": "maria@gmail.com", "Telefone": "222222", "Cidade": "Campinas" }
    ],
    rowCount: 2,
    columnCount: 4
};

const sheetB = {
    name: "Planilha2",
    headers: ["Nome", "E-mail", "Departamento", "Cidade"],
    rows: [
        { "Nome": "João Pedro ", "E-mail": "teste2@gmail.com", "Departamento": "Engenharia", "Cidade": "São Paulo" },
        { "Nome": "Carlos Souza", "E-mail": "carlos@gmail.com", "Departamento": "Financeiro", "Cidade": "Santos" }
    ],
    rowCount: 2,
    columnCount: 4
};

const keyPairs = [{ left: "Nome", right: "Nome" }];

const result = CrossValidator.consolidate(sheetA, sheetB, keyPairs);

console.log("=== COLUNAS DA PLANILHA FINAL ===");
result.columns.forEach(column => console.log(" -", column));

console.log("\n=== LINHAS CONSOLIDADAS ===");
console.table(result.rows.map(row => ({ ...row })));

console.log("\n=== RESUMO ===");
console.log(JSON.stringify(result.summary, null, 2));

// ============================================================
// Verificações
// ============================================================

let failures = 0;

function check(name, condition) {

    if (condition) {
        console.log(`[OK] ${name}`);
    } else {
        console.error(`[FALHOU] ${name}`);
        failures++;
    }

}

check(
    "Coluna-chave aparece uma única vez como 'Nome (Cruzamento)'",
    result.columns.filter(c => c.includes("(Cruzamento)")).length === 1
);

check(
    "Colunas de origem identificadas",
    result.columns.some(c => c === "E-mail (Planilha 1)") &&
    result.columns.some(c => c === "E-mail (Planilha 2)") &&
    result.columns.some(c => c === "Telefone (Planilha 1)") &&
    result.columns.some(c => c === "Departamento (Planilha 2)")
);

check(
    "Todos os registros preservados (3 linhas)",
    result.rows.length === 3
);

const joao = result.rows.find(r => r["Nome (Cruzamento)"] === "João Pedro");
const maria = result.rows.find(r => r["Nome (Cruzamento)"] === "Maria Silva");
const carlos = result.rows.find(r => r["Nome (Cruzamento)"] === "Carlos Souza");

check("João Pedro aparece uma única vez", Boolean(joao));

check(
    "Os dois e-mails de João Pedro são preservados",
    joao?.["E-mail (Planilha 1)"] === "teste1@gmail.com" &&
    joao?.["E-mail (Planilha 2)"] === "teste2@gmail.com"
);

check(
    "'Cidade' igual nas duas fontes marcada como duplicada",
    String(joao?.["Duplicado"]).includes("Cidade")
);

check("Maria Silva não foi perdida", Boolean(maria));

check(
    "Campos da Planilha 2 vazios para Maria Silva",
    maria?.["Departamento (Planilha 2)"] === ""
);

check("Carlos Souza não foi perdido", Boolean(carlos));

check(
    "Campos da Planilha 1 vazios para Carlos Souza",
    carlos?.["Telefone (Planilha 1)"] === "" &&
    carlos?.["Cidade (Planilha 1)"] === ""
);

check(
    "Valores originais preservados (sem normalização na exportação)",
    result.rows.some(r => r["Nome (Cruzamento)"] === "João Pedro")
);

check(
    "Match por equivalência com espaço extra ('João Pedro ' vs 'João Pedro')",
    Boolean(joao) && joao["Departamento (Planilha 2)"] === "Engenharia"
);

console.log("");

if (failures > 0) {
    console.error(`${failures} verificação(ões) falharam.`);
    process.exit(1);
} else {
    console.log("Todas as verificações passaram.");
}
