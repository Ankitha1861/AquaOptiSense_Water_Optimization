import wntr
import os

def main():
    inp_path = "data/Bangalore_WDS_Realistic_fixed_adjusted_target100m.inp"
    fixed_path = "data/Bangalore_WDS_with_heads.inp"

    print(f"🔍 Loading network from: {inp_path}")
    wn = wntr.network.WaterNetworkModel(inp_path)

    reservoirs = [name for name, _ in wn.reservoirs()]
    print(f"Found reservoirs: {reservoirs}")

    # --- Assign realistic head values ---
    head_values = {
        "Reservoir1": 850,
        "Reservoir2": 830,
        "Reservoir3": 810,
        "Borewell1": 800,
        "Borewell2": 795,
    }

    for r_name in reservoirs:
        node = wn.get_node(r_name)
        new_head = head_values.get(r_name, 800)
        try:
            node.base_head = new_head
            print(f"✅ Set {r_name} base_head = {new_head} m")
        except Exception as e:
            print(f"⚠️ Could not set head for {r_name}: {e}")

    # --- Save using the modern WNTR I/O system ---
    try:
        from wntr.network.io import write_inpfile
        write_inpfile(wn, fixed_path)
        print(f"\n💾 Saved fixed INP file with heads → {os.path.abspath(fixed_path)}")
    except Exception as e:
        print(f"❌ Failed to write INP file: {e}")
        return

    # --- Verify ---
    print("\n🧠 Final reservoir heads:")
    for name, r in wn.reservoirs():
        print(f"  {name}: {r.base_head}")

if __name__ == "__main__":
    main()
