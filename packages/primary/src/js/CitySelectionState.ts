import Observable from "./Observable";
import { CityId } from "./types";

type CitySelectionState = {
  cityId: CityId;
  shouldSnapMap: boolean;
};

export type CitySelectionObservable = Observable<CitySelectionState>;

export function initCitySelectionState(
  cityIds: CityId[],
  initialCityId: CityId | null,
  fallBackCityId: CityId,
): CitySelectionObservable {
  const startingCity =
    initialCityId && cityIds.includes(initialCityId)
      ? initialCityId
      : fallBackCityId;
  return new Observable<CitySelectionState>("city state", {
    cityId: startingCity,
    shouldSnapMap: true,
  });
}
