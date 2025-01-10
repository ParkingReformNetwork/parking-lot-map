/* eslint-disable import/no-relative-packages */

import type { ParkingLotGeoJSONModules } from "@prn-parking-lots/shared/src/js/types";

import CITY_STATS_DATA from "../../data/city-stats.json" with { type: "json" };
import CITY_BOUNDARIES_GEOJSON from "../../data/city-boundaries.geojson" with { type: "json" };

const PARKING_LOT_GEOJSON_MODULES = import(
  // @ts-expect-error Dynamic import with glob pattern
  "../../data/parking-lots/*"
) as unknown as ParkingLotGeoJSONModules;

export {
  CITY_STATS_DATA,
  CITY_BOUNDARIES_GEOJSON,
  PARKING_LOT_GEOJSON_MODULES,
};
