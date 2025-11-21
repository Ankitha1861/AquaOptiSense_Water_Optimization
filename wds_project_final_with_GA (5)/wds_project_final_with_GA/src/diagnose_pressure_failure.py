import wntr

def main():
    path = "data/Bangalore_WDS_with_heads.inp"
    print(f"🔍 Diagnosing extreme negative pressure issue in {path}")
    wn = wntr.network.WaterNetworkModel(path)

    # --- Check demands ---
    demands = [j.base_demand for _, j in wn.junctions()]
    print(f"\n📊 Demand stats:")
    print(f"  Min: {min(demands):.4f} m³/s")
    print(f"  Max: {max(demands):.4f} m³/s")
    print(f"  Total: {sum(demands):.2f} m³/s")

    if sum(demands) > 10:
        print("⚠️  Total demand > 10 m³/s — probably wrong units! (Should likely be L/s)")
        print("💡 Try dividing all base demands by 1000 and re-run simulation.")

    # --- Check elevations ---
    elevations = [j.elevation for _, j in wn.junctions()]
    print(f"\n⛰️ Elevation range: {min(elevations):.2f} m – {max(elevations):.2f} m")

    # --- Check for closed pipes ---
    closed_pipes = [p for p_name, p in wn.pipes() if p.status.name == "Closed"]
    if closed_pipes:
        print(f"\n🚧 Closed pipes detected: {[p.name for p in closed_pipes]}")
    else:
        print("\n✅ No closed pipes detected.")

    # --- Check pump/valve elements ---
    if wn.pump_name_list:
        print(f"\n⚙️ Pumps: {wn.pump_name_list}")
    else:
        print("\n❌ No pumps found — may cause lack of flow balance.")

    if wn.valve_name_list:
        print(f"🔧 Valves: {wn.valve_name_list}")
    else:
        print("ℹ️ No valves present (OK if network is simple).")

    print("\n🧩 Diagnosis complete.")

if __name__ == "__main__":
    main()
