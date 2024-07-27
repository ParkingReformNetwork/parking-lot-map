import { ImageOverlay, Map, geoJSON, GeoJSON } from "leaflet";
import "leaflet/dist/leaflet.css";

import { CityEntry, CityEntryCollection } from "./types";
import { extractCityIdFromUrl } from "./cityId";
import initIcons from "./fontAwesome";
import maybeDisableFullScreenIcon from "./iframe";
import initAbout from "./about";
import subscribeShareLink from "./share";
import subscribeScorecard from "./scorecard";
import initDropdown from "./dropdown";
import { createMap, STYLES } from "./map";
import ParkingLotLoader from "./ParkingLotLoader";
import {
  CitySelectionObservable,
  initCitySelectionState,
} from "./CitySelectionState";

import cityBoundariesGeojson from "~/data/city-boundaries.geojson";
import cityStatsData from "~/data/city-stats.json";

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

function subscribeSnapToCity(
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
function setCityByMapPosition(
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

/**
 * Load the cities from GeoJson and associate each city with its layer and scorecard entry.
 */
function createCitiesLayer(map: Map): [GeoJSON, CityEntryCollection] {
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

function setCityOnBoundaryClick(
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

export default async function setUpSite(): Promise<void> {
  initIcons();
  maybeDisableFullScreenIcon();
  initAbout();

  const map = createMap();
  const [cityBoundaries, cityEntries] = createCitiesLayer(map);

  const parkingLotLoader = new ParkingLotLoader(map);

  const initialCityId = extractCityIdFromUrl(window.location.href);
  const citySelectionObservable = initCitySelectionState(
    initialCityId,
    "atlanta-ga",
  );

  initDropdown(citySelectionObservable);
  subscribeScorecard(citySelectionObservable, cityEntries);
  subscribeShareLink(citySelectionObservable);
  subscribeSnapToCity(citySelectionObservable, map, cityEntries);
  parkingLotLoader.subscribe(citySelectionObservable);

  setCityOnBoundaryClick(citySelectionObservable, map, cityBoundaries);
  setCityByMapPosition(
    citySelectionObservable,
    map,
    cityEntries,
    parkingLotLoader,
  );

  citySelectionObservable.initialize();

  // There have been some issues on Safari with the map only rendering the top 20%
  // on the first page load. This is meant to address that.
  map.invalidateSize();
}
