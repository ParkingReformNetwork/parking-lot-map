import { determineArgs, updateParkingLots } from "./base.ts";

async function main(): Promise<void> {
  const { cityId } = determineArgs("update-lots", process.argv.slice(2));
  await updateParkingLots(
    cityId,
    false,
    "parking-lots-update.geojson",
    `packages/primary/data/parking-lots/${cityId}.geojson`,
  );

  console.log(
    `File updated! Now, run 'pnpm fmt'. Then, start the server and
      see if the site is what you expect.
    `,
  );
}

main();
