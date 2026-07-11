import {
  type GeoJSON,
  geoJSON,
  type Map as LeafletMap,
  type Polygon,
} from "leaflet";
import { parseCityId } from "../model/cityId";
import type {
  BaseCityStats,
  CityBoundaries,
  CityEntryCollection,
  CityStatsCollection,
} from "../model/types";
import type { ViewStateManager } from "../state/ViewState";
import { STYLES } from "./styles";

/**
 * Load the cities from GeoJson and associate each city with its layer and scorecard entry.
 */
export function createCitiesLayer<T extends BaseCityStats>(
  map: LeafletMap,
  cityBoundaries: CityBoundaries,
  cityStatsData: CityStatsCollection<T>,
): [GeoJSON, CityEntryCollection<T>] {
  const cityEntries: CityEntryCollection<T> = {};
  const boundaries = geoJSON(cityBoundaries, {
    style() {
      return STYLES.cities;
    },
    onEachFeature(feature, layer: Polygon) {
      const cityId = parseCityId(feature.properties.id as string);
      cityEntries[cityId] = {
        layer,
        stats: cityStatsData[cityId],
      };
      layer.on("add", () => {
        layer.getElement()?.setAttribute("id", cityId);
      });
    },
  });

  boundaries.addTo(map);
  return [boundaries, cityEntries];
}

export function setCityOnBoundaryClick(
  viewState: ViewStateManager,
  map: LeafletMap,
  cityBoundaries: GeoJSON,
): void {
  cityBoundaries.addEventListener("click", (e) => {
    const currentZoom = map.getZoom();
    // Only change cities if zoomed in enough.
    if (currentZoom <= 7) return;
    const cityId = parseCityId(e.sourceTarget.feature.properties.id as string);
    viewState.setValue({ cityId, shouldSnapMap: true });
  });
}
