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
  // We need to set `pane`, which comes from Leaflet.
  pane = map.createPane("fixed", document.getElementById("map"));

  const zoomHome = L.Control.zoomHome();
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
 * Extract the city ID from the URL's `#`, if present.
 *
 * @param string windowUrl: the current page's URL
 * @return string: Returns e.g. `saint-louis-mo` if present, else the empty string
 */
const extractCityIdFromUrl = (windowUrl) =>
  windowUrl.indexOf("#parking-reform-map=") === -1
    ? ""
    : windowUrl.split("#")[1].split("=")[1].toLowerCase();

/**
 * Parse the geojson's `Name` property into the city ID.
 *
 * @param string jsonCityName: the `Name` property from JSON, e.g. `"My City, AZ"`
 * @return string: the city ID, e.g. `saint-louis-mo`.
 */
const parseCityIdFromJson = (jsonCityName) =>
  jsonCityName.toLowerCase().replace(/ /g, "-").replace(/,/g, "");

/**
 * Determine what URL to use to share the current city.
 *
 * @param string windowUrl: the current page's URL
 * @param string cityId: e.g. `saint-louis-mo`
 * @return string: the URL to share
 */
const determineShareUrl = (windowUrl, cityId) => {
  const [baseUrl] = windowUrl.split("#");
  return `${baseUrl}#parking-reform-map=${cityId}`;
};

/**
 * Copy `value` to the user's clipboard and show the copied link message.
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
    <div class="url-copy-button"><a href="#"><img src="icons/share-url-button.png"></a></div>
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
 * @param string cityId: e.g. `saint-louis-mo`
 * @param cityProperties: An object with a `layout` key (Leaflet value) and keys
 *    representing the score card properties stored in the Geojson files.
 */
const setMapToCity = (map, cityId, cityProperties) => {
  const { layer } = cityProperties;
  map.fitBounds(layer.getBounds());
  const scorecard = generateScorecard(cityProperties);
  setUpShareUrlClickListener(cityId);
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
 *
 * @param map: The Leaflet map instance.
 * @param string initialCityId: e.g. `columbus-oh` or an empty string if none was set. Will
 *    default to `columbus-oh`.
 */
const setUpCitiesLayer = async (map, initialCityId) => {
  const response = await fetch("./data/cities-polygons.geojson");
  const data = await response.json();

  const cities = {};
  L.geoJson(data, {
    style() {
      return citiesPolygonsStyle;
    },
    onEachFeature(feature, layer) {
      const key = parseCityIdFromJson(feature.properties.Name);
      cities[key] = { layer, ...feature.properties };
    },
  }).addTo(map);

  // Set map to update when city selection changes.
  const cityToggleElement = document.getElementById("city-choice");
  cityToggleElement.addEventListener("change", () => {
    const cityId = cityToggleElement.value;
    setMapToCity(map, cityId, cities[cityId]);
  });

  // Add each city to the city selection toggle and set the initial city.
  const cityKeys = Object.keys(cities).sort();
  cityKeys.forEach((key) => {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = cities[key].Name;
    cityToggleElement.appendChild(option);
  });

  // Set initial city.
  const validatedInitialCityId =
    initialCityId in cities ? initialCityId : "columbus-oh";
  cityToggleElement.value = validatedInitialCityId;
  setMapToCity(map, validatedInitialCityId, cities[validatedInitialCityId]);
};

const setUpParkingLotsLayer = async (map) => {
  const response = await fetch("./data/parking-lots.geojson");
  const data = await response.json();
  L.geoJSON(data, {
    style() {
      return parkingLotsStyle;
    },
  }).addTo(map);
};

const setUpSite = async () => {
  setUpAbout();
  const map = createMap();
  const initialCityId =
    extractCityIdFromUrl(window.location.href) || "columbus-oh";
  await Promise.all([
    setUpCitiesLayer(map, initialCityId),
    setUpParkingLotsLayer(map),
  ]);
};

module.exports = {
  extractCityIdFromUrl,
  determineShareUrl,
  parseCityIdFromJson,
  setUpSite,
};
