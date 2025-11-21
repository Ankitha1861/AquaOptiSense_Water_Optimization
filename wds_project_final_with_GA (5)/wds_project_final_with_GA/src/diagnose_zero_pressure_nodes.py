import sys
import wntr
import pandas as pd

def diagnose_zero_pressure_nodes(inp_file, threshold=1.0):
    print(f"🔍 Loading network model from: {inp_file}")
    wn = wntr.network.WaterNetworkModel(inp_file)

    # Run hydraulic simulation
    sim = wntr.sim.EpanetSimulator(wn)
    results = sim.run_sim()

    # Extract node pressures and heads
    pressure = results.node['pressure'].iloc[-1]
    head = results.node['head'].iloc[-1]

    # Gather elevations safely
    elevations = {}
    for name, node in wn.nodes():
        if hasattr(node, "elevation"):
            elevations[name] = node.elevation
        else:
            elevations[name] = None

    # Combine into a single DataFrame
    df = pd.DataFrame({
        'Elevation_m': elevations,
        'Head_m': head,
        'Pressure_m': pressure
    })
    df['Pressure_m'] = df['Pressure_m'].fillna(0)

    # Find nodes with zero or near-zero pressure
    low_pressure_nodes = df[df['Pressure_m'] <= threshold]
    print(f"\n⚠️ Found {len(low_pressure_nodes)} nodes with pressure ≤ {threshold} m")

    if not low_pressure_nodes.empty:
        print(low_pressure_nodes.head(15))
        low_pressure_nodes.to_csv('reports/zero_pressure_nodes.csv')
        print("\n💾 Saved details to reports/zero_pressure_nodes.csv")
    else:
        print("✅ No nodes with zero or low pressure found!")

    # Additional context for debugging
    print("\n--- Network Summary ---")
    print(f"Total nodes: {len(wn.node_name_list)}")
    print(f"Total reservoirs: {len(wn.reservoir_name_list)}")
    print(f"Total tanks: {len(wn.tank_name_list)}")
    print(f"Total pipes: {len(wn.pipe_name_list)}")

    print("\nDone ✅")


def main():
    if len(sys.argv) < 2:
        print("Usage: python src/diagnose_zero_pressure_nodes.py <inp_file> [threshold_m]")
        sys.exit(1)

    inp_file = sys.argv[1]
    threshold = float(sys.argv[2]) if len(sys.argv) > 2 else 1.0

    diagnose_zero_pressure_nodes(inp_file, threshold)


if __name__ == "__main__":
    main()
