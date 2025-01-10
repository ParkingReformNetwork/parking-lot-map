import { determineArgs, updateCoordinates } from "./base.ts";

const main = async (): Promise<void> => {
  const { cityId } = determineArgs(
    "update-city-boundaries",
    process.argv.slice(2),
  )
    .mapErr((err) => new Error(`Argument error: ${err}`))
    .unwrap();
  const value = (
    await updateCoordinates(
      "update-city-boundaries",
      cityId,
      false,
      "data/city-boundaries.geojson",
      "city-update.geojson",
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
