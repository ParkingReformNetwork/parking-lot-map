import { determineArgs, updateCoordinates } from "./base.ts";

async function main(): Promise<void> {
  const { cityId } = determineArgs(
    "update-city-boundaries",
    process.argv.slice(2),
  );
  await updateCoordinates(
    "update-city-boundaries",
    cityId,
    false,
    "packages/primary/data/city-boundaries.geojson",
    "city-update.geojson",
  );

  console.log(
    `File updatad! Now, run 'pnpm fmt'. Then, start the server and
      see if the site is what you expect.
    `,
  );
}

main();
