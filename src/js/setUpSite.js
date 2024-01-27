/* global document, navigator, window */
import { Control, Map, Popup, TileLayer, geoJSON } from "leaflet";
import "leaflet/dist/leaflet.css";

import { determineShareUrl, extractCityIdFromUrl } from "./cityId";
import setUpIcons from "./fontAwesome";
import scoreCardsData from "../../data/score-cards.json";
import setUpAbout from "./about";

const parkingLots = import("../../data/parking-lots/*"); // eslint-disable-line

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
      ext: "png",
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

const addCitiesToToggle = (initialCityId, fallbackCityId) => {
  const cityToggleElement = document.getElementById("city-choice");
  let validInitialId = false;
  Object.entries(scoreCardsData).forEach(([id, { Name }]) => {
    if (id === initialCityId) {
      validInitialId = true;
    }
    const option = document.createElement("option");
    option.value = id;
    option.textContent = Name;
    cityToggleElement.appendChild(option);
  });
  cityToggleElement.value = validInitialId ? initialCityId : fallbackCityId;
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
  map.createPane("fixed", document.getElementById("map"));
  return map;
};

/**
 * Copy `value` to the user's clipboard and show the copied link message.
 *
 * @param string value
 */
const copyToClipboard = async (value) => {
  try {
    await navigator.clipboard.writeText(value);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Failed to write to clipboard: ", err);
  }

  const copiedLinkMessageElement = document.querySelector(
    ".copied-link-message"
  );
  copiedLinkMessageElement.style.display = "block";
  setTimeout(() => {
    copiedLinkMessageElement.style.display = "none";
  }, 1000);
};

/**
 * Add an event listener for the share button to copy the link to the clipboard.
 *
 * @param string cityId: e.g. `st.-louis-mo`
 */
const setUpShareUrlClickListener = (cityId) => {
  // We put the event listener on `map` because it is never erased, unlike the copy button
  // being recreated every time the score card changes. This is called "event delegation".
  document.querySelector("#map").addEventListener("click", async (event) => {
    const targetElement = event.target.closest("div.url-copy-button > a");
    if (targetElement) {
      const shareUrl = determineShareUrl(window.location.href, cityId);
      await copyToClipboard(shareUrl);
    }
  });
};

/**
 * Generate the HTML for the score card.
 *
 * @param scoreCardEntry: An entry from score-cards.json.
 * @returns string: The HTML represented as a string.
 */
