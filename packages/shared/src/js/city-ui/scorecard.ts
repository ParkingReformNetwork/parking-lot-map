import { iconHtml } from "../layout/icons";
import type { BaseCityStats, CityEntryCollection } from "../model/types";
import type { ViewStateObservable } from "../state/ViewState";

export interface ScorecardValues {
  header: string;
  listEntries: string[];
}

export type ScorecardFormatter<T extends BaseCityStats> = (
  stats: T,
) => ScorecardValues;

function generateScorecard(values: ScorecardValues): string {
  const accordion = `<details class="scorecard-accordion">
      <summary class="scorecard-accordion-toggle">
        <span id="scorecard-accordion-title" class="scorecard-accordion-title">Additional details</span>
        <div class="scorecard-accordion-icon-container" aria-hidden="true">
          <svg class="chevron-down-icon" title="expand additional details"><use href="#icon-chevron-down"></use></svg>
          <svg class="chevron-up-icon" title="collapse additional details"><use href="#icon-chevron-up"></use></svg>
        </div>
      </summary>
      <section
        class="scorecard-accordion-content"
        aria-describedby="scorecard-accordion-title"
      >
        <ul>
        ${values.listEntries.map((e) => `<li>${e}</li>`).join("\n")}
        </ul>
      </section>
    </details>
  `;
  return values.header + accordion;
}

export function formatHeader(args: {
  name: string;
  percentage: string;
  boundaryDescription: string;
}): string {
  return `
    <h1 class="scorecard-title">Parking lots in ${args.name}</h1>
    <p>${args.percentage} of the ${args.boundaryDescription} is off-street parking</p>
    `;
}

export function formatReformLine(
  reformStatus: string,
  url: string | null,
): string {
  let result = `Parking reforms ${reformStatus}`;
  if (url) {
    result += ` (<a class="external-link" title="view parking reform details" href="${url}" target="_blank">details ${iconHtml("arrow-right")}</a>)`;
  }
  return result;
}

export default function subscribeScorecard<T extends BaseCityStats>(
  viewState: ViewStateObservable,
  cityEntries: CityEntryCollection<T>,
  scorecardFormatter: ScorecardFormatter<T>,
): void {
  viewState.subscribe(({ cityId }) => {
    const scorecardContainer = document.querySelector(".scorecard-container");
    if (!scorecardContainer) return;
    scorecardContainer.innerHTML = generateScorecard(
      scorecardFormatter(cityEntries[cityId].stats),
    );
  }, "generate scorecard");
}
