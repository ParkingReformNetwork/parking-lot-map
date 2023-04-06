const fs = require("fs").promises;

// Rather than using `try/catch`, we return either `Ok` or `Err`.
// This emulates Rust's `Result` type.
const Ok = (value) => ({ value });
const Err = (error) => ({ error });

const updateGeoJSON = async (cityName, originalFilePath, updateFilePath) => {
  if (!cityName) {
    return Err(
      "Please provide a city/state name as an argument, e.g. `npm run update-lots -- 'Columbus, OH'`"
    );
  }

  let newData;
  try {
    const rawNewData = await fs.readFile(updateFilePath, "utf8");
    newData = JSON.parse(rawNewData);
  } catch (err) {
    return Err(
      `Issue reading the update file path ${updateFilePath}: ${err.message}`
    );
  }

  if (!Array.isArray(newData.features) || newData.features.length !== 1) {
    return Err(
      "The script expects exactly one entry in `features` because you can only update one city at a time."
    );
  }

  const newCoordinates = newData.features[0].geometry.coordinates;

  let originalData;
  try {
    const rawOriginalData = await fs.readFile(originalFilePath, "utf8");
    originalData = JSON.parse(rawOriginalData);
  } catch (err) {
    return Err(
      `Issue reading the original data file path ${originalFilePath}: ${err.message}`
    );
  }

  const cityOriginalData = originalData.features.find(
    (feature) => feature.properties.Name === cityName
  );
  if (!cityOriginalData) {
    return Err("The program only works on cities currently in the data set.");
  }

  cityOriginalData.geometry.coordinates = newCoordinates;

  await fs.writeFile(originalFilePath, JSON.stringify(originalData, null, 2));
  return Ok(
    "File updated successfully! Now, run `npm run fmt`. Then, `npm start` and see if the site is what you expect"
  );
};

const main = async () => {
  const cityName = process.argv[2];
  const result = await updateGeoJSON(
    cityName,
    "data/parking-lots.geojson",
    "parking-lots-update.geojson"
  );

  /* eslint-disable no-console */
  if (result.error) {
    console.error("Error:", result.error);
    process.exit(1);
  } else {
    console.log("Success:", result.value);
  }
  /* eslint-enable no-console */
};

if (require.main === module) {
  (async () => {
    await main();
  })();
}

module.exports = updateGeoJSON;
