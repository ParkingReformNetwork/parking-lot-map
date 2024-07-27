/* global document, window */

/**
 * Set up event listeners to open and close the about popup.
 */
function setUpAbout(): void {
  const aboutPopup = document.querySelector<HTMLElement>(".about-popup");
  const aboutHeaderIcon = document.querySelector<HTMLElement>(
    ".header-about-icon-container"
  );
  const closeIcon = document.querySelector<HTMLElement>(
    ".about-popup-close-icon-container"
  );
  if (!aboutPopup || !aboutHeaderIcon || !closeIcon) return;

  const closePopup = () => {
    aboutPopup.hidden = true;
    aboutHeaderIcon.setAttribute("aria-expanded", "false");
  };

  const openPopup = () => {
    aboutPopup.hidden = false;
    aboutHeaderIcon.setAttribute("aria-expanded", "true");
  };

  aboutHeaderIcon.addEventListener("click", () => {
    if (aboutPopup.hidden) {
      openPopup();
    } else {
      closePopup();
    }
  });

  // closes window on clicks outside the info popup
  window.addEventListener("click", (event) => {
    if (
      !aboutPopup.hidden &&
      event.target instanceof Element &&
      !aboutHeaderIcon.contains(event.target) &&
      !aboutPopup.contains(event.target)
    ) {
      closePopup();
    }
  });

  closeIcon.addEventListener("click", () => {
    closePopup();
  });
}

export default setUpAbout;
