/**
 * Shared SSE client utility
 * Usage:
 *   import { subscribeToSSE } from "@/lib/sse";
 *   const unsub = subscribeToSSE((event) => { ... });
 *   // call unsub() to disconnect
 */

export type SSEEvent = {
    type: string;
    payload: Record<string, unknown>;
    ts: number;
};

/**
 * Subscribe to the /api/events SSE stream.
 * Automatically reconnects if the connection drops.
 * Returns an unsubscribe function.
 */
export function subscribeToSSE(
    onEvent: (event: SSEEvent) => void,
    onConnected?: () => void
): () => void {
    let es: EventSource | null = null;
    let retryTimeout: ReturnType<typeof setTimeout> | null = null;
    let stopped = false;

    function connect() {
        if (stopped) return;
        es = new EventSource("/api/events");

        es.onmessage = (e) => {
            try {
                const parsed: SSEEvent = JSON.parse(e.data);
                if (parsed.type === "connected") {
                    onConnected?.();
                    return;
                }
                onEvent(parsed);
            } catch {
                // malformed event
            }
        };

        es.onerror = () => {
            es?.close();
            if (!stopped) {
                retryTimeout = setTimeout(connect, 3000);
            }
        };
    }

    connect();

    return () => {
        stopped = true;
        if (retryTimeout) clearTimeout(retryTimeout);
        es?.close();
    };
}

/**
 * Publish an event to all SSE clients by calling the publish API.
 * Can be called from any client component.
 */
export async function publishEvent(
    type: string,
    payload: Record<string, unknown>
): Promise<void> {
    await fetch("/api/events/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, payload }),
    });
}
