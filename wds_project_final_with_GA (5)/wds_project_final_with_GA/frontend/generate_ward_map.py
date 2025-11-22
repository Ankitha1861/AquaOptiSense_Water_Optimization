#!/usr/bin/env python3
"""
Generate interactive ward map using Folium
Shows all 198 wards with demand vs supply metrics
"""

import json
import folium
from folium import GeoJson, GeoJsonTooltip

# File paths
GEOJSON_FILE = "client/public/BBMP.geojson"
WARD_DATA_FILE = "client/public/ward-data.json"
OUTPUT_FILE = "client/public/ward_map.html"


def normalize_ward_name(name):
    """Normalize ward names for matching"""
    return name.lower().replace(".", "").replace("  ", " ").strip()


def load_data():
    """Load GeoJSON and ward data"""
    print("📂 Loading data files...")

    with open(GEOJSON_FILE, "r", encoding="utf-8") as f:
        geojson_data = json.load(f)

    with open(WARD_DATA_FILE, "r", encoding="utf-8") as f:
        ward_data = json.load(f)

    # Create lookup dictionary
    ward_lookup = {}
    for ward in ward_data:
        normalized = normalize_ward_name(ward["name"])
        ward_lookup[normalized] = ward

    print(f"✅ Loaded {len(geojson_data['features'])} GeoJSON features")
    print(f"✅ Loaded {len(ward_data)} ward data entries")

    return geojson_data, ward_lookup


def get_ward_color(ward_data, metric="supplyDemand"):
    """Get color based on metric"""
    after = ward_data["after"]
    before = ward_data["before"]

    if metric == "supplyDemand":
        ratio = (after["supply"] / after["demand"]) * 100
        if ratio >= 98:
            return "#10b981"  # Green
        elif ratio >= 95:
            return "#22c55e"  # Light green
        elif ratio >= 90:
            return "#f59e0b"  # Orange
        elif ratio >= 85:
            return "#fb923c"  # Light orange
        else:
            return "#ef4444"  # Red

    elif metric == "shortage":
        shortage = after["shortage_pct"]
        if shortage < 2:
            return "#10b981"
        elif shortage < 5:
            return "#22c55e"
        elif shortage < 10:
            return "#f59e0b"
        else:
            return "#ef4444"

    elif metric == "pressure":
        improvement = after["pressure"] - before["pressure"]
        if improvement > 2:
            return "#10b981"
        elif improvement > 0:
            return "#22c55e"
        elif improvement > -1:
            return "#f59e0b"
        else:
            return "#ef4444"

    return "#3b82f6"  # Default blue


