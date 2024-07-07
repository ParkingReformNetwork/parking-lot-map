import { Popup } from "leaflet";
import { CityId, ScoreCard, ScoreCardDetails } from "./types";
import setUpShareUrlClickListener from "./share";

const generateScorecard = (entry: ScoreCardDetails): string => {
  const header = `
      <h1 class="scorecard-title">Parking lots in ${entry.name}</h1>
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
      <button class="scorecard-accordion-toggle" aria-expanded="false" aria-controls="scorecard-accordion-content">
        <span class="scorecard-accordion-title">Additional details</span>
        <div class="scorecard-accordion-icon-container" aria-hidden="true">
          <i class="fa-solid fa-chevron-down" title="expand additional details"></i>
          <i class="fa-solid fa-chevron-up" title="collapse additional details" style="display: none"></i>
        </div>
      </button>
      <div id="scorecard-accordion-content" class="scorecard-accordion-content" hidden>
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

const setUpScorecardAccordionListener = () => {
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
    const upIcon = accordionToggle.querySelector(".fa-chevron-up");
    const downIcon = accordionToggle.querySelector(".fa-chevron-down");
    if (!(upIcon instanceof SVGElement) || !(downIcon instanceof SVGElement))
      return;

    const currentlyExpanded =
      accordionToggle.getAttribute("aria-expanded") === "true";
    if (currentlyExpanded) {
      accordionToggle.setAttribute("aria-expanded", "false");
      accordionContent.hidden = true;
      upIcon.style.display = "none";
      downIcon.style.display = "block";
    } else {
      accordionToggle.setAttribute("aria-expanded", "true");
      accordionContent.hidden = false;
      upIcon.style.display = "block";
      downIcon.style.display = "none";
    }
  });
};

export { setScorecard, setUpScorecardAccordionListener };
