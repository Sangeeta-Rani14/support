"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import {
    Ambulance, AlertTriangle, BookOpen, CheckCircle2,
    Heart, MapPin, Navigation, Phone, Search,
    Shield, Users, X, Zap, Clock, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { subscribeToSSE, publishEvent, SSEEvent } from "@/lib/sse";

// Leaflet must be loaded client-side only (no SSR)
const IncidentMap = dynamic(() => import("@/components/IncidentMap"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-[280px] rounded-xl bg-slate-100 animate-pulse flex items-center justify-center">
            <p className="text-xs text-muted-foreground">Loading map...</p>
        </div>
    ),
});

// ─── Types ────────────────────────────────────────────────────────────────────
type UnitType = "ambulance" | "volunteer" | "police" | "family";

interface DispatchedUnit {
    type: UnitType;
    label: string;
    unit: string;
    dispatchedAt: string;
    eta: string;
    trackingProgress: number; // 0-100
}

// ─── Mock patient ─────────────────────────────────────────────────────────────
const MOCK_PATIENT = {
    name: "Rajesh Kumar",
    phone: "+91 98765 43210",
    bloodGroup: "B+",
    scannerNumber: "JS-2024-001",
    lat: 28.6139,
    lng: 77.2090,
    location: "28.6139, 77.2090",
    condition: "critical",
    accidentType: "Road Accident",
    notes: "Victim unconscious, head injury visible, multiple passengers involved.",
    familyName: "Sunita Kumar (Wife)",
    familyContact: "+91 91234 56789",
};

const UNITS = [
    { label: "Nearest Ambulance", type: "ambulance" as UnitType, unit: "AMB-042", distance: "0.5 km", eta: "3 min" },
    { label: "Nearest Volunteer", type: "volunteer" as UnitType, unit: "VOL-018", distance: "1.2 km", eta: "6 min" },
    { label: "Police Station", type: "police" as UnitType, unit: "PS-North", distance: "2.5 km", eta: "8 min" },
    { label: "Family Contact", type: "family" as UnitType, unit: "Family", distance: "—", eta: "—" },
];

const FIRST_AID_STEPS = [
    "Ensure scene safety before approaching victim",
    "Check victim's responsiveness — tap shoulders & shout",
    "Call for help / confirm ambulance is dispatched",
    "Check breathing — tilt head back, lift chin",
    "Begin CPR if not breathing (30 compressions : 2 breaths)",
    "Control visible bleeding with firm, steady pressure",
    "Do not move victim if spinal injury is suspected",
    "Keep victim warm, calm, and still until help arrives",
];

