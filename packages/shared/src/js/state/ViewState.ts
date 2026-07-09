import type { CityId } from "../model/types";
import Observable from "./Observable";

type ViewState = {
  cityId: CityId;
  shouldSnapMap: boolean;
};

/**
 * Wraps the ViewState Observable to add change-detection helpers.
 */
export class ViewStateManager {
  private readonly state: Observable<ViewState>;

  constructor(initialState: ViewState) {
    this.state = new Observable("view state", initialState);
  }

  getValue(): ViewState {
    return this.state.getValue();
  }

  setValue(newValue: ViewState): void {
    this.state.setValue(newValue);
  }

  initialize(): void {
    this.state.initialize();
  }

  /** Fires on every state change. Use when you care about `shouldSnapMap`. */
  subscribe(id: string, callback: (state: ViewState) => void): void {
    this.state.subscribe(id, callback);
  }

  /** Fires on the initial value and thereafter only when `cityId` changes. */
  subscribeToCity(id: string, callback: (cityId: CityId) => void): void {
    let priorCityId: CityId | null = null;
    this.state.subscribe(id, ({ cityId }) => {
      if (cityId === priorCityId) return;
      priorCityId = cityId;
      callback(cityId);
    });
  }
}

export function initViewState(
  cityIds: CityId[],
  initialCityId: CityId | null,
  fallBackCityId: CityId,
): ViewStateManager {
  const startingCity =
    initialCityId && cityIds.includes(initialCityId)
      ? initialCityId
      : fallBackCityId;
  return new ViewStateManager({
    cityId: startingCity,
    shouldSnapMap: true,
  });
}
