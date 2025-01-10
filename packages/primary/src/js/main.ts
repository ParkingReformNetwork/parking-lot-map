import initIcons from "@prn-parking-lots/shared/src/js/fontAwesome";
import maybeDisableFullScreenIcon from "@prn-parking-lots/shared/src/js/iframe";

import { extractCityIdFromUrl } from "./cityId";
import initAbout from "./about";
import subscribeShareLink from "./share";
import subscribeScorecard from "./scorecard";
import initDropdown from "./dropdown";
import { createMap } from "./map";
import { setCityByMapPosition, subscribeSnapToCity } from "./mapPosition";
import { createCitiesLayer, setCityOnBoundaryClick } from "./citiesLayer";
import ParkingLotLoader from "./ParkingLotLoader";
import { initViewState } from "@prn-parking-lots/shared/src/js/ViewState";
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
