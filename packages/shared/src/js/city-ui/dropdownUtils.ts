import type {
  Group as ChoicesJsGroup,
  Choice as ChoicesJsChoice,
} from "choices.js";

import type { CityId } from "../model/types";

interface DropdownChoice {
  value: string;
  label: string;
  customProperties: {
    city: string;
    /// E.g. "NY" or "rail station"
    context: string;
  };
}

export interface DropdownChoiceRequest {
  id: CityId;
  name: string;
}

export interface DropdownGroupRequest {
  label: string;
  cities: Array<DropdownChoiceRequest>;
}

export function createChoice(choiceId: DropdownChoiceRequest): DropdownChoice {
  const { name, id } = choiceId;
  const [city, context] = name.split(/,\s|\s-\s/);
  return {
    value: id,
    label: name,
    customProperties: {
      city,
      context: context ?? "",
    },
  };
}

export type DropdownRequest =
  | { useGroups: false; value: DropdownChoiceRequest[] }
  | { useGroups: true; value: DropdownGroupRequest[] };

export function convertToChoicesJs(
  request: DropdownRequest,
): ChoicesJsGroup[] | ChoicesJsChoice[] {
  if (!request.useGroups) {
    return request.value.map(createChoice);
  }
  return request.value
    .filter(({ cities }) => cities.length > 0)
    .map(({ label, cities }) => ({
      label,
      value: label,
      disabled: false,
      choices: cities.map(createChoice),
    }));
}
