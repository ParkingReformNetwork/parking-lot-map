import Choices from "choices.js";
import "choices.js/public/assets/styles/choices.css";

import scoreCardsData from "../../data/score-cards.json";
import { ScoreCardDetails, DropdownChoice } from "./types";
import { CitySelectionObservable } from "./CitySelectionState";

function createDropdown(): Choices {
  const dropdown = new Choices("#city-dropdown", {
    allowHTML: false,
    itemSelectText: "",
    searchEnabled: true,
    searchResultLimit: 6,
    searchFields: ["customProperties.city", "customProperties.state"],
    // Since cities are already alphabetical order in scorecard,
    // disabling this option allows us to show PRN maps at the top.
    shouldSort: false,
  });

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

  dropdown.setChoices([
    {
      value: "Official maps",
      label: "Official maps",
      disabled: false,
      choices: officialCities,
    },
  ]);

  if (communityCities.length > 0) {
    dropdown.setChoices([
      {
        value: "Community maps",
        label: "Community maps",
        disabled: false,
        choices: communityCities,
      },
    ]);
  }

  return dropdown;
}

function setUpDropdown(observable: CitySelectionObservable): void {
  const dropdown = createDropdown();

  observable.subscribe(({ cityId }) => dropdown.setChoiceByValue(cityId));

  const selectElement = dropdown.passedElement.element as HTMLSelectElement;
  selectElement.addEventListener("change", () => {
    // Note that `change` only triggers for user-driven changes, not programmatic changes.
    observable.setValue({ cityId: selectElement.value, shouldSnapMap: true });
  });
}

export default setUpDropdown;
