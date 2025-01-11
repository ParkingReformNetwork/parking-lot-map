import type { CityId } from "../model/types";

export interface DropdownChoice {
  value: string;
  label: string;
  customProperties: {
    city: string;
    /// E.g. "NY" or "rail station"
    context: string;
  };
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
