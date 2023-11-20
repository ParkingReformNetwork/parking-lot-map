// Split parking-lots.geojson into each city to allow lazy loading

/* eslint-disable no-console */
import fs from "fs/promises";

const createSeparateFiles = async () => {
  const filepath = "data/parking-lots.geojson";
  let parkingLots;
  try {
    const rawData = await fs.readFile(filepath, "utf8");
    parkingLots = JSON.parse(rawData);
  } catch (err) {
    console.log("Error in reading file");
  }

  parkingLots.features.forEach((feature) => {
    const { id } = feature.properties;
    const filename = `data/parking-lots/${id}.geojson`;
    fs.writeFile(filename, JSON.stringify(feature, null, 2));
    console.log(`File saved: ${filename}`);
  });
};

createSeparateFiles();
