import type { Group as ChoicesJSGroup } from "choices.js";

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

export interface DropdownChoiceId {
  id: CityId;
  name: string;
}

export interface DropdownGroup {
  label: string;
  cities: Array<DropdownChoiceId>;
}

export function createChoice(id: CityId, name: string): DropdownChoice {
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

export function convertToChoicesGroups(
  groups: DropdownGroup[],
): ChoicesJSGroup[] {
  return groups
    .filter(({ cities }) => cities.length > 0)
    .map(({ label, cities }) => ({
      label,
      value: label,
      disabled: false,
      choices: cities.map(({ id, name }) => createChoice(id, name)),
    }));
}