// ─── Unit icon & colors (muted, design-consistent) ───────────────────────────
function unitIcon(type: UnitType, cls = "w-4 h-4") {
    if (type === "ambulance") return <Ambulance className={cls} />;
    if (type === "police") return <Shield className={cls} />;
    if (type === "volunteer") return <Heart className={cls} />;
    return <Users className={cls} />;
}
function unitAccent(type: UnitType) {
    if (type === "ambulance") return { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", icon: "bg-red-100 text-red-600" };
    if (type === "police") return { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", icon: "bg-blue-100 text-blue-600" };
    if (type === "volunteer") return { bg: "bg-green-50", border: "border-green-200", text: "text-green-700", icon: "bg-green-100 text-green-600" };
    return { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700", icon: "bg-purple-100 text-purple-600" };
}


// function LiveTrackingMap({ unit, progress }: { unit: DispatchedUnit; progress: number }) {
//     // Simulate vehicle moving along a path from top-left to bottom-right (incident)
//     const vx = 10 + (progress / 100) * 65; // % across SVG
//     const vy = 10 + (progress / 100) * 55;

//     return (
//         <div className="relative w-full h-52 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
//             {/* Grid background */}
//             <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
//                 <defs>
//                     <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
//                         <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#94a3b8" strokeWidth="0.5" />
//                     </pattern>
//                 </defs>
//                 <rect width="100%" height="100%" fill="url(#grid)" />
//             </svg>

//             {/* Road lines */}
//             <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
//                 {/* Horizontal roads */}
//                 <line x1="0" y1="35%" x2="100%" y2="35%" stroke="#cbd5e1" strokeWidth="6" />
//                 <line x1="0" y1="65%" x2="100%" y2="65%" stroke="#cbd5e1" strokeWidth="4" />
//                 {/* Vertical roads */}
//                 <line x1="30%" y1="0" x2="30%" y2="100%" stroke="#cbd5e1" strokeWidth="4" />
//                 <line x1="70%" y1="0" x2="70%" y2="100%" stroke="#cbd5e1" strokeWidth="6" />
//                 {/* Route path (dashed) */}
//                 <line
//                     x1="10%" y1="10%"
//                     x2={`${vx}%`} y2={`${vy}%`}
//                     stroke="#f97316" strokeWidth="2.5" strokeDasharray="6 4"
//                     strokeLinecap="round"
//                 />
//                 {/* Destination marker */}
//                 <circle cx="75%" cy="65%" r="8" fill="#ef4444" opacity="0.25" />
//                 <circle cx="75%" cy="65%" r="4" fill="#ef4444" />
//             </svg>

//             {/* Moving vehicle dot */}
//             <div
//                 className="absolute w-7 h-7 rounded-full bg-white border-2 border-orange-500 shadow-lg flex items-center justify-center transition-all duration-1000"
//                 style={{ left: `calc(${vx}% - 14px)`, top: `calc(${vy}% - 14px)` }}
//             >
//                 {unitIcon(unit.type, "w-3.5 h-3.5 text-orange-600")}
//             </div>

//             {/* Destination pulse */}
//             <div className="absolute" style={{ left: "calc(75% - 16px)", top: "calc(65% - 16px)" }}>
//                 <div className="w-8 h-8 rounded-full bg-red-400/30 animate-ping absolute" />
//             </div>

//             {/* Labels */}
//             <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1 text-[10px] font-semibold text-slate-700 border border-slate-200 flex items-center gap-1.5">
//                 <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
//                 {unit.unit} · En Route
//             </div>
//             <div className="absolute bottom-2 right-2 bg-red-600/90 backdrop-blur-sm rounded-lg px-2 py-1 text-[10px] font-semibold text-white flex items-center gap-1">
//                 <MapPin className="w-3 h-3" /> Incident Site
//             </div>
//             <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1 text-[10px] font-semibold text-slate-700 border border-slate-200">
//                 ETA: {Math.max(0, Math.round((1 - progress / 100) * parseInt(unit.eta)))} min
//             </div>
//         </div>
//     );
// }

// ─── Confirmation + Tracking Modal ───────────────────────────────────────────
function DispatchModal({
    unit,
    onClose,
}: {
    unit: DispatchedUnit;
    onClose: () => void;
}) {
    const accent = unitAccent(unit.type);
    const [progress, setProgress] = useState(unit.trackingProgress);



    const arrived = progress >= 100;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 p-4">
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className={`px-5 py-4 flex items-center justify-between border-b ${accent.border} ${accent.bg}`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${accent.icon}`}>
                            {unitIcon(unit.type)}
                        </div>
                        <div>
                            <h3 className={`font-bold text-base ${accent.text}`}>{unit.label}</h3>
                            <p className="text-xs text-muted-foreground">{unit.unit} · Dispatched {unit.dispatchedAt}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {arrived ? (
                            <Badge className="bg-green-100 text-green-700 border-0 text-xs gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Arrived
                            </Badge>
                        ) : (
                            <Badge className="bg-amber-100 text-amber-700 border-0 text-xs gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> En Route
                            </Badge>
                        )}
                        <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-slate-100" onClick={onClose}>
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                <div className="p-5 space-y-4 overflow-y-auto">
                    {/* Confirmation Banner */}
                    <div className={`flex items-start gap-3 p-4 rounded-xl border ${accent.bg} ${accent.border}`}>
                        <CheckCircle2 className={`w-5 h-5 mt-0.5 shrink-0 ${accent.text}`} />
                        <div>
                            <p className={`text-sm font-bold ${accent.text}`}>
                                {arrived ? `${unit.unit} has arrived at the incident site` : `${unit.unit} confirmed & dispatched`}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {arrived
                                    ? "Unit is on-scene. Coordinating with responders."
                                    : `Estimated arrival: ${unit.eta} · Dispatched at ${unit.dispatchedAt}`}
                            </p>
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span className="font-medium">Route Progress</span>
                            <span>{progress}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-700 ${arrived ? "bg-green-500" : "bg-orange-500"}`}
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <div className="flex justify-between text-[10px] text-muted-foreground">
                            <span>Base Station</span>
                            <span>Incident Site</span>
                        </div>
                    </div>f

                    {/* Patient info (for ambulance) */}
                    {unit.type === "ambulance" && (
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { label: "Patient", value: MOCK_PATIENT.name },
                                { label: "Blood Group", value: MOCK_PATIENT.bloodGroup },
                                { label: "Scanner No.", value: MOCK_PATIENT.scannerNumber },
                                { label: "Condition", value: MOCK_PATIENT.condition },
                            ].map((item) => (
                                <div key={item.label} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">{item.label}</p>
                                    <p className="text-sm font-bold text-foreground capitalize">{item.value}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* First aid (for volunteer) */}
                    {unit.type === "volunteer" && (
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="flex items-center gap-2 mb-3">
                                <BookOpen className="w-4 h-4 text-green-600" />
                                <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">First Aid Guide</p>
                            </div>
                            <ol className="space-y-1.5">
                                {FIRST_AID_STEPS.map((step, i) => (
                                    <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                                        <span className="w-4 h-4 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">
                                            {i + 1}
                                        </span>
                                        {step}
                                    </li>
                                ))}
                            </ol>
                        </div>
                    )}

                    {/* Police info */}
                    {unit.type === "police" && (
                        <div className="space-y-2">
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Incident Type</p>
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-blue-600" />
                                    <p className="text-sm font-bold text-slate-800">{MOCK_PATIENT.accidentType}</p>
                                </div>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Family Contact</p>
                                <p className="text-sm font-bold text-foreground">{MOCK_PATIENT.familyName}</p>
                                <p className="text-xs text-blue-600 font-mono">{MOCK_PATIENT.familyContact}</p>
                            </div>
                        </div>
                    )}

                    {/* Family info */}
                    {unit.type === "family" && (
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Notified Contact</p>
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center">
                                    <Users className="w-4 h-4 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-foreground">{MOCK_PATIENT.familyName}</p>
                                    <p className="text-xs text-purple-600 font-mono">{MOCK_PATIENT.familyContact}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DispatchControlPage() {
    const [search, setSearch] = useState("");
    const [dispatched, setDispatched] = useState<DispatchedUnit[]>([]);
    const [confirming, setConfirming] = useState<UnitType | null>(null);
    const [volunteerResponses, setVolunteerResponses] = useState<Record<string, string>>({}); // unitId → vehicleNumber

    // ── Listen for volunteer responses via SSE ──────────────────────────────────
    useEffect(() => {
        const unsub = subscribeToSSE((event: SSEEvent) => {
            if (event.type === "volunteer_response") {
                const p = event.payload as { incidentId?: string; vehicleNumber?: string; volunteerName?: string; eta?: string };
                if (p.vehicleNumber) {
                    setVolunteerResponses((prev) => ({
                        ...prev,
                        [String(p.incidentId ?? "latest")]: `${p.vehicleNumber} · ETA ${p.eta}`,
                    }));
                }
            }
        });
        return unsub;
    }, []);

    const isDispatched = (type: UnitType) => dispatched.some((d) => d.type === type);
    const getDispatched = (type: UnitType) => dispatched.find((d) => d.type === type);

    const handleDispatch = async (type: UnitType, label: string, unit: string, eta: string) => {
        if (isDispatched(type)) return;
        setConfirming(type);
        // Simulate backend confirmation delay
        await new Promise((r) => setTimeout(r, 1200));
        const newUnit: DispatchedUnit = {
            type, label, unit,
            dispatchedAt: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
            eta,
            trackingProgress: 5,
        };
        setDispatched((prev) => [...prev, newUnit]);
        setConfirming(null);

        // Broadcast dispatch_request via SSE → volunteers receive this on all devices
        publishEvent("dispatch_request", {
            incidentId: MOCK_PATIENT.scannerNumber,
            type: MOCK_PATIENT.accidentType,
            condition: MOCK_PATIENT.condition,
            location: `${MOCK_PATIENT.location} — lat ${MOCK_PATIENT.lat}, lng ${MOCK_PATIENT.lng}`,
            reporter: MOCK_PATIENT.name,
            phone: MOCK_PATIENT.phone,
            notes: MOCK_PATIENT.notes,
            requestedAt: new Date().toISOString(),
            unitRequested: type,
            unitLabel: label,
            unitId: unit,
            eta,
        });
    };

    const handleDispatchAll = async () => {
        const toDispatch = UNITS.filter((u) => !isDispatched(u.type));
        for (const u of toDispatch) {
            await handleDispatch(u.type, u.label, u.unit, u.eta);
        }
    };

    const filtered = UNITS.filter((u) =>
        u.label.toLowerCase().includes(search.toLowerCase()) ||
        u.unit.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-5">
            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-foreground">Dispatch Control</h1>
                    <p className="text-sm text-muted-foreground">Coordinate emergency response units in real-time</p>
                </div>
                <Badge variant="outline" className="text-xs px-3 py-1 border-red-300 text-red-600 bg-red-50 font-semibold w-fit animate-pulse">
                    🔴 {MOCK_PATIENT.condition.toUpperCase()} · {MOCK_PATIENT.name}
                </Badge>
            </div>

            {/* ── Patient Summary ── */}
            <Card className="border border-slate-200 shadow-sm">
                <CardContent className="p-4">
                    <div className="flex flex-wrap gap-x-6 gap-y-3 items-center">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center">
                                <Users className="w-4 h-4 text-slate-500" />
                            </div>
                            <div>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Patient</p>
                                <p className="text-sm font-bold text-foreground">{MOCK_PATIENT.name}</p>
                            </div>
                        </div>
                        <div className="h-8 w-px bg-slate-200 hidden sm:block" />
                        <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Blood Group</p>
                            <p className="text-base font-bold text-red-600">{MOCK_PATIENT.bloodGroup}</p>
                        </div>
                        <div className="h-8 w-px bg-slate-200 hidden sm:block" />
                        <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Scanner</p>
                            <p className="text-xs font-mono font-bold text-foreground">{MOCK_PATIENT.scannerNumber}</p>
                        </div>
                        <div className="h-8 w-px bg-slate-200 hidden sm:block" />
                        <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Location</p>
                            <p className="text-xs font-mono text-foreground">{MOCK_PATIENT.location}</p>
                        </div>
                        <div className="h-8 w-px bg-slate-200 hidden sm:block" />
                        <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Incident</p>
                            <p className="text-xs font-semibold text-foreground">{MOCK_PATIENT.accidentType}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* ── Active Dispatches ── */}
            {dispatched.length > 0 && (
                <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Dispatches</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {dispatched.map((unit) => {
                            const accent = unitAccent(unit.type);
                            return (
                                <div
                                    key={unit.type}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left ${accent.bg} ${accent.border}`}
                                >
                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-semibold ${accent.text}`}>{unit.unit}</p>
                                        <p className="text-[10px] text-muted-foreground">Dispatched {unit.dispatchedAt} · ETA {unit.eta}</p>
                                    </div>
                                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── Search ── */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                    placeholder="Search units — ambulance, police, volunteer..."
                    className="pl-9 h-10 text-sm bg-white border-slate-200"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* ── Dispatch Buttons ── */}
            <div className="space-y-2">
                {filtered.map((u) => {
                    const dispatching = confirming === u.type;
                    const done = isDispatched(u.type);
                    const accent = unitAccent(u.type);

                    return (
                        <button
                            key={u.type}
                            onClick={() => handleDispatch(u.type, u.label, u.unit, u.eta)}
                            disabled={dispatching}
                            className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border text-left transition-all duration-200 hover:shadow-sm ${done
                                ? `${accent.bg} ${accent.border}`
                                : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                }`}
                        >
                            {/* Icon */}
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${done ? accent.icon : "bg-slate-100 text-slate-500"}`}>
                                {dispatching ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    unitIcon(u.type)
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm font-semibold ${done ? accent.text : "text-foreground"}`}>{u.label}</p>
                                <p className="text-[11px] text-muted-foreground">
                                    {u.unit}
                                    {u.distance !== "—" && ` · ${u.distance} · ETA ${u.eta}`}
                                </p>
                            </div>

                            {/* Status */}
                            {dispatching ? (
                                <span className="text-xs text-muted-foreground shrink-0">Confirming...</span>
                            ) : done ? (
                                <div className="flex items-center gap-1.5 shrink-0">
                                    <Badge className={`text-[10px] border-0 ${accent.icon}`}>
                                        <CheckCircle2 className="w-3 h-3 mr-1" />Dispatched
                                    </Badge>
                                    <span className={`text-[10px] font-medium ${accent.text}`}>Track →</span>
                                </div>
                            ) : (
                                <span className="text-xs font-semibold text-foreground shrink-0 border border-slate-200 rounded-lg px-3 py-1.5 bg-white hover:bg-slate-50">
                                    Dispatch
                                </span>
                            )}
                        </button>
                    );
                })}

                {/* Dispatch All */}
                <button
                    onClick={handleDispatchAll}
                    disabled={dispatched.length === UNITS.length || confirming !== null}
                    className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border text-left transition-all duration-200 mt-1 ${dispatched.length === UNITS.length
                        ? "bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed"
                        : "bg-slate-900 border-slate-900 text-white hover:bg-slate-800 hover:shadow-md"
                        }`}
                >
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                        <Zap className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-bold">Dispatch All Units</p>
                        <p className="text-[11px] opacity-60">Send ambulance, volunteer, police & notify family</p>
                    </div>
                    {dispatched.length === UNITS.length && (
                        <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                    )}
                </button>
            </div>


        </div>
    );
}
