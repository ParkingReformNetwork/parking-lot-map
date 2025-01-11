import subscribeScorecard from "./city-ui/scorecard";
import initDropdown from "./city-ui/dropdown";

import initAbout from "./layout/about";
import initIcons from "./layout/fontAwesome";
import maybeDisableFullScreenIcon from "./layout/iframe";
import { createMap } from "./layout/map";
import subscribeShareLink from "./layout/share";

import { setCityByMapPosition, subscribeSnapToCity } from "./mapPosition";

import {
  createCitiesLayer,
  setCityOnBoundaryClick,
} from "./map-layers/citiesLayer";
import ParkingLotLoader from "./map-layers/ParkingLotLoader";

import { extractCityIdFromUrl } from "./model/cityId";
import type { CityId, DataSet } from "./model/types";

import { initViewState } from "./state/ViewState";

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
