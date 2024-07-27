import Observable from "./Observable";
import { CityId } from "./types";

import scoreCardsData from "../../data/score-cards.json";

type GlobalState = {
  cityId: CityId;
  shouldSnapMap: boolean;
};

type GlobalStateObservable = Observable<GlobalState>;

function initGlobalState(
  initialCityId: CityId | null,
  fallBackCityId: CityId
): GlobalStateObservable {
  const startingCity =
    initialCityId && Object.keys(scoreCardsData).includes(initialCityId)
      ? initialCityId
      : fallBackCityId;
  return new Observable<GlobalState>({
    cityId: startingCity,
    shouldSnapMap: true,
  });
}

export { GlobalStateObservable, initGlobalState };
