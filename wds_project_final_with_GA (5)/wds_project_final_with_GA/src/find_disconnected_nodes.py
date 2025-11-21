import sys
import wntr
import networkx as nx

def main():
    if len(sys.argv) < 2:
        print("Usage: python find_disconnected_nodes.py <inp_file>")
        sys.exit(1)

    inp_file = sys.argv[1]
    print(f"🔍 Loading network from: {inp_file}")

    # Load network
    wn = wntr.network.WaterNetworkModel(inp_file)
    G_directed = wn.to_graph()  # Directed graph (by default)
    G = G_directed.to_undirected()  # ✅ Convert to undirected for connectivity

    # Get reservoir names properly
    reservoirs = [name for name, _ in wn.reservoirs()]
    print(f"Found reservoirs: {reservoirs}")

    # Use NetworkX connected components
    connected_components = list(nx.connected_components(G))
    print(f"Total connected components: {len(connected_components)}")

    # Identify components containing reservoirs
    reservoir_components = [
        comp for comp in connected_components if any(r in comp for r in reservoirs)
    ]
    reservoir_nodes = set().union(*reservoir_components)

    # Find disconnected junctions
    disconnected_nodes = [name for name, _ in wn.junctions() if name not in reservoir_nodes]

    if disconnected_nodes:
        print(f"⚠️ Disconnected nodes (not linked to any reservoir): {len(disconnected_nodes)}")
        for n in disconnected_nodes[:30]:
            print("  ", n)
        if len(disconnected_nodes) > 30:
            print(f"  ... and {len(disconnected_nodes)-30} more")
    else:
        print("✅ All junctions are connected to at least one reservoir.")

if __name__ == "__main__":
    main()
