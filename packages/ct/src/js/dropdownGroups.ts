import {
  DropdownChoiceId,
  DropdownGroup,
} from "@prn-parking-lots/shared/src/js/city-ui/dropdownUtils";
import type { CityStatsCollection } from "@prn-parking-lots/shared/src/js/model/types";

import type { CityStats } from "./types";

export default function createDropdownGroups(
  data: CityStatsCollection<CityStats>,
): DropdownGroup[] {
  const fairfield: DropdownChoiceId[] = [];
  const hartford: DropdownChoiceId[] = [];
  const litchfield: DropdownChoiceId[] = [];
  const middlesex: DropdownChoiceId[] = [];
  const newHaven: DropdownChoiceId[] = [];
  const newLondon: DropdownChoiceId[] = [];
  const tolland: DropdownChoiceId[] = [];
  const windham: DropdownChoiceId[] = [];
  Object.entries(data).forEach(([id, { name, county }]) => {
    switch (county) {
      case "Fairfield County":
        fairfield.push({ name, id });
        break;
      case "Hartford County":
        hartford.push({ name, id });
        break;
      case "Litchfield County":
        litchfield.push({ name, id });
        break;
      case "Middlesex County":
        middlesex.push({ name, id });
        break;
      case "New Haven County":
        newHaven.push({ name, id });
        break;
      case "New London County":
        newLondon.push({ name, id });
        break;
      case "Tolland County":
        tolland.push({ name, id });
        break;
      case "Windham County":
        windham.push({ name, id });
        break;
      default:
        throw new Error(`Unrecognized group '${county}' for ${id}`);
    }
  });
  return [
    {
      label: "Fairfield County",
      cities: fairfield,
    },
    {
      label: "Hartford County",
      cities: hartford,
    },
    {
      label: "Litchfield County",
      cities: litchfield,
    },
    {
      label: "Middlesex County",
      cities: middlesex,
    },
    {
      label: "New Haven County",
      cities: newHaven,
    },
    {
      label: "New London County",
      cities: newLondon,
    },
    {
      label: "Tolland County",
      cities: tolland,
    },
    {
      label: "Windham County",
      cities: windham,
    },
  ];
}
