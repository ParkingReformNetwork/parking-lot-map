const googleMapsSatellite = L.tileLayer(
  "https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
  {
    attribution: "Google Maps",
    maxZoom: 20, // max value is 24 but I set it to 20, because the Stamen Toner style has value of 20 as max value.
  }
);

const stamenToner = L.tileLayer(
  "https://stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}{r}.{ext}",
  {
    attribution:
      'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    subdomains: "abcd",
    minZoom: 0,
    maxZoom: 20,
    ext: "png",
  }
);

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

const map = L.map("map", {
  zoomControl: false,
  layers: [stamenToner],
});

const attribution = map.attributionControl;
attribution.setPrefix(
  'created by <a style="padding: 0 3px 0 3px; color:#fafafa; background-color: #21ccb9;" target="_blank" href=http://www.geocadder.bg/en/>GEOCADDER</a>'
);

const baseLayers = {
  Light: stamenToner,
  "Google Maps": googleMapsSatellite,
};

L.control.layers(baseLayers).addTo(map);

// We need to set `pane`, which comes from Leaflet.
pane = map.createPane("fixed", document.getElementById("map"));

let currentTier = $("#tier-dropdown option:selected").text();

// added initial zoom
const zoomHome = L.Control.zoomHome();
zoomHome.setHomeCoordinates([39.440556, -98.697222]);
zoomHome.setHomeZoom(4);
zoomHome.addTo(map);

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

// adding URL tags
let locationTag = "";

const urlAddress = window.location.href;
if (urlAddress.indexOf("#parking-reform-map") > -1) {
  const [, splitAddressFragment] = urlAddress.split("#");
  // If the tag is "parking-reform-map=....."
  if (splitAddressFragment.indexOf("parking-reform-map") > -1) {
    $("#toggle-projects-by-tag").css("display", "none");
    const [, locationTagFromUrl] = splitAddressFragment.split("=");
    locationTag = locationTagFromUrl;
  }
}

const [firstTag, ...remainingTags] = locationTag.split("%20");
if (remainingTags.length > 0) {
  locationTag = `${firstTag} ${remainingTags.join(' ')}`;
}
// end adding URL tags

// 1. start Cities Polygons layer
$.getJSON("data/cities-polygons.geojson", (data) => {
  const citiesArray = [];
  const citiesPolygons = L.geoJson(data, {
    style () {
      return citiesPolygonsStyle;
    },
    onEachFeature (feature, layer) {
      $("#tier-dropdown").change(() => {
        currentTier = $("#tier-dropdown option:selected").text();

        if (currentTier === feature.properties.Name) {
          map.fitBounds(layer.getBounds());
          const popupContent = generatePopupContent(feature);
          const popup = L.popup({
            pane: "fixed",
            className: "popup-fixed",
            autoPan: false,
          }).setContent(popupContent);
          layer.bindPopup(popup).openPopup();
        }
      });

      // checking for the URL tag
      const [cityName,] = feature.properties.Name.split(", ");
      if (cityName.toLowerCase() === locationTag.toLowerCase()) {
        const popupContent = generatePopupContent(feature);

        const popup = L.popup({
          pane: "fixed",
          className: "popup-fixed",
          autoPan: false,
        }).setContent(popupContent);

        map.fitBounds(layer.getBounds());
        layer.once("add", () => {
          layer.bindPopup(popup).openPopup();
        });
      }
      // end checking for the URL tag

      citiesArray.push(feature.properties.Name);

      layer.on({
        click () {
          const popupContent = generatePopupContent(feature);
          const popup = L.popup({
            pane: "fixed",
            className: "popup-fixed",
            autoPan: false,
          }).setContent(popupContent);
          layer.bindPopup(popup).openPopup();
          layer.bindPopup(popupContent).openPopup();
        },
      });
    },
  }).addTo(map);

  citiesArray.sort((a, b) => a.localeCompare(b));
  citiesArray.forEach((city) =>
    $("#city-choice").append(
      $("<option></option>").attr("value", city).text(city)
    )
  );

  if (urlAddress.indexOf("#parking-reform-map") === -1) {
    map.fitBounds(citiesPolygons.getBounds());
  }
}).then(() => {
  // Select default city
  $('#city-choice').val('Columbus, OH').change();
});
// 1. end Cities Polygons layer

// 2. start Parking Lots layer
$.getJSON("data/parking-lots.geojson", (data) => {
  L.geoJson(data, {
    style () {
      return parkingLotsStyle;
    }
  }).addTo(map);
});
// 2. end Parking Lots layer

function generatePopupContent(feature) {
  let popupContent =
    `<div class='title'>${ 
    feature.properties.Name 
    }</div><div class='url-copy-button'><a href='#'><img src='icons/share-url-button.png'></a></div><hr>`;

  // copy the URL for the current city
  let currentLocationUrl = urlAddress;
  const [cityName,] = feature.properties.Name.toLowerCase().split(", ");
  if (currentLocationUrl.indexOf("#parking-reform-map=") > -1) {
    const urlTagArray = currentLocationUrl.split("#parking-reform-map=");
    const urlTagCityName = urlTagArray[1];
    currentLocationUrl = currentLocationUrl.replace(
      `#parking-reform-map=${  urlTagCityName}`,
      ""
    );
  }
  currentLocationUrl =
    `${currentLocationUrl  }#parking-reform-map=${  cityName}`;
  if (currentLocationUrl.indexOf(" ") > -1) {
    currentLocationUrl = currentLocationUrl.replace(" ", "%20");
  }
  // end copying the URL for the current city

  map.on("popupopen", () => {
    $("div.url-copy-button > a").click(() => {
      const dummy = document.createElement("textarea");
      document.body.appendChild(dummy);
      dummy.value = currentLocationUrl;
      dummy.select();
      document.execCommand("copy");
      document.body.removeChild(dummy);
      $(".copied-link-message").css("display", "block");
      setTimeout(() => {
        $(".copied-link-message").css("display", "none");
      }, "1000")
      
    });
  });

  popupContent +=
    `<div><span class='details-title'>Percent of Central City Devoted to Parking: </span><span class='details-value'>${ 
    feature.properties.Percentage 
    }</span></div>`;
  popupContent +=
    `<div><span class='details-title'>Population: </span><span class='details-value'>${ 
    feature.properties.Population 
    }</span></div>`;
  popupContent +=
    `<div><span class='details-title'>Metro Population: </span><span class='details-value'>${ 
    feature.properties["Metro Population"] 
    }</span></div>`;
  popupContent +=
    `<div><span class='details-title'>Parking Score: </span><span class='details-value'>${ 
    feature.properties["Parking Score"] 
    }</span></div>`;
  popupContent +=
    `<div><span class='details-title'>Parking Mandate Reforms: </span><span class='details-value'>${ 
    feature.properties.Reforms 
    }</span></div>`;

  if (feature.properties["Website URL"]) {
    popupContent +=
      `<hr><div class='popup-button'><a target='_blank' href='${ 
      feature.properties["Website URL"] 
      }'>View more</a></div>`;
  }
  return popupContent;
}
