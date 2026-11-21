
import random
import pytest
from typing import cast

from backend.genetic_algorithm.individual import Individual
from backend.genetic_algorithm.mutation import swap_mutation


@pytest.fixture
def individual():
    return Individual((0, 1, 2, 3, 4, 5))


def test_mutation_returns_individual(individual):
    mutated = swap_mutation(
        individual,
        rng=random.Random(42)
    )

    assert isinstance(mutated, Individual)


def test_mutation_preserves_all_cities(individual):
    mutated = swap_mutation(
        individual,
        rng=random.Random(42)
    )

    assert set(mutated.route) == set(individual.route)
    assert len(mutated.route) == len(individual.route)
    assert len(set(mutated.route)) == len(mutated.route)


def test_mutation_preserves_start_city(individual):
    mutated = swap_mutation(
        individual,
        rng=random.Random(42)
    )

    assert mutated.route[0] == individual.route[0]


def test_mutation_changes_route(individual):
    mutated = swap_mutation(
        individual,
        rng=random.Random(42)
    )

    assert mutated.route != individual.route


def test_mutation_is_reproducible(individual):
    mutated_a = swap_mutation(
        individual,
        rng=random.Random(123)
    )

    mutated_b = swap_mutation(
        individual,
        rng=random.Random(123)
    )

    assert mutated_a == mutated_b


def test_mutation_does_not_modify_original(individual):
    original_route = individual.route

    swap_mutation(
        individual,
        rng=random.Random(42)
    )

    assert individual.route == original_route


def test_mutation_with_three_cities():
    individual = Individual((0, 1, 2))

    mutated = swap_mutation(
        individual,
        rng=random.Random(42)
    )

    assert mutated.route[0] == 0
    assert set(mutated.route) == {0, 1, 2}
    assert mutated.route != individual.route


def test_mutation_rejects_invalid_individual():
    individual = Individual((0, 1, 1, 3))

    with pytest.raises(ValueError):
        swap_mutation(individual)


def test_mutation_rejects_too_few_cities():
    individual = Individual((0, 1))

    with pytest.raises(ValueError):
        swap_mutation(individual)


def test_mutation_rejects_non_individual():
    invalid_individual = cast(
        Individual,
        (0, 1, 2, 3)
    )

    with pytest.raises(ValueError):
        swap_mutation(invalid_individual)
