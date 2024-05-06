import { Feature, Geometry } from "geojson";
import { ImageOverlay } from "leaflet";

export type CityId = string; // e.g. `st.-louis-mo`

export interface ScoreCardDetails {
  name: string;
  percentage: string;
  cityType: string;
  population: string;
  urbanizedAreaPopulation: string;
  parkingScore: string;
  reforms: string;
  url: string;
  contribution?: string;
}

export type ScoreCardsDetails = Record<CityId, ScoreCardDetails>;

export interface ScoreCard {
  details: ScoreCardDetails;
  layer: ImageOverlay;
}

export type ScoreCards = Record<CityId, ScoreCard>;

export interface ParkingLotModules {
  [key: string]: () => Promise<Feature<Geometry>>;
}
