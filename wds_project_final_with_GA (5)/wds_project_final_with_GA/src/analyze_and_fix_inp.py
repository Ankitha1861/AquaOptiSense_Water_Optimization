import sys
import wntr
import pandas as pd
import numpy as np

def run_hydraulic(inp_path):
    """Run hydraulic simulation and extract results"""
    wn = wntr.network.WaterNetworkModel(inp_path)
    sim = wntr.sim.EpanetSimulator(wn)
    results = sim.run_sim()

    pressures = results.node['pressure']
    demands = results.node['demand']

    # Not all networks have 'inflow' — handle safely
    inflow = results.node.get('inflow', demands.copy())

    # Find time of peak demand
    time_of_peak = demands.sum(axis=1).idxmax()

    snapshot = {
        'time': time_of_peak,
        'pressure': pressures.loc[time_of_peak],
        'demand': demands.loc[time_of_peak],
        'inflow': inflow.loc[time_of_peak],
    }
    return wn, results, snapshot


def summarize_nodes(wn, snapshot):
    """Summarize node data into a dataframe"""
    rows = []
    for name, node in wn.nodes():
        if node.node_type.lower() != 'junction':
            continue

        d = float(snapshot['demand'].get(name, 0.0))
        p = float(snapshot['pressure'].get(name, np.nan))
        q_in = float(snapshot['inflow'].get(name, 0.0))

        rows.append({
            'node': name,
            'demand_LPS': d,
            'pressure_m': p,
            'inflow_LPS': q_in,
            'shortage_LPS': max(d - q_in, 0)
        })

    return pd.DataFrame(rows)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python src\\analyze_and_fix_inp.py <input_file.inp>")
        sys.exit(1)

    inp_path = sys.argv[1]
    print(f"🔹 Running analysis on: {inp_path}")

    try:
        wn, results, snapshot = run_hydraulic(inp_path)
        df = summarize_nodes(wn, snapshot)

        print("\n📊 Sample of pressures (first 10 nodes):")
        print(df[['node', 'pressure_m']].head(10))

        min_p = df['pressure_m'].min()
        neg_nodes = df[df['pressure_m'] < 0]

        print(f"\n🔻 Minimum pressure: {min_p:.2f} m")

        if not neg_nodes.empty:
            print("\n⚠️ Nodes with negative pressure:")
            print(neg_nodes[['node', 'pressure_m']])
        else:
            print("\n✅ All nodes have positive pressure!")

        output_csv = "reports/network_pressure_summary.csv"
        df.to_csv(output_csv, index=False)
        print(f"\n✅ Summary saved to: {output_csv}")

    except Exception as e:
        print(f"\n❌ Error during analysis: {e}")
