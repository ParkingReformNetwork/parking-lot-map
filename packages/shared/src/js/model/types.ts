import type {
  Feature,
  FeatureCollection,
  GeoJsonProperties,
  Geometry,
  Polygon,
} from "geojson";
import type { ImageOverlay } from "leaflet";

/// The slugified ID, e.g. `st-louis-mo` or `hartford`.
/// (The state code is missing for state-specific maps like CT.)
/// Branded so that only `parseCityId()` can mint one, keeping unvalidated
/// strings from flowing into city lookups.
export type CityId = string & { readonly __brand: "CityId" };

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
