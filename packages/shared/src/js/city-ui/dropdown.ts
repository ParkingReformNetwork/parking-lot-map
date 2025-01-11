import ChoicesJS from "choices.js";

import { DropdownChoice, createChoice } from "./dropdownUtils";
import type { CityStatsCollection } from "../model/types";
import { ViewStateObservable } from "../state/ViewState";

function createDropdown(cityStatsData: CityStatsCollection): ChoicesJS {
  const dropdown = new ChoicesJS("#city-dropdown", {
    position: "bottom",
    allowHTML: false,
    itemSelectText: "",
    searchEnabled: true,
    searchResultLimit: 6,
    searchFields: ["customProperties.city", "customProperties.context"],
    // Disabling this option allows us to properly handle search groups.
    // We already sort entries in the JSON file.
    shouldSort: false,
  });

  const officialCities: DropdownChoice[] = [];
  const communityCities: DropdownChoice[] = [];
  Object.entries(cityStatsData).forEach(([id, { name, contribution }]) => {
    const entry = createChoice(id, name);
    if (contribution) {
      communityCities.push(entry);
    } else {
      officialCities.push(entry);
    }
  });

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

export default function initDropdown(
  cityStatsData: CityStatsCollection,
  viewState: ViewStateObservable,
): void {
  const dropdown = createDropdown(cityStatsData);

  viewState.subscribe(
    ({ cityId }) => dropdown.setChoiceByValue(cityId),
    "set dropdown to city",
  );

  // Bind user-changes in the dropdown to update the state in CitySelectionObservable.
  // Note that `change` only triggers for user-driven changes, not programmatic updates.
  const selectElement = dropdown.passedElement.element as HTMLSelectElement;
  selectElement.addEventListener("change", () => {
    viewState.setValue({ cityId: selectElement.value, shouldSnapMap: true });
  });
}
