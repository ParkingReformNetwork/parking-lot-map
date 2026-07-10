import { type GeoJSON, geoJSON, type Map as LeafletMap } from "leaflet";
import { STYLES } from "../layout/map";
import type { CityId, ParkingLotGeoJSONModules } from "../model/types";
import type { ViewStateManager } from "../state/ViewState";

function handleLotsToggle(map: LeafletMap, parkingLayer: GeoJSON): void {
  if (window.location.href.indexOf("#lots-toggle") === -1) return;

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
}

function createParkingLotsLayer(map: LeafletMap): GeoJSON {
  const parkingLayer = geoJSON(undefined, {
    style() {
      return STYLES.parkingLots;
    },
  }).addTo(map);
  handleLotsToggle(map, parkingLayer);
  return parkingLayer;
}

/**
 * A lazy and thread-safe loader for the parking lot data.
 */
export default class ParkingLotLoader {
  private layer: GeoJSON;

  private lotsData: ParkingLotGeoJSONModules;

  private loadedCities: Set<CityId>;

  // Used to track in-flight requests to load the data so that we don't have
  // multiple concurrent requests.
  private loadingPromises: Map<CityId, Promise<void>>;

  constructor(map: LeafletMap, lotsData: ParkingLotGeoJSONModules) {
    this.layer = createParkingLotsLayer(map);
    this.lotsData = lotsData;
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

  subscribe(viewState: ViewStateManager): void {
    viewState.subscribeToCity("load parking lots", (cityId) =>
      this.load(cityId),
    );
  }

  private async loadCity(cityId: CityId): Promise<void> {
    const loadModule = this.lotsData[`${cityId}.geojson`];
    if (!loadModule) {
      throw new Error(`No parking lot data found for city id "${cityId}".`);
    }
    const data = await loadModule();
    this.layer.addData(data);
    // Ensure the parking lots do not cover the city boundary.
    this.layer.bringToBack();
  }
}
