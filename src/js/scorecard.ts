import { Popup } from "leaflet";
import { CityId, ScoreCard, ScoreCardDetails } from "./types";
import setUpShareUrlClickListener from "./share";

const generateScorecard = (entry: ScoreCardDetails): string => {
  const header = `
      <div class="scorecard-header">
        <div class="scorecard-title">${entry.name}</div>
        <a href="#" class="share-icon-container">
          <i class="share-link-icon fa-solid fa-link fa-xl" title="Copy link"></i>
          <i class="share-check-icon fa-solid fa-check fa-xl" title="Link Copied!" style="display: none"></i>
        </a>
      </div>
      `;

  const lines = ["<hr>"];
  lines.push(`<p>Parking: ${entry.percentage} of central city</p>`);
  if (entry.parkingScore) {
    lines.push(`<p>Parking score: ${entry.parkingScore}</p>`);
  }
  lines.push(`<p>Parking reform: ${entry.reforms}</p>`);
  lines.push("<br />");
  lines.push(`<p>City type: ${entry.cityType}</p>`);
  lines.push(`<p>Population: ${entry.population}</p>`);
  lines.push(
    `<p>Urbanized area population: ${entry.urbanizedAreaPopulation}</p>`
  );

  if ("contribution" in entry) {
    lines.push("<hr>");
    lines.push(
      `<div><span class="community-tag"><i class="fa-solid fa-triangle-exclamation"></i> Community-maintained map. <br>Email ${entry.contribution} for issues.</span></div>`
    );
  }
  if (entry.url) {
    lines.push(
      "<hr>",
      `<div class="popup-button"><a href="${entry.url}">View more about reforms</a></div>`
    );
  }
  return header + lines.join("\n");
};

const setScorecard = (cityId: CityId, cityProperties: ScoreCard): void => {
  const { layer, details } = cityProperties;
  const scorecard = generateScorecard(details);
  setUpShareUrlClickListener(cityId);
  const popup = new Popup({
    pane: "fixed",
    className: "popup-fixed",
    autoPan: false,
  }).setContent(scorecard);
  layer.bindPopup(popup).openPopup();
};

export default setScorecard;
