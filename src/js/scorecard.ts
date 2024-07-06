import { Popup } from "leaflet";
import { CityId, ScoreCard, ScoreCardDetails } from "./types";
import setUpShareUrlClickListener from "./share";

const generateScorecard = (entry: ScoreCardDetails): string => {
  const header = `
      <div class="scorecard-header">
        <h1 class="scorecard-title">${entry.name}</h1>
        <a href="#" class="share-icon-container">
          <i class="share-link-icon fa-solid fa-link fa-xl" title="Copy link"></i>
          <i class="share-check-icon fa-solid fa-check fa-xl" title="Link Copied!" style="display: none"></i>
        </a>
      </div>
      <p>${entry.percentage} of the central city is off-street parking</p>
      `;

  const accordionLines = [];
  if (entry.parkingScore) {
    accordionLines.push(`<p>Parking score: ${entry.parkingScore}</p>`);
  }
  accordionLines.push(`<p>City type: ${entry.cityType}</p>`);
  accordionLines.push(`<p>Population: ${entry.population}</p>`);
  accordionLines.push(
    `<p>Urbanized area population: ${entry.urbanizedAreaPopulation}</p>`
  );

  if ("contribution" in entry) {
    accordionLines.push("<hr>");
    accordionLines.push(
      `<div><span class="community-tag"><i class="fa-solid fa-triangle-exclamation"></i> Community-maintained map. <br>Email ${entry.contribution} for issues.</span></div>`
    );
  }

  accordionLines.push(`<p>Parking reform: ${entry.reforms}</p>`);
  if (entry.url) {
    accordionLines.push(
      `<div class="popup-button"><a href="${entry.url}">View more about reforms</a></div>`
    );
  }

  const accordion = `<div class="scorecard-accordion">
      <button class="scorecard-accordion-toggle">
        <span class="scorecard-accordion-title">Additional details</span>
        <div class="scorecard-accordion-icon-container">
          <i class="fa-solid fa-chevron-down" title="expand additional details"></i>
          <i class="fa-solid fa-chevron-up" title="collapse additional details" style="display: none"></i>
        </div>
      </button>
      <div id="scorecard-accordion-content" class="scorecard-accordion-content" style="display: none">
        ${accordionLines.join("\n")}
      </div>
    </div>
  `;

  return header + accordion;
};

const setScorecard = (cityId: CityId, cityProperties: ScoreCard): void => {
  const { layer, details } = cityProperties;
  const scorecard = generateScorecard(details);
  const popup = new Popup({
    pane: "fixed",
    className: "popup-fixed",
    autoPan: false,
  }).setContent(scorecard);
  layer.bindPopup(popup).openPopup();
  setUpShareUrlClickListener(cityId);
};

const switchAccordionIcons = (
  accordionToggle: HTMLButtonElement,
  currentlyExpanded: boolean
): void => {
  const upIcon = accordionToggle.querySelector(".fa-chevron-up");
  const downIcon = accordionToggle.querySelector(".fa-chevron-down");
  if (!(upIcon instanceof SVGElement) || !(downIcon instanceof SVGElement))
    return;

  if (currentlyExpanded) {
    upIcon.style.display = "none";
    downIcon.style.display = "block";
  } else {
    upIcon.style.display = "block";
    downIcon.style.display = "none";
  }
};

const setScorecardAccordionListener = () => {
  // The event listener is on `map` because it is never erased, unlike the scorecard
  // being recreated every time the map moves. This is called "event delegation".
  const map = document.querySelector("#map");
  if (!(map instanceof Element)) return;
  map.addEventListener("click", async (event) => {
    const clicked = event.target;
    if (!(clicked instanceof Element)) return;
    const accordionToggle = clicked.closest(".scorecard-accordion-toggle");
    if (!(accordionToggle instanceof HTMLButtonElement)) return;

    const accordionContent = document.querySelector(
      "#scorecard-accordion-content"
    );
    if (!(accordionContent instanceof HTMLDivElement)) return;
    const currentlyExpanded = accordionContent.style.display !== "none";

    accordionContent.style.display = currentlyExpanded ? "none" : "block";
    switchAccordionIcons(accordionToggle, currentlyExpanded);
  });
};

export { setScorecard, setScorecardAccordionListener };
