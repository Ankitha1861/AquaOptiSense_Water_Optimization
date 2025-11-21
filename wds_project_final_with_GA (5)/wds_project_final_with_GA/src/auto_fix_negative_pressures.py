import wntr
import os

def run_simulation(wn):
    """Run a hydraulic simulation and return the minimum pressure."""
    sim = wntr.sim.EpanetSimulator(wn)
    results = sim.run_sim()
    pressures = results.node['pressure'].min(axis=1)
    return pressures.min()

def main():
    inp_path = "data/Bangalore_WDS_with_heads.inp"
    wn = wntr.network.WaterNetworkModel(inp_path)

    print(f"🔍 Starting auto-fix for: {inp_path}")
    reservoirs = list(wn.reservoir_name_list)
    print(f"Found reservoirs: {reservoirs}")

    # Initial parameters
    step = 50  # increase in meters per iteration
    max_iterations = 15
    iteration = 0

    while iteration < max_iterations:
        iteration += 1
        min_pressure = run_simulation(wn)
        print(f"Iteration {iteration}: Min pressure = {min_pressure:.2f} m")

        if min_pressure > 0:
            print("✅ All pressures are positive — fix complete.")
            break

        # Increase reservoir heads
        for name in reservoirs:
            node = wn.get_node(name)
            if hasattr(node, "base_head"):
                node.base_head += step
            else:
                # Fallback (older versions)
                try:
                    node.head = node.head + step
                except Exception:
                    pass

        print(f"⬆️  Increased all reservoir heads by {step} m")

    # Save the new INP file
    fixed_path = os.path.join("data", "Bangalore_WDS_final_fixed.inp")
    try:
        wntr.network.io.write_inpfile(wn, fixed_path)
        print(f"\n💾 Saved updated network → {fixed_path}")
    except Exception as e:
        print(f"❌ Failed to save INP file: {e}")

if __name__ == "__main__":
    main()
