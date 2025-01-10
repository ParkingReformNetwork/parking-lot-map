declare module "~/data/city-boundaries.geojson" {
  const value: import("@prn-parking-lots/shared/src/js/types").CityBoundaries;
  export default value;
}

declare module "~/data/city-stats.json" {
  const value: import("@prn-parking-lots/shared/src/js/types").CityStatsCollection;
  export default value;
}

declare module "~/data/parking-lots/*" {
  const value: unknown;
  export default value;
}
