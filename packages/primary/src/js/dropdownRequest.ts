import {
  DropdownRequest,
  DropdownChoiceRequest,
} from "@prn-parking-lots/shared/src/js/city-ui/dropdownUtils";
import type { CityStatsCollection } from "@prn-parking-lots/shared/src/js/model/types";

import type { CityStats } from "./types";

export default function createDropdownRequest(
  data: CityStatsCollection<CityStats>,
): DropdownRequest {
  const official: DropdownChoiceRequest[] = [];
  const community: DropdownChoiceRequest[] = [];
  Object.entries(data).forEach(([id, { name, contribution }]) => {
    if (contribution) {
      community.push({ id, name });
    } else {
      official.push({ id, name });
    }
  });
  return {
    useGroups: true,
    value: [
      {
        label: "Official maps",
        cities: official,
      },
      {
        label: "Community maps",
        cities: community,
      },
    ],
  };
}
