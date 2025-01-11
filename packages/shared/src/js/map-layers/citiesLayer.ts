import { ImageOverlay, Map, geoJSON, GeoJSON } from "leaflet";

import type {
  CityEntryCollection,
  CityStatsCollection,
  CityBoundaries,
  BaseCityStats,
} from "../model/types";
import { ViewStateObservable } from "../state/ViewState";
import { STYLES } from "../layout/map";

/**
 * Load the cities from GeoJson and associate each city with its layer and scorecard entry.
 */
export function createCitiesLayer<T extends BaseCityStats>(
  map: Map,
  cityBoundaries: CityBoundaries,
  cityStatsData: CityStatsCollection<T>,
): [GeoJSON, CityEntryCollection<T>] {
  const cityEntries: CityEntryCollection<T> = {};
  const boundaries = geoJSON(cityBoundaries, {
    style() {
      return STYLES.cities;
    },
    onEachFeature(feature, layer: ImageOverlay) {
      const cityId = feature.properties.id;
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
  viewState: ViewStateObservable,
  map: Map,
  cityBoundaries: GeoJSON,
): void {
  cityBoundaries.addEventListener("click", (e) => {
    const currentZoom = map.getZoom();
    // Only change cities if zoomed in enough.
    if (currentZoom <= 7) return;
    const cityId = e.sourceTarget.feature.properties.id;
    viewState.setValue({ cityId, shouldSnapMap: true });
  });
}
