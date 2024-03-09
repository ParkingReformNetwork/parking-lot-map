declare module "~/data/city-boundaries.geojson" {
  import { FeatureCollection, Polygon, GeoJsonProperties } from "geojson";

  const value: FeatureCollection<Polygon, GeoJsonProperties>;
  export default value;
}

declare module "~/data/score-cards.json" {
  const value: import("./types").ScoreCardsDetails;
  export default value;
}

declare module "~/data/parking-lots/*" {
  const value: unknown;
  export default value;
}
