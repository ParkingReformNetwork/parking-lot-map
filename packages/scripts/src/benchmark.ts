import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import {
  type Browser,
  type CDPSession,
  chromium,
  type Page,
} from "@playwright/test";

import { runScript } from "./runScript.ts";

const PORT = process.env.PORT || "8080";
const BASE_URL = `http://127.0.0.1:${PORT}`;

const SCORECARD_TITLE = ".scorecard-title";
const CHOICE_ITEM = ".choices__item--choice";

const INITIAL_CITY_TITLE = "Parking lots in Atlanta, GA";
const TARGET_CITY_ID = "corpus-christi-tx";
const TARGET_CITY_TITLE = "Parking lots in Corpus Christi, TX";

// Instrumentation installed BEFORE the app runs so we can capture two
// app-specific moments on the browser's own clock (relative to navigation
// start, same base as Navigation/Paint/Resource Timing):
//   - scorecardReady: the scorecard title turns to "Parking lots in Atlanta,
//     GA" -- i.e. the app's synchronous bootstrap work is done and the
//     scorecard markup has been inserted into the DOM (but not yet painted).
//   - painted: the frame containing that scorecard has actually painted,
//     which is what the user perceives as "the app is ready". We detect the
//     title in a requestAnimationFrame (runs before that frame's paint) and
//     then post a MessageChannel task (runs just after that frame's paint).
// Passed to addInitScript as a raw string so tsx/esbuild never transpiles it
// (which would reintroduce the browser-undefined `__name` helper).
const INIT_LOAD_INSTRUMENTATION = `
  window.__bench = { scorecardReady: null, painted: null };
  (function () {
    function poll() {
      var el = document.querySelector("${SCORECARD_TITLE}");
      if (el && (el.textContent || "").trim() === "${INITIAL_CITY_TITLE}") {
        window.__bench.scorecardReady = performance.now();
        var ch = new MessageChannel();
        ch.port1.onmessage = function () {
          window.__bench.painted = performance.now();
        };
        ch.port2.postMessage(0);
        return;
      }
      requestAnimationFrame(poll);
    }
    requestAnimationFrame(poll);
  })();
`;

interface InitialLoadMarks {
  /** Cumulative milliseconds from navigation start. */
  responseEndMs: number;
  fcpMs: number;
  dataFetchedMs: number;
  dataUrl: string;
  scorecardReadyMs: number;
  paintedMs: number;
  numCities: number;
}

interface Args {
  runs: number;
  headed: boolean;
  out: string;
}

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const args: Args = {
    runs: 15,
    headed: false,
    out: path.join("benchmark-results", "latest.json"),
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--runs") {
      i += 1;
      args.runs = parseInt(argv[i], 10);
    } else if (arg === "--headed") {
      args.headed = true;
    } else if (arg === "--out") {
      i += 1;
      args.out = argv[i];
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  if (!Number.isInteger(args.runs) || args.runs < 1) {
    throw new Error(`--runs must be a positive integer, got: ${args.runs}`);
  }
  return args;
}

