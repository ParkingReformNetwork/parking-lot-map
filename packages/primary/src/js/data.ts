/* eslint-disable import/no-relative-packages */

import { ParkingLotGeoJSONModules } from "./types";

import CITY_STATS_DATA from "../../../../data/city-stats.json" with { type: "json" };
// @ts-expect-error - move data to this package to fix declaration
import CITY_BOUNDARIES_GEOJSON from "../../../../data/city-boundaries.geojson" with { type: "json" };

const PARKING_LOT_GEOJSON_MODULES = import(
  // @ts-expect-error - move data to this package to fix declaration
  "../../../../data/parking-lots/*"
) as unknown as ParkingLotGeoJSONModules;

export {
  CITY_STATS_DATA,
  CITY_BOUNDARIES_GEOJSON,
  PARKING_LOT_GEOJSON_MODULES,
};
