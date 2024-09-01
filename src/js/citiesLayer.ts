import { ImageOverlay, Map, geoJSON, GeoJSON } from "leaflet";

import { CityEntry, CityEntryCollection } from "./types";
import { STYLES } from "./map";
import { CitySelectionObservable } from "./CitySelectionState";

import cityBoundariesGeojson from "~/data/city-boundaries.geojson";
import cityStatsData from "~/data/city-stats.json";

/**
 * Load the cities from GeoJson and associate each city with its layer and scorecard entry.
 */
export function createCitiesLayer(map: Map): [GeoJSON, CityEntryCollection] {
  const cityEntries: CityEntryCollection = {};
  const boundaries = geoJSON(cityBoundariesGeojson, {
    style() {
      return STYLES.cities;
    },
    onEachFeature(feature, layer: ImageOverlay) {
      const cityId = feature.properties.id;
      cityEntries[cityId] = {
        layer,
        stats: cityStatsData[cityId],
      } as CityEntry;
      layer.on("add", () => {
        layer.getElement()?.setAttribute("id", cityId);
      });
    },
  });

  boundaries.addTo(map);
  return [boundaries, cityEntries];
}

export function setCityOnBoundaryClick(
  observable: CitySelectionObservable,
  map: Map,
  cityBoundaries: GeoJSON,
): void {
  cityBoundaries.addEventListener("click", (e) => {
    const currentZoom = map.getZoom();
    // Only change cities if zoomed in enough.
    if (currentZoom <= 7) return;
    const cityId = e.sourceTarget.feature.properties.id;
    observable.setValue({ cityId, shouldSnapMap: true });
  });
}
