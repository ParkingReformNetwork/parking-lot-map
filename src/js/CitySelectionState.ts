import Observable from "./Observable";
import { CityId } from "./types";

import cityStatsData from "../../data/city-stats.json" with { type: "json" };

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
    initialCityId && Object.keys(cityStatsData).includes(initialCityId)
      ? initialCityId
      : fallBackCityId;
  return new Observable<CitySelectionState>({
    cityId: startingCity,
    shouldSnapMap: true,
  });
}
