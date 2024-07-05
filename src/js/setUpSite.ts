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
  "High contrast": new TileLayer(
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
 * This sets up Google Maps vs. High contrast, attribution, and zoom.
 */
const createMap = (): Map => {
  const map = new Map("map", {
    layers: [BASE_LAYERS["High contrast"]],
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
 */
const generateScorecard = (entry: ScoreCardDetails): string => {
  const header = `
    <div class="scorecard-title">${entry.name}</div>
    <div class="share-icon-container-outer">
      <a href="#" class="share-icon-container">
        <i class="share-link-icon fa-solid fa-link fa-xl" title="Copy link"></i>
        <i class="share-check-icon fa-solid fa-check fa-xl" title="Link Copied!" style="display: none"></i>
      </a>
    </div>
    `;

  const lines = ["<hr>"];
  lines.push(`<p>Parking: ${entry.percentage} of central city</p>`);
  if (entry.parkingScore) {
    lines.push(`<p>Parking score: ${entry.parkingScore}</p>`);
  }
  lines.push(`<p>Parking reform: ${entry.reforms}</p>`);
  lines.push("<br />");
  lines.push(`<p>City type: ${entry.cityType}</p>`);
  lines.push(`<p>Population: ${entry.population}</p>`);
  lines.push(
    `<p>Urbanized area population: ${entry.urbanizedAreaPopulation}</p>`
  );

  if ("contribution" in entry) {
    lines.push("<hr>");
    lines.push(
      `<div><span class="community-tag"><i class="fa-solid fa-triangle-exclamation"></i> Community-maintained map. <br>Email ${entry.contribution} for issues.</span></div>`
    );
  }
  if (entry.url) {
    lines.push(
      "<hr>",
      `<div class="popup-button"><a href="${entry.url}">View more about reforms</a></div>`
    );
  }
  return header + lines.join("\n");
};

/**
 * Load city parking lots if not already loaded.
 */
const loadParkingLot = async (
  cityId: CityId,
  parkingLayer: GeoJSON<GeoJsonProperties, Geometry>
): Promise<void> => {
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
const snapToCity = (map: Map, layer: ImageOverlay): void => {
  map.fitBounds(layer.getBounds());
};

const setScorecard = (cityId: CityId, cityProperties: ScoreCard): void => {
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
const setUpAutoScorecard = async (
  map: Map,
  cities: ScoreCards,
  parkingLayer: GeoJSON<GeoJsonProperties, Geometry>
): Promise<void> => {
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
const setUpCitiesLayer = async (
  map: Map,
  parkingLayer: GeoJSON<GeoJsonProperties, Geometry>
): Promise<void> => {
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
  const cityToggleElement = document.getElementById("city-dropdown");
  if (!(cityToggleElement instanceof HTMLSelectElement)) return;
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
  setUpAutoScorecard(map, cities, parkingLayer);
  snapToCity(map, cities[cityId].layer);
  setScorecard(cityId, cities[cityId]);
};

/**
 * Creates a GeoJSON layer to hold all parking lot polygons.
 * Every cites' parking lots will be lazily added to this layer.
 */
const setUpParkingLotsLayer = async (
  map: Map
): Promise<GeoJSON<GeoJsonProperties, Geometry>> => {
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
    toggle.style.display = "block";
  }
  document.querySelector("#lots-toggle-off")?.addEventListener("click", () => {
    parkingLayer.removeFrom(map);
  });
  document.querySelector("#lots-toggle-on")?.addEventListener("click", () => {
    parkingLayer.addTo(map);
  });
  return parkingLayer;
};

const setUpSite = async (): Promise<void> => {
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
