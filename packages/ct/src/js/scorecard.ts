import { ScorecardValues } from "@prn-parking-lots/shared/src/js/city-ui/scorecard";
import { CityStats } from "@prn-parking-lots/shared/src/js/model/types";

export default function formatScorecard(stats: CityStats): ScorecardValues {
  let header = `
    <h1 class="scorecard-title">Parking lots in ${stats.name}</h1>
    <p>${stats.percentage} of the district is off-street parking</p>
    `;

  const listEntries = [];
  listEntries.push(`${stats.population} residents (city proper)`);

  let reformsLine = `Parking reforms ${stats.reforms}`;
  if (stats.url) {
    reformsLine += ` (<a class="external-link" title="view parking reform details" href="${stats.url}" target="_blank">details <i aria-hidden="true" class="fa-solid fa-arrow-right"></i></a>)`;
  }
  listEntries.push(reformsLine);

  return { header, listEntries };
}
