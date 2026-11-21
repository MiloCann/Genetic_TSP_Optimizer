
from backend.models.problem_instance import ProblemInstance
from backend.genetic_algorithm.individual import Individual
from backend.genetic_algorithm.fitness import (
    calculate_route_cost,
    InfeasibleRouteError
)
from backend.validation.matrix_validator import (
    validate_problem_instance
)


def two_opt_search(
    individual: Individual,
    problem: ProblemInstance
) -> Individual:
    """
    Mejora una ruta mediante búsqueda local 2-opt.

    Utiliza una estrategia de mejor mejora:
    evalúa los intercambios posibles y aplica el que
    produzca la mayor reducción de costo.

    La búsqueda termina cuando no encuentra mejoras.
    """

    if not isinstance(individual, Individual):
        raise ValueError(
            "El elemento debe ser un Individual."
        )

    validate_problem_instance(problem, min_cities=3)

    individual.validate(
        city_count=problem.city_count,
        start_city=problem.start_city
    )

    # La ruta inicial debe ser factible.
    best_individual = individual
    best_cost = calculate_route_cost(
        best_individual,
        problem
    )

    improved = True

    while improved:
        improved = False

        current_best = best_individual
        current_best_cost = best_cost

        # La posición cero corresponde al origen y nunca cambia.
        for i in range(1, problem.city_count - 1):
            for j in range(i + 1, problem.city_count):

                candidate_route = list(best_individual.route)

                # Invertir el segmento seleccionado.
                candidate_route[i:j + 1] = reversed(
                    candidate_route[i:j + 1]
                )

                candidate = Individual(
                    tuple(candidate_route)
                )

                try:
                    candidate_cost = calculate_route_cost(
                        candidate,
                        problem
                    )

                except InfeasibleRouteError:
                    continue

                if candidate_cost < current_best_cost:
                    current_best = candidate
                    current_best_cost = candidate_cost

        # Aplicar la mejor mejora encontrada en esta iteración.
        if current_best_cost < best_cost:
            best_individual = current_best
            best_cost = current_best_cost
            improved = True

    return best_individual
