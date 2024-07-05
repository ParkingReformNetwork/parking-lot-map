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
  // We put the event listener on `map` because it is never erased, unlike the copy button
  // being recreated every time the score card changes. This is called "event delegation".
  const mapElement = document.querySelector("#map");
  if (!(mapElement instanceof Element)) return;
  mapElement.addEventListener("click", async (event) => {
    const copyButton = event.target;
    if (!(copyButton instanceof Element)) return;
    const targetElement = copyButton.closest(".share-icon-container");
    if (!(targetElement instanceof HTMLAnchorElement)) return;
    const shareUrl = determineShareUrl(window.location.href, cityId);
    await copyToClipboard(shareUrl);
    switchIcons(targetElement);
  });
};

export default setUpShareUrlClickListener;
