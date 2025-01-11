import { ScorecardValues } from "@prn-parking-lots/shared/src/js/city-ui/scorecard";
import { CityStats } from "@prn-parking-lots/shared/src/js/model/types";

export default function formatScorecard(stats: CityStats): ScorecardValues {
  let header = `
    <h1 class="scorecard-title">Parking lots in ${stats.name}</h1>
    <p>${stats.percentage} of the central city is off-street parking</p>
    `;

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

  let reformsLine = `Parking reforms ${stats.reforms}`;
  if (stats.url) {
    reformsLine += ` (<a class="external-link" title="view parking reform details" href="${stats.url}" target="_blank">details <i aria-hidden="true" class="fa-solid fa-arrow-right"></i></a>)`;
  }
  listEntries.push(reformsLine);

  if (stats.contribution) {
    listEntries.push(
      `<a href="mailto:${stats.contribution}">Email data maintainer</a>`,
    );
  }

  return { header, listEntries };
}
