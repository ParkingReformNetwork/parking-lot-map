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
 * Extract the city name from the URL's `#`, if present.
 *
 * @param string windowUrl: the current page's URL
 * @return string: Returns empty string if not present
 */
const extractLocationTag = (windowUrl) => {
  if (windowUrl.indexOf("#parking-reform-map=") === -1) {
    return "";
  }
  const rawValue = windowUrl.split("#")[1].split("=")[1];
  const [firstWord, ...remainingWords] = rawValue.split("%20");
  const result =
    remainingWords.length > 0
      ? `${firstWord} ${remainingWords.join(" ")}`
      : firstWord;
  return result.toLowerCase();
};

/**
 * Parse the city name from the geojson's `Name` property.
 *
 * @param string jsonCityName: the `Name` property from JSON, e.g. `"My City, AZ"`
 * @return string: the city name, lowercased.
 */
const parseCityName = (jsonCityName) =>
  jsonCityName.toLowerCase().split(", ")[0];

/**
 * Determine what URL to use to share the current city.
 *
 * @param string windowUrl: the current page's URL
 * @param string jsonCityName: the `Name` property from JSON, e.g. `"My City, AZ"`
 * @return string: the URL to share
 */
const determineShareUrl = (windowUrl, jsonCityName) => {
  const cityName = parseCityName(jsonCityName).replace(/ /g, "%20");
  const [baseUrl] = windowUrl.split("#");
  return `${baseUrl}#parking-reform-map=${cityName}`;
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
 * @param city: An object with a `layout` key (Leaflet value) and keys representing the
 *    score card properties stored in the Geojson files.
 */
const setMapToCity = (map, city) => {
  const { layer } = city;
  map.fitBounds(layer.getBounds());
  const popupContent = generatePopupContent(map, city);
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
 * @param string initialCity: the lower-case city name to initially load.
 */
const setUpCitiesLayer = (map, initialCity) => {
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
          const key = parseCityName(feature.properties.Name);
          cities[key] = { layer, ...feature.properties };
        },
      }).addTo(map);
      return cities;
    })
    .then((cities) => {
      // Set map to update when city selection changes.
      const cityToggleElement = document.getElementById("city-choice");
      cityToggleElement.addEventListener("change", () => {
        setMapToCity(map, cities[cityToggleElement.value]);
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
      cityToggleElement.value = initialCity;
      setMapToCity(map, cities[initialCity]);
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
  const initialCity = extractLocationTag(window.location.href) || "columbus";
  setUpCitiesLayer(map, initialCity);
  setUpParkingLotsLayer(map);
};

function generatePopupContent(map, cityProperties) {
  let popupContent = `<div class='title'>${cityProperties.Name}</div><div class='url-copy-button'><a href='#'><img src='icons/share-url-button.png'></a></div><hr>`;

  const shareUrl = determineShareUrl(window.location.href, cityProperties.Name);
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
  extractLocationTag,
  determineShareUrl,
  parseCityName,
  setUpSite,
};
