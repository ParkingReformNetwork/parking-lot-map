import os
import subprocess
import glob


def main():
    geojson_files = glob.glob("*.geojson")
    city_names = [
        file.replace('.geojson', '')
        for file in geojson_files
        if not file.startswith('Name_')
    ]
    for city_name in city_names:
        os.rename(f"{city_name}.geojson", "parking-lots-update.geojson")
        os.rename(f"Name_{city_name}.geojson"   , "city-update.geojson")
        subprocess.run(["npm", "run", "add-city", "--", city_name])
        print(f"Added city: {city_name}")


if __name__ == "__main__":
    main()
