import {
  ScorecardValues,
  formatHeader,
  formatReformLine,
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
  if (stats.reforms) {
    listEntries.push(formatReformLine(stats.reforms, stats.url));
  }

  return { header, listEntries };
}
