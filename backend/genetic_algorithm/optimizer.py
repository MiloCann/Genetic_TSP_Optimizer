
import math
import random

from dataclasses import dataclass

from backend.models.problem_instance import ProblemInstance
from backend.validation.matrix_validator import validate_problem_instance

from backend.genetic_algorithm.individual import Individual
from backend.genetic_algorithm.population import create_population
from backend.genetic_algorithm.fitness import (
    calculate_route_cost,
    InfeasibleRouteError
)
from backend.genetic_algorithm.selection import tournament_selection
from backend.genetic_algorithm.crossover import order_crossover
from backend.genetic_algorithm.mutation import swap_mutation
from backend.genetic_algorithm.elitism import select_elites
from backend.genetic_algorithm.local_search import two_opt_search


@dataclass(frozen=True)
class GeneticAlgorithmConfig:
    population_size: int = 150
    generations: int = 500
    crossover_rate: float = 0.85
    mutation_rate: float = 0.15
    elite_rate: float = 0.05
    tournament_size: int = 3
    use_two_opt: bool = False
    seed: int | None = None
    max_attempts_per_generation: int = 1000

    def __post_init__(self):
        integer_fields = {
            "population_size": self.population_size,
            "generations": self.generations,
            "tournament_size": self.tournament_size,
            "max_attempts_per_generation":
                self.max_attempts_per_generation
        }

        for name, value in integer_fields.items():
            if (
                isinstance(value, bool)
                or not isinstance(value, int)
                or value < 1
            ):
                raise ValueError(
                    f"{name} debe ser un entero positivo."
                )

        probabilities = {
            "crossover_rate": self.crossover_rate,
            "mutation_rate": self.mutation_rate,
            "elite_rate": self.elite_rate
        }

        for name, value in probabilities.items():
            if (
                isinstance(value, bool)
                or not isinstance(value, (int, float))
                or not math.isfinite(value)
                or not 0 <= value <= 1
            ):
                raise ValueError(
                    f"{name} debe estar entre 0 y 1."
                )

        if self.elite_rate == 0:
            raise ValueError(
                "El porcentaje de elitismo debe ser mayor que cero."
            )

        if self.elite_rate == 1:
            raise ValueError(
                "El porcentaje de elitismo debe ser menor que uno."
            )

        if self.tournament_size > self.population_size:
            raise ValueError(
                "El torneo no puede superar el tamaño de población."
            )

        if not isinstance(self.use_two_opt, bool):
            raise ValueError(
                "use_two_opt debe ser booleano."
            )

        if self.seed is not None and (
            isinstance(self.seed, bool)
            or not isinstance(self.seed, int)
        ):
            raise ValueError(
                "La semilla debe ser un entero o None."
            )


@dataclass(frozen=True)
class OptimizationResult:
    best_individual: Individual
    best_cost: float
    best_generation: int
    history: tuple[float, ...]

    @property
    def closed_route(self) -> tuple[int, ...]:
        return self.best_individual.closed_route()


class PopulationEvolutionError(RuntimeError):
    """No fue posible completar una nueva generación."""


def optimize(
    problem: ProblemInstance,
    config: GeneticAlgorithmConfig | None = None
) -> OptimizationResult:
    """
    Ejecuta el algoritmo genético para resolver una instancia TSP.
    """

    validate_problem_instance(problem, min_cities=3)

    if config is None:
        config = GeneticAlgorithmConfig()
    elif not isinstance(config, GeneticAlgorithmConfig):
        raise ValueError(
        "La configuración debe ser una instancia "
        "de GeneticAlgorithmConfig."
    )

    rng = random.Random(config.seed)

    population = create_population(
        problem,
        population_size=config.population_size,
        seed=config.seed
    )

    elite_count = max(
        1,
        math.ceil(config.population_size * config.elite_rate)
    )

    best_individual = min(
        population,
        key=lambda individual: calculate_route_cost(
            individual, problem
        )
    )

    best_cost = calculate_route_cost(
        best_individual, problem
    )

    best_generation = 0
    history = [best_cost]

    for generation in range(1, config.generations + 1):

        costs = [
            calculate_route_cost(individual, problem)
            for individual in population
        ]

        elites = select_elites(
            population,
            costs,
            elite_count
        )

        new_population = list(elites)
        attempts = 0

        while len(new_population) < config.population_size:

            if attempts >= config.max_attempts_per_generation:
                raise PopulationEvolutionError(
                    f"No se pudo completar la generación {generation}. "
                    f"Individuos generados: {len(new_population)} de "
                    f"{config.population_size}."
                )

            attempts += 1

            parent_a = tournament_selection(
                population,
                costs,
                config.tournament_size,
                rng
            )

            parent_b = tournament_selection(
                population,
                costs,
                config.tournament_size,
                rng
            )

            if rng.random() < config.crossover_rate:
                children = order_crossover(
                    parent_a,
                    parent_b,
                    rng
                )
            else:
                children = (parent_a, parent_b)

            for child in children:

                if rng.random() < config.mutation_rate:
                    child = swap_mutation(child, rng)

                if config.use_two_opt:
                    child = two_opt_search(child, problem)

                try:
                    calculate_route_cost(child, problem)
                except InfeasibleRouteError:
                    continue

                if len(new_population) < config.population_size:
                    new_population.append(child)

        population = new_population

        generation_best = min(
            population,
            key=lambda individual: calculate_route_cost(
                individual, problem
            )
        )

        generation_best_cost = calculate_route_cost(
            generation_best, problem
        )

        if generation_best_cost < best_cost:
            best_individual = generation_best
            best_cost = generation_best_cost
            best_generation = generation

        history.append(best_cost)

    return OptimizationResult(
        best_individual=best_individual,
        best_cost=best_cost,
        best_generation=best_generation,
        history=tuple(history)
    )
