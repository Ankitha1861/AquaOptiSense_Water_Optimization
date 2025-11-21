import wntr
import os

def save_inpfile(wn, output_path):
    """Save INP file safely for all WNTR versions."""
    try:
        # 🧩 Newer WNTR (≥0.5)
        wntr.network.io.write_inpfile(wn, output_path)
        print(f"💾 Saved scaled-down network → {output_path}")
    except Exception:
        try:
            # 🧩 Older WNTR (≤0.4)
            from wntr.network import io
            io.write_inpfile(wn, output_path)
            print(f"💾 Saved scaled-down network → {output_path}")
        except Exception as e:
            print(f"❌ Failed to save INP file: {e}")

def main():
    input_path = "data/Bangalore_WDS_with_heads.inp"
    output_path = "data/Bangalore_WDS_demand_fixed.inp"

    print(f"🔧 Loading network from: {input_path}")
    wn = wntr.network.WaterNetworkModel(input_path)

    # --- Scale junction demands ---
    count = 0
    for j_name, j in wn.junctions():
        if j.demand_timeseries_list:
            old = j.demand_timeseries_list[0].base_value
            if old > 0:
                j.demand_timeseries_list[0].base_value = old / 1000.0
                count += 1
    print(f"✅ Scaled {count} junction demands by 1/1000")

    # --- Save network ---
    save_inpfile(wn, output_path)

    # --- Quick hydraulic simulation ---
    print("\n🚰 Running quick hydraulic check...")
    sim = wntr.sim.EpanetSimulator(wn)
    results = sim.run_sim()
    min_p = results.node["pressure"].min().min()
    max_p = results.node["pressure"].max().max()
    print(f"📈 Pressure range after scaling: {min_p:.2f} m – {max_p:.2f} m")
    if min_p < 0:
        print("⚠️ Still some negative pressures — further tuning may be needed.")
    else:
        print("✅ All pressures positive — network hydraulically stable!")

if __name__ == "__main__":
    main()
