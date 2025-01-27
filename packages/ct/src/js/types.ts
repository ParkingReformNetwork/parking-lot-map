import type { BaseCityStats } from "@prn-parking-lots/shared/src/js/model/types";

export type CityStats = BaseCityStats & {
  percentage: string;
  population: string;
  transitStation: string | null;
  county: string;
};
