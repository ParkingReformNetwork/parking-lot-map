import { CitySelectionObservable } from "./CitySelectionState";
import { CityEntryCollection, CityStats } from "./types";
import Observable from "./Observable";

function generateScorecard(stats: CityStats): string {
  let header = `
      <h1 class="scorecard-title">Parking lots in ${stats.name}</h1>
      <p>${stats.percentage} of the central city is off-street parking</p>
      `;

  if ("contribution" in stats) {
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
    reformsLine += ` (<a class="external-link" title="view parking reform details" href="${stats.url}">details <i aria-hidden="true" class="fa-solid fa-arrow-right"></i></a>)`;
  }
  listEntries.push(reformsLine);

  if ("contribution" in stats) {
    listEntries.push(
      `<a href="mailto:${stats.contribution}">Email data maintainer</a>`,
    );
  }

  const accordion = `<div class="scorecard-accordion">
      <button
        class="scorecard-accordion-toggle"
        aria-expanded="false"
        aria-controls="scorecard-accordion-content"
      >
        <span id="scorecard-accordion-title" class="scorecard-accordion-title">Additional details</span>
        <div class="scorecard-accordion-icon-container" aria-hidden="true">
          <i class="fa-solid fa-chevron-down" title="expand additional details"></i>
          <i class="fa-solid fa-chevron-up" title="collapse additional details" style="display: none"></i>
        </div>
      </button>
      <section
        id="scorecard-accordion-content"
        class="scorecard-accordion-content"
        aria-describedby="scorecard-accordion-title"
        hidden
      >
        <ul>
        ${listEntries.map((e) => `<li>${e}</li>`).join("\n")}
        </ul>
      </section>
    </div>
  `;

  return header + accordion;
}

function updateAccordionUI(expanded: boolean): void {
  const toggle = document.querySelector(".scorecard-accordion-toggle");
  const content = document.querySelector<HTMLElement>(
    "#scorecard-accordion-content",
  );
  const upIcon = toggle?.querySelector<SVGElement>(".fa-chevron-up");
  const downIcon = toggle?.querySelector<SVGElement>(".fa-chevron-down");
  if (!toggle || !content || !upIcon || !downIcon) return;

  toggle.setAttribute("aria-expanded", expanded.toString());
  content.hidden = !expanded;
  upIcon.style.display = expanded ? "block" : "none";
  downIcon.style.display = expanded ? "none" : "block";
}

function initAccordion(): void {
  const isExpanded = new Observable<boolean>(false);
  isExpanded.subscribe(updateAccordionUI);

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

export default function subscribeScorecard(
  observable: CitySelectionObservable,
  cityEntries: CityEntryCollection,
): void {
  observable.subscribe(({ cityId }) => {
    const scorecardContainer = document.querySelector(".scorecard-container");
    if (!scorecardContainer) return;
    scorecardContainer.innerHTML = generateScorecard(cityEntries[cityId].stats);
  });

  // Also set up the accordion UI. It doesn't depend on globalState, so only
  // needs to run once.
  initAccordion();
}
