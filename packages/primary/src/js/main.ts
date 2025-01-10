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
import { initCitySelectionState } from "./CitySelectionState";
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
  const cityState = initCitySelectionState(
    Object.keys(CITY_STATS_DATA),
    initialCityId,
    "atlanta-ga",
  );

  initDropdown(CITY_STATS_DATA, cityState);
  subscribeScorecard(cityState, cityEntries);
  subscribeShareLink(cityState);
  subscribeSnapToCity(cityState, map, cityEntries);
  parkingLotLoader.subscribe(cityState);

  setCityOnBoundaryClick(cityState, map, cityBoundaries);
  setCityByMapPosition(cityState, map, cityEntries, parkingLotLoader);

  cityState.initialize();

  // There have been some issues on Safari with the map only rendering the top 20%
  // on the first page load. This is meant to address that.
  map.invalidateSize();
}
