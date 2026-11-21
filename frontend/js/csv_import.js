
"use strict";

/**
 * GENETIC TSP OPTIMIZER
 * Módulo: Importación y exportación CSV.
 */

const TSPCsv = (() => {

    const fileInput = document.getElementById("csv-file");

    const exportButton = document.getElementById("export-csv-btn");


    // =====================================================
    // PARSER CSV
    // =====================================================

    function parseCSV(text) {

        const rows = [];

        let row = [];
        let field = "";
        let insideQuotes = false;

        for (let i = 0; i < text.length; i++) {

            const char = text[i];

            if (insideQuotes) {

                if (char === '"') {

                    if (text[i + 1] === '"') {
                        field += '"';
                        i++;
                    } else {
                        insideQuotes = false;
                    }

                } else {
                    field += char;
                }

                continue;
            }

            if (char === '"') {

                if (field.length !== 0) {
                    throw new Error(
                        "Formato CSV incorrecto: comillas en posición inválida."
                    );
                }

                insideQuotes = true;

            } else if (char === ",") {

                row.push(field);
                field = "";

            } else if (char === "\n") {

                row.push(field);

                rows.push(row);

                row = [];
                field = "";

            } else if (char === "\r") {

                if (text[i + 1] === "\n") {
                    continue;
                }

                row.push(field);

                rows.push(row);

                row = [];
                field = "";

            } else {

                field += char;
            }
        }

        if (insideQuotes) {
            throw new Error(
                "Formato CSV incorrecto: existen comillas sin cerrar."
            );
        }

        row.push(field);

        if (row.some(value => value !== "") || row.length > 1) {
            rows.push(row);
        }

        return rows;
    }


    // =====================================================
    // VALIDACIÓN Y CONVERSIÓN
    // =====================================================

    function convertCSVToMatrix(rows) {

        if (!Array.isArray(rows) || rows.length < 4) {
            throw new Error(
                "El archivo debe contener al menos 3 ciudades."
            );
        }

        const headers = rows[0].slice(1);

        const size = headers.length;

        if (size < 3) {
            throw new Error(
                "Se requieren al menos 3 ciudades en el CSV."
            );
        }

        if (rows[0].length !== size + 1) {
            throw new Error(
                "La cabecera del CSV tiene una cantidad incorrecta de columnas."
            );
        }

        const cities = headers.map(name => name.trim());

        if (cities.some(name => !name)) {
            throw new Error(
                "El CSV contiene nombres de ciudades vacíos."
            );
        }

        if (
            new Set(
                cities.map(city => city.toLocaleLowerCase())
            ).size !== size
        ) {
            throw new Error(
                "El CSV contiene nombres de ciudades duplicados."
            );
        }

        if (rows.length !== size + 1) {
            throw new Error(
                "La cantidad de filas no coincide con el número de ciudades."
            );
        }

        const matrix = [];

        for (let rowIndex = 0; rowIndex < size; rowIndex++) {

            const currentRow = rows[rowIndex + 1];

            if (currentRow.length !== size + 1) {
                throw new Error(
                    `La fila ${rowIndex + 2} no tiene la cantidad correcta de columnas.`
                );
            }

            const originName = currentRow[0].trim();

            if (
                originName.toLocaleLowerCase() !==
                cities[rowIndex].toLocaleLowerCase()
            ) {
                throw new Error(
                    `El nombre de origen de la fila ${rowIndex + 2} no coincide con la cabecera.`
                );
            }

            const values = [];

            for (let colIndex = 0; colIndex < size; colIndex++) {

                const rawValue = currentRow[colIndex + 1].trim();

                if (rowIndex === colIndex) {

                    if (rawValue !== "0") {
                        throw new Error(
                            `La diagonal principal debe ser cero. Error en ${cities[rowIndex]}.`
                        );
                    }

                    values.push(0);

                    continue;
                }

                if (rawValue === "") {

                    values.push(null);

                    continue;
                }

                const number = Number(rawValue);

                if (
                    !Number.isFinite(number) ||
                    number < 0
                ) {
                    throw new Error(
                        `Costo inválido entre ${cities[rowIndex]} y ${cities[colIndex]}.`
                    );
                }

                values.push(number);
            }

            matrix.push(values);
        }

        return {
            cities,
            matrix
        };
    }


    // =====================================================
    // IMPORTACIÓN
    // =====================================================

    async function importFile(file) {

        if (!file) {
            return;
        }

        if (!file.name.toLowerCase().endsWith(".csv")) {
            throw new Error("Selecciona un archivo con extensión .csv.");
        }

        const content = await file.text();

        // Eliminar BOM UTF-8 cuando exista.
        const normalizedContent = content.replace(/^\uFEFF/, "");

        const rows = parseCSV(normalizedContent);

        const data = convertCSVToMatrix(rows);

        const result = window.TSPMatrix.importData(
            data.cities,
            data.matrix
        );

        return result;
    }


    // =====================================================
    // EXPORTACIÓN
    // =====================================================

    function escapeCSV(value) {

        const text = String(value);

        if (/[",\r\n]/.test(text)) {
            return `"${text.replace(/"/g, '""')}"`;
        }

        return text;
    }


    function exportFile() {

        const state = window.TSPMatrix.getState();

        const validation = window.TSPMatrix.validateState();

        if (!validation.valid) {
            throw new Error(validation.error);
        }

        const rows = [];

        // Cabecera.
        rows.push([
            "",
            ...state.cities
        ]);

        // Filas de la matriz.
        state.cities.forEach((city, rowIndex) => {

            rows.push([
                city,
                ...state.matrix[rowIndex].map(
                    value => value === null ? "" : value
                )
            ]);

        });

        const csvContent = rows
            .map(row => row.map(escapeCSV).join(","))
            .join("\r\n");

        const blob = new Blob(
            ["\uFEFF", csvContent],
            { type: "text/csv;charset=utf-8;" }
        );

        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");

        link.href = url;
        link.download = "tsp_matrix.csv";

        document.body.appendChild(link);

        link.click();

        link.remove();

        URL.revokeObjectURL(url);
    }


    // =====================================================
    // EVENTOS
    // =====================================================

    function bindEvents() {

        fileInput.addEventListener(
            "change",
            async event => {

                const file = event.target.files[0];

                if (!file) {
                    return;
                }

                try {

                    await importFile(file);

                } catch (error) {

                    const feedback = document.getElementById(
                        "feedback-message"
                    );

                    feedback.textContent = error.message;

                    feedback.className =
                        "feedback-message error";

                } finally {

                    // Permite volver a seleccionar el mismo archivo.
                    fileInput.value = "";
                }
            }
        );


        exportButton.addEventListener(
            "click",
            () => {

                try {

                    exportFile();

                    const feedback = document.getElementById(
                        "feedback-message"
                    );

                    feedback.textContent =
                        "Archivo CSV exportado correctamente.";

                    feedback.className =
                        "feedback-message success";

                } catch (error) {

                    const feedback = document.getElementById(
                        "feedback-message"
                    );

                    feedback.textContent = error.message;

                    feedback.className =
                        "feedback-message error";
                }
            }
        );

    }


    // =====================================================
    // API PÚBLICA
    // =====================================================

    function init() {
        bindEvents();
    }


    return {
        init,
        parseCSV,
        convertCSVToMatrix,
        importFile,
        exportFile
    };

})();


window.TSPCsv = TSPCsv;


document.addEventListener(
    "DOMContentLoaded",
    () => TSPCsv.init()
);
