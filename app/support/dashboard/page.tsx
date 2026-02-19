"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
    Activity, AlertTriangle, Ambulance, CheckCircle2, Clock,
    MapPin, MoreHorizontal, Phone, Search, Mic, MicOff, PhoneOff,
    Video, VideoOff, Users, Shield, Heart, BookOpen, Navigation,
    ChevronRight, X, TrendingUp, TrendingDown, Radio, Zap,
    CheckCheck, Timer, Wifi, WifiOff,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { EmergencyNotification, onEmergencyNotification, broadcastSupportReady } from "@/lib/emergency-channel";
import Peer from "peerjs";

// ─── Types ────────────────────────────────────────────────────────────────────
type DispatchTarget = "ambulance" | "volunteer" | "police" | null;

interface DispatchedUnit {
    type: DispatchTarget;
    label: string;
    status: "dispatched" | "en_route" | "arrived";
    time: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────
const AUTO_SUGGESTIONS = [
    { label: "Nearest Ambulance", value: "ambulance_1", distance: "0.5 km", eta: "3 min", type: "ambulance" as const, unit: "AMB-042" },
    { label: "Nearest Volunteer", value: "volunteer_1", distance: "1.2 km", eta: "6 min", type: "volunteer" as const, unit: "VOL-018" },
    { label: "Police Station", value: "police_1", distance: "2.5 km", eta: "8 min", type: "police" as const, unit: "PS-North" },
    { label: "Family Contact", value: "family_1", distance: "—", eta: "—", type: "family" as const, unit: "Family" },
];

const FIRST_AID_STEPS = [
    "Ensure scene safety before approaching",
    "Check victim's responsiveness (tap & shout)",
    "Call for help / confirm ambulance dispatched",
    "Check breathing — tilt head, lift chin",
    "Begin CPR if not breathing (30:2 ratio)",
    "Control bleeding with firm pressure",
    "Keep victim warm and still",
    "Monitor vitals until help arrives",
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function SuggestionIcon({ type }: { type: string }) {
    const base = "w-5 h-5";
    if (type === "ambulance") return <Ambulance className={base} />;
    if (type === "police") return <Shield className={base} />;
    if (type === "volunteer") return <Heart className={base} />;
    return <Users className={base} />;
}

function SuggestionColor(type: string) {
    if (type === "ambulance") return "bg-red-100 text-red-600";
    if (type === "police") return "bg-blue-100 text-blue-600";
    if (type === "volunteer") return "bg-green-100 text-green-600";
    return "bg-purple-100 text-purple-600";
}

// ─── Ambulance Detail Panel ───────────────────────────────────────────────────
function AmbulancePanel({ report, onClose }: { report: EmergencyNotification; onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-4">
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-red-100 overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                            <Ambulance className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-lg">Ambulance Dispatch</h3>
                            <p className="text-red-100 text-xs">Patient info sent to AMB-042</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-8 w-8" onClick={onClose}>
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                <div className="p-6 space-y-4">
                    {/* Live Location */}
                    <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl border border-red-100">
                        <Navigation className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                        <div className="flex-1">
                            <p className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-1">Live Location</p>
                            <p className="text-sm font-mono text-slate-800 break-all">{report.location}</p>
                            <div className="mt-2 h-24 bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200">
                                <div className="text-center">
                                    <MapPin className="w-6 h-6 text-red-500 mx-auto mb-1 animate-bounce" />
                                    <p className="text-xs text-slate-500">Route map loading...</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Patient Info Grid */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Patient Name</p>
                            <p className="text-sm font-bold text-foreground">{report.reporter}</p>
                        </div>
                        <div className="p-3 bg-red-50 rounded-xl border border-red-100">
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Blood Group</p>
                            <p className="text-sm font-bold text-red-600">{report.bloodGroup || "Unknown"}</p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Scanner No.</p>
                            <p className="text-xs font-mono font-bold text-brand-primary">{report.scannerNumber || "N/A"}</p>
                        </div>
                        <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Condition</p>
                            <p className="text-sm font-bold text-amber-700 capitalize">{report.condition}</p>
                        </div>
                    </div>

                    {/* Photo placeholder */}
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="w-14 h-14 rounded-lg bg-slate-200 flex items-center justify-center shrink-0">
                            <Users className="w-6 h-6 text-slate-400" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Patient Photo</p>
                            <p className="text-xs text-slate-500 mt-0.5">Photo from scanner profile</p>
                        </div>
                    </div>

                    <Button className="w-full bg-red-600 hover:bg-red-700 text-white h-11 font-semibold shadow-lg shadow-red-500/20">
                        <Ambulance className="w-4 h-4 mr-2" />
                        Confirm Dispatch to Ambulance
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ─── Volunteer Detail Panel ───────────────────────────────────────────────────
function VolunteerPanel({ report, onClose }: { report: EmergencyNotification; onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-4">
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-green-100 overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 flex items-center justify-between sticky top-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                            <Heart className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-lg">Volunteer Dispatch</h3>
                            <p className="text-green-100 text-xs">Sending to VOL-018</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-8 w-8" onClick={onClose}>
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                <div className="p-6 space-y-4">
                    {/* Map */}
                    <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                        <div className="flex items-center gap-2 mb-2">
                            <MapPin className="w-4 h-4 text-green-600" />
                            <p className="text-xs font-semibold text-green-600 uppercase tracking-wider">Location Map</p>
                        </div>
                        <div className="h-28 bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200">
                            <div className="text-center">
                                <Navigation className="w-6 h-6 text-green-500 mx-auto mb-1 animate-bounce" />
                                <p className="text-xs text-slate-500 font-mono">{report.location}</p>
                            </div>
                        </div>
                    </div>

                    {/* First Aid Guide */}
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-2 mb-3">
                            <BookOpen className="w-4 h-4 text-green-600" />
                            <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">First Aid Guide</p>
                            <Badge className="ml-auto text-[10px] bg-green-100 text-green-700 border-0">
                                {report.condition?.toUpperCase()}
                            </Badge>
                        </div>
                        <ol className="space-y-2">
                            {FIRST_AID_STEPS.map((step, i) => (
                                <li key={i} className="flex items-start gap-2.5 text-xs text-slate-600">
                                    <span className="w-5 h-5 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                                        {i + 1}
                                    </span>
                                    {step}
                                </li>
                            ))}
                        </ol>
                    </div>

                    {/* Scanner Contact */}
                    <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-100">
                        <Phone className="w-5 h-5 text-green-600 shrink-0" />
                        <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Scanner Contact</p>
                            <p className="text-sm font-bold text-foreground">{report.phone}</p>
                            <p className="text-xs text-slate-500">Scanner: {report.scannerNumber || "N/A"}</p>
                        </div>
                    </div>

                    <Button className="w-full bg-green-600 hover:bg-green-700 text-white h-11 font-semibold shadow-lg shadow-green-500/20">
                        <Heart className="w-4 h-4 mr-2" />
                        Notify Volunteer
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ─── Police Detail Panel ──────────────────────────────────────────────────────
function PolicePanel({ report, onClose }: { report: EmergencyNotification; onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-4">
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-blue-100 overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-700 to-blue-800 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                            <Shield className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-lg">Police Notification</h3>
                            <p className="text-blue-100 text-xs">Sending to PS-North</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-8 w-8" onClick={onClose}>
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                <div className="p-6 space-y-4">
                    {/* Accident Type */}
                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                        <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">Accident Type</p>
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-blue-600" />
                            <p className="text-base font-bold text-slate-800 capitalize">
                                {report.accidentType?.replace("_", " ") || "Unknown Incident"}
                            </p>
                        </div>
                        {report.notes && (
                            <p className="text-xs text-slate-600 mt-2 bg-white rounded-lg p-2 border border-blue-100">
                                {report.notes}
                            </p>
                        )}
                    </div>

                    {/* Location */}
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Incident Location</p>
                        <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                            <p className="text-sm font-mono text-slate-800 break-all">{report.location}</p>
                        </div>
                    </div>

                    {/* Family Number */}
                    <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                        <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-2">Family Contact</p>
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center">
                                <Users className="w-4 h-4 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-foreground">{report.familyName || "Family Member"}</p>
                                <p className="text-sm text-purple-600 font-mono">{report.familyContact || report.phone}</p>
                            </div>
                        </div>
                    </div>

                    <Button className="w-full bg-blue-700 hover:bg-blue-800 text-white h-11 font-semibold shadow-lg shadow-blue-500/20">
                        <Shield className="w-4 h-4 mr-2" />
                        Notify Police Station
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ─── Dispatch Control View ────────────────────────────────────────────────────
function DispatchControl({
    report,
    onClose,
}: {
    report: EmergencyNotification;
    onClose: () => void;
}) {
    const [activePanel, setActivePanel] = useState<DispatchTarget>(null);
    const [dispatched, setDispatched] = useState<DispatchedUnit[]>([]);
    const [dispatchAll, setDispatchAll] = useState(false);

    const handleDispatch = (type: DispatchTarget, label: string) => {
        if (!dispatched.find((d) => d.type === type)) {
            setDispatched((prev) => [
                ...prev,
                { type, label, status: "dispatched", time: new Date().toLocaleTimeString() },
            ]);
        }
    };

    const handleDispatchAll = () => {
        const units: DispatchedUnit[] = [
            { type: "ambulance", label: "Ambulance AMB-042", status: "dispatched", time: new Date().toLocaleTimeString() },
            { type: "volunteer", label: "Volunteer VOL-018", status: "dispatched", time: new Date().toLocaleTimeString() },
            { type: "police", label: "Police PS-North", status: "dispatched", time: new Date().toLocaleTimeString() },
        ];
        setDispatched(units);
        setDispatchAll(true);
    };

    const isDispatched = (type: string) => dispatched.some((d) => d.type === type);

    return (
        <div className="absolute inset-0 bg-slate-50 flex flex-col overflow-y-auto">
            {/* Panel header */}
            <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-brand-emergency/10 flex items-center justify-center">
                        <Zap className="w-5 h-5 text-brand-emergency" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wide">Dispatch Control</h2>
                        <p className="text-xs text-slate-500">Emergency for {report.reporter}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Badge
                        variant="outline"
                        className={`text-xs px-2 py-0.5 font-bold uppercase ${report.condition === "critical"
                            ? "border-red-400 text-red-600 bg-red-50"
                            : report.condition === "injured"
                                ? "border-amber-400 text-amber-600 bg-amber-50"
                                : "border-green-400 text-green-600 bg-green-50"
                            }`}
                    >
                        {report.condition}
                    </Badge>
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100" onClick={onClose}>
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            <div className="p-5 space-y-5 flex-1">
                {/* Dispatch All Banner */}
                {dispatchAll && (
                    <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl animate-in slide-in-from-top-2 fade-in">
                        <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                        <div>
                            <p className="text-sm font-bold text-green-700">All units dispatched successfully</p>
                            <p className="text-xs text-green-600">Ambulance, Volunteer &amp; Police notified</p>
                        </div>
                    </div>
                )}

                {/* Dispatched units status */}
                {dispatched.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Dispatches</p>
                        <div className="space-y-2">
                            {dispatched.map((unit, i) => (
                                <div key={i} className="flex items-center gap-3 px-4 py-2.5 bg-white border border-slate-200 rounded-xl shadow-sm">
                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    <p className="text-sm font-medium text-slate-800 flex-1">{unit.label}</p>
                                    <Badge className="text-[10px] bg-green-100 text-green-700 border-0">En Route</Badge>
                                    <span className="text-[10px] text-muted-foreground">{unit.time}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* ── Auto Suggestions ── */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Search className="w-4 h-4 text-brand-primary" />
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Auto Suggestions</h3>
                        </div>
                        <div className="space-y-2">
                            {AUTO_SUGGESTIONS.map((s, i) => (
                                <div
                                    key={i}
                                    className={`flex items-center justify-between p-3.5 bg-white border rounded-xl shadow-sm hover:shadow-md transition-all duration-200 ${isDispatched(s.type) ? "border-green-200 bg-green-50/50" : "border-slate-200 hover:border-slate-300"
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center ${SuggestionColor(s.type)}`}>
                                            <SuggestionIcon type={s.type} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900">{s.label}</p>
                                            <p className="text-[10px] text-slate-500">
                                                {s.distance !== "—" ? `${s.distance} · ETA ${s.eta}` : "Contact only"}
                                            </p>
                                        </div>
                                    </div>
                                    {isDispatched(s.type) ? (
                                        <Badge className="text-[10px] bg-green-100 text-green-700 border-0">
                                            <CheckCircle2 className="w-3 h-3 mr-1" />
                                            Sent
                                        </Badge>
                                    ) : (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="text-xs h-7 px-3"
                                            onClick={() => handleDispatch(s.type as DispatchTarget, s.label)}
                                        >
                                            Select
                                            <ChevronRight className="w-3 h-3 ml-1" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── Action Buttons ── */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-brand-primary" />
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Actions</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-2.5">
                            {/* Call Ambulance */}
                            <button
                                onClick={() => handleDispatch("ambulance", "Ambulance AMB-042")}
                                className={`group relative flex flex-col items-center justify-center gap-1.5 h-24 rounded-xl border-2 transition-all duration-200 font-semibold text-xs ${isDispatched("ambulance")
                                    ? "bg-red-600 border-red-600 text-white shadow-lg shadow-red-500/30"
                                    : "bg-white border-red-200 text-red-600 hover:bg-red-600 hover:text-white hover:border-red-600 hover:shadow-lg hover:shadow-red-500/20"
                                    }`}
                            >
                                <Phone className="w-5 h-5" />
                                <span>Call Ambulance</span>
                                {isDispatched("ambulance") && <CheckCircle2 className="w-3 h-3 absolute top-2 right-2" />}
                            </button>

                            {/* Dispatch Ambulance */}
                            <button
                                onClick={() => handleDispatch("ambulance", "Ambulance AMB-042")}
                                className={`group relative flex flex-col items-center justify-center gap-1.5 h-24 rounded-xl border-2 transition-all duration-200 font-semibold text-xs ${isDispatched("ambulance")
                                    ? "bg-red-700 border-red-700 text-white shadow-lg shadow-red-500/30"
                                    : "bg-white border-red-300 text-red-700 hover:bg-red-700 hover:text-white hover:border-red-700 hover:shadow-lg hover:shadow-red-500/20"
                                    }`}
                            >
                                <Ambulance className="w-5 h-5" />
                                <span>Dispatch Ambulance</span>
                                {isDispatched("ambulance") && <CheckCircle2 className="w-3 h-3 absolute top-2 right-2" />}
                            </button>

                            {/* Notify Family */}
                            <button
                                onClick={() => {
                                    setDispatched((prev) =>
                                        prev.find((d) => d.type === "family" as unknown)
                                            ? prev
                                            : [...prev, { type: "family" as DispatchTarget, label: "Family Notified", status: "dispatched", time: new Date().toLocaleTimeString() }]
                                    );
                                }}
                                className={`group relative flex flex-col items-center justify-center gap-1.5 h-24 rounded-xl border-2 transition-all duration-200 font-semibold text-xs ${dispatched.find((d) => d.label === "Family Notified")
                                    ? "bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-500/30"
                                    : "bg-white border-purple-200 text-purple-600 hover:bg-purple-600 hover:text-white hover:border-purple-600 hover:shadow-lg hover:shadow-purple-500/20"
                                    }`}
                            >
                                <Users className="w-5 h-5" />
                                <span>Notify Family</span>
                            </button>

                            {/* Notify Police */}
                            <button
                                onClick={() => handleDispatch("police", "Police PS-North")}
                                className={`group relative flex flex-col items-center justify-center gap-1.5 h-24 rounded-xl border-2 transition-all duration-200 font-semibold text-xs ${isDispatched("police")
                                    ? "bg-blue-700 border-blue-700 text-white shadow-lg shadow-blue-500/30"
                                    : "bg-white border-blue-200 text-blue-700 hover:bg-blue-700 hover:text-white hover:border-blue-700 hover:shadow-lg hover:shadow-blue-500/20"
                                    }`}
                            >
                                <Shield className="w-5 h-5" />
                                <span>Notify Police</span>
                                {isDispatched("police") && <CheckCircle2 className="w-3 h-3 absolute top-2 right-2" />}
                            </button>

                            {/* Notify Volunteer */}
                            <button
                                onClick={() => handleDispatch("volunteer", "Volunteer VOL-018")}
                                className={`group relative flex flex-col items-center justify-center gap-1.5 h-24 rounded-xl border-2 transition-all duration-200 font-semibold text-xs ${isDispatched("volunteer")
                                    ? "bg-green-600 border-green-600 text-white shadow-lg shadow-green-500/30"
                                    : "bg-white border-green-200 text-green-600 hover:bg-green-600 hover:text-white hover:border-green-600 hover:shadow-lg hover:shadow-green-500/20"
                                    }`}
                            >
                                <Heart className="w-5 h-5" />
                                <span>Notify Volunteer</span>
                                {isDispatched("volunteer") && <CheckCircle2 className="w-3 h-3 absolute top-2 right-2" />}
                            </button>

                            {/* Dispatch All */}
                            <button
                                onClick={handleDispatchAll}
                                disabled={dispatchAll}
                                className={`group relative flex flex-col items-center justify-center gap-1.5 h-24 rounded-xl border-2 transition-all duration-200 font-bold text-xs col-span-1 ${dispatchAll
                                    ? "bg-slate-800 border-slate-800 text-white shadow-lg shadow-slate-500/30"
                                    : "bg-white border-slate-300 text-slate-800 hover:bg-slate-800 hover:text-white hover:border-slate-800 hover:shadow-lg hover:shadow-slate-500/20"
                                    }`}
                            >
                                <Zap className="w-5 h-5" />
                                <span>Dispatch All</span>
                                {dispatchAll && <CheckCircle2 className="w-3 h-3 absolute top-2 right-2" />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>


        </div>
    );
}

// ─── Main Dashboard Page ──────────────────────────────────────────────────────
export default function DashboardPage() {
    const [reports, setReports] = useState<EmergencyNotification[]>([]);
    const [selectedReport, setSelectedReport] = useState<EmergencyNotification | null>(null);
    const [incomingAlert, setIncomingAlert] = useState<EmergencyNotification | null>(null); // ringing state
    const [isCallActive, setIsCallActive] = useState(false);
    const [photoUrl, setPhotoUrl] = useState<string | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [myStream, setMyStream] = useState<MediaStream | null>(null);
    const [isSupportMuted, setIsSupportMuted] = useState(false);
    const [isSupportCameraOff, setIsSupportCameraOff] = useState(false);
    const [callDuration, setCallDuration] = useState(0);
    const callTimerRef = useRef<NodeJS.Timeout | null>(null);

    // ── Live clock ──
    const [liveTime, setLiveTime] = useState("");
    useEffect(() => {
        const tick = () => setLiveTime(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, []);

    // ── Simulated stats (update when reports change) ──
    const totalReports = reports.length;
    const criticalCount = reports.filter((r) => r.condition === "critical").length;
    const resolvedCount = Math.max(0, totalReports - criticalCount);
    const avgResponseTime = totalReports > 0 ? (3.2 + totalReports * 0.4).toFixed(1) : "—";

    // ── Simulated live activity feed ──
    const [activityFeed] = useState([
        { id: 1, icon: "🚑", text: "AMB-042 dispatched to Sector 12", time: "2 min ago", color: "text-red-500" },
        { id: 2, icon: "👮", text: "Police PS-North alerted for road accident", time: "5 min ago", color: "text-blue-500" },
        { id: 3, icon: "💚", text: "Volunteer VOL-018 accepted assignment", time: "8 min ago", color: "text-green-500" },
        { id: 4, icon: "📞", text: "Family of Rajesh Kumar notified", time: "12 min ago", color: "text-purple-500" },
        { id: 5, icon: "✅", text: "Report #EMR-001 marked resolved", time: "18 min ago", color: "text-slate-500" },
    ]);

    // ── Unit availability ──
    const units = [
        { label: "AMB-042", type: "Ambulance", status: "en_route", location: "Sector 12" },
        { label: "AMB-019", type: "Ambulance", status: "available", location: "Base Station" },
        { label: "VOL-018", type: "Volunteer", status: "en_route", location: "MG Road" },
        { label: "VOL-007", type: "Volunteer", status: "available", location: "Nearby" },
        { label: "PS-North", type: "Police", status: "alerted", location: "North Station" },
    ];

    const router = useRouter();
    const peerRef = useRef<Peer | null>(null);

    const handleEmergencyConfirm = () => {
        // End the call and go straight to dispatch — no popup
        setIsCallActive(false);
        setIsSupportMuted(false);
        setIsSupportCameraOff(false);
        myStream?.getTracks().forEach((t) => t.stop());
        remoteStream?.getTracks().forEach((t) => t.stop());
        setMyStream(null);
        setRemoteStream(null);
        router.push("/support/dashboard/dispatch");
    };

    // Initialize PeerJS
    useEffect(() => {
        if (typeof window !== "undefined") {
            const peer = new Peer();
            peer.on("open", (id) => console.log("Dashboard Peer ID:", id));
            peer.on("call", async (call) => {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                    setMyStream(stream);
                    call.answer(stream);
                    call.on("stream", (remoteVideoStream) => {
                        setRemoteStream(remoteVideoStream);
                        setIsCallActive(true);
                    });
                    call.on("error", () => setIsCallActive(false));
                } catch (err) {
                    console.error("Failed to answer call", err);
                }
            });
            peerRef.current = peer;
            return () => { peerRef.current?.destroy(); };
        }
    }, []);

    // Listen for real-time updates — show ringing alert, wait for agent to accept
    useEffect(() => {
        const cleanup = onEmergencyNotification((notification) => {
            if (notification.type === "new_report") {
                const report = notification as EmergencyNotification;
                setReports((prev) => [report, ...prev]);
                // Show the incoming call alert (ringing UI)
                setIncomingAlert(report);
            }
        });
        return cleanup;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Accept the incoming call
    const handleAcceptAlert = () => {
        if (!incomingAlert) return;
        setSelectedReport(incomingAlert);
        setIncomingAlert(null);
        handleStartCall(incomingAlert);
    };

    // Decline / dismiss the alert
    const handleDeclineAlert = () => {
        setIncomingAlert(null);
    };

    // Manage object URLs
    useEffect(() => {
        setIsCallActive(false);
        let pUrl: string | null = null;
        let vUrl: string | null = null;
        if (selectedReport?.photo) { pUrl = URL.createObjectURL(selectedReport.photo); setPhotoUrl(pUrl); }
        else setPhotoUrl(null);
        if (selectedReport?.video) { vUrl = URL.createObjectURL(selectedReport.video); setVideoUrl(vUrl); }
        else setVideoUrl(null);
        return () => { if (pUrl) URL.revokeObjectURL(pUrl); if (vUrl) URL.revokeObjectURL(vUrl); };
    }, [selectedReport]);


    const handleStartCall = async (reportToCall: EmergencyNotification | null = null) => {
        const target = reportToCall || selectedReport;
        if (target && peerRef.current) {
            broadcastSupportReady(target.id, peerRef.current.id);
            setIsCallActive(true);
        } else {
            console.warn("Support system not ready — peer not initialized yet.");
        }
    };

    // ── Call timer ──
    useEffect(() => {
        if (isCallActive) {
            setCallDuration(0);
            callTimerRef.current = setInterval(() => setCallDuration((s) => s + 1), 1000);
        } else {
            if (callTimerRef.current) clearInterval(callTimerRef.current);
        }
        return () => { if (callTimerRef.current) clearInterval(callTimerRef.current); };
    }, [isCallActive]);

    const formatCallDuration = (s: number) =>
        `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

    // ── Mute toggle (support side) ──
    const handleToggleSupportMute = () => {
        if (!myStream) return;
        myStream.getAudioTracks().forEach((t) => { t.enabled = isSupportMuted; });
        setIsSupportMuted((m) => !m);
    };

    // ── Camera toggle (support side) ──
    const handleToggleSupportCamera = () => {
        if (!myStream) return;
        myStream.getVideoTracks().forEach((t) => { t.enabled = isSupportCameraOff; });
        setIsSupportCameraOff((c) => !c);
    };

    const handleEndCall = () => {
        setIsCallActive(false);
        setIsSupportMuted(false);
        setIsSupportCameraOff(false);
        myStream?.getTracks().forEach((t) => t.stop());
        remoteStream?.getTracks().forEach((t) => t.stop());
        setMyStream(null);
        setRemoteStream(null);
        setSelectedReport(null);
    };

    return (
        <div className="space-y-6">
            {/* ── Page Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Command Center</h1>
                    <p className="text-muted-foreground">Overview of emergency operations and active reports.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm"><Clock className="w-4 h-4 mr-2" />Shift Log</Button>
                    <Button size="sm" className="bg-brand-primary hover:bg-brand-primary/90">
                        <Ambulance className="w-4 h-4 mr-2" />Dispatch Unit
                    </Button>
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* ── WIDGETS SECTION ── */}
            {/* ══════════════════════════════════════════════════════════════ */}

            {/* ── Stat Cards Row ── */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                {/* Total Reports */}
                <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                            <div className="w-9 h-9 rounded-xl bg-brand-primary/10 flex items-center justify-center">
                                <Activity className="w-4 h-4 text-brand-primary" />
                            </div>
                            <span className="flex items-center gap-0.5 text-[10px] font-semibold text-green-600">
                                <TrendingUp className="w-3 h-3" />+{totalReports}
                            </span>
                        </div>
                        <p className="text-2xl font-bold text-foreground">{totalReports}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Total Reports</p>
                    </CardContent>
                </Card>

                {/* Critical */}
                <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                            <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center">
                                <AlertTriangle className="w-4 h-4 text-red-600" />
                            </div>
                            {criticalCount > 0 && (
                                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            )}
                        </div>
                        <p className="text-2xl font-bold text-red-600">{criticalCount}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Critical</p>
                    </CardContent>
                </Card>

                {/* Resolved */}
                <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                            <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center">
                                <CheckCheck className="w-4 h-4 text-green-600" />
                            </div>
                            <span className="flex items-center gap-0.5 text-[10px] font-semibold text-green-600">
                                <TrendingUp className="w-3 h-3" />
                            </span>
                        </div>
                        <p className="text-2xl font-bold text-green-600">{resolvedCount}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Resolved</p>
                    </CardContent>
                </Card>

                {/* Avg Response */}
                <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
                                <Timer className="w-4 h-4 text-amber-600" />
                            </div>
                            <span className="flex items-center gap-0.5 text-[10px] font-semibold text-amber-600">
                                <TrendingDown className="w-3 h-3" />-0.3m
                            </span>
                        </div>
                        <p className="text-2xl font-bold text-foreground">{avgResponseTime}<span className="text-sm font-normal text-muted-foreground">m</span></p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Avg Response</p>
                    </CardContent>
                </Card>

                {/* Active Units */}
                <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
                                <Ambulance className="w-4 h-4 text-blue-600" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-blue-600">5</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Active Units</p>
                    </CardContent>
                </Card>

                {/* Live Clock */}
                <Card className="border-0 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-slate-900 to-slate-800 text-white">
                    <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                                <Radio className="w-4 h-4 text-white animate-pulse" />
                            </div>
                            <span className="text-[10px] font-semibold text-green-400 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />LIVE
                            </span>
                        </div>
                        <p className="text-lg font-bold font-mono tracking-tight">{liveTime}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">System Time</p>
                    </CardContent>
                </Card>
            </div>

            {/* ── Middle Row: Activity Feed + Unit Status ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                {/* Live Activity Feed */}
                <Card className="border-0 shadow-sm lg:col-span-2">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <Radio className="w-4 h-4 text-brand-primary animate-pulse" />
                                Live Activity Feed
                            </CardTitle>
                            <Badge className="text-[10px] bg-green-100 text-green-700 border-0 gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />Live
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-1">
                        {[...reports.map((r, i) => ({
                            id: `r-${i}`,
                            icon: r.condition === "critical" ? "🚨" : r.condition === "injured" ? "⚠️" : "📋",
                            text: `New report from ${r.reporter} — ${r.condition} condition`,
                            time: new Date(r.timestamp).toLocaleTimeString(),
                            color: r.condition === "critical" ? "text-red-500" : r.condition === "injured" ? "text-amber-500" : "text-slate-500",
                        })), ...activityFeed].slice(0, 7).map((item) => (
                            <div key={item.id} className="flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors group">
                                <span className="text-base shrink-0 mt-0.5">{item.icon}</span>
                                <p className="text-xs text-slate-700 flex-1 leading-relaxed">{item.text}</p>
                                <span className="text-[10px] text-muted-foreground shrink-0 whitespace-nowrap">{item.time}</span>
                            </div>
                        ))}
                        {reports.length === 0 && activityFeed.length === 0 && (
                            <div className="py-8 text-center text-xs text-muted-foreground">No activity yet</div>
                        )}
                    </CardContent>
                </Card>

                {/* Unit Availability */}
                <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <Wifi className="w-4 h-4 text-brand-primary" />
                            Unit Status
                        </CardTitle>
                        <CardDescription className="text-[10px]">Real-time field unit availability</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-2">
                        {units.map((unit, i) => (
                            <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${unit.type === "Ambulance" ? "bg-red-100" :
                                    unit.type === "Police" ? "bg-blue-100" : "bg-green-100"
                                    }`}>
                                    {unit.type === "Ambulance" ? <Ambulance className="w-4 h-4 text-red-600" /> :
                                        unit.type === "Police" ? <Shield className="w-4 h-4 text-blue-600" /> :
                                            <Heart className="w-4 h-4 text-green-600" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-slate-900">{unit.label}</p>
                                    <p className="text-[10px] text-muted-foreground truncate">{unit.location}</p>
                                </div>
                                <Badge className={`text-[9px] px-1.5 py-0.5 border-0 shrink-0 ${unit.status === "available" ? "bg-green-100 text-green-700" :
                                    unit.status === "en_route" ? "bg-amber-100 text-amber-700" :
                                        "bg-blue-100 text-blue-700"
                                    }`}>
                                    {unit.status === "available" ? "Free" :
                                        unit.status === "en_route" ? "En Route" : "Alerted"}
                                </Badge>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            {/* ── Response Time Mini-Chart ── */}
            <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-brand-primary" />
                            Response Time Trend
                        </CardTitle>
                        <CardDescription className="text-[10px]">Last 7 incidents (minutes)</CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="pt-0">
                    <div className="flex items-end gap-2 h-20">
                        {[5.2, 4.8, 6.1, 3.9, 4.2, 3.5, avgResponseTime === "—" ? 4.0 : parseFloat(avgResponseTime as string)].map((val, i) => {
                            const max = 7;
                            const pct = Math.round((val / max) * 100);
                            const isLast = i === 6;
                            return (
                                <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                                    <span className="text-[9px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">{val}m</span>
                                    <div
                                        className={`w-full rounded-t-md transition-all duration-500 ${isLast ? "bg-brand-primary" :
                                            val > 5 ? "bg-red-300" :
                                                val > 4 ? "bg-amber-300" : "bg-green-400"
                                            }`}
                                        style={{ height: `${pct}%` }}
                                    />
                                    <span className="text-[9px] text-muted-foreground">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Now"][i]}</span>
                                </div>
                            );
                        })}
                    </div>
                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100">
                        <div className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-sm bg-green-400" />
                            <span className="text-[10px] text-muted-foreground">&lt; 4 min (Good)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-sm bg-amber-300" />
                            <span className="text-[10px] text-muted-foreground">4–5 min (Fair)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-sm bg-red-300" />
                            <span className="text-[10px] text-muted-foreground">&gt; 5 min (Slow)</span>
                        </div>
                        <div className="flex items-center gap-1.5 ml-auto">
                            <span className="w-3 h-3 rounded-sm bg-brand-primary" />
                            <span className="text-[10px] text-muted-foreground">Current shift</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* ── Incoming Call Alert (ringing overlay) ── */}
            {incomingAlert && !isCallActive && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-300 p-4">
                    <div className="w-full max-w-sm bg-slate-900 rounded-3xl shadow-2xl border border-white/10 overflow-hidden animate-in zoom-in-95 duration-300">

                        {/* Pulsing ring animation */}
                        <div className="relative flex flex-col items-center pt-10 pb-6 px-6 gap-5">
                            {/* Outer rings */}
                            <div className="relative flex items-center justify-center">
                                <div className="absolute w-32 h-32 rounded-full bg-red-500/10 animate-ping" style={{ animationDuration: '1.5s' }} />
                                <div className="absolute w-24 h-24 rounded-full bg-red-500/15 animate-ping" style={{ animationDuration: '1.5s', animationDelay: '0.3s' }} />
                                {/* Avatar */}
                                <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-xl shadow-red-500/40 z-10">
                                    <Phone className="w-8 h-8 text-white" />
                                </div>
                            </div>

                            {/* Incoming label */}
                            <div className="text-center space-y-1">
                                <p className="text-xs font-semibold text-red-400 uppercase tracking-widest animate-pulse">Incoming Emergency</p>
                                <h2 className="text-xl font-bold text-white">{incomingAlert.reporter}</h2>
                                <p className="text-sm text-slate-400">{incomingAlert.phone}</p>
                            </div>

                            {/* Info chips */}
                            <div className="flex flex-wrap gap-2 justify-center">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${incomingAlert.condition === 'critical'
                                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                    : incomingAlert.condition === 'injured'
                                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                        : 'bg-green-500/20 text-green-400 border border-green-500/30'
                                    }`}>
                                    {incomingAlert.condition === 'critical' ? '🚨' : incomingAlert.condition === 'injured' ? '⚠️' : '✅'} {incomingAlert.condition}
                                </span>
                                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-700 text-slate-300 border border-slate-600">
                                    <MapPin className="w-3 h-3 inline mr-1" />{incomingAlert.location.slice(0, 28)}{incomingAlert.location.length > 28 ? '…' : ''}
                                </span>
                            </div>

                            {/* Accept / Decline buttons */}
                            <div className="flex items-center gap-8 pt-2">
                                {/* Decline */}
                                <div className="flex flex-col items-center gap-2">
                                    <button
                                        onClick={handleDeclineAlert}
                                        className="w-16 h-16 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition-all active:scale-95 shadow-lg"
                                    >
                                        <PhoneOff className="w-6 h-6 text-white" />
                                    </button>
                                    <span className="text-xs text-slate-400">Decline</span>
                                </div>

                                {/* Accept */}
                                <div className="flex flex-col items-center gap-2">
                                    <button
                                        onClick={handleAcceptAlert}
                                        className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-400 flex items-center justify-center transition-all active:scale-95 shadow-xl shadow-green-500/40 animate-bounce"
                                    >
                                        <Phone className="w-6 h-6 text-white" />
                                    </button>
                                    <span className="text-xs text-green-400 font-semibold">Accept</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Fullscreen Video Call ── */}
            {selectedReport && isCallActive && (
                <div className="fixed inset-0 z-50 bg-black" style={{ display: "grid", gridTemplateRows: "1fr auto" }}>

                    {/* Remote video area */}
                    <div className="relative overflow-hidden bg-slate-950">
                        {remoteStream ? (
                            <video
                                ref={(v) => { if (v && v.srcObject !== remoteStream) v.srcObject = remoteStream; }}
                                className="absolute inset-0 w-full h-full object-cover"
                                autoPlay playsInline
                            />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-slate-900 text-slate-400 flex-col gap-4">
                                <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center animate-pulse">
                                    <Users className="w-8 h-8 opacity-40" />
                                </div>
                                <p className="text-sm">Waiting for video stream from device...</p>
                            </div>
                        )}

                        {/* HUD: top-left — LIVE badge + timer */}
                        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                            <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full">
                                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                <span className="text-xs font-semibold text-red-400 uppercase tracking-wider">Live</span>
                            </div>
                            <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full w-fit">
                                <Clock className="w-3 h-3 text-white/60" />
                                <span className="text-xs font-mono text-white/80">{formatCallDuration(callDuration)}</span>
                            </div>
                        </div>

                        {/* HUD: top-right — reporter name + status badges */}
                        <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end z-10">
                            <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full">
                                <MapPin className="w-3 h-3 text-white/60" />
                                <span className="text-xs text-white/80">{selectedReport.reporter}</span>
                            </div>
                            {isSupportMuted && (
                                <div className="flex items-center gap-1.5 bg-red-600/90 backdrop-blur-md px-2.5 py-1 rounded-full">
                                    <MicOff className="w-3 h-3 text-white" />
                                    <span className="text-[10px] font-semibold text-white">Muted</span>
                                </div>
                            )}
                            {isSupportCameraOff && (
                                <div className="flex items-center gap-1.5 bg-slate-700/90 backdrop-blur-md px-2.5 py-1 rounded-full">
                                    <VideoOff className="w-3 h-3 text-white" />
                                    <span className="text-[10px] font-semibold text-white">Cam Off</span>
                                </div>
                            )}
                        </div>

                        {/* PiP: support self-view */}
                        <div className="absolute bottom-3 right-3 w-28 h-40 bg-slate-900 rounded-xl border-2 border-white/20 shadow-2xl overflow-hidden z-10">
                            {myStream && !isSupportCameraOff ? (
                                <video
                                    ref={(v) => { if (v && v.srcObject !== myStream) v.srcObject = myStream; }}
                                    className="w-full h-full object-cover"
                                    muted playsInline autoPlay
                                />
                            ) : (
                                <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                                    <VideoOff className="w-5 h-5 text-white/30" />
                                </div>
                            )}
                            <div className="absolute bottom-1.5 left-2 text-[10px] text-white/60 bg-black/40 px-1 rounded">You</div>
                        </div>
                    </div>

                    {/* Controls bar — always visible */}
                    <div className="bg-black border-t border-white/10 px-4 py-3 flex items-center justify-center gap-5">

                        {/* Mute */}
                        <button onClick={handleToggleSupportMute} className="flex flex-col items-center gap-1">
                            <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${isSupportMuted ? "bg-red-600 shadow-lg shadow-red-500/30" : "bg-white/10 hover:bg-white/20"
                                }`}>
                                {isSupportMuted ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5 text-white" />}
                            </div>
                            <span className="text-[10px] text-white/50">{isSupportMuted ? "Unmute" : "Mute"}</span>
                        </button>

                        {/* Camera */}
                        <button onClick={handleToggleSupportCamera} className="flex flex-col items-center gap-1">
                            <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${isSupportCameraOff ? "bg-slate-600" : "bg-white/10 hover:bg-white/20"
                                }`}>
                                {isSupportCameraOff ? <VideoOff className="w-5 h-5 text-white" /> : <Video className="w-5 h-5 text-white" />}
                            </div>
                            <span className="text-[10px] text-white/50">{isSupportCameraOff ? "Show Cam" : "Hide Cam"}</span>
                        </button>

                        {/* End Call */}
                        <button onClick={handleEndCall} className="flex flex-col items-center gap-1">
                            <div className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center shadow-xl shadow-red-500/40 transition-all active:scale-95">
                                <PhoneOff className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-[10px] text-white/50">End Call</span>
                        </button>

                        {/* Confirm Emergency → redirect to dispatch page */}
                        <button onClick={handleEmergencyConfirm} className="flex flex-col items-center gap-1">
                            <div className="w-11 h-11 rounded-full bg-green-600 hover:bg-green-700 flex items-center justify-center shadow-lg transition-all active:scale-95">
                                <CheckCircle2 className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-[10px] text-white/50">Confirm</span>
                        </button>

                    </div>
                </div>
            )}

            {/* ── Reports Table ── */}

            <Card className="border-0 shadow-sm">
                <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-base">Recent Reports</CardTitle>
                            <CardDescription className="text-xs">Live emergency reports from the field</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                                <Input placeholder="Search..." className="pl-8 h-8 text-xs w-48" />
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {reports.length === 0 ? (
                        <div className="py-16 text-center">
                            <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                                <Activity className="w-8 h-8 text-muted-foreground/40" />
                            </div>
                            <p className="text-sm font-medium text-muted-foreground">No reports yet</p>
                            <p className="text-xs text-muted-foreground/60 mt-1">Reports will appear here when submitted via the QR form</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="text-xs">Reporter</TableHead>
                                    <TableHead className="text-xs">Condition</TableHead>
                                    <TableHead className="text-xs hidden md:table-cell">Location</TableHead>
                                    <TableHead className="text-xs hidden sm:table-cell">Time</TableHead>
                                    <TableHead className="text-xs text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {reports.map((report) => (
                                    <TableRow key={report.id} className="cursor-pointer hover:bg-muted/30" onClick={() => setSelectedReport(report)}>
                                        <TableCell className="font-medium text-sm">{report.reporter}</TableCell>
                                        <TableCell>
                                            <Badge variant={report.condition === "critical" ? "destructive" : report.condition === "injured" ? "secondary" : "outline"} className={`text-[10px] ${report.condition === "injured" ? "bg-amber-100 text-amber-800 hover:bg-amber-100" : ""}`}>
                                                {report.condition}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground hidden md:table-cell max-w-[200px] truncate">{report.location}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground hidden sm:table-cell">{new Date(report.timestamp).toLocaleTimeString()}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="w-4 h-4" /></Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div >
    );
}
