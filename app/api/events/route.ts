/**
 * SSE (Server-Sent Events) broadcast endpoint
 * GET  /api/events          — client connects and keeps the stream open
 * The server pushes JSON events to all connected clients whenever
 * POST /api/events/publish  sends a message.
 *
 * This enables real-time cross-device communication:
 *  Support Dashboard  ←→  EMR form
 */

// Global registry of active SSE clients
const clients = new Set<ReadableStreamDefaultController>();

/**
 * Broadcast a JSON payload to all connected SSE clients.
 * Called internally by the publish route and any server action.
 */
export function broadcast(data: object) {
    const line = `data: ${JSON.stringify(data)}\n\n`;
    const encoder = new TextEncoder();
    for (const ctrl of clients) {
        try {
            ctrl.enqueue(encoder.encode(line));
        } catch {
            clients.delete(ctrl);
        }
    }
}

/**
 * GET /api/events
 * Opens a persistent SSE stream for the caller.
 */
export async function GET() {
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        start(controller) {
            // Register this client
            clients.add(controller);

            // Send an initial "connected" ping so the client knows SSE works
            controller.enqueue(
                encoder.encode(
                    `data: ${JSON.stringify({ type: "connected", ts: Date.now() })}\n\n`
                )
            );

            // Heartbeat every 25 s to keep the connection alive through proxies
            const heartbeat = setInterval(() => {
                try {
                    controller.enqueue(encoder.encode(": heartbeat\n\n"));
                } catch {
                    clearInterval(heartbeat);
                    clients.delete(controller);
                }
            }, 25_000);

            // Cleanup when the client disconnects
            // (ReadableStream cancellation)
            return () => {
                clearInterval(heartbeat);
                clients.delete(controller);
            };
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
            "X-Accel-Buffering": "no", // Disable Nginx buffering
        },
    });
}
