import { ScoreCardDetails } from "./types";

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

function setScorecard(entry: ScoreCardDetails): void {
  const scorecardContainer = document.querySelector(".scorecard-container");
  if (!scorecardContainer) return;
  scorecardContainer.innerHTML = generateScorecard(entry);
}

function setUpScorecardAccordionListener() {
  // The event listener is on `#scorecard-container` because it is never erased,
  // unlike the scorecard contents being recreated every time the city changes.
  // This is called "event delegation".
  const scorecardContainer = document.querySelector<HTMLElement>(
    "#scorecard-container"
  );
  scorecardContainer?.addEventListener("click", async (event) => {
    const clicked = event.target;
    if (!(clicked instanceof Element)) return;
    const accordionToggle = clicked.closest<HTMLButtonElement>(
      ".scorecard-accordion-toggle"
    );
    if (!accordionToggle) return;

    const accordionContent = document.querySelector<HTMLElement>(
      "#scorecard-accordion-content"
    );
    const upIcon = accordionToggle.querySelector<SVGElement>(".fa-chevron-up");
    const downIcon =
      accordionToggle.querySelector<SVGElement>(".fa-chevron-down");
    if (!accordionContent || !upIcon || !downIcon) return;

    const currentlyExpanded =
      accordionToggle.getAttribute("aria-expanded") === "true";
    const newState = !currentlyExpanded;

    accordionToggle.setAttribute("aria-expanded", newState.toString());
    accordionContent.hidden = !newState;
    upIcon.style.display = newState ? "block" : "none";
    downIcon.style.display = newState ? "none" : "block";
  });
}

export { setScorecard, setUpScorecardAccordionListener };
