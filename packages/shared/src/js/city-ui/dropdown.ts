import ChoicesJS from "choices.js";

import { DropdownGroup, convertToChoicesGroups } from "./dropdownUtils";
import { ViewStateObservable } from "../state/ViewState";

function createDropdown(groups: DropdownGroup[]): ChoicesJS {
  const dropdown = new ChoicesJS("#city-dropdown", {
    position: "bottom",
    allowHTML: false,
    itemSelectText: "",
    searchEnabled: true,
    searchResultLimit: 6,
    searchFields: ["customProperties.city", "customProperties.context"],
    // Disabling this option allows us to properly handle groups.
    // We already sort entries in the JSON file.
    shouldSort: false,
  });
  dropdown.setChoices(convertToChoicesGroups(groups));
  return dropdown;
}

export default function initDropdown(
  groups: DropdownGroup[],
  viewState: ViewStateObservable,
): void {
  const dropdown = createDropdown(groups);

  viewState.subscribe(
    ({ cityId }) => dropdown.setChoiceByValue(cityId),
    "set dropdown to city",
  );

  // Bind user changes in the dropdown to update the view state.
  // Note that `change` only triggers for user-driven changes, not programmatic updates.
  const selectElement = dropdown.passedElement.element as HTMLSelectElement;
  selectElement.addEventListener("change", () => {
    viewState.setValue({ cityId: selectElement.value, shouldSnapMap: true });
  });
}
