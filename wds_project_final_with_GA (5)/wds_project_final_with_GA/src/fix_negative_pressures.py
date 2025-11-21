import wntr
import pandas as pd
from pathlib import Path

def fix_negative_pressures(inp_path, output_path, max_iterations=10):
    print(f"🔹 Loading model: {inp_path}")
    wn = wntr.network.WaterNetworkModel(inp_path)

    for iteration in range(max_iterations):
        sim = wntr.sim.EpanetSimulator(wn)
        results = sim.run_sim()
        pressures = results.node["pressure"]
        min_pressure = pressures.min().min()
        print(f"🔁 Iteration {iteration+1}: Minimum pressure = {min_pressure:.2f} m")

        if min_pressure >= 0:
            print("✅ All pressures are positive now!")
            break

        # Slightly increase reservoir heads
        for reservoir_name, reservoir in wn.reservoirs():
            old_head = reservoir.head_timeseries.base_value
            reservoir.head_timeseries.base_value = old_head + abs(min_pressure) * 0.1

        # Slightly increase pump head curve
        for pump_name, pump in wn.pumps():
            curve = wn.get_curve(pump.head_curve_name)
            curve.points = [(x, y * 1.02) for x, y in curve.points]

    # ✅ Universal safe writer (handles all WNTR versions)
    try:
        wn.write_inpfile(str(output_path))
    except Exception:
        try:
            from wntr.network.io import write_inpfile
            write_inpfile(wn, str(output_path))
        except Exception:
            from wntr.network import write_inpfile
            write_inpfile(wn, str(output_path))

    print(f"\n✅ Fixed .inp file saved as: {output_path}")

    # Save pressure summary
    pressure_df = pressures.describe().transpose()
    Path("reports").mkdir(exist_ok=True)
    pressure_df.to_csv("reports/fixed_pressure_summary.csv")
    print("📊 Summary saved to: reports/fixed_pressure_summary.csv")


if __name__ == "__main__":
    import sys
    if len(sys.argv) != 2:
        print("Usage: python src\\fix_negative_pressures.py data\\Bangalore_WDS_Realistic.inp")
        sys.exit(1)

    inp_path = Path(sys.argv[1])
    output_path = inp_path.parent / (inp_path.stem + "_fixed.inp")

    try:
        fix_negative_pressures(str(inp_path), str(output_path))
    except Exception as e:
        print(f"❌ Error: {e}")
