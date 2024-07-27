import { ImageOverlay } from "leaflet";

export type CityId = string; // e.g. `st.-louis-mo`

export interface CityStats {
  name: string;
  percentage: string;
  cityType: string;
  population: string;
  urbanizedAreaPopulation: string;
  parkingScore: string | null;
  reforms: string;
  url?: string;
  contribution?: string;
}

export type CityStatsCollection = Record<CityId, CityStats>;

export interface CityEntry {
  stats: CityStats;
  layer: ImageOverlay;
}

export type CityEntryCollection = Record<CityId, CityEntry>;

export interface DropdownChoice {
  value: string;
  label: string;
  customProperties: {
    city: string;
    state: string;
  };
}
