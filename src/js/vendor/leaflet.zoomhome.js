/*
 * Leaflet zoom control with a home button for resetting the view.
 *
 * Distributed under the CC-BY-SA-3.0 license. See the file "LICENSE"
 * for details.
 *
 * Based on code by toms (https://gis.stackexchange.com/a/127383/48264).
 */

/* eslint-disable no-underscore-dangle, no-param-reassign */

import { Control, DomUtil, latLngBounds } from "leaflet";

class ZoomHome extends Control.Zoom {
  constructor(options) {
    super(options);
    this.options = {
      position: "topleft",
      zoomInText: "+",
      zoomInTitle: "Zoom in",
      zoomOutText: "-",
      zoomOutTitle: "Zoom out",
      zoomHomeIcon: "home",
      zoomHomeTitle: "Home",
      homeCoordinates: null,
      homeZoom: null,
      ...options,
    };
  }

  onAdd(map) {
    const controlName = "leaflet-control-zoomhome";
    const container = DomUtil.create("div", `${controlName} leaflet-bar`);
    const { options } = this;

    if (options.homeCoordinates === null) {
      options.homeCoordinates = map.getCenter();
    }
    if (options.homeZoom === null) {
      options.homeZoom = map.getZoom();
    }

    this._zoomInButton = this._createButton(
      options.zoomInText,
      options.zoomInTitle,
      `${controlName}-in`,
      container,
      this._zoomIn.bind(this)
    );
    const zoomHomeText = `<i class="fa fa-${options.zoomHomeIcon}" style="line-height:1.65;"></i>`;
    this._zoomHomeButton = this._createButton(
      zoomHomeText,
      options.zoomHomeTitle,
      `${controlName}-home`,
      container,
      this._zoomHome.bind(this)
    );
    this._zoomOutButton = this._createButton(
      options.zoomOutText,
      options.zoomOutTitle,
      `${controlName}-out`,
      container,
      this._zoomOut.bind(this)
    );

    this._updateDisabled();
    map.on("zoomend zoomlevelschange", this._updateDisabled, this);

    return container;
  }

  setHomeBounds(bounds) {
    if (bounds === undefined) {
      bounds = this._map.getBounds();
    } else if (typeof bounds.getCenter !== "function") {
      bounds = latLngBounds(bounds);
    }
    this.options.homeZoom = this._map.getBoundsZoom(bounds);
    this.options.homeCoordinates = bounds.getCenter();
  }

  setHomeCoordinates(coordinates) {
    if (coordinates === undefined) {
      coordinates = this._map.getCenter();
    }
    this.options.homeCoordinates = coordinates;
  }

  setHomeZoom(zoom) {
    if (zoom === undefined) {
      zoom = this._map.getZoom();
    }
    this.options.homeZoom = zoom;
  }

  getHomeZoom() {
    return this.options.homeZoom;
  }

  getHomeCoordinates() {
    return this.options.homeCoordinates;
  }

  _zoomHome() {
    this._map.setView(this.options.homeCoordinates, this.options.homeZoom);
  }
}

export default ZoomHome;
