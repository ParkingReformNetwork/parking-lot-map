import type { Map as LeafletMap } from "leaflet";

declare global {
  interface Window {
    mapTestHandles?: { map: LeafletMap };
  }
}

/** Expose the map for Playwright end-to-end tests and browser-console debugging. */
export default function exposeTestHooks(map: LeafletMap): void {
  window.mapTestHandles = { map };
}
