import { DropdownGroup } from "@prn-parking-lots/shared/src/js/city-ui/dropdownUtils";
import { CityStatsCollection } from "@prn-parking-lots/shared/src/js/model/types";

export default function createDropdownGroups(
  data: CityStatsCollection,
): DropdownGroup[] {
  return [
    {
      label: "Group 1",
      cities: Object.entries(data).map(([id, { name }]) => ({ id, name })),
    },
  ];
}
