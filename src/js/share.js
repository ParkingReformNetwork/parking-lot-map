/* global document, navigator, window */
import { determineShareUrl } from "./cityId";
/**
 * Copy `value` to the user's clipboard
 *
 * @param string value
 */
const copyToClipboard = async (value) => {
  try {
    await navigator.clipboard.writeText(value);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Failed to write to clipboard: ", err);
  }
};

/**
 * Toggle share link icon briefly to show user an indicator
 *
 * @param {HTMLAnchorElement} shareIcon
 */
const switchIcons = (shareIcon) => {
  const linkIcon = shareIcon.querySelector("svg.share-link-icon");
  const checkIcon = shareIcon.querySelector("svg.share-check-icon");
  linkIcon.style.display = "none";
  checkIcon.style.display = "inline-block";
  setTimeout(() => {
    linkIcon.style.display = "inline-block";
    checkIcon.style.display = "none";
  }, 1000);
};

/**
 * Add an event listener for the share button to copy the link to the clipboard.
 *
 * @param string cityId: e.g. `st.-louis-mo`
 */
const setUpShareUrlClickListener = (cityId) => {
  // We put the event listener on `map` because it is never erased, unlike the copy button
  // being recreated every time the score card changes. This is called "event delegation".
  document.querySelector("#map").addEventListener("click", async (event) => {
    const targetElement = event.target.closest("div.url-copy-button > a");
    if (targetElement) {
      const shareUrl = determineShareUrl(window.location.href, cityId);
      await copyToClipboard(shareUrl);
      switchIcons(targetElement);
    }
  });
};

export default setUpShareUrlClickListener;
