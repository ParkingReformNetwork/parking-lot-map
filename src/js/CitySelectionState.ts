import Observable from "./Observable";
import { CityId } from "./types";

import scoreCardsData from "../../data/score-cards.json";

type CitySelectionState = {
  cityId: CityId;
  shouldSnapMap: boolean;
};

export type CitySelectionObservable = Observable<CitySelectionState>;

export function initCitySelectionState(
  initialCityId: CityId | null,
  fallBackCityId: CityId,
): CitySelectionObservable {
  const startingCity =
    initialCityId && Object.keys(scoreCardsData).includes(initialCityId)
      ? initialCityId
      : fallBackCityId;
  return new Observable<CitySelectionState>({
    cityId: startingCity,
    shouldSnapMap: true,
  });
}
