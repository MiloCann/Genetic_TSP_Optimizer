
import pytest

from backend.models.problem_instance import ProblemInstance
from backend.validation.matrix_validator import (
    validate_problem_instance
)


def create_valid_problem():
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


def test_valid_problem():
    problem = create_valid_problem()

    assert validate_problem_instance(problem) is None


def test_minimum_cities():
    problem = ProblemInstance(
        cities=("A", "B"),
        cost_matrix=((0, 10), (10, 0))
    )

    with pytest.raises(ValueError):
        validate_problem_instance(problem)


def test_invalid_matrix_dimensions():
    problem = ProblemInstance(
        cities=("A", "B", "C"),
        cost_matrix=(
            (0, 10, 15),
            (10, 0),
            (15, 20, 0)
        )
    )

    with pytest.raises(ValueError):
        validate_problem_instance(problem)


def test_negative_cost():
    problem = ProblemInstance(
        cities=("A", "B", "C"),
        cost_matrix=(
            (0, -10, 15),
            (-10, 0, 20),
            (15, 20, 0)
        )
    )

    with pytest.raises(ValueError):
        validate_problem_instance(problem)


def test_asymmetric_matrix():
    problem = ProblemInstance(
        cities=("A", "B", "C"),
        cost_matrix=(
            (0, 10, 15),
            (20, 0, 25),
            (15, 25, 0)
        ),
        symmetric=True
    )

    with pytest.raises(ValueError):
        validate_problem_instance(problem)


def test_asymmetric_mode_accepts_different_costs():
    problem = ProblemInstance(
        cities=("A", "B", "C"),
        cost_matrix=(
            (0, 10, 15),
            (20, 0, 25),
            (30, 35, 0)
        ),
        symmetric=False
    )

    assert validate_problem_instance(problem) is None


def test_missing_connection_is_allowed():
    problem = ProblemInstance(
        cities=("A", "B", "C"),
        cost_matrix=(
            (0, None, 15),
            (None, 0, 25),
            (15, 25, 0)
        )
    )

    assert validate_problem_instance(problem) is None


def test_duplicate_city_names():
    problem = ProblemInstance(
        cities=("Bogota", "Medellin", "bogota"),
        cost_matrix=(
            (0, 10, 20),
            (10, 0, 30),
            (20, 30, 0)
        )
    )

    with pytest.raises(ValueError):
        validate_problem_instance(problem)


def test_infinite_cost():
    problem = ProblemInstance(
        cities=("A", "B", "C"),
        cost_matrix=(
            (0, 10, 15),
            (10, 0, float("inf")),
            (15, float("inf"), 0)
        )
    )

    with pytest.raises(ValueError):
        validate_problem_instance(problem)
