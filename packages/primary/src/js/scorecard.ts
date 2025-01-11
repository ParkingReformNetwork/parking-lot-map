import {
  ScorecardValues,
  formatHeader,
  formatReformLine,
} from "@prn-parking-lots/shared/src/js/city-ui/scorecard";
import { CityStats } from "@prn-parking-lots/shared/src/js/model/types";

export default function formatScorecard(stats: CityStats): ScorecardValues {
  let header = formatHeader({
    name: stats.name,
    percentage: stats.percentage,
    boundaryDescription: "central city",
  });
  if (stats.contribution) {
    header += `<div class="community-contribution-warning">
    <i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i> 
    Community-maintained map
  </div>`;
  }

  const listEntries = [];
  if (stats.parkingScore) {
    listEntries.push(
      `${stats.parkingScore}/100 parking score (lower is better)`,
    );
  }
  listEntries.push(`City type: ${stats.cityType}`);
  listEntries.push(`${stats.population} residents - city proper`);
  listEntries.push(
    `${stats.urbanizedAreaPopulation} residents - urbanized area`,
  );
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
