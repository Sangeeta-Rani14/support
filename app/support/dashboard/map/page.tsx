"use client";

import dynamic from "next/dynamic";
import { MapPin, Navigation, Clock, Radio, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

// Leaflet is browser-only — no SSR
const IncidentMap = dynamic(() => import("@/components/IncidentMap"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full bg-slate-100 animate-pulse flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 rounded-full border-4 border-slate-300 border-t-orange-500 animate-spin" />
                <p className="text-sm text-muted-foreground font-medium">Loading map...</p>
            </div>
        </div>
    ),
});

// ── Mock incident data (replace with real data from context/store) ─────────────
const INCIDENT = {
    id: "JS-2024-001",
    reporter: "Rajesh Kumar",
    condition: "Critical",
    accidentType: "Road Accident",
    location: "28.6139° N, 77.2090° E",
    address: "Connaught Place, New Delhi",
    // Incident coords — Connaught Place, Delhi
    lat: 28.6139,
    lng: 77.2090,
};

const UNIT = {
    id: "AMB-042",
    type: "Ambulance",
    status: "En Route",
    eta: "3 min",
    distance: "0.5 km",
    // Base station coords — nearby hospital
    originLat: 28.6250,
    originLng: 77.1950,
};

export default function LiveMapPage() {
    return (
        <div className="flex flex-col gap-4 h-full">
            {/* ── Page Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                        Live Incident Map
                    </h1>
                    <p className="text-sm text-muted-foreground">Real-time tracking of dispatched units</p>
                </div>
                <Badge
                    variant="outline"
                    className="text-xs px-3 py-1.5 border-red-300 text-red-600 bg-red-50 font-semibold w-fit animate-pulse"
                >
                    🔴 CRITICAL · {INCIDENT.reporter}
                </Badge>
            </div>

            {/* ── Status Cards Row ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
                <Card className="border border-slate-200 shadow-sm">
                    <CardContent className="p-3 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Incident</p>
                            <p className="text-xs font-bold text-foreground truncate">{INCIDENT.accidentType}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border border-slate-200 shadow-sm">
                    <CardContent className="p-3 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                            <Navigation className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Unit</p>
                            <p className="text-xs font-bold text-foreground">{UNIT.id}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border border-slate-200 shadow-sm">
                    <CardContent className="p-3 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                            <Clock className="w-4 h-4 text-orange-600" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">ETA</p>
                            <p className="text-xs font-bold text-foreground">{UNIT.eta}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border border-slate-200 shadow-sm">
                    <CardContent className="p-3 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                            <Radio className="w-4 h-4 text-green-600 animate-pulse" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Status</p>
                            <p className="text-xs font-bold text-green-600">{UNIT.status}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ── Full Map ── */}
            <Card className="border border-slate-200 shadow-sm flex-1 overflow-hidden min-h-[420px]">
                <CardContent className="p-0 h-full flex flex-col">
                    {/* Map fills remaining space */}
                    <div className="flex-1 relative">
                        <IncidentMap
                            incidentLat={INCIDENT.lat}
                            incidentLng={INCIDENT.lng}
                            originLat={UNIT.originLat}
                            originLng={UNIT.originLng}
                            className="absolute inset-0 rounded-none h-full"
                        />
                    </div>

                    {/* Legend bar */}
                    <div className="flex flex-wrap items-center gap-5 px-4 py-3 bg-slate-50 border-t border-slate-100 text-[11px] text-muted-foreground shrink-0">
                        <span className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-full bg-blue-500 inline-block border-2 border-white shadow-sm" />
                            <span className="font-medium">{UNIT.id} — Base Station</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-full bg-red-500 inline-block border-2 border-white shadow-sm" />
                            <span className="font-medium">Incident Site — {INCIDENT.address}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                            <svg width="24" height="8" viewBox="0 0 24 8">
                                <line x1="0" y1="4" x2="24" y2="4" stroke="#f97316" strokeWidth="2.5" strokeDasharray="6 4" strokeLinecap="round" />
                            </svg>
                            <span className="font-medium">Route ({UNIT.distance})</span>
                        </span>
                        <span className="ml-auto flex items-center gap-1.5 text-slate-400">
                            <MapPin className="w-3 h-3" />
                            {INCIDENT.location}
                        </span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
