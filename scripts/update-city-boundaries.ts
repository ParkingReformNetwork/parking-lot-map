import { determineArgs, valueOrExit, updateCoordinates } from "./base.js";

const main = async () => {
  const args = determineArgs("update-city-boundaries", process.argv.slice(2));
  const { cityId } = valueOrExit(args, (msg) => `Argument error: ${msg}`);
  const result = await updateCoordinates(
    "update-city-boundaries",
    cityId,
    false,
    "data/city-boundaries.geojson",
    "city-update.geojson"
  );

  const value = valueOrExit(result, (msg) => `Error: ${msg}`);
  /* eslint-disable-next-line no-console */
  console.log(
    `${value} Now, run 'npm run fmt'. Then, 'npm start' and
      see if the site is what you expect.
    `
  );
};

main();
