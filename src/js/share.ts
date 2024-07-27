/* global document, navigator, window */
import { determineShareUrl } from "./cityId";
import { CitySelectionObservable } from "./CitySelectionState";

async function copyToClipboard(value: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(value);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Failed to write to clipboard: ", err);
  }
}

function switchShareIcons(shareIcon: HTMLAnchorElement): void {
  const linkIcon = shareIcon.querySelector<SVGElement>("svg.share-link-icon");
  const checkIcon = shareIcon.querySelector<SVGElement>("svg.share-check-icon");
  if (!linkIcon || !checkIcon) return;

  linkIcon.style.display = "none";
  checkIcon.style.display = "inline-block";
  setTimeout(() => {
    linkIcon.style.display = "inline-block";
    checkIcon.style.display = "none";
  }, 1000);
}

function addShareLinkSubscriber(observable: CitySelectionObservable): void {
  observable.subscribe(({ cityId }) => {
    const shareIcon = document.querySelector<HTMLAnchorElement>(
      ".header-share-icon-container"
    );
    const fullScreenIcon = document.querySelector<HTMLAnchorElement>(
      ".header-full-screen-icon-container"
    );
    if (!shareIcon || !fullScreenIcon) return;

    const shareUrl = determineShareUrl(window.location.href, cityId);
    shareIcon.addEventListener("click", async () => {
      await copyToClipboard(shareUrl);
      switchShareIcons(shareIcon);
    });
    fullScreenIcon.href = shareUrl;
  });
}

export default addShareLinkSubscriber;
