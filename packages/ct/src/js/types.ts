import type { CommonCityStats } from "@prn-parking-lots/shared/src/js/model/types";

export type CityStats = CommonCityStats & {
  group: string;
  transitStation: string | null;
  transitService: string | null;
  county: string;
  cog: string;
};
