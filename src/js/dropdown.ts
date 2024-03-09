import Choices from "choices.js";
import "choices.js/public/assets/styles/choices.css";
import scoreCardsData from "../../data/score-cards.json";
import { CityId } from "./types";

export const DROPDOWN = new Choices("#city-choice", {
  allowHTML: false,
  itemSelectText: "Select",
  searchEnabled: true,
});

const setUpDropdown = (initialCityId: CityId, fallBackCityId: CityId) => {
  const cities = Object.entries(scoreCardsData).map(([id, { name }]) => ({
    value: id,
    label: name,
  }));
  DROPDOWN.setChoices(cities);
  if (Object.keys(scoreCardsData).includes(initialCityId)) {
    DROPDOWN.setChoiceByValue(initialCityId);
  } else {
    DROPDOWN.setChoiceByValue(fallBackCityId);
  }
};

export default setUpDropdown;
