import type { DropdownRequest } from "@prn-parking-lots/shared/src/js/city-ui/dropdownUtils";
import { cityIdEntries } from "@prn-parking-lots/shared/src/js/model/cityId.ts";
import type { CityStatsCollection } from "@prn-parking-lots/shared/src/js/model/types";

import type { CityStats } from "./types";

export default function createDropdownRequest(
  data: CityStatsCollection<CityStats>,
): DropdownRequest {
  return {
    useGroups: false,
    value: cityIdEntries(data).map(([id, { name }]) => ({ name, id })),
  };
}
