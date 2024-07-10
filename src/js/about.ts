/* global document, window */

/**
 * Set up event listeners to open and close the about popup.
 */
const setUpAbout = () => {
  const aboutPopup = document.querySelector(".about-popup");
  const aboutHeaderIcon = document.querySelector(
    ".header-about-icon-container"
  );
  if (
    !(aboutPopup instanceof HTMLElement) ||
    !(aboutHeaderIcon instanceof HTMLElement)
  )
    return;

  aboutHeaderIcon.addEventListener("click", () => {
    aboutPopup.hidden = !aboutPopup.hidden;
  });

  // closes window on clicks outside the info popup
  window.addEventListener("click", (event) => {
    if (
      !aboutPopup.hidden &&
      event.target instanceof Element &&
      !aboutHeaderIcon.contains(event.target) &&
      !aboutPopup.contains(event.target)
    ) {
      aboutPopup.hidden = true;
    }
  });

  const closeIcon = document.querySelector(".about-popup-close-icon-container");
  if (!(closeIcon instanceof HTMLElement)) return;
  closeIcon.addEventListener("click", () => {
    aboutPopup.hidden = true;
  });
};

export default setUpAbout;
