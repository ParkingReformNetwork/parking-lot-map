import { extractCityIdFromUrl } from "./cityId";
import initIcons from "./fontAwesome";
import maybeDisableFullScreenIcon from "./iframe";
import initAbout from "./about";
import subscribeShareLink from "./share";
import subscribeScorecard from "./scorecard";
import initDropdown from "./dropdown";
import { createMap } from "./map";
import { setCityByMapPosition, subscribeSnapToCity } from "./mapPosition";
import { createCitiesLayer, setCityOnBoundaryClick } from "./citiesLayer";
import ParkingLotLoader from "./ParkingLotLoader";
import { initCitySelectionState } from "./CitySelectionState";

export default async function initApp(): Promise<void> {
  initIcons();
  maybeDisableFullScreenIcon();
  initAbout();

  const map = createMap();
  const [cityBoundaries, cityEntries] = createCitiesLayer(map);
  const parkingLotLoader = new ParkingLotLoader(map);

  const initialCityId = extractCityIdFromUrl(window.location.href);
  const cityState = initCitySelectionState(initialCityId, "atlanta-ga");

  initDropdown(cityState);
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
