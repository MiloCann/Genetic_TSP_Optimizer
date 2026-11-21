
import math
import pytest

from backend.models.problem_instance import ProblemInstance
from backend.genetic_algorithm.individual import Individual
from backend.genetic_algorithm.local_search import two_opt_search
from backend.genetic_algorithm.fitness import (
    calculate_route_cost,
    InfeasibleRouteError
)


@pytest.fixture
def square_problem():
    diagonal = math.sqrt(2)

    return ProblemInstance(
        cities=("A", "B", "C", "D"),
        cost_matrix=(
            (0, 1, diagonal, 1),
            (1, 0, 1, diagonal),
            (diagonal, 1, 0, 1),
            (1, diagonal, 1, 0)
        ),
        symmetric=True,
        start_city=0
    )


def test_two_opt_improves_crossing_route(square_problem):
    individual = Individual((0, 1, 3, 2))

    improved = two_opt_search(individual, square_problem)

    original_cost = calculate_route_cost(
        individual, square_problem
    )
    improved_cost = calculate_route_cost(
        improved, square_problem
    )

    assert improved_cost < original_cost
    assert improved_cost == pytest.approx(4.0)


def test_two_opt_preserves_start_city(square_problem):
    individual = Individual((0, 1, 3, 2))

    improved = two_opt_search(individual, square_problem)

    assert improved.route[0] == square_problem.start_city


def test_two_opt_preserves_all_cities(square_problem):
    individual = Individual((0, 1, 3, 2))

    improved = two_opt_search(individual, square_problem)

    assert set(improved.route) == set(individual.route)
    assert len(set(improved.route)) == square_problem.city_count


def test_two_opt_returns_individual(square_problem):
    individual = Individual((0, 1, 3, 2))

    improved = two_opt_search(individual, square_problem)

    assert isinstance(improved, Individual)


def test_two_opt_does_not_modify_original(square_problem):
    individual = Individual((0, 1, 3, 2))
    original_route = individual.route

    two_opt_search(individual, square_problem)

    assert individual.route == original_route


def test_two_opt_does_not_worsen_route(square_problem):
    individual = Individual((0, 1, 3, 2))

    improved = two_opt_search(individual, square_problem)

    original_cost = calculate_route_cost(
        individual, square_problem
    )
    improved_cost = calculate_route_cost(
        improved, square_problem
    )

    assert improved_cost <= original_cost


def test_two_opt_keeps_optimal_route(square_problem):
    individual = Individual((0, 1, 2, 3))

    improved = two_opt_search(individual, square_problem)

    assert calculate_route_cost(
        improved, square_problem
    ) == pytest.approx(4.0)


def test_two_opt_supports_asymmetric_matrix():
    problem = ProblemInstance(
        cities=("A", "B", "C", "D"),
        cost_matrix=(
            (0, 10, 20, 15),
            (12, 0, 8, 25),
            (18, 14, 0, 9),
            (7, 22, 11, 0)
        ),
        symmetric=False,
        start_city=0
    )

    individual = Individual((0, 1, 2, 3))

    improved = two_opt_search(individual, problem)

    assert calculate_route_cost(
        improved, problem
    ) <= calculate_route_cost(individual, problem)


def test_two_opt_rejects_infeasible_initial_route():
    problem = ProblemInstance(
        cities=("A", "B", "C"),
        cost_matrix=(
            (0, None, 10),
            (None, 0, 10),
            (10, 10, 0)
        ),
        symmetric=True,
        start_city=0
    )

    individual = Individual((0, 1, 2))

    with pytest.raises(InfeasibleRouteError):
        two_opt_search(individual, problem)


def test_two_opt_rejects_invalid_individual(square_problem):
    individual = Individual((0, 1, 1, 3))

    with pytest.raises(ValueError):
        two_opt_search(individual, square_problem)


def test_two_opt_rejects_wrong_number_of_cities(square_problem):
    individual = Individual((0, 1, 2))

    with pytest.raises(ValueError):
        two_opt_search(individual, square_problem)


def test_two_opt_rejects_non_individual(square_problem):
    from typing import cast

    invalid_individual = cast(
        Individual,
        (0, 1, 2, 3)
    )

    with pytest.raises(ValueError):
        two_opt_search(invalid_individual, square_problem)
