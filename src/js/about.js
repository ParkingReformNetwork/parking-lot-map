/* global document, window */

/**
 * Set up event listeners to open and close the about popup.
 */
const setUpAbout = () => {
  const aboutElement = document.querySelector(".about-text-popup");
  const infoButton = document.querySelector(".header-about-icon");
  infoButton.addEventListener("click", () => {
    aboutElement.style.display =
      aboutElement.style.display !== "block" ? "block" : "none";
  });

  // closes window on clicks outside the info popup
  window.addEventListener("click", (event) => {
    if (
      !infoButton.contains(event.target) &&
      aboutElement.style.display === "block" &&
      !aboutElement.contains(event.target)
    ) {
      aboutElement.style.display = "none";
      infoButton.classList.toggle("active");
    }
  });

  // Note that the close element will only render when the about text popup is rendered.
  // So, it only ever makes sense for a click to close.
  document.querySelector(".about-close").addEventListener("click", () => {
    aboutElement.style.display = "none";
  });
};

export default setUpAbout;
