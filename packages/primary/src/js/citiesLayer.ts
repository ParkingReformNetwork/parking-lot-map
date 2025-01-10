import { ImageOverlay, Map, geoJSON, GeoJSON } from "leaflet";

import type {
  CityEntryCollection,
  CityStatsCollection,
  CityBoundaries,
} from "@prn-parking-lots/shared/src/js/types";
import { STYLES } from "./map";
import { ViewStateObservable } from "@prn-parking-lots/shared/src/js/ViewState";

/**
 * Load the cities from GeoJson and associate each city with its layer and scorecard entry.
 */
export function createCitiesLayer(
  map: Map,
  cityBoundaries: CityBoundaries,
  cityStatsData: CityStatsCollection,
): [GeoJSON, CityEntryCollection] {
  const cityEntries: CityEntryCollection = {};
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
