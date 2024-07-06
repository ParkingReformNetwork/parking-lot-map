/* global document, navigator, window */
import { CityId } from "./types";
import { determineShareUrl } from "./cityId";

const copyToClipboard = async (value: string): Promise<void> => {
  try {
    await navigator.clipboard.writeText(value);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Failed to write to clipboard: ", err);
  }
};

const switchIcons = (shareIcon: HTMLAnchorElement): void => {
  const linkIcon = shareIcon.querySelector("svg.share-link-icon");
  const checkIcon = shareIcon.querySelector("svg.share-check-icon");
  if (!(linkIcon instanceof SVGElement) || !(checkIcon instanceof SVGElement))
    return;

  linkIcon.style.display = "none";
  checkIcon.style.display = "inline-block";
  setTimeout(() => {
    linkIcon.style.display = "inline-block";
    checkIcon.style.display = "none";
  }, 1000);
};

const setUpShareUrlClickListener = (cityId: CityId): void => {
  // The event listener is on `map` because it is never erased, unlike the copy button
  // being recreated every time the map moves. This is called "event delegation".
  const map = document.querySelector("#map");
  if (!(map instanceof Element)) return;
  map.addEventListener("click", async (event) => {
    const clicked = event.target;
    if (!(clicked instanceof Element)) return;
    const iconContainer = clicked.closest(".share-icon-container");
    if (!(iconContainer instanceof HTMLAnchorElement)) return;
    const shareUrl = determineShareUrl(window.location.href, cityId);
    await copyToClipboard(shareUrl);
    switchIcons(iconContainer);
  });
};

export default setUpShareUrlClickListener;
