from pathlib import Path
import json


def main() -> None:
    lat_lng_pairs_to_cities = read_cities_data()
    validate_each_city_unique_coordinates(lat_lng_pairs_to_cities)

    parking_file = Path("data/parking-lots.geojson")
    with parking_file.open() as f:
        parking_json = json.load(f)

    new_entries = []
    for feature in parking_json["features"]:
        city = determine_city(
            lat_lng_pairs_to_cities, feature["geometry"]["coordinates"]
        )
        new_entries.append({**feature, "properties": {"Name": city}})
        print(city)

    new_json = {**parking_json, "features": new_entries}
    with parking_file.open("w") as f:
        json.dump(new_json, f)


def trunc_coord(x: float) -> str:
    base, dec = str(x).split(".")
    return f"{base}.{dec[0]}"


def read_cities_data() -> dict[frozenset[tuple[str, str], str]]:
    with Path("data/cities-polygons.geojson").open() as f:
        data = json.load(f)

    result = {}
    for feature in data["features"]:
        name = feature["properties"]["Name"]
        lat_lng_pairs = {
            (trunc_coord(lat), trunc_coord(lng))
            for lat, lng, _ in feature["geometry"]["coordinates"][0]
        }
        result[frozenset(lat_lng_pairs)] = name
    return result


def validate_each_city_unique_coordinates(
    cities_to_valid_lat_lng_pairs: dict[frozenset[tuple[str, str]], str]
) -> None:
    unique_pairs = set()
    for pairs in cities_to_valid_lat_lng_pairs:
        for pair in pairs:
            if pair in unique_pairs:
                raise AssertionError(f"Pair is not unique! {pair}\n\n{unique_pairs}")
            unique_pairs.add(pair)


def determine_city(
    lat_lng_pairs_to_cities: dict[frozenset[tuple[str, str]], str],
    all_coordinates: list[list[list[float]]],
) -> str:
    flattened_coordinates: list[tuple[float, float, float]] = [
        tuple(coord)
        for sublist1 in all_coordinates
        for sublist2 in sublist1
        for coord in sublist2
    ]
    unique_pairs = frozenset(
        {(trunc_coord(lat), trunc_coord(lng)) for lat, lng, _ in flattened_coordinates}
    )
    city = next(
        (
            city
            for city_pairs, city in lat_lng_pairs_to_cities.items()
            if unique_pairs.issubset(city_pairs)
        ),
        None,
    )
    if city is None:
        raise AssertionError(
            f"Could not find city for the unique pairs: {unique_pairs}\n\n"
            f"{lat_lng_pairs_to_cities.keys()}"
        )
    return city


if __name__ == "__main__":
    main()
