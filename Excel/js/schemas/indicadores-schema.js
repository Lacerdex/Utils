"use strict";

/*
 * ============================================================
 * SCHEMA DE INDICADORES
 * ============================================================
 */

const IndicadoresSchema = {

    name: "indicadores",

    label: "Registro de Indicadores",


    /*
     * Campos reconhecidos
     */

    fields: {

        periodo: {

            label: "Período",

            required: true,

            aliases: [
                "período",
                "periodo",
                "mês",
                "mes",
                "month",
                "data",
                "date"
            ]

        },


        indicador: {

            label: "Indicador",

            required: true,

            aliases: [
                "indicador",
                "nome do indicador",
                "nome indicador",
                "metric",
                "kpi"
            ]

        },


        valor: {

            label: "Valor",

            required: true,

            aliases: [
                "valor",
                "value",
                "resultado",
                "resultado",
                "meta",
                "target"
            ]

        },


        meta: {

            label: "Meta",

            required: false,

            aliases: [
                "meta",
                "target",
                "objetivo",
                "objetivo",
                "esperado"
            ]

        },


        status: {

            label: "Status",

            required: false,

            aliases: [
                "status",
                "situação",
                "situacao",
                "estado",
                "estado"
            ]

        },


        responsavel: {

            label: "Responsável",

            required: false,

            aliases: [
                "responsável",
                "responsavel",
                "gerente",
                "proprietário",
                "proprietario",
                "owner"
            ]

        },


        observacoes: {

            label: "Observações",

            required: false,

            aliases: [
                "observações",
                "observacoes",
                "notas",
                "notes",
                "comentários",
                "comentarios"
            ]

        }

    }

};


if (typeof SchemaRegistry !== "undefined") {

    SchemaRegistry.register(IndicadoresSchema);

}
