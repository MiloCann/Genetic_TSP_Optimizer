
"use strict";

/**
 * GENETIC TSP OPTIMIZER
 * Módulo: Editor de ciudades y matriz de costos.
 *
 * Responsabilidades:
 * - Administrar las ciudades.
 * - Administrar la matriz de costos.
 * - Mantener la ciudad de origen.
 * - Aplicar las reglas de matrices simétricas y asimétricas.
 * - Exponer los datos para la comunicación con la API.
 */

const TSPMatrix = (() => {

    // =====================================================
    // ESTADO INTERNO
    // =====================================================

    let cities = [];

    // null representa una conexión inexistente.
    let matrix = [];

    let symmetric = true;
    let startCity = 0;


    // =====================================================
    // REFERENCIAS DOM
    // =====================================================

    const elements = {
        cityName: document.getElementById("city-name"),
        addCityButton: document.getElementById("add-city-btn"),

        matrixType: document.getElementById("matrix-type"),
        startCity: document.getElementById("start-city"),

        cityList: document.getElementById("city-list"),
        cityListCount: document.getElementById("city-list-count"),
        cityCount: document.getElementById("city-count"),

        generateMatrixButton:
            document.getElementById("generate-matrix-btn"),

        clearMatrixButton:
            document.getElementById("clear-matrix-btn"),

        matrixContainer:
            document.getElementById("matrix-container")
    };


    // =====================================================
    // UTILIDADES
    // =====================================================

    function createEmptyMatrix(size) {

        return Array.from(
            { length: size },
            (_, row) => Array.from(
                { length: size },
                (_, col) => row === col ? 0 : null
            )
        );
    }


    function showMessage(message, type = "error") {

        const feedback = document.getElementById(
            "feedback-message"
        );

        if (!feedback) {
            window.alert(message);
            return;
        }

        feedback.textContent = message;
        feedback.className = `feedback-message ${type}`;
    }


    function updateCityCounters() {

        elements.cityCount.textContent = cities.length;

        elements.cityListCount.textContent =
            `${cities.length} ciudad${cities.length === 1 ? "" : "es"}`;
    }


    // =====================================================
    // ADMINISTRACIÓN DE CIUDADES
    // =====================================================

    function addCity(name) {

        const cityName = String(name ?? "").trim();

        if (!cityName) {
            showMessage("Ingresa el nombre de una ciudad.");
            return false;
        }

        if (cityName.length > 60) {
            showMessage(
                "El nombre de la ciudad no puede superar 60 caracteres."
            );
            return false;
        }

        const duplicated = cities.some(
            city => city.toLocaleLowerCase() ===
                    cityName.toLocaleLowerCase()
        );

        if (duplicated) {
            showMessage("Esta ciudad ya se encuentra registrada.");
            return false;
        }

        cities.push(cityName);

        const newSize = cities.length;

        matrix = matrix.map(row => [...row]);

        matrix.forEach(row => row.push(null));

        const newRow = Array(newSize).fill(null);
        newRow[newSize - 1] = 0;

        matrix.push(newRow);

        if (cities.length === 1) {
            startCity = 0;
        }

        render();

        showMessage(
            `Ciudad "${cityName}" agregada correctamente.`,
            "success"
        );

        return true;
    }


    function removeCity(index) {

        if (
            !Number.isInteger(index) ||
            index < 0 ||
            index >= cities.length
        ) {
            return false;
        }

        const removedName = cities[index];

        cities.splice(index, 1);

        matrix.splice(index, 1);

        matrix.forEach(row => row.splice(index, 1));

        if (cities.length === 0) {
            startCity = 0;
        } else if (startCity === index) {
            startCity = 0;
        } else if (startCity > index) {
            startCity--;
        }

        render();

        showMessage(
            `Ciudad "${removedName}" eliminada correctamente.`,
            "success"
        );

        return true;
    }


    function renderCities() {

        elements.cityList.replaceChildren();

        if (cities.length === 0) {

            const emptyMessage = document.createElement("p");

            emptyMessage.className = "empty-message";
            emptyMessage.textContent =
                "Agrega ciudades para comenzar.";

            elements.cityList.appendChild(emptyMessage);

        } else {

            cities.forEach((city, index) => {

                const chip = document.createElement("div");
                chip.className = "city-chip";

                const name = document.createElement("span");
                name.textContent = city;

                const removeButton = document.createElement("button");

                removeButton.type = "button";
                removeButton.textContent = "×";
                removeButton.title = `Eliminar ${city}`;
                removeButton.setAttribute(
                    "aria-label",
                    `Eliminar ciudad ${city}`
                );

                removeButton.dataset.index = index;

                chip.append(name, removeButton);

                elements.cityList.appendChild(chip);

            });
        }

        updateCityCounters();

        renderStartCity();
    }


    // =====================================================
    // CIUDAD DE ORIGEN
    // =====================================================

    function renderStartCity() {

        elements.startCity.replaceChildren();

        if (cities.length === 0) {

            const option = document.createElement("option");

            option.value = "";
            option.textContent = "Sin ciudades";

            elements.startCity.appendChild(option);

            elements.startCity.disabled = true;

            return;
        }

        elements.startCity.disabled = false;

        cities.forEach((city, index) => {

            const option = document.createElement("option");

            option.value = index;
            option.textContent = city;

            elements.startCity.appendChild(option);

        });

        elements.startCity.value = String(startCity);
    }


    // =====================================================
    // MATRIZ DE COSTOS
    // =====================================================

    function renderMatrix() {

        elements.matrixContainer.replaceChildren();

        if (cities.length === 0) {

            const empty = document.createElement("div");

            empty.className = "matrix-empty";

            const icon = document.createElement("span");
            icon.textContent = "▦";

            const message = document.createElement("p");
            message.textContent = "La matriz aparecerá aquí.";

            empty.append(icon, message);

            elements.matrixContainer.appendChild(empty);

            return;
        }

        const table = document.createElement("table");

        table.className = "matrix-table";

        const thead = document.createElement("thead");
        const headerRow = document.createElement("tr");

        const corner = document.createElement("th");
        corner.textContent = "ORIGEN / DESTINO";

        headerRow.appendChild(corner);

        cities.forEach(city => {

            const th = document.createElement("th");

            th.textContent = city;

            headerRow.appendChild(th);

        });

        thead.appendChild(headerRow);

        const tbody = document.createElement("tbody");

        cities.forEach((origin, rowIndex) => {

            const row = document.createElement("tr");

            const rowHeader = document.createElement("th");

            rowHeader.textContent = origin;

            row.appendChild(rowHeader);

            cities.forEach((destination, colIndex) => {

                const cell = document.createElement("td");

                const input = document.createElement("input");

                input.type = "number";
                input.min = "0";
                input.step = "any";

                input.dataset.row = rowIndex;
                input.dataset.col = colIndex;

                input.setAttribute(
                    "aria-label",
                    `Costo de ${origin} a ${destination}`
                );

                const value = matrix[rowIndex][colIndex];

                input.value = value === null ? "" : String(value);

                if (rowIndex === colIndex) {

                    input.value = "0";
                    input.disabled = true;
                    input.title = "La diagonal principal siempre es cero.";

                } else {

                    input.placeholder = "—";

                    if (
                        symmetric &&
                        rowIndex > colIndex
                    ) {
                        input.readOnly = true;
                        input.title =
                            "Valor sincronizado por simetría.";
                    }
                }

                cell.appendChild(input);
                row.appendChild(cell);

            });

            tbody.appendChild(row);

        });

        table.append(thead, tbody);

        elements.matrixContainer.appendChild(table);
    }


    function updateMatrixCell(row, col, rawValue) {

        if (
            !Number.isInteger(row) ||
            !Number.isInteger(col) ||
            row < 0 ||
            col < 0 ||
            row >= cities.length ||
            col >= cities.length ||
            row === col
        ) {
            return;
        }

        const input = elements.matrixContainer.querySelector(
            `input[data-row="${row}"][data-col="${col}"]`
        );

        if (!input) {
            return;
        }

        if (rawValue.trim() === "") {

            matrix[row][col] = null;

            if (symmetric) {
                matrix[col][row] = null;
                updateMirroredInput(col, row, "");
            }

            input.classList.remove("invalid");

            return;
        }

        const value = Number(rawValue);

        if (!Number.isFinite(value) || value < 0) {

            input.classList.add("invalid");

            return;
        }

        matrix[row][col] = value;

        input.classList.remove("invalid");

        if (symmetric) {

            matrix[col][row] = value;

            updateMirroredInput(col, row, String(value));
        }
    }


    function updateMirroredInput(row, col, value) {

        const mirrored = elements.matrixContainer.querySelector(
            `input[data-row="${row}"][data-col="${col}"]`
        );

        if (mirrored) {
            mirrored.value = value;
            mirrored.classList.remove("invalid");
        }
    }


    function clearMatrix() {

        matrix = createEmptyMatrix(cities.length);

        renderMatrix();

        showMessage(
            "La matriz se ha limpiado correctamente.",
            "success"
        );
    }


    function synchronizeSymmetricMatrix() {

        const size = cities.length;

        for (let row = 0; row < size; row++) {

            for (let col = row + 1; col < size; col++) {

                matrix[col][row] = matrix[row][col];

            }
        }
    }


    function changeMatrixType() {

        const requestedSymmetry =
            elements.matrixType.value === "symmetric";

        if (requestedSymmetry === symmetric) {
            return;
        }

        if (requestedSymmetry) {

            const hasDifferences = matrix.some(
                (row, i) => row.some(
                    (value, j) =>
                        i < j && value !== matrix[j][i]
                )
            );

            if (
                hasDifferences &&
                !window.confirm(
                    "Al activar la matriz simétrica, " +
                    "los valores del triángulo superior " +
                    "se copiarán al inferior. ¿Deseas continuar?"
                )
            ) {

                elements.matrixType.value = "asymmetric";

                return;
            }

            symmetric = true;

            synchronizeSymmetricMatrix();

        } else {

            symmetric = false;
        }

        renderMatrix();

        showMessage(
            `Matriz ${symmetric ? "simétrica" : "asimétrica"} activada.`,
            "success"
        );
    }


    // =====================================================
    // EVENTOS
    // =====================================================

    function bindEvents() {

        elements.addCityButton.addEventListener(
            "click",
            () => {

                const added = addCity(elements.cityName.value);

                if (added) {
                    elements.cityName.value = "";
                    elements.cityName.focus();
                }
            }
        );


        elements.cityName.addEventListener(
            "keydown",
            event => {

                if (event.key === "Enter") {

                    event.preventDefault();

                    elements.addCityButton.click();
                }
            }
        );


        elements.cityList.addEventListener(
            "click",
            event => {

                const button = event.target.closest("button");

                if (!button || !button.dataset.index) {
                    return;
                }

                removeCity(Number(button.dataset.index));
            }
        );


        elements.startCity.addEventListener(
            "change",
            () => {

                const value = Number(elements.startCity.value);

                if (
                    Number.isInteger(value) &&
                    value >= 0 &&
                    value < cities.length
                ) {
                    startCity = value;
                }
            }
        );


        elements.matrixType.addEventListener(
            "change",
            changeMatrixType
        );


        elements.generateMatrixButton.addEventListener(
            "click",
            renderMatrix
        );


        elements.clearMatrixButton.addEventListener(
            "click",
            clearMatrix
        );


        elements.matrixContainer.addEventListener(
            "input",
            event => {

                const input = event.target;

                if (
                    !input.matches("input[data-row][data-col]")
                ) {
                    return;
                }

                updateMatrixCell(
                    Number(input.dataset.row),
                    Number(input.dataset.col),
                    input.value
                );
            }
        );

    }

   
    // =====================================================
    // CARGA DE MATRIZ EXTERNA
    // =====================================================

    function importData(importedCities, importedMatrix) {

        if (!Array.isArray(importedCities) ||
            !Array.isArray(importedMatrix)) {
            throw new Error("Los datos importados no tienen un formato válido.");
        }

        if (importedCities.length < 3) {
            throw new Error("El CSV debe contener al menos 3 ciudades.");
        }

        const size = importedCities.length;

        if (importedMatrix.length !== size) {
            throw new Error("La matriz importada no tiene dimensiones correctas.");
        }

        const normalizedCities = importedCities.map(city => {
            if (typeof city !== "string" || !city.trim()) {
                throw new Error("El CSV contiene nombres de ciudades vacíos.");
            }

            return city.trim();
        });

        const normalizedNames = normalizedCities.map(
            city => city.toLocaleLowerCase()
        );

        if (new Set(normalizedNames).size !== size) {
            throw new Error("El CSV contiene nombres de ciudades duplicados.");
        }

        const normalizedMatrix = importedMatrix.map(
            (row, rowIndex) => {

                if (!Array.isArray(row) || row.length !== size) {
                    throw new Error(
                        `La fila ${rowIndex + 1} tiene dimensiones incorrectas.`
                    );
                }

                return row.map((value, colIndex) => {

                    if (rowIndex === colIndex) {

                        if (value !== 0) {
                            throw new Error(
                                "La diagonal principal debe contener únicamente ceros."
                            );
                        }

                        return 0;
                    }

                    if (value === null || value === "") {
                        return null;
                    }

                    if (
                        typeof value !== "number" ||
                        !Number.isFinite(value) ||
                        value < 0
                    ) {
                        throw new Error(
                            `Costo inválido entre ${normalizedCities[rowIndex]} y ${normalizedCities[colIndex]}.`
                        );
                    }

                    return value;
                });
            }
        );

        const detectedSymmetry = normalizedMatrix.every(
            (row, i) => row.every(
                (value, j) => value === normalizedMatrix[j][i]
            )
        );

        // Conservamos la ciudad de origen si existe en la importación.
        const previousStartName = cities[startCity];

        const matchingStart = normalizedCities.findIndex(
            city => city.toLocaleLowerCase() ===
                    previousStartName?.toLocaleLowerCase()
        );

        // Actualizamos el estado únicamente después de validar todo.
        cities = normalizedCities;
        matrix = normalizedMatrix;
        symmetric = detectedSymmetry;

        startCity = matchingStart >= 0 ? matchingStart : 0;

        elements.matrixType.value = symmetric
            ? "symmetric"
            : "asymmetric";

        render();

        showMessage(
            `CSV importado correctamente: ${size} ciudades, matriz ${symmetric ? "simétrica" : "asimétrica"}.`,
            "success"
        );

        return {
            cities: size,
            symmetric: detectedSymmetry
        };
    }
     


    // =====================================================
    // INTERFAZ PÚBLICA
    // =====================================================

    function getState() {

        return {
            cities: [...cities],

            matrix: matrix.map(
                row => [...row]
            ),

            symmetric,

            start_city: startCity
        };
    }


    function validateState() {

        if (cities.length < 3) {

            return {
                valid: false,
                error: "Se requieren al menos 3 ciudades."
            };
        }
        const invalidCell = elements.matrixContainer.querySelector(
            "input.invalid"
        );

        if (invalidCell) {
            return {
                valid: false,
                error: "La matriz contiene costos inválidos. Revisa las celdas marcadas."
            };
        }

        if (new Set(
            cities.map(city => city.toLocaleLowerCase())
        ).size !== cities.length) {

            return {
                valid: false,
                error: "Existen nombres de ciudades duplicados."
            };
        }

        if (
            !Number.isInteger(startCity) ||
            startCity < 0 ||
            startCity >= cities.length
        ) {

            return {
                valid: false,
                error: "La ciudad de origen no es válida."
            };
        }

        for (let row = 0; row < cities.length; row++) {

            if (!Array.isArray(matrix[row]) ||
                matrix[row].length !== cities.length) {

                return {
                    valid: false,
                    error: "La matriz tiene dimensiones incorrectas."
                };
            }

            for (let col = 0; col < cities.length; col++) {

                const value = matrix[row][col];

                if (row === col) {

                    if (value !== 0) {
                        return {
                            valid: false,
                            error: "La diagonal principal debe ser cero."
                        };
                    }

                    continue;
                }

                if (
                    value !== null &&
                    (
                        typeof value !== "number" ||
                        !Number.isFinite(value) ||
                        value < 0
                    )
                ) {

                    return {
                        valid: false,
                        error: `Costo inválido entre ${cities[row]} y ${cities[col]}.`
                    };
                }

                if (
                    symmetric &&
                    value !== matrix[col][row]
                ) {

                    return {
                        valid: false,
                        error: "La matriz no cumple la condición de simetría."
                    };
                }
            }
        }

        return {
            valid: true,
            error: null
        };
    }


    function init() {

        bindEvents();

        elements.matrixType.value = "symmetric";

        render();
    }


    function render() {

        renderCities();

        renderMatrix();
    }


    return {
        init,
        addCity,
        removeCity,
        clearMatrix,
        getState,
        validateState,
        render,
        importData 
    };

})();


// Disponible para los demás módulos del frontend.
window.TSPMatrix = TSPMatrix;


// Inicialización del editor.
document.addEventListener(
    "DOMContentLoaded",
    () => TSPMatrix.init()
);
