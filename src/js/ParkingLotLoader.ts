import { GeoJSON } from "leaflet";
import { Feature, Geometry } from "geojson";

import { CityId } from "./types";

interface ParkingLotModules {
  [key: string]: () => Promise<Feature<Geometry>>;
}

const parkingLotsModules = import(
  "~/data/parking-lots/*"
) as unknown as ParkingLotModules;

export default class ParkingLotLoader {
  private loadedCities: Set<CityId>;

  // Used to track in-flight requests to load the data so that we don't have
  // multiple concurrent requests.
  private loadingPromises: Map<CityId, Promise<void>>;

  constructor() {
    this.loadedCities = new Set();
    this.loadingPromises = new Map();
  }

  load(cityId: CityId, parkingLayer: GeoJSON): Promise<void> {
    if (this.loadedCities.has(cityId)) {
      return Promise.resolve();
    }

    let loadPromise = this.loadingPromises.get(cityId);
    if (!loadPromise) {
      loadPromise = ParkingLotLoader.loadCity(cityId, parkingLayer);
      this.loadingPromises.set(cityId, loadPromise);
      loadPromise
        .then(() => this.loadedCities.add(cityId))
        .finally(() => {
          this.loadingPromises.delete(cityId);
        });
    }
    return loadPromise;
  }

  private static async loadCity(
    cityId: CityId,
    parkingLayer: GeoJSON
  ): Promise<void> {
    const data = await parkingLotsModules[`${cityId}.geojson`]();
    parkingLayer.addData(data);
    // Ensure the parking lots do not cover the city boundary.
    parkingLayer.bringToBack();
  }
}
