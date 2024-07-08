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

const switchShareIcons = (shareIcon: HTMLAnchorElement): void => {
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

/** Set up the share icon & full screen icons to use the cityId.
 *
 * This function should be called anytime the cityId changes.
 */
const updateIconsShareLink = (cityId: CityId): void => {
  const shareUrl = determineShareUrl(window.location.href, cityId);

  const shareIconContainer = document.querySelector(
    ".header-share-icon-container"
  );
  if (!(shareIconContainer instanceof HTMLAnchorElement)) return;
  shareIconContainer.addEventListener("click", async () => {
    await copyToClipboard(shareUrl);
    switchShareIcons(shareIconContainer);
  });

  const fullScreenIconContainer = document.querySelector(
    ".header-full-screen-icon-container"
  );
  if (!(fullScreenIconContainer instanceof HTMLAnchorElement)) return;
  fullScreenIconContainer.href = shareUrl;
};

export default updateIconsShareLink;
