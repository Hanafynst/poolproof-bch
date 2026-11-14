/**
 * Cauldron Router quote client (R48) — the live cross-check the
 * report claims: for the audit's reference sell, ask the venue's
 * own router what the routed exit would pay, over the public
 * WebSocket JSON-RPC endpoint Riften documents
 * (docs.riftenlabs.com/router + /api/route.quote/; JSON-RPC over
 * wss://router.riften.net/v1/route, no credentials during beta;
 * the 0.1% usage fee applies to tx.build, not to quotes).
 *
 * Proven live from this project on 2026-11-13 (R9) and again on
 * 2026-11-14 (R48): the endpoint answered a route.quote for the
 * PUSD reference sell with every pool used and an output within
 * 0.03% of our own simulation, both times.
 *
 * Discipline: the quote is a cross-check, never a dependency.
 * fetchRouteQuote resolves null on EVERY failure — a socket that
 * will not open, a timeout, an error object, a malformed answer —
 * and never rejects, so a dead router costs the report only its
 * cross-check, never the report itself. What a landed quote
 * means is the verdict core's decision (precedence in
 * poolproof-core.ts); this module only carries it, in bigint
 * sats, like every other money figure in the project.
 */

export const ROUTER_WSS_URL = "wss://router.riften.net/v1/route";

/** How long a live audit waits for its cross-check before the
 *  report simply keeps the routed CPMM figure. The report has
 *  already landed by the time this runs; the timeout bounds the
 *  upgrade, never the audit. */
export const ROUTE_QUOTE_TIMEOUT_MS = 10_000;

const ROUTE_QUOTE_ID = 1;

/** The JSON-RPC request for one reference sell: token category
 *  in, BCH out, amount in the token's base units. The exact shape
 *  the R9 cross-check proved against the live endpoint. */
export function buildRouteQuoteMessage(
  category: string,
  amountRaw: bigint,
): string {
  return JSON.stringify({
    id: ROUTE_QUOTE_ID,
    method: "route.quote",
    params: {
      sell: category,
      buy: "bch",
      amount: amountRaw.toString(),
      side: "sell",
    },
  });
}

/** Read one route.quote answer. Returns the output in sats, or
 *  null for anything that is not a well-formed answer to OUR
 *  request: an error object, a foreign id, a missing or negative
 *  or fractional output. Total by design — no throw — because
 *  every caller treats an unusable answer as "no quote". */
export function parseRouteQuoteMessage(data: string): bigint | null {
  let payload: unknown;
  try {
    payload = JSON.parse(data);
  } catch {
    return null;
  }
  if (typeof payload !== "object" || payload === null) return null;
  const message = payload as Record<string, unknown>;
  if (message.id !== ROUTE_QUOTE_ID) return null;
  if (message.error !== undefined && message.error !== null) return null;
  if (typeof message.result !== "object" || message.result === null) {
    return null;
  }
  const output = (message.result as Record<string, unknown>).output_amount;
  if (typeof output === "string") {
    // Base-unit amounts cross the wire as decimal strings; a sign
    // or a fraction is not a sats figure this project will carry.
    if (!/^\d+$/.test(output)) return null;
    return BigInt(output);
  }
  if (typeof output === "number" && Number.isSafeInteger(output) && output >= 0) {
    return BigInt(output);
  }
  return null;
}

/** The slice of a WebSocket this client drives. The browser's
 *  WebSocket satisfies it directly; tests inject a fake, and the
 *  Node-side live proof injects an adapter over `ws` (Node's ws
 *  does not honour this VM's egress proxy — see TOOLS.md — so the
 *  proof tunnels, exactly like router-crosscheck.mjs). */
export interface RouteQuoteSocket {
  send: (data: string) => void;
  close: () => void;
  onopen: (() => void) | null;
  onmessage: ((event: { data: unknown }) => void) | null;
  onerror: ((event: unknown) => void) | null;
  onclose: (() => void) | null;
}

export type RouteQuoteSocketFactory = (url: string) => RouteQuoteSocket;

const browserSocketFactory: RouteQuoteSocketFactory = (url) =>
  new WebSocket(url) as unknown as RouteQuoteSocket;

export interface RouteQuoteOptions {
  timeoutMs?: number;
  createSocket?: RouteQuoteSocketFactory;
  url?: string;
}

/** Ask the Router for one quote. Resolves the output in sats, or
 *  null — on a non-positive amount (no socket is even opened),
 *  on any socket failure, on close-before-answer, on timeout,
 *  and on an answer parseRouteQuoteMessage cannot stand behind.
 *  Never rejects. */
export function fetchRouteQuote(
  category: string,
  amountRaw: bigint,
  options: RouteQuoteOptions = {},
): Promise<bigint | null> {
  if (amountRaw <= 0n) return Promise.resolve(null);
  const timeoutMs = options.timeoutMs ?? ROUTE_QUOTE_TIMEOUT_MS;
  const createSocket = options.createSocket ?? browserSocketFactory;
  const url = options.url ?? ROUTER_WSS_URL;
  return new Promise((resolve) => {
    let settled = false;
    let socket: RouteQuoteSocket;
    try {
      socket = createSocket(url);
    } catch {
      resolve(null);
      return;
    }
    const settle = (value: bigint | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        socket.close();
      } catch {
        // A socket that will not close cleanly has still given
        // its answer (or its failure); the quote is settled.
      }
      resolve(value);
    };
    const timer = setTimeout(() => settle(null), timeoutMs);
    socket.onopen = () => {
      try {
        socket.send(buildRouteQuoteMessage(category, amountRaw));
      } catch {
        settle(null);
      }
    };
    socket.onmessage = (event) => {
      settle(
        typeof event.data === "string"
          ? parseRouteQuoteMessage(event.data)
          : null,
      );
    };
    socket.onerror = () => settle(null);
    socket.onclose = () => settle(null);
  });
}
