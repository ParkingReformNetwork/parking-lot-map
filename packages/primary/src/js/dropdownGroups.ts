import {
  DropdownGroup,
  DropdownChoiceId,
} from "@prn-parking-lots/shared/src/js/city-ui/dropdownUtils";
import { CityStatsCollection } from "@prn-parking-lots/shared/src/js/model/types";

export default function createDropdownGroups(
  data: CityStatsCollection,
): DropdownGroup[] {
  const official: DropdownChoiceId[] = [];
  const community: DropdownChoiceId[] = [];
  Object.entries(data).forEach(([id, { name, contribution }]) => {
    if (contribution) {
      community.push({ id, name });
    } else {
      official.push({ id, name });
    }
  });
  return [
    {
      label: "Official maps",
      cities: official,
    },
    {
      label: "Community maps",
      cities: community,
    },
  ];
}
