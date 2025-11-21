import pandas as pd

# Load both reports
checked_path = "reports/final_water_report_checked.csv"
optimized_path = "reports/final_water_report_optimized.csv"

try:
    checked = pd.read_csv(checked_path)
    optimized = pd.read_csv(optimized_path)
    print("✅ Reports loaded successfully!\n")
except FileNotFoundError:
    print("❌ Could not find one or both report files.")
    exit()

# Make sure ward names align properly
wards = set(checked["Ward Name"]).intersection(set(optimized["Ward Name"]))
print(f"🔹 Found {len(wards)} matching wards.\n")

# Compare each ward
for ward in sorted(wards):
    c_row = checked[checked["Ward Name"] == ward].iloc[0]
    o_row = optimized[optimized["Ward Name"] == ward].iloc[0]

    # Check if any key values differ
    diffs = {}
    for col in ["Pressure(m)", "Supplied_LPS", "Shortage_LPS", "Shortage_pct", "Leakage_pct", "Explanation"]:
        if col in c_row and col in o_row:
            if str(c_row[col]) != str(o_row[col]):
                diffs[col] = (c_row[col], o_row[col])

    if diffs:
        print(f"⚠️  Ward: {ward}")
        for key, (before, after) in diffs.items():
            print(f"   - {key}: {before}  →  {after}")
        print("-" * 80)

print("\n✅ Comparison complete.")
