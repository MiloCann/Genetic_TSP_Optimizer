
import pytest

from backend.models.problem_instance import ProblemInstance
from backend.genetic_algorithm.individual import Individual
from backend.genetic_algorithm.fitness import (
    calculate_route_cost,
    InfeasibleRouteError
)


def create_problem():
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


def test_calculate_route_cost():
    problem = create_problem()

    individual = Individual((0, 1, 3, 2))

    result = calculate_route_cost(individual, problem)

    assert result == 80


def test_asymmetric_route_cost():
    problem = ProblemInstance(
        cities=("A", "B", "C"),
        cost_matrix=(
            (0, 10, 50),
            (20, 0, 15),
            (30, 40, 0)
        ),
        symmetric=False,
        start_city=0
    )

    individual = Individual((0, 1, 2))

    result = calculate_route_cost(individual, problem)

    assert result == 55


def test_infeasible_route():
    problem = ProblemInstance(
        cities=("A", "B", "C"),
        cost_matrix=(
            (0, None, 15),
            (None, 0, 25),
            (15, 25, 0)
        ),
        symmetric=True
    )

    individual = Individual((0, 1, 2))

    with pytest.raises(InfeasibleRouteError):
        calculate_route_cost(individual, problem)


def test_invalid_individual():
    problem = create_problem()

    individual = Individual((0, 1, 1, 3))

    with pytest.raises(ValueError):
        calculate_route_cost(individual, problem)
