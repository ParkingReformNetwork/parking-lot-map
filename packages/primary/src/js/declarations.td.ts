declare module "~/data/city-boundaries.geojson" {
  const value: import("./types").CityBoundaries;
  export default value;
}

declare module "~/data/city-stats.json" {
  const value: import("./types").CityStatsCollection;
  export default value;
}

declare module "~/data/parking-lots/*" {
  const value: unknown;
  export default value;
}
