import { ImageOverlay, Map } from "leaflet";

import { CityEntryCollection } from "./types";
import ParkingLotLoader from "./ParkingLotLoader";
import { CitySelectionObservable } from "./CitySelectionState";

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
  observable: CitySelectionObservable,
  map: Map,
  cityEntries: CityEntryCollection,
): void {
  observable.subscribe((state) => {
    if (!state.shouldSnapMap) return;
    snapToCity(map, cityEntries[state.cityId].layer);
  });
}

/**
 * Change the city to whatever is in the center of the map.
 *
 * Regardless of if the city is chosen, ensure its parking lots are loaded when in view.
 */
export function setCityByMapPosition(
  observable: CitySelectionObservable,
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
      observable.setValue({ cityId: centralCity, shouldSnapMap: false });
    }
  });
}
