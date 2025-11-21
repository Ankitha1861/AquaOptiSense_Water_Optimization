import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import random
import os

# === PARAMETERS ===
POP_SIZE = 8
GENERATIONS = 20  # Increased from 5 to 20 for better optimization
MUTATION_RATE = 0.2

REPORT_PATH = "reports/optimized_summary.csv"

# === OBJECTIVE FUNCTION (EXAMPLE) ===
def evaluate_candidate(candidate):
    """Simulate objective value for a candidate solution."""
    # These are placeholders; replace with real hydraulic simulation later
    total_delivered_LPS = 355959.22  # constant for demo
    total_demand_LPS = 355959.20
    unserved_m3_day = 0.0
    total_capex = sum(candidate) * 1e6

    obj_value = total_capex  # minimize total cost
    return obj_value, {
        "total_delivered_LPS": total_delivered_LPS,
        "total_demand_LPS": total_demand_LPS,
        "unserved_m3_day": unserved_m3_day,
        "total_capex": total_capex,
    }

# === INITIAL POPULATION ===
def init_population():
    return [np.random.randint(100, 200, 10) for _ in range(POP_SIZE)]

# === SELECTION ===
def select_parents(population, fitnesses):
    # Convert numpy arrays to lists for safe sorting
    pop_as_lists = [p.tolist() if isinstance(p, np.ndarray) else p for p in population]
    sorted_pairs = sorted(zip(fitnesses, pop_as_lists), key=lambda x: x[0])
    sorted_pop = [x[1] for x in sorted_pairs]
    return sorted_pop[:2]  # select top 2


# === CROSSOVER ===
def crossover(parent1, parent2):
    point = random.randint(1, len(parent1) - 1)
    child1 = np.concatenate((parent1[:point], parent2[point:]))
    child2 = np.concatenate((parent2[:point], parent1[point:]))
    return child1, child2

# === MUTATION ===
def mutate(candidate):
    for i in range(len(candidate)):
        if random.random() < MUTATION_RATE:
            candidate[i] += random.randint(-10, 10)
    return candidate

# === MAIN GA LOOP ===
def run_ga():
    population = init_population()
    best_history = []

    for gen in range(GENERATIONS):
        fitnesses = []
        diagnostics_list = []

        # Evaluate all candidates
        for candidate in population:
            obj, diag = evaluate_candidate(candidate)
            fitnesses.append(obj)
            diagnostics_list.append(diag)
            print(f"Evaluated candidate: obj={obj:.2f}, delivered_LPS={diag['total_delivered_LPS']:.2f}")

        # Select best
        best_idx = np.argmin(fitnesses)
        best_obj = fitnesses[best_idx]
        best_diag = diagnostics_list[best_idx]
        best_history.append(best_obj)

        print(f"Generation {gen+1}/{GENERATIONS}: Best obj = {best_obj:.2f} delivered LPS = {best_diag['total_delivered_LPS']:.2f}")

        # Selection, crossover, mutation
        parents = select_parents(population, fitnesses)
        new_population = []
        while len(new_population) < POP_SIZE:
            child1, child2 = crossover(*parents)
            new_population.extend([mutate(child1), mutate(child2)])
        population = new_population[:POP_SIZE]

    # Save best result
    df = pd.DataFrame([{
        "Best_Objective": best_obj,
        **best_diag
    }])
    os.makedirs("reports", exist_ok=True)
    df.to_csv(REPORT_PATH, index=False)
    print(f"✅ Optimization complete. Results saved to: {REPORT_PATH}")
    print(f"Best objective: {best_obj}")
    print(f"Best diagnostics: {best_diag}")

    # === Plot improvement ===
    plt.figure(figsize=(8, 5))
    plt.plot(range(1, GENERATIONS+1), best_history, marker='o', color='blue')
    plt.title("GA Optimization Progress")
    plt.xlabel("Generation")
    plt.ylabel("Best Objective (Cost)")
    plt.grid(True)
    plt.tight_layout()
    plt.show()

if __name__ == "__main__":
    run_ga()
