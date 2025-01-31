import ChoicesJS from "choices.js";

import { DropdownRequest, convertToChoicesJs } from "./dropdownUtils";
import { ViewStateObservable } from "../state/ViewState";

function createDropdown(dropdownRequest: DropdownRequest): ChoicesJS {
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
  dropdown.setChoices(convertToChoicesJs(dropdownRequest));
  return dropdown;
}

export default function initDropdown(
  dropdownRequest: DropdownRequest,
  viewState: ViewStateObservable,
): void {
  const dropdown = createDropdown(dropdownRequest);

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
