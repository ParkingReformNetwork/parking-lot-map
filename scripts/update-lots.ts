import { valueOrExit, determineArgs, updateParkingLots } from "./base.js";

const main = async () => {
  const args = determineArgs("update-lots", process.argv.slice(2));
  const { cityId } = valueOrExit(args, (msg) => `Argument error: ${msg}`);
  const result = await updateParkingLots(
    cityId,
    false,
    "parking-lots-update.geojson",
    `data/parking-lots/${cityId}.geojson`
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
