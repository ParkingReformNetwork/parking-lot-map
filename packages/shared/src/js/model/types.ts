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

export interface BaseCityStats {
  name: string;
}

export type CityStatsCollection<T extends BaseCityStats> = Record<CityId, T>;

export interface CityEntry<T extends BaseCityStats> {
  stats: T;
  layer: ImageOverlay;
}

export type CommonCityStats = BaseCityStats & {
  percentage: string;
  reforms: string | null;
  url: string | null;
  population: string;
};

export type CityEntryCollection<T extends BaseCityStats> = Record<
  CityId,
  CityEntry<T>
>;

export type CityBoundaries = FeatureCollection<Polygon, GeoJsonProperties>;

export interface ParkingLotGeoJSONModules {
  [key: string]: () => Promise<Feature<Geometry>>;
}

export interface DataSet<T extends BaseCityStats> {
  stats: CityStatsCollection<T>;
  boundaries: CityBoundaries;
  parkingLots: ParkingLotGeoJSONModules;
}
