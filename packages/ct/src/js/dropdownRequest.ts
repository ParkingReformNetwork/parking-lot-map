import { DropdownRequest } from "@prn-parking-lots/shared/src/js/city-ui/dropdownUtils";
import type { CityStatsCollection } from "@prn-parking-lots/shared/src/js/model/types";

import type { CityStats } from "./types";

export default function createDropdownRequest(
  data: CityStatsCollection<CityStats>,
): DropdownRequest {
  return {
    useGroups: false,
    value: Object.entries(data).map(([id, { name }]) => ({ name, id })),
  };
}
