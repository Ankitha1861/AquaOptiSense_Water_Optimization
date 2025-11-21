import wntr
import pandas as pd
import os

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(__file__))
INP_FILE = os.path.join(BASE_DIR, "data", "Bangalore_WDS_Realistic.inp")
WARD_CSV = os.path.join(BASE_DIR, "data", "ward_results.csv")
PIPE_CSV = os.path.join(BASE_DIR, "data", "pipe_results.csv")

print(f"Loading INP: {INP_FILE}")

wn = wntr.network.WaterNetworkModel(INP_FILE)
print("Running hydraulic simulation (this may take some seconds)...")
sim = wntr.sim.EpanetSimulator(wn)
results = sim.run_sim()

# Node (Ward) results
node_results = pd.DataFrame({
    "Node": results.node["pressure"].columns,
    "Pressure(m)": results.node["pressure"].iloc[-1].values,
    "Delivered_m3_s": results.node["demand"].iloc[-1].values,
})
node_results["Delivered_LPS"] = node_results["Delivered_m3_s"] * 1000
node_results.to_csv(WARD_CSV, index=False)
print(f"Saved: {WARD_CSV}")

# Pipe results
pipe_results = pd.DataFrame({
    "Pipe": results.link["flowrate"].columns,
    "Flow_m3_s": results.link["flowrate"].iloc[-1].values,
})
pipe_results["Flow_LPS"] = pipe_results["Flow_m3_s"] * 1000
pipe_results.to_csv(PIPE_CSV, index=False)
print(f"Saved: {PIPE_CSV}")
print("Simulation finished.")
