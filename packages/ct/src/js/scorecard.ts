import {
  ScorecardValues,
  formatHeader,
} from "@prn-parking-lots/shared/src/js/city-ui/scorecard.ts";

import type { CityStats } from "./types.ts";

export default function formatScorecard(stats: CityStats): ScorecardValues {
  const header = formatHeader({
    name: stats.name,
    percentage: stats.percentage,
    boundaryDescription: "district",
  });

  const listEntries = [];
  listEntries.push(`${stats.population} city residents`);
  if (stats.transitStation) {
    listEntries.push(`Transit station: ${stats.transitStation}`);
  }
  listEntries.push(`${stats.county}`);

  return { header, listEntries };
}