def create_popup_html(ward_name, ward_data):
    """Create HTML popup content"""
    after = ward_data["after"]
    before = ward_data["before"]

    supply_demand_ratio = (after["supply"] / after["demand"]) * 100
    shortage_improvement = before["shortage_pct"] - after["shortage_pct"]
    pressure_improvement = after["pressure"] - before["pressure"]
    supply_improvement = after["supply"] - before["supply"]

    html = f"""
    <div style="font-family: Arial, sans-serif; width: 320px; padding: 10px;">
        <h3 style="margin: 0 0 10px 0; color: #1e293b; border-bottom: 2px solid #3b82f6; padding-bottom: 5px;">
            {ward_name}
        </h3>

        <div style="background: #f1f5f9; padding: 8px; border-radius: 6px; margin-bottom: 8px;">
            <strong style="color: #0ea5e9;">📊 Demand vs Supply</strong><br>
            <table style="width: 100%; font-size: 12px; margin-top: 5px;">
                <tr>
                    <td>Demand:</td>
                    <td style="text-align: right;"><strong>{after["demand"]:.2f} LPS</strong></td>
                </tr>
                <tr>
                    <td>Supply (After):</td>
                    <td style="text-align: right; color: #10b981;"><strong>{after["supply"]:.2f} LPS</strong></td>
                </tr>
                <tr style="border-top: 1px solid #cbd5e1;">
                    <td>Ratio:</td>
                    <td style="text-align: right; color: #6366f1;"><strong>{supply_demand_ratio:.2f}%</strong></td>
                </tr>
            </table>
        </div>

        <div style="background: #fef3c7; padding: 8px; border-radius: 6px; margin-bottom: 8px;">
            <strong style="color: #f59e0b;">💧 Water Shortage</strong><br>
            <table style="width: 100%; font-size: 12px; margin-top: 5px;">
                <tr>
                    <td>Before:</td>
                    <td style="text-align: right;">{before["shortage_pct"]:.2f}%</td>
                </tr>
                <tr>
                    <td>After:</td>
                    <td style="text-align: right; color: #10b981;"><strong>{after["shortage_pct"]:.2f}%</strong></td>
                </tr>
                <tr style="border-top: 1px solid #fbbf24;">
                    <td>Improvement:</td>
                    <td style="text-align: right; color: #059669;"><strong>↓ {shortage_improvement:.2f} pp</strong></td>
                </tr>
            </table>
        </div>

        <div style="background: #dbeafe; padding: 8px; border-radius: 6px; margin-bottom: 8px;">
            <strong style="color: #3b82f6;">⚙️ Pressure</strong><br>
            <table style="width: 100%; font-size: 12px; margin-top: 5px;">
                <tr>
                    <td>Before:</td>
                    <td style="text-align: right;">{before["pressure"]:.2f} m</td>
                </tr>
                <tr>
                    <td>After:</td>
                    <td style="text-align: right; color: #2563eb;"><strong>{after["pressure"]:.2f} m</strong></td>
                </tr>
                <tr style="border-top: 1px solid #93c5fd;">
                    <td>Improvement:</td>
                    <td style="text-align: right; color: #1d4ed8;"><strong>↑ {pressure_improvement:.2f} m</strong></td>
                </tr>
            </table>
        </div>

        <div style="background: #dcfce7; padding: 8px; border-radius: 6px; margin-bottom: 8px;">
            <strong style="color: #10b981;">🚰 Supply Improvement</strong><br>
            <table style="width: 100%; font-size: 12px; margin-top: 5px;">
                <tr>
                    <td>Before:</td>
                    <td style="text-align: right;">{before["supply"]:.2f} LPS</td>
                </tr>
                <tr>
                    <td>After:</td>
                    <td style="text-align: right; color: #10b981;"><strong>{after["supply"]:.2f} LPS</strong></td>
                </tr>
                <tr style="border-top: 1px solid #86efac;">
                    <td>Improvement:</td>
                    <td style="text-align: right; color: #059669;"><strong>↑ {supply_improvement:.2f} LPS</strong></td>
                </tr>
            </table>
        </div>

        <div style="background: #e0e7ff; padding: 8px; border-radius: 6px;">
            <strong style="color: #6366f1;">📉 Leakage</strong><br>
            <table style="width: 100%; font-size: 12px; margin-top: 5px;">
                <tr>
                    <td>Before:</td>
                    <td style="text-align: right;">{before["leakage"]:.2f}%</td>
                </tr>
                <tr>
                    <td>After:</td>
                    <td style="text-align: right; color: #6366f1;"><strong>{after["leakage"]:.2f}%</strong></td>
                </tr>
            </table>
        </div>

        <div style="margin-top: 10px; padding: 8px; background: #f8fafc; border-radius: 6px; font-size: 11px; color: #64748b;">
            <em>{ward_data["explanation"]}</em>
        </div>
    </div>
    """
    return html


