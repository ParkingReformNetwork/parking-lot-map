import bootstrapApp from "@prn-parking-lots/shared/src/js/bootstrap";

import {
  CITY_STATS_DATA,
  CITY_BOUNDARIES_GEOJSON,
  PARKING_LOT_GEOJSON_MODULES,
} from "./data";
import createDropdownGroups from "./dropdownGroups";

export default async function initApp(): Promise<void> {
  await bootstrapApp({
    data: {
      stats: CITY_STATS_DATA,
      boundaries: CITY_BOUNDARIES_GEOJSON,
      parkingLots: PARKING_LOT_GEOJSON_MODULES,
    },
    dropdownGroups: createDropdownGroups(CITY_STATS_DATA),
    initialCity: "atlanta-ga",
  });
}
