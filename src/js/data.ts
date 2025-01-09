import { ParkingLotGeoJSONModules } from "./types";

import CITY_STATS_DATA from "../../data/city-stats.json" with { type: "json" };
import CITY_BOUNDARIES_GEOJSON from "~/data/city-boundaries.geojson" with { type: "json" };

const PARKING_LOT_GEOJSON_MODULES = import(
  "~/data/parking-lots/*"
) as unknown as ParkingLotGeoJSONModules;

export {
  CITY_STATS_DATA,
  CITY_BOUNDARIES_GEOJSON,
  PARKING_LOT_GEOJSON_MODULES,
};
