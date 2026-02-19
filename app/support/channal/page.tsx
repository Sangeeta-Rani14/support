"use client";

import { useState, useEffect, useRef } from "react";
import {
    Radio, Wifi, WifiOff, Activity, Ambulance, Shield, Users,
    CheckCircle2, AlertTriangle, Clock, Trash2, Filter,
} from "lucide-react";
import { subscribeToSSE, SSEEvent } from "@/lib/sse";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// ─── Types ────────────────────────────────────────────────────────────────────
type ChannelEvent = SSEEvent & { id: string };

const EVENT_ICONS: Record<string, React.ElementType> = {
    emergency_alert: AlertTriangle,
    dispatch_request: Ambulance,
    volunteer_response: Users,
    dispatch_confirmed: CheckCircle2,
    connected: Wifi,
};

const EVENT_COLORS: Record<string, string> = {
    emergency_alert: "text-red-500 bg-red-100",
    dispatch_request: "text-blue-600 bg-blue-100",
    volunteer_response: "text-emerald-600 bg-emerald-100",
    dispatch_confirmed: "text-purple-600 bg-purple-100",
    connected: "text-gray-500 bg-gray-100",
};

function EventRow({ event }: { event: ChannelEvent }) {
    const Icon = EVENT_ICONS[event.type] ?? Radio;
    const color = EVENT_COLORS[event.type] ?? "text-gray-400 bg-gray-100";

    return (
        <div className="flex items-start gap-3 p-3 border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors group">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
                <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-foreground font-mono">{event.type}</span>
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4">SSE</Badge>
                </div>
                <pre className="text-[10px] text-muted-foreground mt-1 whitespace-pre-wrap break-all font-mono">
                    {JSON.stringify(event.payload, null, 2)}
                </pre>
            </div>
            <span className="text-[10px] text-muted-foreground flex-shrink-0 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(event.ts).toLocaleTimeString("en-IN")}
            </span>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ChannelMonitorPage() {
    const [events, setEvents] = useState<ChannelEvent[]>([]);
    const [connected, setConnected] = useState(false);
    const [filter, setFilter] = useState<string>("all");
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const unsub = subscribeToSSE(
            (event) => {
                setEvents((prev) => [
                    { ...event, id: Math.random().toString(36).slice(2) },
                    ...prev,
                ].slice(0, 200)); // keep last 200 events
            },
            () => setConnected(true)
        );
        return unsub;
    }, []);

    const eventTypes = ["all", ...Array.from(new Set(events.map((e) => e.type)))];
    const filtered = filter === "all" ? events : events.filter((e) => e.type === filter);

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center">
                        <Radio className="w-5 h-5 text-brand-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-foreground">Channel Monitor</h1>
                        <p className="text-sm text-muted-foreground">Real-time cross-device SSE event stream</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {connected ? (
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 gap-1.5">
                            <Wifi className="w-3 h-3" /> Connected
                        </Badge>
                    ) : (
                        <Badge variant="outline" className="gap-1.5 text-muted-foreground">
                            <WifiOff className="w-3 h-3" /> Connecting…
                        </Badge>
                    )}
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setEvents([])}>
                        <Trash2 className="w-3.5 h-3.5" /> Clear
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: "Total Events", value: events.length, icon: Activity, cls: "bg-brand-primary/10 text-brand-primary" },
                    { label: "Emergency Alerts", value: events.filter(e => e.type === "emergency_alert").length, icon: AlertTriangle, cls: "bg-red-100 text-red-600" },
                    { label: "Dispatches", value: events.filter(e => e.type === "dispatch_request").length, icon: Ambulance, cls: "bg-blue-100 text-blue-600" },
                    { label: "Volunteer Resp.", value: events.filter(e => e.type === "volunteer_response").length, icon: Users, cls: "bg-emerald-100 text-emerald-600" },
                ].map(({ label, value, icon: Icon, cls }) => (
                    <div key={label} className="bg-white rounded-xl border border-border/60 p-3 flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${cls}`}>
                            <Icon className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-xl font-bold text-foreground leading-none">{value}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filter tabs */}
            <div className="flex gap-1 flex-wrap">
                {eventTypes.map((type) => (
                    <button
                        key={type}
                        onClick={() => setFilter(type)}
                        className={`text-xs px-3 py-1 rounded-lg font-medium transition-all border ${filter === type
                            ? "bg-brand-primary text-white border-brand-primary"
                            : "bg-white text-muted-foreground border-border/60 hover:border-brand-primary/40"
                            }`}
                    >
                        {type === "all" ? "All" : type}
                    </button>
                ))}
            </div>

            {/* Event stream */}
            <div className="bg-white rounded-xl border border-border/60 overflow-hidden">
                <div className="px-4 py-2.5 bg-muted/30 border-b border-border/40 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-semibold text-foreground">Live Stream</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">{filtered.length} events</span>
                </div>

                <div className="max-h-[480px] overflow-y-auto">
                    {filtered.length === 0 ? (
                        <div className="p-10 text-center">
                            <Radio className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3 animate-pulse" />
                            <p className="text-sm text-muted-foreground">Listening for events…</p>
                            <p className="text-xs text-muted-foreground/60 mt-1">
                                Events appear here when any device submits a form or dispatches a unit
                            </p>
                        </div>
                    ) : (
                        filtered.map((event) => <EventRow key={event.id} event={event} />)
                    )}
                    <div ref={bottomRef} />
                </div>
            </div>

            {/* How it works info box */}
            <div className="bg-brand-primary/5 border border-brand-primary/20 rounded-xl p-4 space-y-2">
                <p className="text-xs font-bold text-brand-primary">How Cross-Device Communication Works</p>
                <ul className="text-[11px] text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Support dashboard & volunteer phones connect to <code className="bg-muted px-1 rounded">/api/events</code> (SSE stream)</li>
                    <li>Any page POSTs to <code className="bg-muted px-1 rounded">/api/events/publish</code> to push a real-time event</li>
                    <li>Volunteer responses POST to <code className="bg-muted px-1 rounded">/api/volunteer/respond</code> which also broadcasts via SSE</li>
                    <li>All connected clients receive all events instantly, regardless of device or browser</li>
                </ul>
            </div>
        </div>
    );
}
