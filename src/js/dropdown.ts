import Choices from "choices.js";
import "choices.js/public/assets/styles/choices.css";
import scoreCardsData from "../../data/score-cards.json";
import { CityId, ScoreCardDetails } from "./types";

export const DROPDOWN = new Choices("#city-choice", {
  allowHTML: false,
  itemSelectText: "Select",
  searchEnabled: true,
  shouldSort: false, // since cities are already alphabetical order in scorecard, disabling this option allows us to show PRN maps at the top.
});

const typedScoreCardData: Record<string, ScoreCardDetails> = scoreCardsData;

const setUpDropdown = (initialCityId: CityId, fallBackCityId: CityId) => {
  const allCities = Object.entries(typedScoreCardData).map(
    ([id, { name, contribution }]) => ({
      value: id,
      label: name,
      contribution: contribution || "PRN",
    })
  );
  DROPDOWN.setChoices([
    {
      value: "PRN Maps",
      label: "PRN Maps",
      disabled: false,
      choices: allCities.filter((city) => city.contribution === "PRN"),
    },
    {
      value: "Community Maps",
      label: "Community Maps",
      disabled: false,
      choices: allCities.filter((city) => city.contribution !== "PRN"),
    },
  ]);
  if (Object.keys(scoreCardsData).includes(initialCityId)) {
    DROPDOWN.setChoiceByValue(initialCityId);
  } else {
    DROPDOWN.setChoiceByValue(fallBackCityId);
  }
};

export default setUpDropdown;
