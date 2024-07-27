/* global document, window */
import {
  Control,
  ImageOverlay,
  Map,
  TileLayer,
  geoJSON,
  GeoJSON,
} from "leaflet";
import "leaflet/dist/leaflet.css";

import { ScoreCard, ScoreCards } from "./types";
import { extractCityIdFromUrl } from "./cityId";
import setUpIcons from "./fontAwesome";
import maybeDisableFullScreenIcon from "./iframe";
import setUpAbout from "./about";
import addShareLinkSubscriber from "./share";
import addScorecardSubscriber from "./scorecard";
import setUpDropdown from "./dropdown";
import ParkingLotLoader from "./ParkingLotLoader";
import { GlobalStateObservable, initGlobalState } from "./GlobalState";

import cityBoundariesGeojson from "~/data/city-boundaries.geojson";
import scoreCardsDetails from "~/data/score-cards.json";

const MAX_ZOOM = 18;
const BASE_LAYERS = {
  "High contrast": new TileLayer(
    "https://tiles.stadiamaps.com/tiles/stamen_toner_lite/{z}/{x}/{y}{r}.png",
    {
      attribution: `&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>
        &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a>
        &copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a>
        &copy; <a href="https://www.stamen.com/" target="_blank">Stamen Design</a>`,
      subdomains: "abcd",
      minZoom: 0,
      maxZoom: MAX_ZOOM,
    }
  ),
  "Google Maps": new TileLayer(
    "https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
    {
      attribution: `&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; Google Maps`,
      maxZoom: MAX_ZOOM,
    }
  ),
};

const STYLES = {
  cities: {
    fillColor: "##c84041",
    color: "#c84041",
    weight: 4,
    fillOpacity: 0,
  },
  parkingLots: {
    fillColor: "#FF0000",
    color: "#FF0000",
    weight: 1,
    fillOpacity: 0.6,
  },
};

/**
 * Create the initial map object.
 *
 * This sets up Google Maps vs. High contrast, attribution, and zoom.
 */
function createMap(): Map {
  const map = new Map("map", {
    layers: [BASE_LAYERS["High contrast"]],
  });
  map.attributionControl.setPrefix(
    '<a href="https://parkingreform.org/support/">Parking Reform Network</a>'
  );

  new Control.Layers(BASE_LAYERS).addTo(map);
  map.createPane("fixed", document.getElementById("map") || undefined);
  return map;
}

function addParkingLotLoadSubscriber(
  globalState: GlobalStateObservable,
  parkingLayer: GeoJSON,
  parkingLotLoader: ParkingLotLoader
): void {
  globalState.subscribe(({ cityId }) =>
    parkingLotLoader.load(cityId, parkingLayer)
  );
}

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
  globalState: GlobalStateObservable,
  map: Map,
  cities: ScoreCards
): void {
  globalState.subscribe((state) => {
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
  globalState: GlobalStateObservable,
  map: Map,
  cities: ScoreCards,
  parkingLayer: GeoJSON,
  parkingLotLoader: ParkingLotLoader
): void {
  map.on("moveend", () => {
    let centralCityDistance: number | null = null;
    let centralCity;
    Object.entries(cities).forEach(([cityId, scorecard]) => {
      const bounds = scorecard.layer.getBounds();
      if (!map.getBounds().intersects(bounds)) return;
      parkingLotLoader.load(cityId, parkingLayer);

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
      globalState.setValue({ cityId: centralCity, shouldSnapMap: false });
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
  globalState: GlobalStateObservable,
  map: Map,
  cityBoundaries: GeoJSON
): void {
  cityBoundaries.addEventListener("click", (e) => {
    const currentZoom = map.getZoom();
    // Only change cities if zoomed in enough.
    if (currentZoom <= 7) return;
    const cityId = e.sourceTarget.feature.properties.id;
    globalState.setValue({ cityId, shouldSnapMap: true });
  });
}

/**
 * Creates a GeoJSON layer to hold all parking lot polygons.
 * Every cites' parking lots will be lazily added to this layer.
 */
function createParkingLotsLayer(map: Map): GeoJSON {
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

async function setUpSite(): Promise<void> {
  setUpIcons();
  maybeDisableFullScreenIcon();
  setUpAbout();

  const map = createMap();
  const parkingLayer = createParkingLotsLayer(map);
  const [cityBoundaries, cities] = createCitiesLayer(map);

  const initialCityId = extractCityIdFromUrl(window.location.href);
  const globalState = initGlobalState(initialCityId, "atlanta-ga");
  const parkingLotLoader = new ParkingLotLoader();

  setUpDropdown(globalState);
  addScorecardSubscriber(globalState, cities);
  addShareLinkSubscriber(globalState);
  addSnapToCitySubscriber(globalState, map, cities);
  addParkingLotLoadSubscriber(globalState, parkingLayer, parkingLotLoader);

  setCityOnBoundaryClick(globalState, map, cityBoundaries);
  setCityByMapPosition(
    globalState,
    map,
    cities,
    parkingLayer,
    parkingLotLoader
  );

  globalState.initialize();

  // There have been some issues on Safari with the map only rendering the top 20%
  // on the first page load. This is meant to address that.
  map.invalidateSize();
}

export default setUpSite;
