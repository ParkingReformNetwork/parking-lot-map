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
import updateIconsShareLink from "./share";
import { setScorecard, setUpScorecardAccordionListener } from "./scorecard";
import setUpDropdown, { DROPDOWN } from "./dropdown";

import cityBoundaries from "~/data/city-boundaries.geojson";
import scoreCardsDetails from "~/data/score-cards.json";
import ParkingLotLoader from "./ParkingLotLoader";

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

/**
 * Pulls up scorecard for the city closest to the center of view.
 * Also, loads parking lot data of any city in view.
 *
 * @param map: The Leaflet map instance.
 * @param cities: Dictionary of cities with layer and scorecard info.
 * @param parkingLayer: GeoJSON layer with parking lot data
 */
const setUpAutoScorecard = async (
  map: Map,
  cities: ScoreCards,
  parkingLayer: GeoJSON,
  parkingLotLoader: ParkingLotLoader
): Promise<void> => {
  map.on("moveend", async () => {
    let centralCityDistance: number | null = null;
    let centralCity;
    Object.entries(cities).forEach((city) => {
      const [cityName, scoreCard] = city;
      const bounds = scoreCard.layer.getBounds();

      if (bounds && map.getBounds().intersects(bounds)) {
        const diff = map.getBounds().getCenter().distanceTo(bounds.getCenter());
        parkingLotLoader.load(cityName, parkingLayer);
        if (centralCityDistance == null || diff < centralCityDistance) {
          centralCityDistance = diff;
          centralCity = cityName;
        }
      }
    });
    if (centralCity) {
      DROPDOWN.setChoiceByValue(centralCity);
      setScorecard(cities[centralCity].details);
      updateIconsShareLink(centralCity);
    }
  });
};

/**
 * Load the cities from GeoJson and set up an event listener to change cities when the user
 * toggles the city selection.
 */
async function setUpCitiesLayer(
  map: Map,
  parkingLayer: GeoJSON,
  parkingLotLoader: ParkingLotLoader
): Promise<void> {
  const cities: ScoreCards = {};
  const allBoundaries = geoJSON(cityBoundaries, {
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

  // Set up map to update when city selection changes.
  const cityToggleElement =
    document.querySelector<HTMLSelectElement>("#city-dropdown");
  if (!cityToggleElement) return;
  cityToggleElement.addEventListener("change", async () => {
    const cityId = cityToggleElement.value;
    const { layer } = cities[cityId];
    if (layer) {
      snapToCity(map, layer);
    }
  });

  // Set up map to update when user clicks within a city's boundary
  allBoundaries.addEventListener("click", (e) => {
    const currentZoom = map.getZoom();
    if (currentZoom <= 7) return;
    const cityId = e.sourceTarget.feature.properties.id;
    cityToggleElement.value = cityId;
    const { layer } = cities[cityId];
    if (layer) {
      snapToCity(map, layer);
    }
  });

  // Load initial city.
  const cityId = cityToggleElement.value;
  setUpAutoScorecard(map, cities, parkingLayer, parkingLotLoader);
  snapToCity(map, cities[cityId].layer);
  setScorecard(cities[cityId].details);
  updateIconsShareLink(cityId);
}

/**
 * Creates a GeoJSON layer to hold all parking lot polygons.
 * Every cites' parking lots will be lazily added to this layer.
 */
async function setUpParkingLotsLayer(map: Map): Promise<GeoJSON> {
  const parkingLayer = geoJSON(undefined, {
    style() {
      return STYLES.parkingLots;
    },
  }).addTo(map);

  if (window.location.href.indexOf("#lots-toggle") === -1) return parkingLayer;

  // If `#lots-toggle` is in the URL, we show buttons to toggle parking lots.
  const toggle: HTMLAnchorElement | null =
    document.querySelector("#lots-toggle");
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
  setUpScorecardAccordionListener();

  const initialCityId = extractCityIdFromUrl(window.location.href);
  setUpDropdown(initialCityId, "atlanta-ga");

  const parkingLotLoader = new ParkingLotLoader();

  const map = createMap();
  const parkingLayer = await setUpParkingLotsLayer(map);
  await setUpCitiesLayer(map, parkingLayer, parkingLotLoader);

  // There have been some issues on Safari with the map only rendering the top 20%
  // on the first page load. This is meant to address that.
  map.invalidateSize();
}

export default setUpSite;
