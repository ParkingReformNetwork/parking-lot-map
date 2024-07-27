declare module "~/data/city-boundaries.geojson" {
  import { FeatureCollection, Polygon, GeoJsonProperties } from "geojson";

  const value: FeatureCollection<Polygon, GeoJsonProperties>;
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
