import Choices from "choices.js";
import "choices.js/public/assets/styles/choices.css";
import scoreCardsData from "../../data/score-cards.json";

export const DROPDOWN = new Choices("#city-choice", {
  allowHTML: false,
  itemSelectText: "Select",
  searchEnabled: true,
});

const setUpDropdown = (initialCityId, fallBackCityId) => {
  const cities = Object.entries(scoreCardsData).map(([id, { Name }]) => ({
    value: id,
    label: Name,
  }));
  DROPDOWN.setChoices(cities);
  if (Object.keys(scoreCardsData).includes(initialCityId)) {
    DROPDOWN.setChoiceByValue(initialCityId);
  } else {
    DROPDOWN.setChoiceByValue(fallBackCityId);
  }
};

export default setUpDropdown;
