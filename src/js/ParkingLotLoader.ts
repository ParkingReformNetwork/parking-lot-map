import { geoJSON, GeoJSON, Map as LeafletMap } from "leaflet";
import { Feature, Geometry } from "geojson";

import { CityId } from "./types";
import { CitySelectionObservable } from "./CitySelectionState";
import { STYLES } from "./map";

interface ParkingLotModules {
  [key: string]: () => Promise<Feature<Geometry>>;
}

const parkingLotsModules = import(
  "~/data/parking-lots/*"
) as unknown as ParkingLotModules;

function createParkingLotsLayer(map: LeafletMap): GeoJSON {
  const parkingLayer = geoJSON(undefined, {
    style() {
      return STYLES.parkingLots;
    },
  }).addTo(map);

  if (window.location.href.indexOf("#lots-toggle") === -1) return parkingLayer;

  // If `#lots-toggle` is in the URL, we show buttons to toggle parking lots.
  const toggle = document.querySelector<HTMLElement>("#lots-toggle");
  if (toggle) {
    toggle.hidden = false;
  }
  document.querySelector("#lots-toggle-off")?.addEventListener("click", () => {
    parkingLayer.removeFrom(map);
  });
  document.querySelector("#lots-toggle-on")?.addEventListener("click", () => {
    parkingLayer.addTo(map);
  });
  return parkingLayer;
}

/**
 * A lazy and thread-safe loader for the parking lot data.
 */
export default class ParkingLotLoader {
  private layer: GeoJSON;

  private loadedCities: Set<CityId>;

  // Used to track in-flight requests to load the data so that we don't have
  // multiple concurrent requests.
  private loadingPromises: Map<CityId, Promise<void>>;

  constructor(map: LeafletMap) {
    this.layer = createParkingLotsLayer(map);
    this.loadedCities = new Set();
    this.loadingPromises = new Map();
  }

  load(cityId: CityId): Promise<void> {
    if (this.loadedCities.has(cityId)) {
      return Promise.resolve();
    }

    let loadPromise = this.loadingPromises.get(cityId);
    if (!loadPromise) {
      loadPromise = this.loadCity(cityId);
      this.loadingPromises.set(cityId, loadPromise);
      loadPromise
        .then(() => this.loadedCities.add(cityId))
        .finally(() => {
          this.loadingPromises.delete(cityId);
        });
    }
    return loadPromise;
  }

  subscribe(observable: CitySelectionObservable): void {
    observable.subscribe(({ cityId }) => this.load(cityId));
  }

  private async loadCity(cityId: CityId): Promise<void> {
    const data = await parkingLotsModules[`${cityId}.geojson`]();
    this.layer.addData(data);
    // Ensure the parking lots do not cover the city boundary.
    this.layer.bringToBack();
  }
}
