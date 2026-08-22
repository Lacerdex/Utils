"use strict";

/*
 * ============================================================
 * SCHEMA DE CADASTRO
 * ============================================================
 */

const CadastroSchema = {

    name: "cadastro",

    label: "Cadastro de Pessoas",


    /*
     * Campos reconhecidos
     */

    fields: {

        nome: {

            label: "Nome",

            required: true,

            aliases: [
                "nome",
                "nome completo",
                "nome do colaborador",
                "nome pessoa",
                "name"
            ]

        },


        email: {

            label: "E-mail",

            required: false,

            aliases: [
                "email",
                "e-mail",
                "e mail",
                "correio eletrônico"
            ]

        },


        celular: {

            label: "Celular",

            required: false,

            aliases: [
                "celular",
                "telefone",
                "telefone celular",
                "telefone móvel",
                "fone",
                "mobile"
            ]

        },


        cpf: {

            label: "CPF",

            required: false,

            aliases: [
                "cpf",
                "documento",
                "cpf/cnpj"
            ]

        },


        cargo: {

            label: "Cargo",

            required: false,

            aliases: [
                "cargo",
                "função",
                "funcao",
                "ocupação",
                "ocupacao",
                "posição",
                "posicao"
            ]

        },


        empresa: {

            label: "Empresa",

            required: false,

            aliases: [
                "empresa",
                "organização",
                "organizacao",
                "companhia",
                "empresa atual"
            ]

        }

    }

};


if (typeof SchemaRegistry !== "undefined") {

    SchemaRegistry.register(CadastroSchema);

}