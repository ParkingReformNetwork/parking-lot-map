# AGENTS.md

## Project Overview

This is the **Parking Lot Map**, an interactive web application for the Parking Reform Network. Using Leaflet, it displays downtowns with overlays of parking. The map shows one city at a time, including a permanent scorecard.

## Tech Stack

- **No frameworks** — vanilla TypeScript for simplicity (not React, Svelte, or Vue)
- **Bundler**: Parcel 2
- **Language**: TypeScript (strict)
- **Styling**: Sass with theme folder
- **UI components**: Leaflet, Choices.js
- **State management**: Reactive stream with custom `Observable` class in packages/shared/src/js/state/Observable.ts
- **Data**: GeoJSON files stored in packages/primary/data and packages/ct/data
- **Testing**: Playwright
- **Code quality**: Prettier, ESLint, TypeScript compiler

## Key Files & Directories

The repository is organized as a monorepo:

- `packages/shared/`: the core functionality for the map
- `packages/primary/`: the map at https://parkingreform.org/parking-lot-map/
- `packages/ct/`: the map at https://parkingreform.org/ct-parking-lots/ (CT == Connecticut)
- `packages/scripts/`: scripts to help with adding and updatings data

Some particularly important folders and files:

- `packages/shared/src/css/`: stylesheets (Sass)

* `packages/shared/src/js/bootstrap.ts` — App initialization
* `packages/shared/src/js/layout/` — UI components (icons, popups, headers, the map)
* `packages/shared/src/js/map-layers/` — Loading the city overlays
* `packages/shared/src/js/model/` — The core data types
* `packages/shared/src/js/state/` — State management and the Observable type
* `packages/shared/src/js/city-ui/` — The Choices.js dropdown and the scorecard

## Development Workflow

### Code quality

- **Format code**: `npm run fmt`
- **Fix issues**: `npm run fix` — Auto-fix linting and format issues
- **Lint**: `npm run lint` — ESlint + format checks
- **Type check**: `npm run check`
- **Test**: `npx playwright test` — Playwright tests

All PRs require passing lint, type checks, and tests.

### Testing

- Playwright tests start the server. If there are issues starting the server, try `rm -rf .parcel-cache` and retry
- Note that packages/primary/tests has more tests than packages/ct/tests because we don't want to duplicate tests for the common functionality.

## Styling

- Sass stylesheets in `packages/shared/src/css/`
- Use Sass variables and mixins from the theme
- Keep media queries organized for mobile-first design

## Performance matters

The app has to be careful to have a fast user experience. When relevant, we should think about things like caching and lazy loading.
