import type { ImageOverlay } from "leaflet";
import type {
  FeatureCollection,
  Feature,
  Geometry,
  Polygon,
  GeoJsonProperties,
} from "geojson";

/// The slugified ID, e.g. `st-louis-mo` or `hartford`.
/// (The state code is missing for state-specific maps like CT.)
export type CityId = string;

export interface CityStats {
  name: string;
  percentage: string;
  cityType: string;
  population: string;
  urbanizedAreaPopulation: string;
  parkingScore: string | null;
  reforms: string | null;
  url: string | null;
  contribution: string | null;
}

export type CityStatsCollection = Record<CityId, CityStats>;

export interface CityEntry {
  stats: CityStats;
  layer: ImageOverlay;
}

export type CityEntryCollection = Record<CityId, CityEntry>;

export type CityBoundaries = FeatureCollection<Polygon, GeoJsonProperties>;

export interface ParkingLotGeoJSONModules {
  [key: string]: () => Promise<Feature<Geometry>>;
}

export interface DataSet {
  stats: CityStatsCollection;
  boundaries: CityBoundaries;
  parkingLots: ParkingLotGeoJSONModules;
}
