import initIcons from "./fontAwesome";
import maybeDisableFullScreenIcon from "./iframe";
import { initViewState } from "./ViewState";
import { extractCityIdFromUrl } from "./cityId";
import initAbout from "./about";
import subscribeShareLink from "./share";
import subscribeScorecard from "./scorecard";
import initDropdown from "./dropdown";
import { createMap } from "./map";
import { setCityByMapPosition, subscribeSnapToCity } from "./mapPosition";
import { createCitiesLayer, setCityOnBoundaryClick } from "./citiesLayer";
import ParkingLotLoader from "./ParkingLotLoader";
import type { CityId, DataSet } from "./types";

interface Args {
  data: DataSet;
  initialCity: CityId;
}

export default async function bootstrapApp(args: Args): Promise<void> {
  initIcons();
  maybeDisableFullScreenIcon();
  initAbout();

  const map = createMap();
  const [cityBoundaries, cityEntries] = createCitiesLayer(
    map,
    args.data.boundaries,
    args.data.stats,
  );
  const parkingLotLoader = new ParkingLotLoader(map, args.data.parkingLots);

  const initialCityId = extractCityIdFromUrl(window.location.href);
  const viewState = initViewState(
    Object.keys(args.data.stats),
    initialCityId,
    args.initialCity,
  );

  initDropdown(args.data.stats, viewState);
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
