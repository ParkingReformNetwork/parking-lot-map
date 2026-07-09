/* global document, navigator, window */

import { determineShareUrl } from "../model/cityId";
import type { ViewStateManager } from "../state/ViewState";

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

export default function subscribeShareLink(viewState: ViewStateManager): void {
  const shareIcon = document.querySelector<HTMLButtonElement>(
    ".header-share-icon-container",
  );
  const fullScreenIcon = document.querySelector<HTMLAnchorElement>(
    ".header-full-screen-icon-container",
  );
  if (!shareIcon || !fullScreenIcon) return;

  shareIcon.addEventListener("click", async () => {
    const shareUrl = determineShareUrl(
      window.location.href,
      viewState.getValue().cityId,
    );
    await copyToClipboard(shareUrl);
    switchShareIcons(shareIcon);
  });

  viewState.subscribeToCity("update share link", (cityId) => {
    fullScreenIcon.href = determineShareUrl(window.location.href, cityId);
  });
}
