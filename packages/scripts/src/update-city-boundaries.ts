import { determineArgs, updateCoordinates } from "./base.ts";

async function main(): Promise<void> {
  const { cityId, pkg } = determineArgs(
    "update-city-boundaries",
    process.argv.slice(2),
  );
  await updateCoordinates(
    "update-city-boundaries",
    cityId,
    false,
    `packages/${pkg}/data/city-boundaries.geojson`,
    "city-update.geojson",
  );

  console.log(
    "File updated! Now, run 'pnpm fmt'. Then, " +
      `start the server with 'pnpm -F ${pkg} start' and ` +
      "see if the site is what you expect.",
  );
}

main();
