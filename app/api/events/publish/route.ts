/**
 * POST /api/events/publish
 * Body: { type: string, payload: object }
 *
 * Anyone (support dashboard, EMR form)
 * can POST here to push a real-time event to every connected SSE client.
 */

import { NextRequest, NextResponse } from "next/server";
import { broadcast } from "../route";

export async function POST(req: NextRequest) {
    let body: { type?: string; payload?: object };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    if (!body.type) {
        return NextResponse.json({ error: "Missing `type` field" }, { status: 400 });
    }

    const event = {
        type: body.type,
        payload: body.payload ?? {},
        ts: Date.now(),
    };

    broadcast(event);

    return NextResponse.json({ ok: true, broadcasted: event });
}
