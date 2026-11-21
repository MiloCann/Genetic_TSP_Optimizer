
import random

from backend.models.problem_instance import ProblemInstance
from backend.genetic_algorithm.individual import Individual
from backend.genetic_algorithm.fitness import (
    calculate_route_cost,
    InfeasibleRouteError
)
from backend.validation.matrix_validator import (
    validate_problem_instance
)


class PopulationGenerationError(RuntimeError):
    """No fue posible generar la población solicitada."""


def create_population(
    problem: ProblemInstance,
    population_size: int,
    seed: int | None = None,
    max_attempts: int | None = None
) -> list[Individual]:
    """
    Genera una población inicial de rutas factibles.

    La ciudad de origen permanece fija en la primera posición.

    Las rutas repetidas se permiten para mantener flexibilidad
    cuando el número de rutas factibles es limitado.
    """

    validate_problem_instance(problem, min_cities=3)

    if (
        isinstance(population_size, bool)
        or not isinstance(population_size, int)
        or population_size < 1
    ):
        raise ValueError(
            "El tamaño de población debe ser un entero positivo."
        )

    if max_attempts is None:
        max_attempts = population_size * 100

    if (
        isinstance(max_attempts, bool)
        or not isinstance(max_attempts, int)
        or max_attempts < 1
    ):
        raise ValueError(
            "El número máximo de intentos debe ser positivo."
        )

    rng = random.Random(seed)

    start = problem.start_city

    remaining_cities = [
        city
        for city in range(problem.city_count)
        if city != start
    ]

    population = []
    attempts = 0

    while (
        len(population) < population_size
        and attempts < max_attempts
    ):

        attempts += 1

        shuffled_cities = remaining_cities.copy()

        rng.shuffle(shuffled_cities)

        route = (start, *shuffled_cities)

        individual = Individual(route)

        try:
            calculate_route_cost(individual, problem)

            population.append(individual)

        except InfeasibleRouteError:
            continue

    if len(population) < population_size:
        raise PopulationGenerationError(
            f"No se pudo completar la población. "
            f"Individuos generados: {len(population)} de "
            f"{population_size}. Intentos realizados: {attempts}. "
            f"Comprueba la conectividad de la matriz o aumenta "
            f"el límite de intentos."
        )

    return population
