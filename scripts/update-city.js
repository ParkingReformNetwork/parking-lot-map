import { determineArgs, updateCoordinates } from "./base.js";

const main = async () => {
  const args = determineArgs("update-city-boundaries", process.argv.slice(2));
  if (args.error) {
    // eslint-disable-next-line no-console
    console.error("Argument error:", args.error);
    process.exit(1);
  }

  const { cityName, cityId, addFlag } = args.value;
  const newCityProperties = {
    Name: cityName,
    Percentage: "FILL ME IN, e.g. 23%",
    Population: "FILL ME IN, e.g. 346,824",
    "Metro Population": "FILL ME IN, e.g. 13,200,998",
    "Parking Score": "FILL ME IN, e.g. 53",
    Reforms: "FILL ME IN, either 'No Reforms' or 'Implemented'",
    "Website URL": "FILL ME IN OR DELETE ME",
  };
  const result = await updateCoordinates(
    "update-city-boundaries",
    cityId,
    addFlag,
    newCityProperties,
    "data/cities-polygons.geojson",
    "city-update.geojson"
  );

  /* eslint-disable no-console */
  if (result.error) {
    console.error("Error:", result.error);
    process.exit(1);
  } else {
    console.log(
      `${result.value} If you added a new city, update the score card in
      data/city-polygons.json by searching for the city name. Either way,
      then run 'npm run fmt'. Then, 'npm start' and see if the site is what
      you expect.
    `
    );
  }
  /* eslint-enable no-console */
};

main();
