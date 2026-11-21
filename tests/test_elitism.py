
import pytest

from backend.genetic_algorithm.individual import Individual
from backend.genetic_algorithm.elitism import select_elites


@pytest.fixture
def population():
    return [
        Individual((0, 1, 2, 3)),
        Individual((0, 2, 1, 3)),
        Individual((0, 3, 2, 1)),
        Individual((0, 1, 3, 2)),
        Individual((0, 2, 3, 1)),
    ]


@pytest.fixture
def costs():
    return [100.0, 50.0, 80.0, 30.0, 60.0]


def test_selects_requested_number_of_elites(population, costs):
    elites = select_elites(population, costs, elite_count=2)

    assert len(elites) == 2


def test_elites_are_ordered_by_lowest_cost(population, costs):
    elites = select_elites(population, costs, elite_count=3)

    assert elites == [
        population[3],
        population[1],
        population[4]
    ]


def test_selects_best_individual(population, costs):
    elites = select_elites(population, costs, elite_count=1)

    assert elites[0] == population[3]


def test_selects_entire_population(population, costs):
    elites = select_elites(
        population,
        costs,
        elite_count=len(population)
    )

    assert set(elites) == set(population)


def test_elitism_does_not_modify_population(population, costs):
    original_population = population.copy()
    original_costs = costs.copy()

    select_elites(population, costs, elite_count=2)

    assert population == original_population
    assert costs == original_costs


def test_elites_are_existing_individuals(population, costs):
    elites = select_elites(population, costs, elite_count=3)

    for elite in elites:
        assert any(elite is individual for individual in population)


def test_rejects_empty_population():
    with pytest.raises(ValueError):
        select_elites([], [], elite_count=1)


def test_rejects_different_lengths(population):
    with pytest.raises(ValueError):
        select_elites(population, [10, 20], elite_count=1)


def test_rejects_invalid_elite_count(population, costs):
    with pytest.raises(ValueError):
        select_elites(population, costs, elite_count=0)


def test_rejects_elite_count_larger_than_population(
    population, costs
):
    with pytest.raises(ValueError):
        select_elites(
            population,
            costs,
            elite_count=len(population) + 1
        )


def test_rejects_invalid_cost(population):
    invalid_costs = [100, 50, float("inf"), 30, 60]

    with pytest.raises(ValueError):
        select_elites(population, invalid_costs, elite_count=2)


def test_rejects_negative_cost(population):
    invalid_costs = [100, 50, -10, 30, 60]

    with pytest.raises(ValueError):
        select_elites(population, invalid_costs, elite_count=2)
