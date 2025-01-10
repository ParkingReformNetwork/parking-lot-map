import Observable from "./Observable";
import type { CityId } from "./types";

type ViewState = {
  cityId: CityId;
  shouldSnapMap: boolean;
};

export type ViewStateObservable = Observable<ViewState>;

export function initViewState(
  cityIds: CityId[],
  initialCityId: CityId | null,
  fallBackCityId: CityId,
): ViewStateObservable {
  const startingCity =
    initialCityId && cityIds.includes(initialCityId)
      ? initialCityId
      : fallBackCityId;
  return new Observable<ViewState>("city state", {
    cityId: startingCity,
    shouldSnapMap: true,
  });
}
