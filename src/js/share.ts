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
  const copyButton = document.querySelector(".header-share-icon-container");
  if (!(copyButton instanceof HTMLAnchorElement)) return;
  copyButton.addEventListener("click", async () => {
    const shareUrl = determineShareUrl(window.location.href, cityId);
    await copyToClipboard(shareUrl);
    switchIcons(copyButton);
  });
};

export default setUpShareUrlClickListener;
