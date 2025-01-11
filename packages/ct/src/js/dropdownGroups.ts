import { DropdownGroup } from "@prn-parking-lots/shared/src/js/city-ui/dropdownUtils";
import type { CityStatsCollection } from "@prn-parking-lots/shared/src/js/model/types";

import type { CityStats } from "./types";

export default function createDropdownGroups(
  data: CityStatsCollection<CityStats>,
): DropdownGroup[] {
  return [
    {
      label: "Group 1",
      cities: Object.entries(data).map(([id, { name }]) => ({ id, name })),
    },
  ];
}
