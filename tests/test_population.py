
import pytest

from backend.models.problem_instance import ProblemInstance

from backend.genetic_algorithm.population import (
    create_population,
    PopulationGenerationError
)

from backend.genetic_algorithm.fitness import calculate_route_cost


def create_complete_problem():
    return ProblemInstance(
        cities=("A", "B", "C", "D"),
        cost_matrix=(
            (0, 10, 15, 20),
            (10, 0, 35, 25),
            (15, 35, 0, 30),
            (20, 25, 30, 0)
        ),
        symmetric=True,
        start_city=0
    )


def test_population_size():
    problem = create_complete_problem()

    population = create_population(
        problem,
        population_size=20,
        seed=42
    )

    assert len(population) == 20


def test_population_routes_are_valid():
    problem = create_complete_problem()

    population = create_population(
        problem,
        population_size=30,
        seed=42
    )

    for individual in population:

        individual.validate(
            city_count=problem.city_count,
            start_city=problem.start_city
        )

        assert calculate_route_cost(
            individual,
            problem
        ) >= 0


def test_population_uses_fixed_start():
    problem = create_complete_problem()

    population = create_population(
        problem,
        population_size=20,
        seed=42
    )

    for individual in population:
        assert individual.route[0] == 0


def test_population_is_reproducible():
    problem = create_complete_problem()

    population_a = create_population(
        problem,
        population_size=10,
        seed=123
    )

    population_b = create_population(
        problem,
        population_size=10,
        seed=123
    )

    routes_a = [ind.route for ind in population_a]
    routes_b = [ind.route for ind in population_b]

    assert routes_a == routes_b


def test_population_with_asymmetric_matrix():
    problem = ProblemInstance(
        cities=("A", "B", "C"),
        cost_matrix=(
            (0, 10, 20),
            (30, 0, 15),
            (25, 40, 0)
        ),
        symmetric=False,
        start_city=0
    )

    population = create_population(
        problem,
        population_size=10,
        seed=42
    )

    assert len(population) == 10


def test_population_rejects_infeasible_routes():
    problem = ProblemInstance(
        cities=("A", "B", "C"),
        cost_matrix=(
            (0, None, 15),
            (None, 0, 25),
            (15, 25, 0)
        ),
        symmetric=True,
        start_city=0
    )

    with pytest.raises(PopulationGenerationError):
        create_population(
            problem,
            population_size=5,
            seed=42,
            max_attempts=50
        )


def test_population_rejects_invalid_size():
    problem = create_complete_problem()

    with pytest.raises(ValueError):
        create_population(
            problem,
            population_size=0
        )