const generateScorecard = (scoreCardEntry) => {
  const {
    Name,
    cityType,
    Percentage,
    Population,
    urbanizedAreaPopulation,
    "Parking Score": ParkingScore,
    Reforms,
    "Website URL": WebsiteURL,
  } = scoreCardEntry;
  let result = `
    <div class="title">${Name}</div>
    <div class="url-copy-button"><a href="#"><i class="fa-solid fa-link fa-xl"></i></a></div>
    <hr>
    <div><span class="details-title">Parking: </span><span class="details-value">${Percentage} of central city</span></div>
    <div><span class="details-title">Parking score: </span><span class="details-value">${ParkingScore}</span></div>
    <div><span class="details-title">Parking reform: </span><span class="details-value">${Reforms}</span></div>
    <br />
    <div><span class="details-title">City type: </span><span class="details-value">${cityType}</span></div>
    <div><span class="details-title">Population: </span><span class="details-value">${Population}</span></div>
    <div><span class="details-title">Urbanized area population: </span><span class="details-value">${urbanizedAreaPopulation}</span></div>
  `;
  if (WebsiteURL) {
    result += `
    <hr>
    <div class="popup-button"><a href="${WebsiteURL}">View more about reforms</a></div>
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
const loadParkingLot = async (cityId, parkingLayer) => {
  let load = true;
  parkingLayer.getLayers().forEach((loadedCity) => {
    if (loadedCity.feature.properties.id === cityId) {
      load = false;
    }
  });
  if (load) {
    parkingLayer.addData(await parkingLots[`${cityId}.geojson`]());
    parkingLayer.bringToBack(); // Ensures city boundary is on top
  }
};

/**
 * Centers view to city.
 *
 * @param map: The Leaflet map instance.
 * @param layer: The Leaflet layer with the city boundaries to snap to.
 */
const snapToCity = async (map, layer) => {
  map.fitBounds(layer.getBounds());
};

/**
 * Sets scorecard to city.
 *
 * @param cityId: E.g. `columbus-oh`.
 * @param cityProperties: An object with a `layout` key (Leaflet value) and keys
 *    representing the score card properties stored in `score-cards.json`.
 */
const setScorecard = (cityId, cityProperties) => {
  const { layer } = cityProperties;
  const scorecard = generateScorecard(cityProperties);
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
const setUpAutoScorecard = async (map, cities, parkingLayer) => {
  map.on("moveend", async () => {
    let centralCityDistance = null;
    let centralCity;
    Object.entries(cities).forEach((city) => {
      const [cityName, details] = city;
      const bounds = details.layer.getBounds();

      if (map.getBounds().intersects(bounds)) {
        const diff = map.getBounds().getCenter().distanceTo(bounds.getCenter());
        loadParkingLot(cityName, parkingLayer); // Load parking lot data on any city in view
        if (centralCityDistance == null || diff < centralCityDistance) {
          centralCityDistance = diff;
          centralCity = cityName;
        }
      }
    });
    if (centralCity) {
      document.getElementById("city-choice").value = centralCity;
      setScorecard(centralCity, cities[centralCity]);
    }
  });
};

/**
 * Load the cities from GeoJson and set up an event listener to change cities when the user
 * toggles the city selection.
 */
const setUpCitiesLayer = async (map, parkingLayer) => {
  const cities = {};
  const cityBoundariesData = await import("../../data/city-boundaries.geojson");
  const allBoundaries = geoJSON(cityBoundariesData, {
    style() {
      return STYLES.cities;
    },
    onEachFeature(feature, layer) {
      const cityId = feature.properties.id;
      cities[cityId] = { layer, ...scoreCardsData[cityId] };
      layer.on("add", () => {
        layer.getElement().setAttribute("id", cityId);
      });
    },
  });

  allBoundaries.addTo(map);

  // Set up map to update when city selection changes.
  const cityToggleElement = document.getElementById("city-choice");
  cityToggleElement.addEventListener("change", async () => {
    const cityId = cityToggleElement.value;
    snapToCity(map, cities[cityId]);
  });

  // Set up map to update when user clicks within a city's boundary
  allBoundaries.addEventListener("click", (e) => {
    const currentZoom = map.getZoom();
    if (currentZoom > 7) {
      const cityId = e.sourceTarget.feature.properties.id;
      cityToggleElement.value = cityId;
      snapToCity(map, cities[cityId]);
    }
  });

  // Load initial city.
  const cityId = cityToggleElement.value;
  setUpAutoScorecard(map, cities, parkingLayer);
  snapToCity(map, cities[cityId]);
  setScorecard(cityId, cities[cityId]);
};

/**
 * Creates a GeoJSON layer to hold all parking lot polygons.
 * Every cites' parking lots will be lazily added to this layer.
 *
 * @param map: The Leaflet map instance.
 */
const setUpParkingparkingLayer = async (map) => {
  const parkingLayer = geoJSON(null, {
    style() {
      return STYLES.parkingLots;
    },
  }).addTo(map);

  // If `#lots-toggle` is in the URL, we show buttons to toggle parking lots.
  if (window.location.href.indexOf("#lots-toggle") !== -1) {
    document.querySelector("#lots-toggle").style.display = "block";
    document.querySelector("#lots-toggle-on").addEventListener("click", () => {
      parkingLayer.removeFrom(map);
    });
    document.querySelector("#lots-toggle-off").addEventListener("click", () => {
      parkingLayer.addTo(map);
    });
  }
  return parkingLayer;
};

const setUpSite = async () => {
  setUpIcons();

  const initialCityId = extractCityIdFromUrl(window.location.href);
  addCitiesToToggle(initialCityId, "atlanta-ga");
  setUpAbout();

  const map = createMap();
  const parkingLayer = await setUpParkingparkingLayer(map);
  await setUpCitiesLayer(map, parkingLayer);

  // There have been some issues on Safari with the map only rendering the top 20%
  // on the first page load. This is meant to address that.
  map.invalidateSize();
};

export default setUpSite;
