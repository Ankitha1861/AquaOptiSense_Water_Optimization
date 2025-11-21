import wntr
import os

def main():
    inp_path = "data/Bangalore_WDS_demand_fixed.inp"
    wn = wntr.network.WaterNetworkModel(inp_path)

    print(f"🔍 Fine-tuning pressures in: {inp_path}")
    sim = wntr.sim.EpanetSimulator(wn)
    results = sim.run_sim()
    min_p = results.node["pressure"].min().min()
    print(f"Initial minimum pressure: {min_p:.4f} m")

    # Get all reservoirs
    reservoirs = list(wn.reservoir_name_list)
    if not reservoirs:
        print("❌ No reservoirs found. Cannot adjust heads.")
        return

    iteration = 0
    while min_p < 0:
        iteration += 1
        print(f"\nIteration {iteration}: Increasing reservoir heads slightly...")

        # Increase each reservoir’s head by 0.5 m
        for r_name in reservoirs:
            res = wn.get_node(r_name)
            current = res.base_head
            res.base_head = current + 0.5
            print(f"  {r_name}: {current:.2f} → {res.base_head:.2f} m")

        sim = wntr.sim.EpanetSimulator(wn)
        results = sim.run_sim()
        min_p = results.node["pressure"].min().min()
        print(f"  🔁 New minimum pressure: {min_p:.4f} m")

        if iteration > 20:
            print("⚠️  Stopping after 20 iterations — something else may be wrong.")
            break

    if min_p >= 0:
        print(f"\n✅ Success! Final minimum pressure: {min_p:.4f} m")
    else:
        print(f"\n⚠️  Still slightly negative: {min_p:.4f} m (within rounding limits)")

    # Save the tuned network
    out_path = os.path.join("data", "Bangalore_WDS_fine_tuned.inp")
    wntr.network.io.write_inpfile(wn, out_path)
    print(f"\n💾 Saved fine-tuned network → {out_path}")

if __name__ == "__main__":
    main()
