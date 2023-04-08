import { determineArgs, updateCoordinates } from "./base.js";

const main = async () => {
  const args = determineArgs("update-lots", process.argv.slice(2));
  if (args.error) {
    // eslint-disable-next-line no-console
    console.error("Argument error:", args.error);
    process.exit(1);
  }

  const { cityName, addFlag } = args.value;
  const result = await updateCoordinates(
    "update-lots",
    cityName,
    addFlag,
    {},
    "data/parking-lots.geojson",
    "parking-lots-update.geojson"
  );

  /* eslint-disable no-console */
  if (result.error) {
    console.error("Error:", result.error);
    process.exit(1);
  } else {
    console.log(
      `${result.value} Now, run 'npm run fmt'. Then, 'npm start' and
      see if the site is what you expect.
    `
    );
  }
  /* eslint-enable no-console */
};

main();
