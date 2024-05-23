import Choices from "choices.js";
import "choices.js/public/assets/styles/choices.css";
import scoreCardsData from "../../data/score-cards.json";
import { CityId, ScoreCardDetails, dropdownChoice } from "./types";

export const DROPDOWN = new Choices("#city-choice", {
  allowHTML: false,
  itemSelectText: "Select",
  searchEnabled: true,
  shouldSort: false, // since cities are already alphabetical order in scorecard, disabling this option allows us to show PRN maps at the top.
});

const setUpDropdown = (initialCityId: CityId, fallBackCityId: CityId) => {
  const officialCities: dropdownChoice[] = [];
  const communityCities: dropdownChoice[] = [];
  Object.entries(scoreCardsData as Record<string, ScoreCardDetails>).forEach(
    ([id, { name, contribution }]) => {
      const entry: dropdownChoice = {
        value: id,
        label: name,
        contribution: contribution || "PRN",
      };
      if (contribution) {
        communityCities.push(entry);
      } else {
        officialCities.push(entry);
      }
    }
  );

  DROPDOWN.setChoices([
    {
      value: "Official Maps",
      label: "Official Maps",
      disabled: false,
      choices: officialCities.filter((city) => city.contribution === "PRN"),
    },
  ]);

  if (communityCities.length > 0) {
    DROPDOWN.setChoices([
      {
        value: "Community Maps",
        label: "Community Maps",
        disabled: false,
        choices: communityCities,
      },
    ]);
  }

  if (Object.keys(scoreCardsData).includes(initialCityId)) {
    DROPDOWN.setChoiceByValue(initialCityId);
  } else {
    DROPDOWN.setChoiceByValue(fallBackCityId);
  }
};

export default setUpDropdown;