async function assertServerReachable(): Promise<void> {
  try {
    const response = await fetch(BASE_URL, {
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) {
      throw new Error(`status ${response.status}`);
    }
  } catch (error) {
    console.error(
      `Server not reachable at ${BASE_URL} (${(error as Error).message}).\n` +
        `Start it first, e.g.:\n` +
        `  pnpm --filter @prn-parking-lots/primary build\n` +
        `  pnpm --filter @prn-parking-lots/primary serve-dist\n` +
        `(Override the port with the PORT env var.)`,
    );
    process.exit(1);
  }
}

interface RunResult {
  /**
   * Initial load broken into cumulative marks from navigation start, so a
   * regression can be attributed to network, first paint, the data
   * download, JS bootstrap, or scorecard paint -- rather than a single
   * opaque number.
   */
  initialResponseEndMs: number;
  initialFcpMs: number;
  initialDataFetchedMs: number;
  initialScorecardReadyMs: number;
  initialPaintedMs: number;
  /**
   * "Ms" is time-to-paint (felt latency); "JsMs" is the synchronous JS
   * portion only, kept to show how much of the cost is paint.
   */
  cityChangeMs: number;
  cityChangeJsMs: number;
  totalBytes: number;
  numCities: number;
  /** URL -> bytes transferred, for reporting the largest resources. */
  resources: Record<string, number>;
}

// Select a city from the Choices.js dropdown and time how long until the
// browser has actually PAINTED the new scorecard -- i.e. what the user
// perceives.
//
// Choices.js only mirrors the currently-selected option into the underlying
// native `<select>` (the rest of the choices exist only in its own internal
// store, rendered as `.choices__item--choice` divs) -- so we can't just set
// `select.value`. Instead we dispatch the same event Choices.js itself
// listens for: it binds `mousedown` in the capture phase on its outer
// container (see `Choices.prototype._onMouseDown` in choices.js) and walks
// up from `event.target` to find the `[data-choice]` item, so a synthetic
// `mousedown` dispatched directly on the target item's element is enough to
// trigger the same selection path a real click would.
//
// Runs in-page so the timing isn't polluted by CDP round-trips. Choices.js's
// handler synchronously updates the native select and dispatches `change` on
// it, which the app's own listener (packages/shared/src/js/city-ui/dropdown.ts)
// picks up; Observable.notify() then runs every state subscriber
// synchronously, so when `dispatchEvent` returns, all the JS is done: the
// scorecard's innerHTML has been updated. BUT the browser has not yet laid
// out and painted that DOM -- that happens on the next frame. Measuring only
// to end-of-JS badly understates the felt latency. So we wait for the next
// animation frame (which runs just before paint) and then for a macrotask
// scheduled from within it (which runs just after that frame is painted),
// and stop the clock there.
async function timeCityChange(
  page: Page,
  targetCityId: string,
  targetTitle: string,
): Promise<{ jsMs: number; paintedMs: number }> {
  const result = await page.evaluate(
    ({ cityId, choiceItemSelector, titleSelector }) =>
      new Promise<{ jsMs: number; paintedMs: number; title: string }>(
        (resolve, reject) => {
          const item = document.querySelector<HTMLElement>(
            `${choiceItemSelector}[data-value="${cityId}"]`,
          );
          if (!item) {
            reject(new Error(`choice item not found for city: ${cityId}`));
            return;
          }

          const start = performance.now();
          item.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
          // All state subscribers have now run synchronously.
          const jsMs = performance.now() - start;

          requestAnimationFrame(() => {
            // rAF fires before the paint of the frame containing our changes. A
            // MessageChannel task posted from here runs after that paint lands.
            const channel = new MessageChannel();
            channel.port1.onmessage = () => {
              const title =
                document.querySelector(titleSelector)?.textContent ?? "";
              resolve({
                jsMs,
                paintedMs: performance.now() - start,
                title: title.trim(),
              });
            };
            channel.port2.postMessage(undefined);
          });
        },
      ),
    {
      cityId: targetCityId,
      choiceItemSelector: CHOICE_ITEM,
      titleSelector: SCORECARD_TITLE,
    },
  );

  if (result.title !== targetTitle) {
    throw new Error(
      `City change did not update the scorecard: expected "${targetTitle}", got "${result.title}"`,
    );
  }

  return { jsMs: result.jsMs, paintedMs: result.paintedMs };
}

async function runOnce(browser: Browser): Promise<RunResult> {
  // A fresh context is an isolated, incognito-like session. We also disable the
  // browser cache via CDP so every run is a true cold load -- bundle size counts.
  const context = await browser.newContext();
  const page = await context.newPage();

  // tsx transpiles `page.evaluate` callbacks with esbuild's `--keep-names`,
  // which wraps named inner functions in a `__name` helper that only exists at
  // module scope in Node, not in the browser -- so serialized callbacks throw
  // "__name is not defined". Provide a no-op on the page. Passed as a raw string
  // so it isn't itself transpiled (and thus can't reintroduce the reference).
  await page.addInitScript(
    "globalThis.__name = globalThis.__name || function (f) { return f; };",
  );
  await page.addInitScript(INIT_LOAD_INSTRUMENTATION);

  const client: CDPSession = await context.newCDPSession(page);
  await client.send("Network.enable");
  await client.send("Network.clearBrowserCache");
  await client.send("Network.setCacheDisabled", { cacheDisabled: true });

  // Accumulate transfer size per resource. `encodedDataLength` is the number of
  // bytes actually received over the wire (post-compression), which is what we
  // care about for load performance.
  const resources: Record<string, number> = {};
  const requestUrls = new Map<string, string>();
  client.on("Network.responseReceived", (event) => {
    requestUrls.set(event.requestId, event.response.url);
  });
  client.on("Network.loadingFinished", (event) => {
    const url = requestUrls.get(event.requestId) ?? event.requestId;
    resources[url] = (resources[url] ?? 0) + event.encodedDataLength;
  });

  try {
    // `waitUntil: "commit"` returns as soon as navigation commits; the in-page
    // instrumentation (installed above, before any app code) records the load
    // marks on the browser's own clock, so we don't measure across the
    // Node<->browser boundary. Wait until the scorecard has actually painted.
    await page.goto(BASE_URL, { waitUntil: "commit" });
    await page.waitForFunction(
      () => {
        const w = window as unknown as {
          __bench: { painted: number | null };
        };
        return w.__bench.painted != null;
      },
      undefined,
      { timeout: 60_000 },
    );

    // Collect the initial-load marks. Navigation/Paint/Resource Timing and
    // performance.now() all share the same origin (navigation start), so these
    // are directly comparable cumulative offsets. "data fetched" uses the
    // largest resource by transfer size, without hard-coding its hashed URL.
    const initial: InitialLoadMarks = await page.evaluate((selector) => {
      const nav = performance.getEntriesByType("navigation")[0] as
        | PerformanceNavigationTiming
        | undefined;
      const fcp = performance
        .getEntriesByType("paint")
        .find((entry) => entry.name === "first-contentful-paint");
      let largest: PerformanceResourceTiming | undefined;
      for (const entry of performance.getEntriesByType(
        "resource",
      ) as PerformanceResourceTiming[]) {
        if (!largest || entry.transferSize > largest.transferSize) {
          largest = entry;
        }
      }
      const w = window as unknown as {
        __bench: { scorecardReady: number; painted: number };
      };
      const bench = w.__bench;
      return {
        responseEndMs: nav ? nav.responseEnd : 0,
        fcpMs: fcp ? fcp.startTime : 0,
        dataFetchedMs: largest ? largest.responseEnd : 0,
        dataUrl: largest ? largest.name : "",
        scorecardReadyMs: bench.scorecardReady,
        paintedMs: bench.painted,
        // The native `<select>` only mirrors the currently-selected option;
        // Choices.js renders the full list as `.choices__item--choice` divs.
        numCities: document.querySelectorAll(selector).length,
      };
    }, CHOICE_ITEM);
    const { numCities } = initial;

    // Change the city via the dropdown and measure the cost of updating to a
    // different place: this isolates the city-change hot path from the noise
    // of the initial resource load.
    const cityChange = await timeCityChange(
      page,
      TARGET_CITY_ID,
      TARGET_CITY_TITLE,
    );

    const totalBytes = Object.values(resources).reduce((a, b) => a + b, 0);

    return {
      initialResponseEndMs: initial.responseEndMs,
      initialFcpMs: initial.fcpMs,
      initialDataFetchedMs: initial.dataFetchedMs,
      initialScorecardReadyMs: initial.scorecardReadyMs,
      initialPaintedMs: initial.paintedMs,
      cityChangeMs: cityChange.paintedMs,
      cityChangeJsMs: cityChange.jsMs,
      totalBytes,
      numCities,
      resources,
    };
  } finally {
    await context.close();
  }
}

interface Stat {
  median: number;
  min: number;
  max: number;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function summarize(values: number[]): Stat {
  return {
    median: median(values),
    min: Math.min(...values),
    max: Math.max(...values),
  };
}

// A high-level task is reported as one overall time plus granular stages that
// sum to it. Rather than repeat a `summarize(runs.map(...))` per metric, we
// describe each task once (how to read its total and each stage from a raw
// RunResult) and drive the JSON, the console summary, and the per-run output off
// this single list.
interface StageDescriptor {
  key: string;
  label: string;
  note?: string;
  value: (r: RunResult) => number;
}

interface TaskDescriptor {
  key: string;
  label: string;
  note?: string;
  total: (r: RunResult) => number;
  stages: StageDescriptor[];
}

interface TaskStat {
  total: Stat;
  stages: Record<string, Stat>;
}

// For the initial load the stages are the wall-clock gaps between consecutive
// milestones (responseEnd -> fcp -> dataFetched -> scorecardReady -> painted).
// Those milestones are captured as absolute marks on the browser's clock and
// differenced here, so the stages add up exactly to `painted` (the total). The
// city-change task splits its felt time-to-paint into the synchronous JS
// portion and the remaining paint.
const TASKS: TaskDescriptor[] = [
  {
    key: "initialLoad",
    label: "Initial page load",
    total: (r) => r.initialPaintedMs,
    stages: [
      {
        key: "network",
        label: "network",
        note: "HTML downloaded",
        value: (r) => r.initialResponseEndMs,
      },
      {
        key: "firstPaint",
        label: "first paint",
        note: "first pixels",
        value: (r) => r.initialFcpMs - r.initialResponseEndMs,
      },
      {
        key: "dataFetch",
        label: "data fetch",
        note: "largest resource",
        value: (r) => r.initialDataFetchedMs - r.initialFcpMs,
      },
      {
        key: "jsBuild",
        label: "JS build",
        note: "bootstrap",
        value: (r) => r.initialScorecardReadyMs - r.initialDataFetchedMs,
      },
      {
        key: "render",
        label: "render",
        note: "scorecard visible",
        value: (r) => r.initialPaintedMs - r.initialScorecardReadyMs,
      },
    ],
  },
  {
    key: "cityChange",
    label: "Change city",
    note: "Atlanta, GA -> Corpus Christi, TX",
    total: (r) => r.cityChangeMs,
    stages: [
      { key: "js", label: "JS", value: (r) => r.cityChangeJsMs },
      {
        key: "paint",
        label: "paint",
        value: (r) => r.cityChangeMs - r.cityChangeJsMs,
      },
    ],
  },
];

function summarizeTask(task: TaskDescriptor, runs: RunResult[]): TaskStat {
  return {
    total: summarize(runs.map(task.total)),
    stages: Object.fromEntries(
      task.stages.map((stage) => [stage.key, summarize(runs.map(stage.value))]),
    ),
  };
}

// One run reshaped into the same nested { total, stages } shape as the summary.
function runToNested(r: RunResult): Record<string, unknown> {
  const tasks = Object.fromEntries(
    TASKS.map((task) => [
      task.key,
      {
        total: task.total(r),
        stages: Object.fromEntries(
          task.stages.map((stage) => [stage.key, stage.value(r)]),
        ),
      },
    ]),
  );
  return { ...tasks, totalBytes: r.totalBytes };
}

function fmtMs(ms: number): string {
  return `${ms.toFixed(0)} ms`;
}
function fmtMb(bytes: number): string {
  return `${(bytes / 1_000_000).toFixed(2)} MB`;
}

function gitCommit(): string {
  try {
    return execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim();
  } catch {
    return "unknown";
  }
}

async function main(): Promise<void> {
  const args = parseArgs();
  await assertServerReachable();

  console.log(`Benchmarking ${BASE_URL} over ${args.runs} run(s)...\n`);

  const browser = await chromium.launch({ headless: !args.headed });
  const runs: RunResult[] = [];
  try {
    for (let i = 0; i < args.runs; i += 1) {
      const result = await runOnce(browser);
      runs.push(result);
      console.log(
        `Run ${i + 1}/${args.runs}: initial ${fmtMs(
          result.initialPaintedMs,
        )} painted, city change ${fmtMs(result.cityChangeMs)}, transfer ${fmtMb(
          result.totalBytes,
        )}`,
      );
    }
  } finally {
    await browser.close();
  }

  const { numCities } = runs[0];
  const tasks = Object.fromEntries(
    TASKS.map((task) => [task.key, summarizeTask(task, runs)]),
  );
  const transfer = summarize(runs.map((r) => r.totalBytes));

  // Largest resources, using the run with the median total transfer as
  // representative (it's stable across cold loads).
  const representative = [...runs].sort((a, b) => a.totalBytes - b.totalBytes)[
    Math.floor(runs.length / 2)
  ];
  const largest = Object.entries(representative.resources)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  console.log(`\n===== Summary =====`);
  console.log(`Cities available: ${numCities}\n`);

  // One line per task with its overall time, then its granular stages indented
  // underneath (stages sum to the total).
  for (const task of TASKS) {
    const stat = tasks[task.key];
    const note = task.note ? `  ${task.note}` : "";
    console.log(
      `${task.label.padEnd(20)} median ${fmtMs(stat.total.median)} (min ${fmtMs(
        stat.total.min,
      )}, max ${fmtMs(stat.total.max)})${note}`,
    );
    for (const stage of task.stages) {
      const s = stat.stages[stage.key];
      const stageNote = stage.note ? `  ${stage.note}` : "";
      console.log(
        `  ${stage.label.padEnd(14)}${fmtMs(s.median).padStart(7)}${stageNote}`,
      );
    }
  }

  console.log(
    `\n${"Transfer".padEnd(20)} median ${fmtMb(transfer.median)} (min ${fmtMb(
      transfer.min,
    )}, max ${fmtMb(transfer.max)})`,
  );
  console.log(`\nLargest resources (cold load):`);
  for (const [url, bytes] of largest) {
    const name = url.replace(BASE_URL, "").split("?")[0];
    console.log(`  ${fmtMb(bytes).padStart(9)}  ${name}`);
  }

  const output = {
    timestamp: new Date().toISOString(),
    gitCommit: gitCommit(),
    url: BASE_URL,
    numCities,
    tasks,
    transfer,
    runs: runs.map(runToNested),
  };
  fs.mkdirSync(path.dirname(args.out), { recursive: true });
  fs.writeFileSync(args.out, `${JSON.stringify(output, null, 2)}\n`);
  console.log(`\nWrote results to ${args.out}`);
}

runScript(main);
