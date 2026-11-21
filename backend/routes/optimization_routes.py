
from flask import Blueprint, jsonify, request

from backend.models.problem_instance import ProblemInstance
from backend.validation.matrix_validator import validate_problem_instance

from backend.genetic_algorithm.optimizer import (
    optimize,
    GeneticAlgorithmConfig
)

from backend.genetic_algorithm.population import (
    PopulationGenerationError
)

from backend.genetic_algorithm.optimizer import (
    PopulationEvolutionError
)


optimization_bp = Blueprint(
    "optimization",
    __name__,
    url_prefix="/api"
)


def _build_problem(data):
    """Construye y valida una instancia del problema TSP."""

    if not isinstance(data, dict):
        raise ValueError("El cuerpo de la solicitud debe ser un objeto JSON.")

    required_fields = ("cities", "matrix")

    for field in required_fields:
        if field not in data:
            raise ValueError(
                f"Falta el campo obligatorio: {field}."
            )

    cities = data["cities"]
    matrix = data["matrix"]

    if not isinstance(cities, list):
        raise ValueError("cities debe ser una lista.")

    if not isinstance(matrix, list):
        raise ValueError("matrix debe ser una lista.")

    symmetric = data.get("symmetric", True)
    start_city = data.get("start_city", 0)

    if not isinstance(symmetric, bool):
        raise ValueError("symmetric debe ser booleano.")

    if (
        isinstance(start_city, bool)
        or not isinstance(start_city, int)
    ):
        raise ValueError("start_city debe ser un entero.")

    problem = ProblemInstance(
        cities=tuple(cities),
        cost_matrix=tuple(
            tuple(row) if isinstance(row, list) else row
            for row in matrix
        ),
        symmetric=symmetric,
        start_city=start_city
    )

    validate_problem_instance(problem, min_cities=3)

    return problem


def _build_config(data):
    """Construye la configuración del algoritmo genético."""

    if data is None:
        return GeneticAlgorithmConfig()

    if not isinstance(data, dict):
        raise ValueError("config debe ser un objeto JSON.")

    allowed_fields = {
        "population_size",
        "generations",
        "crossover_rate",
        "mutation_rate",
        "elite_rate",
        "tournament_size",
        "use_two_opt",
        "seed",
        "max_attempts_per_generation"
    }

    unknown_fields = set(data) - allowed_fields

    if unknown_fields:
        raise ValueError(
            "Parámetros de configuración desconocidos: "
            + ", ".join(sorted(unknown_fields))
        )

    return GeneticAlgorithmConfig(**data)


@optimization_bp.get("/health")
def health():
    """Comprueba que la API está disponible."""

    return jsonify({
        "status": "ok",
        "message": "Genetic TSP Optimizer API is running."
    }), 200


@optimization_bp.post("/validate")
def validate_problem():
    """Valida una instancia TSP recibida mediante JSON."""

    data = request.get_json(silent=True)

    if data is None:
        return jsonify({
            "error": "Se requiere un cuerpo JSON válido."
        }), 400

    try:
        problem = _build_problem(data)

        return jsonify({
            "valid": True,
            "city_count": problem.city_count,
            "symmetric": problem.symmetric,
            "start_city": problem.start_city,
            "message": "La instancia TSP es válida."
        }), 200

    except (ValueError, TypeError) as error:
        return jsonify({
            "valid": False,
            "error": str(error)
        }), 400


@optimization_bp.post("/optimize")
def optimize_problem():
    """Ejecuta el algoritmo genético sobre una instancia TSP."""

    data = request.get_json(silent=True)

    if data is None:
        return jsonify({
            "error": "Se requiere un cuerpo JSON válido."
        }), 400

    try:
        problem = _build_problem(data)
        config = _build_config(data.get("config"))

        result = optimize(problem, config)

        route = result.closed_route

        return jsonify({
            "feasible": True,
            "route": list(route),
            "route_names": [
                problem.cities[index]
                for index in route
            ],
            "total_cost": result.best_cost,
            "best_generation": result.best_generation,
            "history": list(result.history),
            "statistics": {
                "population_size": config.population_size,
                "generations": config.generations,
                "history_length": len(result.history)
            }
        }), 200

    except (ValueError, TypeError) as error:
        return jsonify({
            "error": str(error)
        }), 400

    except (
        PopulationGenerationError,
        PopulationEvolutionError
    ) as error:
        return jsonify({
            "error": str(error),
            "error_type": "optimization_failed"
        }), 422
