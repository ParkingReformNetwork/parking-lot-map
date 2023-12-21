/* eslint-disable no-console */
import { determineArgs, updateParkingLots } from "./base.js";

const main = async () => {
  const args = determineArgs("update-lots", process.argv.slice(2));
  if (args.error) {
    console.error("Argument error:", args.error);
    process.exit(1);
  }

  const { cityId } = args.value;
  const result = await updateParkingLots(
    cityId,
    false,
    "parking-lots-update.geojson",
    `data/parking-lots/${cityId}.geojson`
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
