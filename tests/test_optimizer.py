
import pytest
from typing import cast

from backend.models.problem_instance import ProblemInstance

from backend.genetic_algorithm.optimizer import (
    optimize,
    GeneticAlgorithmConfig,
    OptimizationResult,
    PopulationEvolutionError
)


@pytest.fixture
def problem():
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


@pytest.fixture
def config():
    return GeneticAlgorithmConfig(
        population_size=20,
        generations=30,
        crossover_rate=0.85,
        mutation_rate=0.15,
        elite_rate=0.10,
        tournament_size=3,
        seed=42
    )


def test_optimizer_returns_result(problem, config):
    result = optimize(problem, config)

    assert isinstance(result, OptimizationResult)


def test_optimizer_returns_valid_route(problem, config):
    result = optimize(problem, config)

    result.best_individual.validate(
        problem.city_count,
        problem.start_city
    )


def test_optimizer_returns_finite_cost(problem, config):
    result = optimize(problem, config)

    assert result.best_cost >= 0
    assert result.best_cost < float("inf")


def test_optimizer_preserves_start_city(problem, config):
    result = optimize(problem, config)

    assert result.best_individual.route[0] == 0
    assert result.closed_route[0] == 0
    assert result.closed_route[-1] == 0


def test_optimizer_history_has_correct_length(problem, config):
    result = optimize(problem, config)

    assert len(result.history) == config.generations + 1


def test_optimizer_history_never_worsens(problem, config):
    result = optimize(problem, config)

    for previous, current in zip(
        result.history,
        result.history[1:]
    ):
        assert current <= previous


def test_optimizer_is_reproducible(problem, config):
    result_a = optimize(problem, config)
    result_b = optimize(problem, config)

    assert result_a.best_individual == result_b.best_individual
    assert result_a.best_cost == result_b.best_cost
    assert result_a.history == result_b.history


def test_optimizer_supports_asymmetric_matrix():
    asymmetric_problem = ProblemInstance(
        cities=("A", "B", "C", "D"),
        cost_matrix=(
            (0, 10, 20, 15),
            (30, 0, 8, 25),
            (18, 14, 0, 9),
            (7, 22, 11, 0)
        ),
        symmetric=False,
        start_city=0
    )

    config = GeneticAlgorithmConfig(
        population_size=15,
        generations=10,
        seed=42
    )

    result = optimize(asymmetric_problem, config)

    assert result.best_cost >= 0


def test_optimizer_supports_two_opt(problem):
    config = GeneticAlgorithmConfig(
        population_size=15,
        generations=10,
        use_two_opt=True,
        seed=42
    )

    result = optimize(problem, config)

    assert result.best_cost >= 0


def test_optimizer_rejects_invalid_population_size():
    with pytest.raises(ValueError):
        GeneticAlgorithmConfig(population_size=0)


def test_optimizer_rejects_invalid_probability():
    with pytest.raises(ValueError):
        GeneticAlgorithmConfig(crossover_rate=1.5)


def test_optimizer_rejects_invalid_elitism():
    with pytest.raises(ValueError):
        GeneticAlgorithmConfig(elite_rate=0)


def test_optimizer_rejects_invalid_tournament_size():
    with pytest.raises(ValueError):
        GeneticAlgorithmConfig(
            population_size=10,
            tournament_size=11
        )


def test_optimizer_rejects_invalid_seed():
    with pytest.raises(ValueError):
        GeneticAlgorithmConfig(seed=True)


def test_optimizer_rejects_invalid_problem():
    invalid_problem = ProblemInstance(
        cities=("A", "B", "C"),
        cost_matrix=(
            (0, -10, 20),
            (-10, 0, 15),
            (20, 15, 0)
        ),
        symmetric=True,
        start_city=0
    )

    with pytest.raises(ValueError):
        optimize(invalid_problem)


def test_optimizer_rejects_non_config(problem):
    invalid_config = cast(
        GeneticAlgorithmConfig,
        "invalid"
    )

    with pytest.raises(ValueError):
        optimize(problem, invalid_config)