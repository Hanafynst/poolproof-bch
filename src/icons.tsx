/**
 * The app's one icon system (R50). Until this module, the glyphs
 * lived where they were used — tiles in WalletHome, report
 * actions in App — drawn ad hoc per file. They agreed by luck
 * (one stroke width, round caps) more than by rule, and small
 * drifts had crept in: the download arrow mixed polyline and
 * line elements, the search lens was a size down from the clock
 * beside it.
 *
 * The system, stated once here:
 *  - a 24-unit grid, no fill, stroke = currentColor;
 *  - stroke width 2 at the render sizes the app uses (20 px in
 *    the icon buttons, 22 px on the tiles), round caps and
 *    round joins everywhere;
 *  - path geometry only (no polyline/line/rect shorthand), so
 *    every glyph is drawn the same way;
 *  - optical sizes matched across a set: the round glyphs
 *    (clock, search lens) sit at the same visual weight, the
 *    arrows are mirror images of each other, and every glyph's
 *    ink stays inside the same 2..22 optical box.
 * Colour is never the icon's own: it inherits, so a tile glyph
 * takes the medallion's accent and a report glyph takes the
 * button's white, exactly as before.
 */
import type { SVGProps } from "react";

const ICON_PROPS = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} satisfies SVGProps<SVGSVGElement>;

export function CopyIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M11 9h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2Z" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

export function LinkIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

export function DownloadIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="m7 10 5 5 5-5" />
      <path d="M12 15V3" />
    </svg>
  );
}

export function CheckIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export type TileKind = "send" | "receive" | "history" | "audit";

/** The four tile glyphs. Send and Receive are one arrow seen
 *  from two directions (up = out of the wallet, down = in);
 *  History is a clock face; Audit is the search lens. */
export function TileIcon({ panel }: { panel: TileKind }) {
  const paths =
    panel === "send" ? (
      <>
        <path d="M12 19V5" />
        <path d="m5 12 7-7 7 7" />
      </>
    ) : panel === "receive" ? (
      <>
        <path d="M12 5v14" />
        <path d="m19 12-7 7-7-7" />
      </>
    ) : panel === "history" ? (
      <>
        <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />
        <path d="M12 7v5l3 2" />
      </>
    ) : (
      <>
        <path d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z" />
        <path d="m21 21-4.35-4.35" />
      </>
    );
  return (
    <svg className="tile-icon" {...ICON_PROPS}>
      {paths}
    </svg>
  );
}
