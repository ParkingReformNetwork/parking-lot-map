import { determineArgs, updateParkingLots } from "./base.ts";

const main = async (): Promise<void> => {
  const { cityId } = determineArgs("update-lots", process.argv.slice(2))
    .mapErr((err) => new Error(`Argument error: ${err}`))
    .unwrap();
  const value = (
    await updateParkingLots(
      cityId,
      false,
      "parking-lots-update.geojson",
      `data/parking-lots/${cityId}.geojson`,
    )
  ).unwrap();

  /* eslint-disable-next-line no-console */
  console.log(
    `${value} Now, run 'npm run fmt'. Then, 'npm start' and
      see if the site is what you expect.
    `,
  );
};

main();
