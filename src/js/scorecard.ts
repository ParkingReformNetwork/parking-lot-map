import { CitySelectionObservable } from "./CitySelectionState";
import { ScoreCards, ScoreCardDetails } from "./types";
import Observable from "./Observable";

function generateScorecard(entry: ScoreCardDetails): string {
  let header = `
      <h1 class="scorecard-title">Parking lots in ${entry.name}</h1>
      <p>${entry.percentage} of the central city is off-street parking</p>
      `;

  if ("contribution" in entry) {
    header += `<div class="community-contribution-warning">
      <i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i> 
      Community-maintained map
    </div>`;
  }

  const listEntries = [];
  if (entry.parkingScore) {
    listEntries.push(
      `${entry.parkingScore}/100 parking score (lower is better)`
    );
  }
  listEntries.push(`City type: ${entry.cityType}`);
  listEntries.push(`${entry.population} residents - city proper`);
  listEntries.push(
    `${entry.urbanizedAreaPopulation} residents - urbanized area`
  );

  let reformsLine = `Parking reforms ${entry.reforms}`;
  if (entry.url) {
    reformsLine += ` (<a class="external-link" title="view parking reform details" href="${entry.url}">details <i aria-hidden="true" class="fa-solid fa-arrow-right"></i></a>)`;
  }
  listEntries.push(reformsLine);

  if ("contribution" in entry) {
    listEntries.push(
      `<a href="mailto:${entry.contribution}">Email data maintainer</a>`
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

function updateScorecardAccordionUI(expanded: boolean): void {
  const toggle = document.querySelector(".scorecard-accordion-toggle");
  const content = document.querySelector<HTMLElement>(
    "#scorecard-accordion-content"
  );
  const upIcon = toggle?.querySelector<SVGElement>(".fa-chevron-up");
  const downIcon = toggle?.querySelector<SVGElement>(".fa-chevron-down");
  if (!toggle || !content || !upIcon || !downIcon) return;

  toggle.setAttribute("aria-expanded", expanded.toString());
  content.hidden = !expanded;
  upIcon.style.display = expanded ? "block" : "none";
  downIcon.style.display = expanded ? "none" : "block";
}

function setUpScorecardAccordion(): void {
  const isExpanded = new Observable<boolean>(false);
  isExpanded.subscribe(updateScorecardAccordionUI);

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

export default function addScorecardSubscriber(
  observable: CitySelectionObservable,
  cities: ScoreCards
): void {
  observable.subscribe(({ cityId }) => {
    const scorecardContainer = document.querySelector(".scorecard-container");
    if (!scorecardContainer) return;
    scorecardContainer.innerHTML = generateScorecard(cities[cityId].details);
  });

  // Also set up the accordion UI. It doesn't depend on globalState, so only
  // needs to run once.
  setUpScorecardAccordion();
}
