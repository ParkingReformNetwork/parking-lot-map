import {
  ScorecardValues,
  formatHeader,
  formatReformLine,
} from "@prn-parking-lots/shared/src/js/city-ui/scorecard.ts";

import type { CityStats } from "./types.ts";

export const COMMUNITY_WARNING = `<div class="community-contribution-warning">
    <i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i> 
    Community-maintained map
  </div>`;

export default function formatScorecard(stats: CityStats): ScorecardValues {
  let header = formatHeader({
    name: stats.name,
    percentage: stats.percentage,
    boundaryDescription: "central city",
  });
  if (stats.contribution) {
    header += COMMUNITY_WARNING;
  }

  const listEntries = [];
  if (stats.parkingScore) {
    listEntries.push(
      `${stats.parkingScore}/100 parking score (lower is better)`,
    );
  }
  listEntries.push(`City type: ${stats.cityType}`);
  listEntries.push(`${stats.population} city residents`);
  listEntries.push(`${stats.urbanizedAreaPopulation} urbanized area residents`);
  if (stats.reforms) {
    listEntries.push(formatReformLine(stats.reforms, stats.url));
  }
  if (stats.contribution) {
    listEntries.push(
      `<a href="mailto:${stats.contribution}">Email data maintainer</a>`,
    );
  }

  return { header, listEntries };
}
