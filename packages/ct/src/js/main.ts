import bootstrapApp from "@prn-parking-lots/shared/src/js/bootstrap";

import {
  CITY_STATS_DATA,
  CITY_BOUNDARIES_GEOJSON,
  PARKING_LOT_GEOJSON_MODULES,
} from "./data";

export default async function initApp(): Promise<void> {
  await bootstrapApp({
    data: {
      stats: CITY_STATS_DATA,
      boundaries: CITY_BOUNDARIES_GEOJSON,
      parkingLots: PARKING_LOT_GEOJSON_MODULES,
    },
    initialCity: "hartford-ct",
  });
}
