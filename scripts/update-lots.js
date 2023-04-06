/* eslint-disable no-console */

const fs = require("fs").promises;

const updateGeoJSON = async (cityName) => {
  try {
    const jsonStringNewData = await fs.readFile(
      "parking-lots-update.geojson",
      "utf8"
    );
    const newData = JSON.parse(jsonStringNewData);

    if (!Array.isArray(newData.features) || newData.features.length !== 1) {
      console.error(
        "The script expects exactly one entry in `features` because you can only update one city at a time."
      );
      return;
    }

    const newCoordinates = newData.features[0].geometry.coordinates;

    const jsonStringOriginalData = await fs.readFile(
      "data/parking-lots.geojson",
      "utf8"
    );
    const originalData = JSON.parse(jsonStringOriginalData);

    const cityOriginalData = originalData.features.find(
      (feature) => feature.properties.Name === cityName
    );

    if (!cityOriginalData) {
      console.error(
        "The program only works on cities currently in the data set."
      );
      return;
    }

    cityOriginalData.geometry.coordinates = newCoordinates;

    await fs.writeFile(
      "data/parking-lots.geojson",
      JSON.stringify(originalData, null, 2)
    );
    console.log(
      "File updated successfully! Now, run `npm run fmt`. Then, `npm start` and see if the site is what you expect"
    );
  } catch (err) {
    console.error("Error:", err);
  }
};

const cityName = process.argv[2];
if (!cityName) {
  console.error(
    "Please provide a city/state name as an argument, e.g. `npm run update-lots -- 'Columbus, OH'`"
  );
  process.exit(1);
}
updateGeoJSON(cityName);
