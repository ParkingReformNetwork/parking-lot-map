const fs = require("fs").promises;

// Rather than using `try/catch`, we return either `Ok` or `Err`.
// This emulates Rust's `Result` type.
const Ok = (value) => ({ value });
const Err = (error) => ({ error });

/**
 * Determine the city name and if `--add` was set.
 *
 * @param string scriptCommand - i.e. `update-lots` or `update-city-boundaries`.
 * @param list[string] processArgv - all argv after the first two elements.
 * @return either an `error` or `value` object.
 */
const determineArgs = (scriptCommand, processArgv) => {
  let cityName;
  let addFlag = false;
  for (let i = 0; i < processArgv.length; i += 1) {
    if (processArgv[i] === "--add") {
      addFlag = true;
    } else if (!cityName) {
      cityName = processArgv[i];
    } else {
      return Err(`Unexpected arguments: ${processArgv}`);
    }
  }

  if (!cityName) {
    return Err(
      `Please provide a city/state name, e.g. npm run ${scriptCommand} -- 'Columbus, OH'`
    );
  }

  return Ok({ cityName, addFlag });
};

/**
 * Rewrite the coordinates for `cityName`.
 *
 * @param string scriptCommand - i.e. `update-lots` or `update-city-boundaries`.
 * @param string cityName - e.g. 'My City, AZ'
 * @param boolean addCity - what to do if the city is missing
 * @param string originalFilePath - what will be updated
 * @param string updatedFilePath - where to get the new coordinates
 * @return either an `error` or `value` object, both with a string to console log.
 */
const updateCoordinates = async (
  scriptCommand,
  cityName,
  addCity,
  originalFilePath,
  updateFilePath
) => {
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

  if (addCity) {
    const newEntry = {
      type: "Feature",
      properties: { Name: cityName },
      geometry: { type: "MultiPolygon", coordinates: newCoordinates },
    };
    originalData.features.push(newEntry);
  } else {
    const cityOriginalData = originalData.features.find(
      (feature) => feature.properties.Name === cityName
    );
    if (!cityOriginalData) {
      return Err(
        `City not found in ${originalFilePath}. To add a new city, run again with the '--add' flag, e.g. npm run ${scriptCommand} -- '${cityName}' --add`
      );
    }
    cityOriginalData.geometry.coordinates = newCoordinates;
  }

  await fs.writeFile(originalFilePath, JSON.stringify(originalData, null, 2));
  return Ok(
    "File updated successfully! Now, run `npm run fmt`. Then, `npm start` and see if the site is what you expect"
  );
};

module.exports = {
  Ok,
  Err,
  determineArgs,
  updateCoordinates,
};
