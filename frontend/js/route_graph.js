
"use strict";

const TSPRouteGraph = (() => {

    const SVG_NS = "http://www.w3.org/2000/svg";

    const CONFIG = {
        width: 1200,
        height: 820,
        centerX: 600,
        centerY: 430,
        radius: 285,
        nodeRadius: 25
    };

    const COLORS = {
        background: "#111827",
        edge: "#64748b",
        route: "#22d3ee",
        node: "#1e293b",
        nodeBorder: "#38bdf8",
        start: "#16a34a",
        text: "#e2e8f0",
        secondary: "#94a3b8",
        weightBackground: "#0f172a"
    };

    function createSvgElement(tag, attributes = {}) {
        const element = document.createElementNS(SVG_NS, tag);

        Object.entries(attributes).forEach(([key, value]) => {
            element.setAttribute(key, String(value));
        });

        return element;
    }

    function createText(x, y, content, attributes = {}) {
        const element = createSvgElement("text", {
            x,
            y,
            fill: COLORS.text,
            "font-family": "Arial, sans-serif",
            "font-size": 14,
            "text-anchor": "middle",
            ...attributes
        });

        element.textContent = String(content);

        return element;
    }

    function validateData(problem, result) {
        if (!problem || !result) {
            throw new Error("Faltan los datos del problema o del resultado.");
        }

        if (!Array.isArray(problem.cities) ||
            !Array.isArray(problem.matrix)) {
            throw new Error("La información de las ciudades o matriz no es válida.");
        }

        if (!Array.isArray(result.route) ||
            result.route.length < 4) {
            throw new Error("La ruta recibida no es válida.");
        }

        if (problem.cities.length < 3) {
            throw new Error("Se necesitan al menos tres ciudades.");
        }

        if (result.route[0] !== result.route[result.route.length - 1]) {
            throw new Error("La ruta no está cerrada correctamente.");
        }

        const cityCount = problem.cities.length;

        for (const cityIndex of result.route) {
            if (!Number.isInteger(cityIndex) ||
                cityIndex < 0 ||
                cityIndex >= cityCount) {
                throw new Error("La ruta contiene un índice de ciudad inválido.");
            }
        }

        if (problem.matrix.length !== cityCount) {
            throw new Error("La matriz no coincide con el número de ciudades.");
        }

        for (const row of problem.matrix) {
            if (!Array.isArray(row) || row.length !== cityCount) {
                throw new Error("La matriz de costos tiene dimensiones incorrectas.");
            }
        }
    }

    function calculatePositions(cityCount) {
        const positions = [];

        for (let i = 0; i < cityCount; i++) {
            const angle =
                (2 * Math.PI * i / cityCount) - Math.PI / 2;

            positions.push({
                x: CONFIG.centerX + CONFIG.radius * Math.cos(angle),
                y: CONFIG.centerY + CONFIG.radius * Math.sin(angle)
            });
        }

        return positions;
    }

    function createDefinitions(svg) {
        const defs = createSvgElement("defs");

        const marker = createSvgElement("marker", {
            id: "tsp-route-arrow",
            markerWidth: 10,
            markerHeight: 10,
            refX: 8,
            refY: 3,
            orient: "auto",
            markerUnits: "userSpaceOnUse"
        });

        const arrow = createSvgElement("path", {
            d: "M0,0 L0,6 L9,3 z",
            fill: COLORS.route
        });

        marker.appendChild(arrow);
        defs.appendChild(marker);
        svg.appendChild(defs);
    }

    function drawRouteEdges(svg, problem, route, positions) {
        const edgesGroup = createSvgElement("g");

        for (let i = 0; i < route.length - 1; i++) {

            const from = route[i];
            const to = route[i + 1];

            const start = positions[from];
            const end = positions[to];

            const cost = problem.matrix[from][to];

            if (typeof cost !== "number" || !Number.isFinite(cost)) {
                throw new Error(
                    `No existe un costo válido entre ${problem.cities[from]} y ${problem.cities[to]}.`
                );
            }

            const dx = end.x - start.x;
            const dy = end.y - start.y;
            const distance = Math.hypot(dx, dy);

            const unitX = dx / distance;
            const unitY = dy / distance;

            const lineStart = {
                x: start.x + unitX * CONFIG.nodeRadius,
                y: start.y + unitY * CONFIG.nodeRadius
            };

            const lineEnd = {
                x: end.x - unitX * (CONFIG.nodeRadius + 10),
                y: end.y - unitY * (CONFIG.nodeRadius + 10)
            };

            const line = createSvgElement("line", {
                x1: lineStart.x,
                y1: lineStart.y,
                x2: lineEnd.x,
                y2: lineEnd.y,
                stroke: COLORS.route,
                "stroke-width": 3,
                "stroke-linecap": "round",
                "marker-end": "url(#tsp-route-arrow)"
            });

            edgesGroup.appendChild(line);

            // Etiqueta del costo de la conexión.
            const midX = (start.x + end.x) / 2;
            const midY = (start.y + end.y) / 2;

            // Desplazamiento perpendicular para separar
            // la etiqueta de la línea.
            const offset = 20;

            const labelX = midX - unitY * offset;
            const labelY = midY + unitX * offset;

            const labelGroup = createSvgElement("g");

            const costText = cost.toLocaleString("es-CO", {
                maximumFractionDigits: 2
            });

            const labelWidth = Math.max(55, costText.length * 9 + 18);

            const labelBackground = createSvgElement("rect", {
                x: labelX - labelWidth / 2,
                y: labelY - 14,
                width: labelWidth,
                height: 27,
                rx: 7,
                fill: COLORS.weightBackground,
                stroke: COLORS.route,
                "stroke-width": 1
            });

            const label = createText(labelX, labelY + 5, costText, {
                fill: COLORS.route,
                "font-size": 12,
                "font-weight": "bold"
            });

            labelGroup.appendChild(labelBackground);
            labelGroup.appendChild(label);

            edgesGroup.appendChild(labelGroup);
        }

        svg.appendChild(edgesGroup);
    }

    function drawCities(svg, cities, positions, startCity) {
        const nodesGroup = createSvgElement("g");

        cities.forEach((city, index) => {

            const position = positions[index];
            const isStart = index === startCity;

            const group = createSvgElement("g");

            const circle = createSvgElement("circle", {
                cx: position.x,
                cy: position.y,
                r: CONFIG.nodeRadius,
                fill: isStart ? COLORS.start : COLORS.node,
                stroke: isStart ? "#4ade80" : COLORS.nodeBorder,
                "stroke-width": 3
            });

            const nodeNumber = createText(
                position.x,
                position.y + 5,
                index,
                {
                    fill: "#ffffff",
                    "font-size": 16,
                    "font-weight": "bold"
                }
            );

            const angle = Math.atan2(
                position.y - CONFIG.centerY,
                position.x - CONFIG.centerX
            );

            const labelDistance = 58;

            const labelX = position.x + Math.cos(angle) * labelDistance;
            const labelY = position.y + Math.sin(angle) * labelDistance + 5;

            const cityName = String(city);

            const maxLength = cities.length > 10 ? 12 : 18;

            const visibleName = cityName.length > maxLength
                ? cityName.slice(0, maxLength - 3) + "..."
                : cityName;

            const labelFontSize = cities.length > 10 ? 11 : 13;

            const nameLabel = createText(
                labelX,
                labelY,
                visibleName,
                {
                    fill: isStart ? "#4ade80" : COLORS.text,
                    "font-size": labelFontSize,
                    "font-weight": isStart ? "bold" : "normal"
                }
            );

            const title = createSvgElement("title");
            title.textContent = cityName;

            group.appendChild(circle);
            group.appendChild(nodeNumber);
            group.appendChild(nameLabel);
            group.appendChild(title);

            nodesGroup.appendChild(group);
        });

        svg.appendChild(nodesGroup);
    }

    function drawLegend(svg, startCity, totalCost) {

        const legend = createSvgElement("g");

        const title = createText(
            CONFIG.centerX,
            48,
            "RECORRIDO ÓPTIMO",
            {
                fill: COLORS.route,
                "font-size": 22,
                "font-weight": "bold",
                "letter-spacing": 2
            }
        );

        const startLabel = createText(
            35,
            790,
            `Origen: ${startCity}`,
            {
                fill: "#4ade80",
                "font-size": 14,
                "text-anchor": "start"
            }
        );

        const costLabel = createText(
            1165,
            790,
            `Costo total: ${Number(totalCost).toLocaleString("es-CO", {
                maximumFractionDigits: 2
            })}`,
            {
                fill: COLORS.route,
                "font-size": 14,
                "font-weight": "bold",
                "text-anchor": "end"
            }
        );

        legend.appendChild(title);
        legend.appendChild(startLabel);
        legend.appendChild(costLabel);

        svg.appendChild(legend);
    }

    function render(problem, result) {

        const container = document.getElementById("graph-container");

        if (!container) {
            console.error("No se encontró graph-container.");
            return false;
        }

        try {
            validateData(problem, result);

            const svg = createSvgElement("svg", {
                viewBox: `0 0 ${CONFIG.width} ${CONFIG.height}`,
                width: "100%",
                height: "100%",
                preserveAspectRatio: "xMidYMid meet",
                role: "img",
                "aria-label": "Visualización del recorrido óptimo del algoritmo genético"
            });

            svg.style.display = "block";
            svg.style.width = "100%";
            svg.style.height = "100%";

            createDefinitions(svg);

            const positions = calculatePositions(problem.cities.length);

            drawLegend(
                svg,
                problem.cities[result.route[0]],
                result.total_cost
            );

            drawRouteEdges(
                svg,
                problem,
                result.route,
                positions
            );

            drawCities(
                svg,
                problem.cities,
                positions,
                result.route[0]
            );

            container.replaceChildren(svg);

            return true;

        } catch (error) {

            console.error("Error al dibujar la ruta:", error);

            container.textContent =
                `No fue posible visualizar la ruta: ${error.message}`;

            return false;
        }
    }

    function clear() {
        const container = document.getElementById("graph-container");

        if (container) {
            container.textContent =
                "Ejecuta una optimización para visualizar la ruta.";
        }
    }

    return {
        render,
        clear
    };

})();

window.TSPRouteGraph = TSPRouteGraph;
