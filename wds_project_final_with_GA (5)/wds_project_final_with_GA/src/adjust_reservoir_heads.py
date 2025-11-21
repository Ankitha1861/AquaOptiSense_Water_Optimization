# src/adjust_reservoir_heads.py
"""
Adjust reservoir heads to be (downstream_junction_elevation + target_pressure_m).
Writes a new INP file next to the original with suffix _adjusted.inp.

Usage:
    python src/adjust_reservoir_heads.py data/Bangalore_WDS_Realistic_fixed.inp 20

The second argument (20) is the target_supply_pressure in meters (default 20 m).
"""

import sys
from pathlib import Path
import re

def parse_section(lines, name):
    """Return start, end indices and section lines (excluding header)."""
    start = None
    for i,l in enumerate(lines):
        if l.strip().upper() == f"[{name}]":
            start = i
            break
    if start is None:
        return None, None, []
    # find next section or EOF
    end = len(lines)
    for j in range(start+1, len(lines)):
        if re.match(r'^\s*\[.+\]\s*$', lines[j]):
            end = j
            break
    sec_lines = lines[start+1:end]
    return start, end, sec_lines

def main():
    if len(sys.argv) < 2:
        print("Usage: python src/adjust_reservoir_heads.py <inp_path> [target_pressure_m]")
        sys.exit(1)

    inp_path = Path(sys.argv[1])
    if not inp_path.exists():
        print("File not found:", inp_path)
        sys.exit(1)

    target_pressure = float(sys.argv[2]) if len(sys.argv) >= 3 else 20.0

    text = inp_path.read_text(encoding='utf-8', errors='replace')
    lines = text.splitlines()

    # parse JUNCTIONS
    s_j, e_j, j_lines = parse_section(lines, "JUNCTIONS")
    if s_j is None:
        print("No [JUNCTIONS] section found.")
        sys.exit(1)

    # build dict of junction elevations (ID -> elevation)
    j_elev = {}
    for raw in j_lines:
        ln = raw.strip()
        if ln == "" or ln.startswith(';'):
            continue
        # split by whitespace; EPANET lines can contain inline comments after ';'
        parts = ln.split(';')[0].split()
        # Expect at least ID and elevation and demand
        if len(parts) >= 2:
            node_id = parts[0]
            try:
                elev = float(parts[1])
            except:
                elev = None
            j_elev[node_id] = elev

    # parse PIPES to find mapping reservoir -> first downstream junction
    s_p, e_p, p_lines = parse_section(lines, "PIPES")
    if s_p is None:
        print("No [PIPES] section found.")
        sys.exit(1)

    # look for pipe names with pattern P_<ReservoirName>_<Jnn>
    # also capture pipes where reservoir appears as node1 or node2
    reservoir_to_junction = {}

    for raw in p_lines:
        ln = raw.strip()
        if ln == "" or ln.startswith(';'):
            continue
        # get tokens
        tokens = ln.split(';')[0].split()
        if len(tokens) < 3:
            continue
        pid = tokens[0]
        n1 = tokens[1]
        n2 = tokens[2]
        # If n1 or n2 is a reservoir (name starts with 'Reservoir' or 'Borewell'), record mapping
        for reservoir_candidate in [n1, n2]:
            if reservoir_candidate.lower().startswith("reservoir") or reservoir_candidate.lower().startswith("borewell"):
                # the other node is likely the junction
                other = n2 if reservoir_candidate == n1 else n1
                # ensure other looks like a junction (J...)
                if other.upper().startswith("J"):
                    if reservoir_candidate not in reservoir_to_junction:
                        reservoir_to_junction[reservoir_candidate] = other

    # parse RESERVOIRS section
    s_r, e_r, r_lines = parse_section(lines, "RESERVOIRS")
    if s_r is None:
        print("No [RESERVOIRS] section found.")
        sys.exit(1)

    # prepare to modify reservoir heads
    new_lines = lines.copy()

    updated = []
    for idx, raw in enumerate(r_lines):
        ln_idx = s_r + 1 + idx
        ln = raw.rstrip("\n")
        if ln.strip() == "" or ln.strip().startswith(';'):
            continue
        # tokens before inline comment
        main = ln.split(';')[0]
        tokens = main.split()
        if len(tokens) == 0:
            continue
        # tokens: ID <head> <pattern?> — head usually tokens[1]
        rid = tokens[0]
        # find the downstream junction for this reservoir
        downstream = reservoir_to_junction.get(rid)
        if downstream and downstream in j_elev and j_elev[downstream] is not None:
            elev = j_elev[downstream]
            desired_head = elev + target_pressure
            # Rebuild the line: keep spacing up to head column by replacing head token
            # We'll perform a regex substitution of the first numeric after the ID
            new_ln = None
            # try to replace the first numeric in the line after the ID
            m = re.match(r'^(\s*' + re.escape(rid) + r'\s+)([-+]?\d*\.?\d+(?:[Ee][-+]?\d+)?)(.*)$', ln)
            if m:
                pre = m.group(1)
                _ = m.group(2)
                post = m.group(3)
                new_ln = f"{pre}{desired_head:.6f}{post}"
            else:
                # fallback: append desired head
                new_ln = f"{rid}    {desired_head:.6f}    ;"
            new_lines[ln_idx] = new_ln + ("\n" if not new_ln.endswith("\n") else "")
            updated.append((rid, downstream, elev, desired_head))
        else:
            # no downstream mapping found: skip (preserve original)
            continue

    # write adjusted file
    out_path = inp_path.with_name(inp_path.stem + f"_adjusted_target{int(target_pressure)}m.inp")
    out_path.write_text("\n".join(new_lines), encoding='utf-8')

    # print before/after summary
    if updated:
        print("Updated reservoir heads (reservoir, downstream_junction, junction_elev_m, new_reservoir_head_m):")
        for u in updated:
            print(f"  {u[0]}  ->  {u[1]}  : elev={u[2]}  -> new_head={u[3]:.3f}")
        print("\nWrote adjusted INP to:", out_path)
    else:
        print("No reservoir->junction mapping found. No changes made. Check PIPES entries or reservoir names.")

if __name__ == "__main__":
    main()
