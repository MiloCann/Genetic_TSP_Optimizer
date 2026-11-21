
import random
import pytest

from backend.genetic_algorithm.individual import Individual
from backend.genetic_algorithm.selection import tournament_selection


@pytest.fixture
def population():
    return [
        Individual((0, 1, 2, 3)),
        Individual((0, 2, 1, 3)),
        Individual((0, 3, 2, 1)),
        Individual((0, 1, 3, 2)),
    ]


@pytest.fixture
def costs():
    return [100.0, 80.0, 120.0, 60.0]


def test_tournament_selects_best_when_all_participate(
    population, costs
):
    winner = tournament_selection(
        population,
        costs,
        tournament_size=4,
        rng=random.Random(42)
    )

    assert winner == population[3]


def test_tournament_size_one_returns_a_population_member(
    population, costs
):
    winner = tournament_selection(
        population,
        costs,
        tournament_size=1,
        rng=random.Random(42)
    )

    assert winner in population


def test_tournament_returns_existing_individual(
    population, costs
):
    winner = tournament_selection(
        population,
        costs,
        rng=random.Random(42)
    )

    assert winner in population


def test_selection_is_reproducible(population, costs):
    winner_a = tournament_selection(
        population,
        costs,
        rng=random.Random(123)
    )

    winner_b = tournament_selection(
        population,
        costs,
        rng=random.Random(123)
    )

    assert winner_a == winner_b


def test_selection_does_not_modify_population(
    population, costs
):
    original_population = population.copy()
    original_costs = costs.copy()

    tournament_selection(
        population,
        costs,
        rng=random.Random(42)
    )

    assert population == original_population
    assert costs == original_costs


def test_selection_rejects_empty_population():
    with pytest.raises(ValueError):
        tournament_selection([], [])


def test_selection_rejects_different_lengths(population):
    with pytest.raises(ValueError):
        tournament_selection(population, [10, 20])


def test_selection_rejects_invalid_tournament_size(
    population, costs
):
    with pytest.raises(ValueError):
        tournament_selection(
            population,
            costs,
            tournament_size=0
        )


def test_selection_rejects_tournament_larger_than_population(
    population, costs
):
    with pytest.raises(ValueError):
        tournament_selection(
            population,
            costs,
            tournament_size=5
        )


def test_selection_rejects_invalid_cost(population):
    with pytest.raises(ValueError):
        tournament_selection(
            population,
            [100, 80, float("inf"), 60]
        )
