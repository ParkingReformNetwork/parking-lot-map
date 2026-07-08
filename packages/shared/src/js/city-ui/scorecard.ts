import { iconHtml } from "../layout/icons";
import type { BaseCityStats, CityEntryCollection } from "../model/types";
import Observable from "../state/Observable";
import type { ViewStateObservable } from "../state/ViewState";

export interface ScorecardValues {
  header: string;
  listEntries: string[];
}

export type ScorecardFormatter<T extends BaseCityStats> = (
  stats: T,
) => ScorecardValues;

function generateScorecard(values: ScorecardValues): string {
  const accordion = `<div class="scorecard-accordion">
      <button
        class="scorecard-accordion-toggle"
        aria-expanded="false"
        aria-controls="scorecard-accordion-content"
      >
        <span id="scorecard-accordion-title" class="scorecard-accordion-title">Additional details</span>
        <div class="scorecard-accordion-icon-container" aria-hidden="true">
          <svg class="chevron-down-icon" title="expand additional details"><use href="#icon-chevron-down"></use></svg>
          <svg class="chevron-up-icon" title="collapse additional details" style="display: none"><use href="#icon-chevron-up"></use></svg>
        </div>
      </button>
      <section
        id="scorecard-accordion-content"
        class="scorecard-accordion-content"
        aria-describedby="scorecard-accordion-title"
        hidden
      >
        <ul>
        ${values.listEntries.map((e) => `<li>${e}</li>`).join("\n")}
        </ul>
      </section>
    </div>
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

function updateAccordionUI(expanded: boolean): void {
  const toggle = document.querySelector(".scorecard-accordion-toggle");
  const content = document.querySelector<HTMLElement>(
    "#scorecard-accordion-content",
  );
  const upIcon = toggle?.querySelector<SVGElement>(".chevron-up-icon");
  const downIcon = toggle?.querySelector<SVGElement>(".chevron-down-icon");
  if (!toggle || !content || !upIcon || !downIcon) return;

  toggle.setAttribute("aria-expanded", expanded.toString());
  content.hidden = !expanded;
  upIcon.style.display = expanded ? "block" : "none";
  downIcon.style.display = expanded ? "none" : "block";
}

function initAccordion(): void {
  const isExpanded = new Observable<boolean>("scorecard accordion", false);
  isExpanded.subscribe(updateAccordionUI, "toggle scorecard open/closed");

  // The event listener is on `#scorecard-container` because it is never erased,
  // unlike the scorecard contents being recreated every time the city changes.
  // This is called "event delegation".
  const scorecardContainer = document.querySelector("#scorecard-container");
  scorecardContainer?.addEventListener("click", (event) => {
    const clickedElement = event.target;
    if (!(clickedElement instanceof Element)) return;
    const toggleClicked = clickedElement.closest(".scorecard-accordion-toggle");
    if (toggleClicked) {
      isExpanded.setValue(!isExpanded.getValue());
    }
  });

  isExpanded.initialize();
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

  // Also set up the accordion UI. It doesn't depend on globalState, so only
  // needs to run once.
  initAccordion();
}
