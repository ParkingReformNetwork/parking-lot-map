import bootstrapApp from "@prn-parking-lots/shared/src/js/bootstrap";

import {
  CITY_STATS_DATA,
  CITY_BOUNDARIES_GEOJSON,
  PARKING_LOT_GEOJSON_MODULES,
} from "./data";
import createDropdownRequest from "./dropdownRequest";
import formatScorecard from "./scorecard";

export default async function initApp(): Promise<void> {
  await bootstrapApp({
    data: {
      stats: CITY_STATS_DATA,
      boundaries: CITY_BOUNDARIES_GEOJSON,
      parkingLots: PARKING_LOT_GEOJSON_MODULES,
    },
    dropdownRequest: createDropdownRequest(CITY_STATS_DATA),
    scorecardFormatter: formatScorecard,
    initialCity: "atlanta-ga",
  });
}
