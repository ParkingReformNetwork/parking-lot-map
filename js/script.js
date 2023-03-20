googleMapsSatellite = L.tileLayer(
  "https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
  {
    attribution: "Google Maps",
    maxZoom: 20, // max value is 24 but I set it to 20, because the Stamen Toner style has value of 20 as max value.
  }
);

var stamenToner = L.tileLayer(
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

$(".banner-about").click(function () {
  if ($(".about-text-popup").css("display") === "none") {
    $(".about-text-popup").css("display", "block");
  } else {
    $(".about-text-popup").css("display", "none");
  }
});

$(".about-close").click(function () {
  if ($(".about-text-popup").css("display") === "block") {
    $(".about-text-popup").css("display", "none");
  }
});

var map = L.map("map", {
  zoomControl: false,
  layers: [stamenToner],
  // center: [40.1, -85.681389],
  // zoom: 6
});

var attribution = map.attributionControl;
attribution.setPrefix(
  'created by <a style="padding: 0 3px 0 3px; color:#fafafa; background-color: #21ccb9;" target="_blank" href=http://www.geocadder.bg/en/>GEOCADDER</a>'
);

var baseLayers = {
  Light: stamenToner,
  "Google Maps": googleMapsSatellite,
};

L.control.layers(baseLayers).addTo(map);

var pane = map.createPane("fixed", document.getElementById("map"));

var currentTier = $("#tier-dropdown option:selected").text();

// added initial zoom
var zoomHome = L.Control.zoomHome();
zoomHome.setHomeCoordinates([39.440556, -98.697222]);
zoomHome.setHomeZoom(4);
zoomHome.addTo(map);

const southWest = L.latLng(25.085598897064752, -125.41992187499999);
const northEast = L.latLng(50.56928286558243, -60.8203125);
const searchBounds = L.latLngBounds(southWest, northEast);

// 1. Cities Polygons styling
var citiesPolygonsStyle = {
  fillColor: "##c84041",
  color: "#c84041",
  weight: 4,
  fillOpacity: 0,
};
var citiesPolygonsHoverStyle = {
  fillColor: "##c84041",
  color: "##c84041",
  weight: 5,
  fillOpacity: 0.2,
};

// 1. Parking Lots styling
var parkingLotsStyle = {
  fillColor: "#FF0000",
  color: "#FF0000",
  weight: 1,
  fillOpacity: 0.6,
};
var parkingLotsHoverStyle = {
  fillColor: "#FFFFFF",
  color: "#FF0000",
  weight: 1,
  fillOpacity: 0.6,
};

// adding URL tags
// var urlAddress = 'http://127.0.0.1:5500/#parking-reform-map=baltimore'
var locationTag = "";

var urlAddress = window.location.href;

if (urlAddress.indexOf("#parking-reform-map") > -1) {
  var splitAdressArray = urlAddress.split("#");
  var currentUrlTag = splitAdressArray[splitAdressArray.length - 1];
  var projectUrlTagFull = currentUrlTag.replace("/", "");

  if (splitAdressArray[1].indexOf("parking-reform-map") > -1) {
    // if the tag is "parking-reform-map=....."
    $("#toggle-projects-by-tag").css("display", "none");
    var locationTagUrlArray = splitAdressArray[1].split("=");
    locationTag = locationTagUrlArray[1];
  }
}

var locationTagArray = locationTag.split("%20");
if (locationTagArray.length > 1) {
  locationTag = locationTagArray[0];
  for (i = 1; i < locationTagArray.length; i++) {
    locationTag += " " + locationTagArray[i];
  }
}
// end adding URL tags

// 1. start Cities Polygons layer
$.getJSON("data/cities-polygons.geojson", function (data) {
  var citiesArray = [];
  var citiesPolygons = L.geoJson(data, {
    style: function (feature) {
      return citiesPolygonsStyle;
    },
    onEachFeature: function (feature, layer) {
      $("#tier-dropdown").change(function () {
        currentTier = $("#tier-dropdown option:selected").text();

        if (currentTier === feature.properties.Name) {
          map.fitBounds(layer.getBounds());
          // map.flyToBounds(layer.getBounds(), { duration: 2 });

          var popupContent = generatePopupContent(feature);

          // map.on('zoomend', function() {
          var popup = L.popup({
            pane: "fixed",
            className: "popup-fixed",
            autoPan: false,
          }).setContent(popupContent);
          layer.bindPopup(popup).openPopup();

          // layer.bindPopup(popupContent).openPopup();
          // });
        }
      });

      // checking for the URL tag
      var cityAndStateName = feature.properties.Name;
      var cityAndStateArray = cityAndStateName.split(", ");
      var cityNameOnly = cityAndStateArray[0];
      if (cityNameOnly.toLowerCase() === locationTag.toLowerCase()) {
        var popupContent = generatePopupContent(feature);

        var popup = L.popup({
          pane: "fixed",
          className: "popup-fixed",
          autoPan: false,
        }).setContent(popupContent);

        map.fitBounds(layer.getBounds());
        layer.once("add", () => {
          layer.bindPopup(popup).openPopup();
        });
        // layer.bindPopup(popup).openPopup();
      }
      // end checking for the URL tag

      citiesArray.push(feature.properties.Name);

      layer.on({
        // mouseout: function (e) {
        //   e.target.setStyle(citiesPolygonsStyle);
        // },
        // mouseover: function (e) {
        //   e.target.setStyle(citiesPolygonsHoverStyle);
        // },
        click: function (e) {
          // This zooms the map to the clicked polygon
          // map.fitBounds(e.target.getBounds());
          var popupContent = generatePopupContent(feature);

          var popup = L.popup({
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
}).then(function () {
  // Select default city
  $('#city-choice').val('Columbus, OH').change();
});
// 1. end Cities Polygons layer

// 2. start Parking Lots layer
$.getJSON("data/parking-lots.geojson", function (data) {
  var parkingLots = L.geoJson(data, {
    style: function (feature) {
      return parkingLotsStyle;
    },
    onEachFeature: function (feature, layer) {
      layer.on({
        // mouseout: function (e) {
        //   e.target.setStyle(parkingLotsStyle);
        // },
        // mouseover: function (e) {
        //   e.target.setStyle(parkingLotsHoverStyle);
        // },
        // click: function (e) {
        //   // This zooms the map to the clicked polygon
        //   // map.fitBounds(e.target.getBounds());
        //   var popupContent = "<b>" + feature.properties["Name"] + "</b>";
        //   layer.bindPo#location=pup(popupContent).openPopup();
        // },
      });
    },
  }).addTo(map);

  // map.fitBounds(paringLots.getBounds());
});

// 2. end Parking Lots layer

function generatePopupContent(feature) {
  var popupContent =
    "<div class='title'>" +
    feature.properties["Name"] +
    "</div><div class='url-copy-button'><a href='#'><img src='icons/share-url-button.png'></a></div><hr>";

  // copy the URL for the current city
  var cityAndStateName = feature.properties.Name;
  var cityAndStateArray = cityAndStateName.split(", ");
  var cityNameOnly = cityAndStateArray[0];
  cityNameOnly = cityNameOnly.toLowerCase();
  var currentLocationUrl = urlAddress;
  if (currentLocationUrl.indexOf("#parking-reform-map=") > -1) {
    var urlTagArray = currentLocationUrl.split("#parking-reform-map=");
    var urlTagCityName = urlTagArray[1];
    currentLocationUrl = currentLocationUrl.replace(
      "#parking-reform-map=" + urlTagCityName,
      ""
    );
  }
  currentLocationUrl =
    currentLocationUrl + "#parking-reform-map=" + cityNameOnly;
  if (currentLocationUrl.indexOf(" ") > -1) {
    currentLocationUrl = currentLocationUrl.replace(" ", "%20");
  }
  // end copying the URL for the current city

  map.on("popupopen", function () {
    $("div.url-copy-button > a").click(function (e) {
      var dummy = document.createElement("textarea");
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
    "<div><span class='details-title'>Percent of Central City Devoted to Parking: </span><span class='details-value'>" +
    feature.properties["Percentage"] +
    "</span></div>";
  popupContent +=
    "<div><span class='details-title'>Population: </span><span class='details-value'>" +
    feature.properties["Population"] +
    "</span></div>";
  popupContent +=
    "<div><span class='details-title'>Metro Population: </span><span class='details-value'>" +
    feature.properties["Metro Population"] +
    "</span></div>";
  popupContent +=
    "<div><span class='details-title'>Parking Score: </span><span class='details-value'>" +
    feature.properties["Parking Score"] +
    "</span></div>";
  popupContent +=
    "<div><span class='details-title'>Parking Mandate Reforms: </span><span class='details-value'>" +
    feature.properties["Reforms"] +
    "</span></div>";

  if (feature.properties["Website URL"]) {
    popupContent +=
      "<hr><div class='popup-button'><a target='_blank' href='" +
      feature.properties["Website URL"] +
      "'>View more</a></div>";
  }
  return popupContent;
}
