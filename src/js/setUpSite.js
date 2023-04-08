/* global document, window */
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";

import { determineShareUrl, extractCityIdFromUrl } from "./cityId";
import { createZoomHome } from "./vendor/leaflet.zoomhome";
import citiesData from "../../data/cities-polygons.geojson";
import parkingLotsData from "../../data/parking-lots.geojson";

const addCitiesToToggle = (initialCityId) => {
  const cityToggleElement = document.getElementById("city-choice");
  citiesData.features.forEach(({properties: {id, Name}}) => {
    const option = document.createElement("option");
    option.value = id;
    option.textContent = Name;
    cityToggleElement.appendChild(option);
  });
  cityToggleElement.value = initialCityId;
}

/**
 * Set up event listeners to open and close the about popup.
 */
const setUpAbout = () => {
  const aboutElement = document.querySelector(".about-text-popup");
  document.querySelector(".banner-about").addEventListener("click", () => {
    aboutElement.style.display =
      aboutElement.style.display !== "block" ? "block" : "none";
  });

  // Note that the close element will only render when the about text popup is rendered.
  // So, it only ever makes sense for a click to close.
  document.querySelector(".about-close").addEventListener("click", () => {
    aboutElement.style.display = "none";
  });
};

const defineBaseLayers = () => ({
  Light: L.tileLayer(
    "https://stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}{r}.{ext}",
    {
      attribution:
        'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      subdomains: "abcd",
      minZoom: 0,
      maxZoom: 20,
      ext: "png",
    }
  ),
  "Google Maps": L.tileLayer(
    "https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
    {
      attribution: "Google Maps",
      // Max value is 24 but I set it to 20 because the Stamen Toner style has value of 20 as max value.
      maxZoom: 20,
    }
  ),
});

/**
 * Create the initial map object.
 *
 * This sets up Google Maps vs. Light mode, attribution, and zoom.
 *
 * @returns: The map instance.
 */
const createMap = () => {
  const baseLayers = defineBaseLayers();
  const map = L.map("map", {
    zoomControl: false,
    layers: [baseLayers.Light],
  });
  map.attributionControl.setPrefix(
    'created by <a style="padding: 0 3px 0 3px; color:#fafafa; background-color: #21ccb9;" target="_blank" href=http://www.geocadder.bg/en/>GEOCADDER</a>'
  );
  L.control.layers(baseLayers).addTo(map);

  map.createPane("fixed", document.getElementById("map"));

  const zoomHome = createZoomHome();
  zoomHome.setHomeCoordinates([39.440556, -98.697222]);
  zoomHome.setHomeZoom(4);
  zoomHome.addTo(map);
  return map;
};

const citiesPolygonsStyle = {
  fillColor: "##c84041",
  color: "#c84041",
  weight: 4,
  fillOpacity: 0,
};
const parkingLotsStyle = {
  fillColor: "#FF0000",
  color: "#FF0000",
  weight: 1,
  fillOpacity: 0.6,
};

/**
 * Copy `value` to the user's clipboard and show the copied link message.
 *
 * @param string value
 */
const copyToClipboard = (value) => {
  const dummy = document.createElement("textarea");
  document.body.appendChild(dummy);
  dummy.value = value;
  dummy.select();
  document.execCommand("copy");
  document.body.removeChild(dummy);

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
 * @param string cityId: e.g. `saint-louis-mo`
 */
const setUpShareUrlClickListener = (cityId) => {
  // We put the event listener on `map` because it is never erased, unlike the copy button
  // being recreated every time the score card changes. This is called "event delegation".
  document.querySelector("#map").addEventListener("click", (event) => {
    const targetElement = event.target.closest("div.url-copy-button > a");
    if (targetElement) {
      const shareUrl = determineShareUrl(window.location.href, cityId);
      copyToClipboard(shareUrl);
    }
  });
};

/**
 * Generate the HTML for the score card.
 *
 * @param cityProperties: The keys from the geoJSON files.
 * @returns string: The HTML represented as a string.
 */
const generateScorecard = (cityProperties) => {
  const {
    Name,
    Percentage,
    Population,
    "Metro Population": MetroPopulation,
    "Parking Score": ParkingScore,
    Reforms,
    "Website URL": WebsiteURL,
  } = cityProperties;
  let result = `
    <div class="title">${Name}</div>
    <div class="url-copy-button"><a href="#"><i class="fas fa-link fa-lg" style="color: #21ccb9;"></i></a></div>
    <hr>
    <div><span class="details-title">Percent of Central City Devoted to Parking: </span><span class="details-value">${Percentage}</span></div>
    <div><span class="details-title">Population: </span><span class="details-value">${Population}</span></div>
    <div><span class="details-title">Metro Population: </span><span class="details-value">${MetroPopulation}</span></div>
    <div><span class="details-title">Parking Score: </span><span class="details-value">${ParkingScore}</span></div>
    <div><span class="details-title">Parking Mandate Reforms: </span><span class="details-value">${Reforms}</span></div>
  `;
  if (WebsiteURL) {
    result += `
    <hr>
    <div class="popup-button"><a target="_blank" href="${WebsiteURL}">View more</a></div>
  `;
  }
  return result;
};

/**
 * Move the map to the city boundaries and set its score card.
 *
 * @param map: The Leaflet map instance.
 * @param cityProperties: An object with a `layout` key (Leaflet value) and keys
 *    representing the score card properties stored in the Geojson files.
 */
const setMapToCity = (map, cityProperties) => {
  const { layer } = cityProperties;
  map.fitBounds(layer.getBounds());
  const scorecard = generateScorecard(cityProperties);
  setUpShareUrlClickListener(cityProperties.id);
  const popup = L.popup({
    pane: "fixed",
    className: "popup-fixed",
    autoPan: false,
  }).setContent(scorecard);
  layer.bindPopup(popup).openPopup();
};

/**
 * Load the cities from GeoJson and set up an event listener to change cities when the user
 * toggles the city selection.
 */
const setUpCitiesLayer = (map) => {
  const cities = {};
  L.geoJson(citiesData, {
    style() {
      return citiesPolygonsStyle;
    },
    onEachFeature(feature, layer) {
      cities[feature.properties.id] = { layer, ...feature.properties };
    },
  }).addTo(map);

  // Set up map to update when city selection changes.
  const cityToggleElement = document.getElementById("city-choice");
  cityToggleElement.addEventListener("change", () => {
    const cityId = cityToggleElement.value;
    setMapToCity(map, cities[cityId]);
  });

  // Load initial city.
  setMapToCity(map, cities[cityToggleElement.value]);
};

const setUpParkingLotsLayer = (map) => {
  L.geoJSON(parkingLotsData, {
    style() {
      return parkingLotsStyle;
    },
  }).addTo(map);
};

const setUpSite = () => {
  const initialCityId = extractCityIdFromUrl(window.location.href) || "columbus-oh";
  addCitiesToToggle(initialCityId);
  setUpAbout();

  const map = createMap();
  setUpCitiesLayer(map);
  setUpParkingLotsLayer(map);
};

export default setUpSite;
