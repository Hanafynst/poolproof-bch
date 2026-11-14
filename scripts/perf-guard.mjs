// Performance regression guard for the production build.
//
// Why this exists (R54, 2026-11-14): App.tsx once imported a VALUE from
// the lazy WalletConnect module, so the whole wallet library (~370 KB gz)
// was dragged into the first paint and preloaded — initial payload ~515 KB
// gz instead of ~145.6 KB gz. The fix was one import, and nothing stopped
// it silently coming back. This guard runs at the end of `npm run build`
// (so CI enforces it on every deploy) and fails the build when:
//   1. any WizardConnect marker string appears in an initial-load JS file;
//   2. the initial payload (index.html + entry script + modulepreloads +
//      stylesheet) exceeds the gzip budget;
//   3. the marker scan would be vacuous (no lazy chunk carries a marker,
//      which would mean the markers went stale and check 1 proves nothing).
//
// The pure helpers are exported so the practice suite
// (spike-local/practice/run-tests.mjs, section 42) can pin them.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Strings that only exist inside the @wizardconnect packages. Verified
// 2026-11-14 (R66): each is present in the lazy WalletConnect chunk and
// absent from every initial-path file.
export const WALLET_MARKERS = ["WizardConnect", "wiz://", "wizardconnect"];

// Initial payload budget, gzip bytes. Measured 2026-11-14 (R66) with this
// guard's own method: 146,776 B (146,575 B via `gzip -c`). R54's post-fix
// figure was ~145.6 KB.
// ~9% headroom for feature rounds; the R54 regression added ~370 KB, so
// this trips long before a judge on a slow connection would feel it.
export const INITIAL_GZ_BUDGET = 160_000;

export function gzipSize(buf) {
  return gzipSync(buf).length;
}

export function countMarkers(text, markers = WALLET_MARKERS) {
  const counts = {};
  for (const marker of markers) {
    counts[marker] = text.split(marker).length - 1;
  }
  return counts;
}

// The initial load path is whatever dist/index.html pulls in before user
// interaction: the module entry script, every modulepreload, and the
// stylesheet. Dynamic-import chunks (WalletConnect, languages) are lazy.
export function parseInitialAssets(html) {
  const pick = (re) =>
    [...html.matchAll(re)].map((m) => m[1].replace(/^\.\//, ""));
  return {
    scripts: pick(/<script[^>]+src="([^"]+)"/g),
    preloads: pick(/<link[^>]+rel="modulepreload"[^>]+href="([^"]+)"/g),
    styles: pick(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/g),
  };
}

export function runGuard(distDir, budget = INITIAL_GZ_BUDGET) {
  const failures = [];
  const rows = [];
  const htmlPath = join(distDir, "index.html");
  if (!existsSync(htmlPath)) {
    return {
      ok: false,
      rows,
      failures: [`dist/index.html not found in ${distDir} — run vite build first`],
      initialGz: 0,
    };
  }
  const html = readFileSync(htmlPath, "utf8");
  const { scripts, preloads, styles } = parseInitialAssets(html);
  const initial = [
    { name: "index.html", role: "document" },
    ...scripts.map((name) => ({ name, role: "entry script" })),
    ...preloads.map((name) => ({ name, role: "modulepreload" })),
    ...styles.map((name) => ({ name, role: "stylesheet" })),
  ];
  let initialGz = 0;
  const initialJsNames = new Set();
  for (const asset of initial) {
    const path = join(distDir, asset.name);
    if (!existsSync(path)) {
      failures.push(`initial asset missing from dist: ${asset.name}`);
      continue;
    }
    const buf = readFileSync(path);
    const gz = gzipSize(buf);
    initialGz += gz;
    rows.push({ ...asset, raw: buf.length, gz });
    if (asset.name.endsWith(".js")) {
      initialJsNames.add(asset.name.split("/").pop());
      const counts = countMarkers(buf.toString("utf8"));
      for (const [marker, count] of Object.entries(counts)) {
        if (count > 0) {
          failures.push(
            `wallet marker "${marker}" appears ${count}x in initial file ${asset.name} — the lazy wallet library leaked into the first paint`,
          );
        }
      }
    }
  }
  if (initialGz > budget) {
    failures.push(
      `initial payload ${initialGz} gz bytes exceeds budget ${budget}`,
    );
  }
  // Positive control: at least one lazy JS chunk must carry a marker, or
  // the marker scan above proves nothing.
  const assetsDir = join(distDir, "assets");
  let lazyMarkerTotal = 0;
  if (existsSync(assetsDir)) {
    for (const name of readdirSync(assetsDir)) {
      if (!name.endsWith(".js") || initialJsNames.has(name)) continue;
      const text = readFileSync(join(assetsDir, name), "utf8");
      const counts = countMarkers(text);
      lazyMarkerTotal += Object.values(counts).reduce((a, b) => a + b, 0);
    }
  }
  if (lazyMarkerTotal === 0) {
    failures.push(
      "no lazy chunk carries any wallet marker — markers are stale, the leak check is vacuous",
    );
  }
  return { ok: failures.length === 0, rows, failures, initialGz };
}

const isMain =
  process.argv[1] &&
  fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const distDir =
    process.argv[2] ??
    join(dirname(fileURLToPath(import.meta.url)), "..", "dist");
  const { ok, rows, failures, initialGz } = runGuard(distDir);
  for (const row of rows) {
    console.log(
      `  ${row.name.padEnd(38)} ${row.role.padEnd(14)} raw ${String(row.raw).padStart(7)}  gz ${String(row.gz).padStart(7)}`,
    );
  }
  console.log(
    `  initial payload gz total: ${initialGz} (budget ${INITIAL_GZ_BUDGET})`,
  );
  for (const failure of failures) console.log(`  FAIL ${failure}`);
  console.log(ok ? "perf-guard: PASS" : "perf-guard: FAIL");
  process.exit(ok ? 0 : 1);
}
