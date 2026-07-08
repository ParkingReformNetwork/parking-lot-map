/* eslint-disable import/first, import/newline-after-import */

import type {
  CityBoundaries,
  CityStatsCollection,
  ParkingLotGeoJSONModules,
} from "@prn-parking-lots/shared/src/js/model/types";
import UNTYPED_CITY_STATS_DATA from "../../data/city-stats.json" with {
  type: "json",
};
import type { CityStats } from "./types";

const CITY_STATS_DATA: CityStatsCollection<CityStats> = UNTYPED_CITY_STATS_DATA;

// @ts-expect-error TypeScript doesn't understand GeoJSON.
import UNTYPED_CITY_BOUNDARIES_GEOJSON from "../../data/city-boundaries.geojson" with {
  type: "json",
};

const CITY_BOUNDARIES_GEOJSON: CityBoundaries = UNTYPED_CITY_BOUNDARIES_GEOJSON;

const PARKING_LOT_GEOJSON_MODULES = import(
  // @ts-expect-error Dynamic import with glob pattern
  "../../data/parking-lots/*"
) as unknown as ParkingLotGeoJSONModules;

export {
  CITY_BOUNDARIES_GEOJSON,
  CITY_STATS_DATA,
  PARKING_LOT_GEOJSON_MODULES,
};
