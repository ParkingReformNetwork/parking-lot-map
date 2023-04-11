/* eslint-disable no-console */
import { determineArgs, updateCoordinates } from "./base.js";

const main = async () => {
  const args = determineArgs("update-city-boundaries", process.argv.slice(2));
  if (args.error) {
    console.error("Argument error:", args.error);
    process.exit(1);
  }

  const { cityId } = args.value;
  const result = await updateCoordinates(
    "update-city-boundaries",
    cityId,
    false,
    "data/city-boundaries.geojson",
    "city-update.geojson"
  );

  if (result.error) {
    console.error("Error:", result.error);
    process.exit(1);
  }
  console.log(
    `${result.value} Now, run 'npm run fmt'. Then, 'npm start' and
      see if the site is what you expect.
    `
  );
};

main();
