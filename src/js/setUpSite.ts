import { ImageOverlay, Map, geoJSON, GeoJSON } from "leaflet";
import "leaflet/dist/leaflet.css";

import { ScoreCard, ScoreCards } from "./types";
import { extractCityIdFromUrl } from "./cityId";
import setUpIcons from "./fontAwesome";
import maybeDisableFullScreenIcon from "./iframe";
import setUpAbout from "./about";
import addShareLinkSubscriber from "./share";
import addScorecardSubscriber from "./scorecard";
import setUpDropdown from "./dropdown";
import { createMap, STYLES } from "./map";
import ParkingLotLoader from "./ParkingLotLoader";
import {
  CitySelectionObservable,
  initCitySelectionState,
} from "./CitySelectionState";

import cityBoundariesGeojson from "~/data/city-boundaries.geojson";
import scoreCardsDetails from "~/data/score-cards.json";

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

function addSnapToCitySubscriber(
  observable: CitySelectionObservable,
  map: Map,
  cities: ScoreCards,
): void {
  observable.subscribe((state) => {
    if (!state.shouldSnapMap) return;
    snapToCity(map, cities[state.cityId].layer);
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
  cities: ScoreCards,
  parkingLotLoader: ParkingLotLoader,
): void {
  map.on("moveend", () => {
    let centralCityDistance: number | null = null;
    let centralCity;
    Object.entries(cities).forEach(([cityId, scorecard]) => {
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
function createCitiesLayer(map: Map): [GeoJSON, ScoreCards] {
  const cities: ScoreCards = {};
  const allBoundaries = geoJSON(cityBoundariesGeojson, {
    style() {
      return STYLES.cities;
    },
    onEachFeature(feature, layer: ImageOverlay) {
      const cityId = feature.properties.id;
      cities[cityId] = {
        layer,
        details: scoreCardsDetails[cityId],
      } as ScoreCard;
      layer.on("add", () => {
        layer.getElement()?.setAttribute("id", cityId);
      });
    },
  });

  allBoundaries.addTo(map);
  return [allBoundaries, cities];
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

async function setUpSite(): Promise<void> {
  setUpIcons();
  maybeDisableFullScreenIcon();
  setUpAbout();

  const map = createMap();
  const [cityBoundaries, cities] = createCitiesLayer(map);

  const parkingLotLoader = new ParkingLotLoader(map);

  const initialCityId = extractCityIdFromUrl(window.location.href);
  const citySelectionObservable = initCitySelectionState(
    initialCityId,
    "atlanta-ga",
  );

  setUpDropdown(citySelectionObservable);
  addScorecardSubscriber(citySelectionObservable, cities);
  addShareLinkSubscriber(citySelectionObservable);
  addSnapToCitySubscriber(citySelectionObservable, map, cities);
  parkingLotLoader.subscribeToCitySelection(citySelectionObservable);

  setCityOnBoundaryClick(citySelectionObservable, map, cityBoundaries);
  setCityByMapPosition(citySelectionObservable, map, cities, parkingLotLoader);

  citySelectionObservable.initialize();

  // There have been some issues on Safari with the map only rendering the top 20%
  // on the first page load. This is meant to address that.
  map.invalidateSize();
}

export default setUpSite;
