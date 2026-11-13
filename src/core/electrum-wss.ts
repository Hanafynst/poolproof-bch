/**
 * Browser Electrum transport: the ElectrumCall wallet-utxos.ts
 * injects, spoken over WebSocket Secure to public Fulcrum servers.
 *
 * Why WSS: a GitHub Pages page is HTTPS, so the browser blocks
 * plain ws:// as mixed content, and raw Electrum TLS (port 50002)
 * is not something a browser can dial at all. Fulcrum's WSS port
 * (50004) is the one Electrum transport a static page can use.
 * Both endpoints below were probed live on 2026-11-14 and answered
 * server.version as Fulcrum 2.1.4 (protocol 1.4).
 *
 * One session multiplexes every call over a single socket by
 * JSON-RPC id. Calls time out individually; a dead socket rejects
 * everything in flight and the next call reconnects from the head
 * of the endpoint list. A JSON-RPC error object is a rejection:
 * callers (the balance read, the broadcast step) must see a failed
 * call as failed, never as an empty result.
 */
import type { ElectrumCall } from "./wallet-utxos.js";

export const ELECTRUM_WSS_ENDPOINTS: readonly string[] = [
  "wss://electrum.imaginary.cash:50004",
  "wss://bch.imaginary.cash:50004",
];

const CALL_TIMEOUT_MS = 25_000;

interface PendingCall {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

export interface ElectrumSession {
  call: ElectrumCall;
  close: () => void;
}

export function createElectrumSession(
  endpoints: readonly string[] = ELECTRUM_WSS_ENDPOINTS,
): ElectrumSession {
  let socket: WebSocket | null = null;
  let connecting: Promise<WebSocket> | null = null;
  let nextId = 1;
  const pending = new Map<number, PendingCall>();

  const failAll = (error: Error) => {
    for (const entry of pending.values()) {
      clearTimeout(entry.timer);
      entry.reject(error);
    }
    pending.clear();
  };

  const openSocket = (url: string): Promise<WebSocket> =>
    new Promise((resolve, reject) => {
      let ws: WebSocket;
      try {
        ws = new WebSocket(url);
      } catch (error) {
        reject(error instanceof Error ? error : new Error(String(error)));
        return;
      }
      const onOpen = () => {
        ws.removeEventListener("error", onError);
        resolve(ws);
      };
      const onError = () => {
        ws.removeEventListener("open", onOpen);
        reject(new Error(`electrum-wss: cannot connect to ${url}`));
      };
      ws.addEventListener("open", onOpen);
      ws.addEventListener("error", onError);
      ws.addEventListener("message", (event) => {
        let message: { id?: unknown; result?: unknown; error?: unknown };
        try {
          message = JSON.parse(String(event.data)) as typeof message;
        } catch {
          return; // Not JSON: not an answer to any call we made.
        }
        if (typeof message.id !== "number") return;
        const entry = pending.get(message.id);
        if (entry === undefined) return;
        pending.delete(message.id);
        clearTimeout(entry.timer);
        if (message.error !== undefined && message.error !== null) {
          const detail =
            typeof message.error === "object" &&
            message.error !== null &&
            "message" in message.error
              ? String((message.error as { message: unknown }).message)
              : String(message.error);
          entry.reject(new Error(`electrum-wss: server error: ${detail}`));
        } else {
          entry.resolve(message.result);
        }
      });
      ws.addEventListener("close", () => {
        if (socket === ws) socket = null;
        failAll(new Error("electrum-wss: connection closed"));
      });
    });

  const ensureSocket = async (): Promise<WebSocket> => {
    if (socket !== null && socket.readyState === WebSocket.OPEN) {
      return socket;
    }
    if (connecting !== null) return connecting;
    connecting = (async () => {
      let lastError: Error = new Error("electrum-wss: no endpoints configured");
      for (const url of endpoints) {
        try {
          const ws = await openSocket(url);
          socket = ws;
          return ws;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
        }
      }
      throw lastError;
    })();
    try {
      return await connecting;
    } finally {
      connecting = null;
    }
  };

  const call: ElectrumCall = async (method, params) => {
    const ws = await ensureSocket();
    const id = nextId++;
    return new Promise<unknown>((resolve, reject) => {
      const timer = setTimeout(() => {
        pending.delete(id);
        reject(
          new Error(
            `electrum-wss: ${method} timed out after ${CALL_TIMEOUT_MS}ms`,
          ),
        );
      }, CALL_TIMEOUT_MS);
      pending.set(id, { resolve, reject, timer });
      try {
        ws.send(JSON.stringify({ id, method, params, jsonrpc: "2.0" }));
      } catch (error) {
        pending.delete(id);
        clearTimeout(timer);
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });
  };

  const close = () => {
    failAll(new Error("electrum-wss: session closed"));
    if (socket !== null) {
      socket.close();
      socket = null;
    }
  };

  return { call, close };
}
