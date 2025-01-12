import {
  DropdownChoiceId,
  DropdownGroup,
} from "@prn-parking-lots/shared/src/js/city-ui/dropdownUtils";
import type { CityStatsCollection } from "@prn-parking-lots/shared/src/js/model/types";

import type { CityStats } from "./types";

export default function createDropdownGroups(
  data: CityStatsCollection<CityStats>,
): DropdownGroup[] {
  const group1: DropdownChoiceId[] = [];
  const group2: DropdownChoiceId[] = [];
  const group3: DropdownChoiceId[] = [];
  Object.entries(data).forEach(([id, { name, group }]) => {
    switch (group) {
      case "Group 1":
        group1.push({ name, id });
        break;
      case "Group 2":
        group2.push({ name, id });
        break;
      case "Group 3":
        group3.push({ name, id });
        break;
      default:
        throw new Error(`Unrecognized group '${group}' for ${id}`);
    }
  });
  return [
    {
      label: "Group 1",
      cities: group1,
    },
    {
      label: "Group 2",
      cities: group2,
    },
    {
      label: "Group 3",
      cities: group3,
    },
  ];
}