def create_map(geojson_data, ward_lookup, metric="supplyDemand"):
    """Create Folium map with all wards"""
    print("🗺️  Creating map...")

    # Center on Bengaluru
    m = folium.Map(
        location=[12.9716, 77.5946],
        zoom_start=11,
        tiles="OpenStreetMap",
        prefer_canvas=True,
    )

    matched_count = 0
    unmatched_wards = []

    # Add each ward as a separate feature
    for feature in geojson_data["features"]:
        props = feature["properties"]
        geojson_name = normalize_ward_name(props.get("KGISWardName", ""))

        # Try to find matching ward data
        ward_data = None
        if geojson_name in ward_lookup:
            ward_data = ward_lookup[geojson_name]
        else:
            # Try partial matching
            for key, value in ward_lookup.items():
                if geojson_name in key or key in geojson_name:
                    ward_data = value
                    break

        if ward_data:
            matched_count += 1
            ward_name = ward_data["name"]
            color = get_ward_color(ward_data, metric)
            popup_html = create_popup_html(ward_name, ward_data)

            # Create tooltip with basic info
            supply_demand_ratio = (
                ward_data["after"]["supply"] / ward_data["after"]["demand"]
            ) * 100
            tooltip_text = (
                f"{ward_name}\n"
                f"Supply/Demand: {supply_demand_ratio:.1f}%\n"
                f"Shortage: {ward_data['after']['shortage_pct']:.2f}%"
            )

            # Add GeoJSON layer for this ward
            folium.GeoJson(
                data=feature,
                style_function=lambda x, color=color: {
                    "fillColor": color,
                    "color": "black",
                    "weight": 1,
                    "fillOpacity": 0.6,
                },
                highlight_function=lambda x: {
                    "weight": 3,
                    "color": "#ffffff",
                    "fillOpacity": 0.8,
                },
                tooltip=tooltip_text,
                popup=folium.Popup(popup_html, max_width=350),
            ).add_to(m)
        else:
            unmatched_wards.append(props.get("KGISWardName", "Unknown"))

    # Add legend
    legend_html = """
    <div style="position: fixed;
                bottom: 50px; right: 50px; width: 220px;
                background-color: white; z-index:9999;
                border:2px solid grey; border-radius: 8px;
                padding: 15px; font-size: 14px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <h4 style="margin: 0 0 10px 0; color: #1e293b;">Supply/Demand Ratio</h4>
        <div style="margin-bottom: 8px;">
            <span style="display: inline-block; width: 20px; height: 20px;
                         background-color: #10b981; border-radius: 3px;
                         vertical-align: middle;"></span>
            <span style="margin-left: 8px;">≥98% (Excellent)</span>
        </div>
        <div style="margin-bottom: 8px;">
            <span style="display: inline-block; width: 20px; height: 20px;
                         background-color: #22c55e; border-radius: 3px;
                         vertical-align: middle;"></span>
            <span style="margin-left: 8px;">95-98% (Good)</span>
        </div>
        <div style="margin-bottom: 8px;">
            <span style="display: inline-block; width: 20px; height: 20px;
                         background-color: #f59e0b; border-radius: 3px;
                         vertical-align: middle;"></span>
            <span style="margin-left: 8px;">90-95% (Moderate)</span>
        </div>
        <div style="margin-bottom: 8px;">
            <span style="display: inline-block; width: 20px; height: 20px;
                         background-color: #fb923c; border-radius: 3px;
                         vertical-align: middle;"></span>
            <span style="margin-left: 8px;">85-90% (Fair)</span>
        </div>
        <div>
            <span style="display: inline-block; width: 20px; height: 20px;
                         background-color: #ef4444; border-radius: 3px;
                         vertical-align: middle;"></span>
            <span style="margin-left: 8px;">&lt;85% (Critical)</span>
        </div>
        <hr style="margin: 10px 0; border: none; border-top: 1px solid #e2e8f0;">
        <div style="font-size: 12px; color: #64748b;">
            <strong style="color: #1e293b;">{matched}</strong> of 198 wards rendered
        </div>
    </div>
    """.format(matched=matched_count)

    m.get_root().html.add_child(folium.Element(legend_html))

    # Add title
    title_html = """
    <div style="position: fixed;
                top: 10px; left: 50px; width: 400px;
                background-color: white; z-index:9999;
                border:2px solid grey; border-radius: 8px;
                padding: 15px; font-size: 14px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <h2 style="margin: 0 0 5px 0; color: #1e293b;">
            🌊 AquaOptiSense Ward Map
        </h2>
        <p style="margin: 0; color: #64748b; font-size: 13px;">
            Interactive map showing all 198 wards with demand vs supply metrics.
            <strong>Click any ward</strong> for detailed analytics.
        </p>
    </div>
    """

    m.get_root().html.add_child(folium.Element(title_html))

    print(f"✅ Matched {matched_count} wards")
    if unmatched_wards:
        print(f"⚠️  {len(unmatched_wards)} wards not matched:")
        for ward in unmatched_wards[:10]:  # Show first 10
            print(f"   - {ward}")
        if len(unmatched_wards) > 10:
            print(f"   ... and {len(unmatched_wards) - 10} more")

    return m


def main():
    """Main function"""
    print("=" * 60)
    print("🚀 AquaOptiSense Ward Map Generator")
    print("=" * 60)

    # Load data
    geojson_data, ward_lookup = load_data()

    # Create map
    m = create_map(geojson_data, ward_lookup, metric="supplyDemand")

    # Save map
    print(f"💾 Saving map to {OUTPUT_FILE}...")
    m.save(OUTPUT_FILE)

    print("=" * 60)
    print(f"✅ SUCCESS! Map generated: {OUTPUT_FILE}")
    print("=" * 60)
    print("\n📝 Next steps:")
    print("1. Open client/public/ward_map.html in a browser to preview")
    print("2. The React app will embed this map automatically")
    print("3. Run your React app to see it in action!")
    print("\n💡 To regenerate the map, just run: python generate_ward_map.py")
    print()


if __name__ == "__main__":
    main()
