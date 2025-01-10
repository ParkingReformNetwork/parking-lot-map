import initIcons from "@prn-parking-lots/shared/src/js/fontAwesome";
import maybeDisableFullScreenIcon from "@prn-parking-lots/shared/src/js/iframe";
import { initViewState } from "@prn-parking-lots/shared/src/js/ViewState";
import { extractCityIdFromUrl } from "@prn-parking-lots/shared/src/js/cityId";
import initAbout from "@prn-parking-lots/shared/src/js/about";
import subscribeShareLink from "@prn-parking-lots/shared/src/js/share";
import subscribeScorecard from "@prn-parking-lots/shared/src/js/scorecard";
import initDropdown from "@prn-parking-lots/shared/src/js/dropdown";
import { createMap } from "@prn-parking-lots/shared/src/js/map";
import {
  setCityByMapPosition,
  subscribeSnapToCity,
} from "@prn-parking-lots/shared/src/js/mapPosition";
import {
  createCitiesLayer,
  setCityOnBoundaryClick,
} from "@prn-parking-lots/shared/src/js/citiesLayer";
import ParkingLotLoader from "@prn-parking-lots/shared/src/js/ParkingLotLoader";

import {
  CITY_STATS_DATA,
  CITY_BOUNDARIES_GEOJSON,
  PARKING_LOT_GEOJSON_MODULES,
} from "./data";

export default async function initApp(): Promise<void> {
  initIcons();
  maybeDisableFullScreenIcon();
  initAbout();

  const map = createMap();
  const [cityBoundaries, cityEntries] = createCitiesLayer(
    map,
    CITY_BOUNDARIES_GEOJSON,
    CITY_STATS_DATA,
  );
  const parkingLotLoader = new ParkingLotLoader(
    map,
    PARKING_LOT_GEOJSON_MODULES,
  );

  const initialCityId = extractCityIdFromUrl(window.location.href);
  const viewState = initViewState(
    Object.keys(CITY_STATS_DATA),
    initialCityId,
    "atlanta-ga",
  );

  initDropdown(CITY_STATS_DATA, viewState);
  subscribeScorecard(viewState, cityEntries);
  subscribeShareLink(viewState);
  subscribeSnapToCity(viewState, map, cityEntries);
  parkingLotLoader.subscribe(viewState);

  setCityOnBoundaryClick(viewState, map, cityBoundaries);
  setCityByMapPosition(viewState, map, cityEntries, parkingLotLoader);

  viewState.initialize();

  // There have been some issues on Safari with the map only rendering the top 20%
  // on the first page load. This is meant to address that.
  map.invalidateSize();
}
