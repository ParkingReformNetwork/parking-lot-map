/* global document, window */
import {
  Control,
  ImageOverlay,
  Map,
  Popup,
  TileLayer,
  geoJSON,
  GeoJSON,
} from "leaflet";
import { Feature, GeoJsonProperties, Geometry } from "geojson";
import "leaflet/dist/leaflet.css";
import { CityId, ScoreCard, ScoreCards, ScoreCardDetails } from "./types";
import { extractCityIdFromUrl } from "./cityId";
import setUpIcons from "./fontAwesome";
import setUpAbout from "./about";
import setUpShareUrlClickListener from "./share";
import setUpDropdown, { DROPDOWN } from "./dropdown";
import cityBoundaries from "~/data/city-boundaries.geojson";
import scoreCardsDetails from "~/data/score-cards.json";

interface ParkingLotModules {
  [key: string]: () => Promise<Feature<Geometry>>;
}

const parkingLotsModules = import(
  "~/data/parking-lots/*"
) as unknown as ParkingLotModules;

const MAX_ZOOM = 18;
const BASE_LAYERS = {
  Light: new TileLayer(
    "https://tiles.stadiamaps.com/tiles/stamen_toner_lite/{z}/{x}/{y}{r}.png",
    {
      attribution: `Map tiles: &copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a>
        &copy; <a href="https://www.stamen.com/" target="_blank">Stamen Design</a>
        &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a>`,
      subdomains: "abcd",
      minZoom: 0,
      maxZoom: MAX_ZOOM,
    }
  ),
  "Google Maps": new TileLayer(
    "https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
    {
      attribution: "Map tiles: Google Maps",
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
 * This sets up Google Maps vs. Light mode, attribution, and zoom.
 *
 * @returns: The map instance.
 */
const createMap = () => {
  const map = new Map("map", {
    layers: [BASE_LAYERS.Light],
    closePopupOnClick: false,
  });
  map.attributionControl.setPrefix(
    'Map data: <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  );

  new Control.Layers(BASE_LAYERS).addTo(map);
  map.createPane("fixed", document.getElementById("map") || undefined);
  return map;
};

/**
 * Generate the HTML for the score card.
 *
 * @param scoreCardEntry: An entry from score-cards.json.
 * @returns string: The HTML represented as a string.
 */
const generateScorecard = (scoreCardEntry: ScoreCardDetails) => {
  const {
    name,
    cityType,
    percentage,
    population,
    urbanizedAreaPopulation,
    parkingScore,
    reforms,
    url,
  } = scoreCardEntry;
  let result = `
    <div class="title">${name}</div>
    <div class="url-copy-button">
      <a href="#" class="share-icon">
        <i class="share-link-icon fa-solid fa-link fa-xl" title="Copy link"></i>
        <i class="share-check-icon fa-solid fa-check fa-xl" title="Link Copied!" style="display: none"></i>
      </a>
    </div>
    <hr>
    <div><span class="details-title">Parking: </span><span class="details-value">${percentage} of central city</span></div>
    <div><span class="details-title">Parking score: </span><span class="details-value">${parkingScore}</span></div>
    <div><span class="details-title">Parking reform: </span><span class="details-value">${reforms}</span></div>
    <br />
    <div><span class="details-title">City type: </span><span class="details-value">${cityType}</span></div>
    <div><span class="details-title">Population: </span><span class="details-value">${population}</span></div>
    <div><span class="details-title">Urbanized area population: </span><span class="details-value">${urbanizedAreaPopulation}</span></div>
  `;
  if (url) {
    result += `
    <hr>
    <div class="popup-button"><a href="${url}">View more about reforms</a></div>
  `;
  }
  return result;
};

/**
 * Load city parking lots if not already loaded.
 *
 * @param cityId: E.g. `columbus-oh`.
 * @param parkingLayer: GeoJSON layer with parking lot data
 */
const loadParkingLot: (
  cityId: CityId,
  parkingLayer: GeoJSON<GeoJsonProperties, Geometry>
) => Promise<void> = async (cityId, parkingLayer) => {
  const alreadyLoaded = parkingLayer
    .getLayers()
    .find((city: GeoJsonProperties) => city?.feature.properties.id === cityId);
  if (!alreadyLoaded) {
    parkingLayer.addData(await parkingLotsModules[`${cityId}.geojson`]());
    parkingLayer.bringToBack(); // Ensures city boundary is on top")
  }
};

/**
 * Centers view to city.
 *
 * @param map: The Leaflet map instance.
 * @param layer: The Leaflet layer with the city boundaries to snap to.
 */
const snapToCity: (map: Map, layer: ImageOverlay) => void = async (
  map,
  layer
) => {
  map.fitBounds(layer.getBounds());
};

/**
 * Sets scorecard to city.
 *
 * @param cityId: E.g. `columbus-oh`.
 * @param cityProperties: An object with a `layout` key (Leaflet value) and keys
 *    representing the score card properties stored in `score-cards.json`.
 */
const setScorecard: (cityId: CityId, cityProperties: ScoreCard) => void = (
  cityId,
  cityProperties
) => {
  const { layer, details } = cityProperties;
  const scorecard = generateScorecard(details);
  setUpShareUrlClickListener(cityId);
  const popup = new Popup({
    pane: "fixed",
    className: "popup-fixed",
    autoPan: false,
  }).setContent(scorecard);
  layer.bindPopup(popup).openPopup();
};

/**
 * Pulls up scorecard for the city closest to the center of view.
 * Also, loads parking lot data of any city in view.
 *
 * @param map: The Leaflet map instance.
 * @param cities: Dictionary of cities with layer and scorecard info.
 * @param parkingLayer: GeoJSON layer with parking lot data
 */
const setUpAutoScorecard: (
  map: Map,
  cities: ScoreCards,
  parkingLayer: GeoJSON<GeoJsonProperties, Geometry>
) => Promise<void> = async (map, cities, parkingLayer) => {
  map.on("moveend", async () => {
    let centralCityDistance: number | null = null;
    let centralCity;
    Object.entries(cities).forEach((city) => {
      const [cityName, scoreCard] = city;
      const bounds = scoreCard.layer.getBounds();

      if (bounds && map.getBounds().intersects(bounds)) {
        const diff = map.getBounds().getCenter().distanceTo(bounds.getCenter());
        loadParkingLot(cityName, parkingLayer); // Load parking lot data on any city in view
        if (centralCityDistance == null || diff < centralCityDistance) {
          centralCityDistance = diff;
          centralCity = cityName;
        }
      }
    });
    if (centralCity) {
      DROPDOWN.setChoiceByValue(centralCity);
      setScorecard(centralCity, cities[centralCity]);
    }
  });
};

/**
 * Load the cities from GeoJson and set up an event listener to change cities when the user
 * toggles the city selection.
 */
const setUpCitiesLayer: (
  map: Map,
  parkingLayer: GeoJSON<GeoJsonProperties, Geometry>
) => Promise<void> = async (map, parkingLayer) => {
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
  const cityToggleElement = document.getElementById("city-choice");
  if (cityToggleElement instanceof HTMLSelectElement) {
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
      if (currentZoom > 7) {
        const cityId = e.sourceTarget.feature.properties.id;
        cityToggleElement.value = cityId;
        const { layer } = cities[cityId];
        if (layer) {
          snapToCity(map, layer);
        }
      }
    });

    // Load initial city.
    const cityId = cityToggleElement.value;
    setUpAutoScorecard(map, cities, parkingLayer);
    snapToCity(map, cities[cityId].layer);
    setScorecard(cityId, cities[cityId]);
  } else {
    throw new Error("#city-choice is not a select element");
  }
};

/**
 * Creates a GeoJSON layer to hold all parking lot polygons.
 * Every cites' parking lots will be lazily added to this layer.
 *
 * @param map: The Leaflet map instance.
 */
const setUpParkingLotsLayer: (
  map: Map
) => Promise<GeoJSON<GeoJsonProperties, Geometry>> = async (map) => {
  const parkingLayer = geoJSON(undefined, {
    style() {
      return STYLES.parkingLots;
    },
  }).addTo(map);

  // If `#lots-toggle` is in the URL, we show buttons to toggle parking lots.
  if (window.location.href.indexOf("#lots-toggle") !== -1) {
    const toggle: HTMLAnchorElement | null =
      document.querySelector("#lots-toggle");
    if (toggle) {
      toggle.style.display = "block";
    }
    document
      .querySelector("#lots-toggle-off")
      ?.addEventListener("click", () => {
        parkingLayer.removeFrom(map);
      });
    document.querySelector("#lots-toggle-on")?.addEventListener("click", () => {
      parkingLayer.addTo(map);
    });
  }
  return parkingLayer;
};

const setUpSite: () => Promise<void> = async () => {
  setUpIcons();

  const initialCityId = extractCityIdFromUrl(window.location.href);
  setUpDropdown(initialCityId, "atlanta-ga");
  setUpAbout();

  const map = createMap();
  const parkingLayer = await setUpParkingLotsLayer(map);
  await setUpCitiesLayer(map, parkingLayer);

  // There have been some issues on Safari with the map only rendering the top 20%
  // on the first page load. This is meant to address that.
  map.invalidateSize();
};

export default setUpSite;
