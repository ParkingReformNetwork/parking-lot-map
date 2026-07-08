/* global document, navigator, window */

import { determineShareUrl } from "../model/cityId";
import type { ViewStateObservable } from "../state/ViewState";

async function copyToClipboard(value: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(value);
  } catch (err) {
    console.error("Failed to write to clipboard: ", err);
  }
}

function switchShareIcons(shareIcon: HTMLButtonElement): void {
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

export default function subscribeShareLink(
  viewState: ViewStateObservable,
): void {
  viewState.subscribe(({ cityId }) => {
    const shareIcon = document.querySelector<HTMLButtonElement>(
      ".header-share-icon-container",
    );
    const fullScreenIcon = document.querySelector<HTMLAnchorElement>(
      ".header-full-screen-icon-container",
    );
    if (!shareIcon || !fullScreenIcon) return;

    const shareUrl = determineShareUrl(window.location.href, cityId);
    shareIcon.addEventListener("click", async () => {
      await copyToClipboard(shareUrl);
      switchShareIcons(shareIcon);
    });
    fullScreenIcon.href = shareUrl;
  }, "update share link");
}
