/* eslint-disable no-console */

const fs = require("fs").promises;

const updateGeoJSON = async (cityName, originalFilePath, updateFilePath) => {
  if (!cityName) {
    console.error(
      "Please provide a city/state name as an argument, e.g. `npm run update-lots -- 'Columbus, OH'`"
    );
    return;
  }

  try {
    const rawNewData = await fs.readFile(updateFilePath, "utf8");
    const newData = JSON.parse(rawNewData);

    if (!Array.isArray(newData.features) || newData.features.length !== 1) {
      console.error(
        "The script expects exactly one entry in `features` because you can only update one city at a time."
      );
      return;
    }

    const newCoordinates = newData.features[0].geometry.coordinates;

    const rawOriginalData = await fs.readFile(originalFilePath, "utf8");
    const originalData = JSON.parse(rawOriginalData);

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

    await fs.writeFile(originalFilePath, JSON.stringify(originalData, null, 2));
    console.log(
      "File updated successfully! Now, run `npm run fmt`. Then, `npm start` and see if the site is what you expect"
    );
  } catch (err) {
    console.error("Error:", err);
  }
};

const main = async () => {
  const cityName = process.argv[2];
  await updateGeoJSON(
    cityName,
    "data/parking-lots.geojson",
    "parking-lots-update.geojson"
  );
};

if (require.main === module) {
  (async () => {
    await main();
  })();
}
