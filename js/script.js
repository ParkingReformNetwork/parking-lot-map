const setUpAbout = () => {
  $(".banner-about").click(() => {
    if ($(".about-text-popup").css("display") === "none") {
      $(".about-text-popup").css("display", "block");
    } else {
      $(".about-text-popup").css("display", "none");
    }
  });

  $(".about-close").click(() => {
    if ($(".about-text-popup").css("display") === "block") {
      $(".about-text-popup").css("display", "none");
    }
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
  const popupContent = generatePopupContent(map, cityId, cityProperties);
  const popup = L.popup({
    pane: "fixed",
    className: "popup-fixed",
    autoPan: false,
  }).setContent(popupContent);
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
const setUpCitiesLayer = (map, initialCityId) => {
  fetch("./data/cities-polygons.geojson")
    .then((response) => response.json())
    // Add the GeoJSON to the map & store the parsed data.
    .then((data) => {
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
      return cities;
    })
    .then((cities) => {
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
    });
};

const setUpParkingLotsLayer = (map) => {
  $.getJSON("data/parking-lots.geojson", (data) => {
    L.geoJson(data, {
      style() {
        return parkingLotsStyle;
      },
    }).addTo(map);
  });
};

const setUpSite = () => {
  setUpAbout();
  const map = createMap();
  const initialCityId =
    extractCityIdFromUrl(window.location.href) || "columbus-oh";
  setUpCitiesLayer(map, initialCityId);
  setUpParkingLotsLayer(map);
};

function generatePopupContent(map, cityId, cityProperties) {
  let popupContent = `<div class='title'>${cityProperties.Name}</div><div class='url-copy-button'><a href='#'><img src='icons/share-url-button.png'></a></div><hr>`;

  const shareUrl = determineShareUrl(window.location.href, cityId);
  map.on("popupopen", () => {
    $("div.url-copy-button > a").click(() => {
      copyToClipboard(shareUrl);
    });
  });

  popupContent += `<div><span class='details-title'>Percent of Central City Devoted to Parking: </span><span class='details-value'>${cityProperties.Percentage}</span></div>`;
  popupContent += `<div><span class='details-title'>Population: </span><span class='details-value'>${cityProperties.Population}</span></div>`;
  popupContent += `<div><span class='details-title'>Metro Population: </span><span class='details-value'>${cityProperties["Metro Population"]}</span></div>`;
  popupContent += `<div><span class='details-title'>Parking Score: </span><span class='details-value'>${cityProperties["Parking Score"]}</span></div>`;
  popupContent += `<div><span class='details-title'>Parking Mandate Reforms: </span><span class='details-value'>${cityProperties.Reforms}</span></div>`;

  if (cityProperties["Website URL"]) {
    popupContent += `<hr><div class='popup-button'><a target='_blank' href='${cityProperties["Website URL"]}'>View more</a></div>`;
  }
  return popupContent;
}

module.exports = {
  extractCityIdFromUrl,
  determineShareUrl,
  parseCityIdFromJson,
  setUpSite,
};
