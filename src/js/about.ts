import Observable from "./Observable";

function updateAboutPopupUI(visible: boolean): void {
  const popup = document.querySelector<HTMLElement>(".about-popup");
  const icon = document.querySelector(".header-about-icon-container");
  if (!popup || !icon) return;
  popup.hidden = !visible;
  icon.setAttribute("aria-expanded", visible.toString());
}

function setUpAbout(): void {
  const isVisible = new Observable<boolean>(false);
  isVisible.subscribe(updateAboutPopupUI);
  updateAboutPopupUI(isVisible.getValue());

  const popup = document.querySelector(".about-popup");
  const headerIcon = document.querySelector(".header-about-icon-container");
  const closeIcon = document.querySelector(".about-popup-close-icon-container");

  headerIcon?.addEventListener("click", () =>
    isVisible.setValue(!isVisible.getValue())
  );
  closeIcon?.addEventListener("click", () => isVisible.setValue(false));

  // Clicks outside the popup close it.
  window.addEventListener("click", (event) => {
    if (
      isVisible.getValue() === true &&
      event.target instanceof Element &&
      !headerIcon?.contains(event.target) &&
      !popup?.contains(event.target)
    ) {
      isVisible.setValue(false);
    }
  });
}

export default setUpAbout;
