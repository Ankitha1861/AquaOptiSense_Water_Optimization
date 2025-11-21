import sys
import wntr

def check_hydraulic_status(inp_file):
    print(f"🔍 Checking hydraulic convergence for: {inp_file}")

    try:
        # Load network
        wn = wntr.network.WaterNetworkModel(inp_file)

        # Run hydraulic simulation
        sim = wntr.sim.EpanetSimulator(wn)
        results = sim.run_sim()

        # Extract pressures
        pressure = results.node["pressure"]
        min_pressure = pressure.min().min()
        max_pressure = pressure.max().max()

        print(f"✅ Simulation finished.")
        print(f"📊 Pressure range: {min_pressure:.2f} m – {max_pressure:.2f} m")

        # Allow a small tolerance for numerical rounding
        tolerance = -0.1

        if min_pressure < tolerance:
            print("⚠️ Negative pressures detected (hydraulic imbalance).")
        else:
            print("✅ Network is hydraulically stable (no significant negative pressures).")

    except Exception as e:
        print(f"❌ Error: {e}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python src/check_hydraulic_status.py <path_to_inp_file>")
        sys.exit(1)

    inp_file = sys.argv[1]
    check_hydraulic_status(inp_file)
