import { ImageOverlay, Map } from "leaflet";

import type { CityEntryCollection } from "@prn-parking-lots/shared/src/js/types";
import { ViewStateObservable } from "@prn-parking-lots/shared/src/js/ViewState";

import ParkingLotLoader from "./ParkingLotLoader";

/**
 * Centers view to city, but translated down to account for the top UI elements.
 */
function snapToCity(map: Map, layer: ImageOverlay): void {
  const bounds = layer.getBounds();
  // This moves the map and resets zoom.
  map.fitBounds(bounds);
  const centerPoint = map.latLngToContainerPoint(bounds.getCenter());
  const translateYPx = -40;
  const translatedCenterPoint = centerPoint.add([0, translateYPx]);
  const translatedCenter = map.containerPointToLatLng(translatedCenterPoint);
  map.setView(translatedCenter);
}

export function subscribeSnapToCity(
  viewState: ViewStateObservable,
  map: Map,
  cityEntries: CityEntryCollection,
): void {
  viewState.subscribe((state) => {
    if (!state.shouldSnapMap) return;
    snapToCity(map, cityEntries[state.cityId].layer);
  }, "snap to city");
}

/**
 * Change the city to whatever is in the center of the map.
 *
 * Regardless of if the city is chosen, ensure its parking lots are loaded when in view.
 */
export function setCityByMapPosition(
  viewState: ViewStateObservable,
  map: Map,
  cityEntries: CityEntryCollection,
  parkingLotLoader: ParkingLotLoader,
): void {
  map.on("moveend", () => {
    let centralCityDistance: number | null = null;
    let centralCity;
    Object.entries(cityEntries).forEach(([cityId, scorecard]) => {
      const bounds = scorecard.layer.getBounds();
      if (!map.getBounds().intersects(bounds)) return;
      parkingLotLoader.load(cityId);

      const distance = map
        .getBounds()
        .getCenter()
        .distanceTo(bounds.getCenter());
      if (!centralCityDistance || distance < centralCityDistance) {
        centralCityDistance = distance;
        centralCity = cityId;
      }
    });
    if (centralCity) {
      viewState.setValue({ cityId: centralCity, shouldSnapMap: false });
    }
  });
}
