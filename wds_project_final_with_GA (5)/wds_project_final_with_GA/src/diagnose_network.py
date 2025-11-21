import wntr
import pandas as pd

# 👇 Change this to the file you're using
inp_file = r"data\Bangalore_WDS_Realistic_fixed_heads.inp"

wn = wntr.network.WaterNetworkModel(inp_file)

print("✅ Loaded:", inp_file)
print("Nodes:", len(wn.junction_name_list), " | Pipes:", len(wn.pipe_name_list))
print()

# --- Check reservoirs ---
for r in wn.reservoir_name_list:
    res = wn.get_node(r)
    print(f"Reservoir {r}: head={res.head}")

# --- Check tanks ---
for t in wn.tank_name_list:
    tank = wn.get_node(t)
    print(f"Tank {t}: elev={tank.elevation}, init={tank.init_level}, min={tank.min_level}, max={tank.max_level}")

print("\n--- Checking node elevations (extremes) ---")
elevs = [wn.get_node(n).elevation for n in wn.junction_name_list]
print("Min elevation:", min(elevs), "m")
print("Max elevation:", max(elevs), "m")

# --- Run a hydraulic simulation ---
print("\nRunning hydraulic simulation...")
sim = wntr.sim.EpanetSimulator(wn)
results = sim.run_sim()

pressure = results.node["pressure"]
min_p = pressure.min().min()
max_p = pressure.max().max()

print("\n✅ Hydraulic simulation complete.")
print(f"Minimum pressure found: {min_p:.3f} m")
print(f"Maximum pressure found: {max_p:.3f} m")

# --- Show the 10 lowest pressure nodes ---
low_press = pressure.min().sort_values().head(10)
print("\n10 lowest-pressure nodes (worst cases):")
print(low_press)
