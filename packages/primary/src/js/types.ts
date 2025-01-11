import type { CommonCityStats } from "@prn-parking-lots/shared/src/js/model/types";

export type CityStats = CommonCityStats & {
  cityType: string;
  urbanizedAreaPopulation: string;
  parkingScore: string | null;
  contribution: string | null;
};
