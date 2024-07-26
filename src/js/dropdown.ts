import Choices from "choices.js";
import "choices.js/public/assets/styles/choices.css";
import scoreCardsData from "../../data/score-cards.json";
import { CityId, ScoreCardDetails, DropdownChoice } from "./types";

export const DROPDOWN = new Choices("#city-dropdown", {
  allowHTML: false,
  itemSelectText: "",
  searchEnabled: true,
  searchResultLimit: 6,
  searchFields: ["customProperties.city", "customProperties.state"],
  // Since cities are already alphabetical order in scorecard,
  // disabling this option allows us to show PRN maps at the top.
  shouldSort: false,
});

const setUpDropdown = (
  initialCityId: CityId | null,
  fallBackCityId: CityId
) => {
  const officialCities: DropdownChoice[] = [];
  const communityCities: DropdownChoice[] = [];
  Object.entries(scoreCardsData as Record<string, ScoreCardDetails>).forEach(
    ([id, { name, contribution }]) => {
      const [city, state] = name.split(", ");
      const entry: DropdownChoice = {
        value: id,
        label: name,
        customProperties: {
          city,
          state,
        },
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
      value: "Official maps",
      label: "Official maps",
      disabled: false,
      choices: officialCities,
    },
  ]);

  if (communityCities.length > 0) {
    DROPDOWN.setChoices([
      {
        value: "Community maps",
        label: "Community maps",
        disabled: false,
        choices: communityCities,
      },
    ]);
  }

  if (initialCityId && Object.keys(scoreCardsData).includes(initialCityId)) {
    DROPDOWN.setChoiceByValue(initialCityId);
  } else {
    DROPDOWN.setChoiceByValue(fallBackCityId);
  }
};

export default setUpDropdown;
