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
  const linkIcon: HTMLAnchorElement | null = shareIcon.querySelector(
    "svg.share-link-icon"
  );
  const checkIcon: HTMLAnchorElement | null = shareIcon.querySelector(
    "svg.share-check-icon"
  );
  if (linkIcon && checkIcon) {
    linkIcon.style.display = "none";
    checkIcon.style.display = "inline-block";
    setTimeout(() => {
      linkIcon.style.display = "inline-block";
      checkIcon.style.display = "none";
    }, 1000);
  }
};

const setUpShareUrlClickListener = (cityId: CityId): void => {
  // We put the event listener on `map` because it is never erased, unlike the copy button
  // being recreated every time the score card changes. This is called "event delegation".
  const mapElement: HTMLElement | null = document.querySelector("#map");
  if (mapElement) {
    mapElement.addEventListener("click", async (event: MouseEvent | null) => {
      const copyButton = event?.target as Element;
      if (copyButton) {
        const targetElement: HTMLAnchorElement | null = copyButton.closest(
          "div.url-copy-button > a"
        );
        if (targetElement) {
          const shareUrl = determineShareUrl(window.location.href, cityId);
          await copyToClipboard(shareUrl);
          switchIcons(targetElement);
        }
      }
    });
  }
};

export default setUpShareUrlClickListener;
