"use client";

import { useState, useEffect } from "react";
import {
    FileText, AlertTriangle, CheckCircle2, Clock, Search,
    Filter, Download, Eye, MapPin, ChevronRight, Ambulance,
    Shield, Users, Activity, TrendingUp, TrendingDown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// ─── Types ────────────────────────────────────────────────────────────────────
type ReportStatus = "confirmed" | "dispatched" | "resolved" | "dismissed";
type Condition = "critical" | "injured" | "stable";

interface IncidentReport {
    id: string;
    reporter: string;
    phone: string;
    location: string;
    condition: Condition;
    type: string;
    status: ReportStatus;
    createdAt: string;
    resolvedAt?: string;
    dispatchedUnits: string[];
    notes: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_REPORTS: IncidentReport[] = [
    {
        id: "EMR-2024-0192",
        reporter: "Rahul Sharma",
        phone: "+91 98765 43210",
        location: "Connaught Place, New Delhi",
        condition: "critical",
        type: "Medical Emergency",
        status: "resolved",
        createdAt: "2026-02-19T08:14:00Z",
        resolvedAt: "2026-02-19T08:47:00Z",
        dispatchedUnits: ["Ambulance", "Police"],
        notes: "Cardiac arrest. CPR administered on site. Transported to AIIMS.",
    },
    {
        id: "EMR-2024-0191",
        reporter: "Priya Mehta",
        phone: "+91 87654 32109",
        location: "Karol Bagh Metro Station",
        condition: "injured",
        type: "Accident",
        status: "dispatched",
        createdAt: "2026-02-19T09:30:00Z",
        dispatchedUnits: ["Ambulance", "Traffic Police"],
        notes: "Two-wheeler collision. Minor head injury. Conscious and breathing.",
    },
    {
        id: "EMR-2024-0190",
        reporter: "Amit Verma",
        phone: "+91 76543 21098",
        location: "Lajpat Nagar Market",
        condition: "stable",
        type: "Fire Incident",
        status: "confirmed",
        createdAt: "2026-02-19T10:05:00Z",
        dispatchedUnits: [],
        notes: "Small fire in market stall. Self-contained but assistance requested.",
    },
    {
        id: "EMR-2024-0189",
        reporter: "Sunita Rao",
        phone: "+91 65432 10987",
        location: "Dwarka Sector 12",
        condition: "critical",
        type: "Medical Emergency",
        status: "resolved",
        createdAt: "2026-02-18T15:20:00Z",
        resolvedAt: "2026-02-18T16:10:00Z",
        dispatchedUnits: ["Ambulance", "Family"],
        notes: "Stroke suspected. Immediate transport arranged.",
    },
    {
        id: "EMR-2024-0188",
        reporter: "Vikram Singh",
        phone: "+91 54321 09876",
        location: "India Gate, New Delhi",
        condition: "stable",
        type: "Missing Person",
        status: "dismissed",
        createdAt: "2026-02-18T12:00:00Z",
        dispatchedUnits: [],
        notes: "Person found after 20 min. False alarm.",
    },
    {
        id: "EMR-2024-0187",
        reporter: "Deepika Jain",
        phone: "+91 43210 98765",
        location: "Rohini Sector 3",
        condition: "injured",
        type: "Domestic Violence",
        status: "resolved",
        createdAt: "2026-02-18T09:45:00Z",
        resolvedAt: "2026-02-18T11:30:00Z",
        dispatchedUnits: ["Police", "Family"],
        notes: "Police responded. Victim taken to shelter.",
    },
];

// ─── Helper components ────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: ReportStatus }) {
    const map: Record<ReportStatus, { label: string; cls: string }> = {
        confirmed: { label: "Confirmed", cls: "bg-amber-100 text-amber-700 border-amber-200" },
        dispatched: { label: "Dispatched", cls: "bg-blue-100 text-blue-700 border-blue-200" },
        resolved: { label: "Resolved", cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
        dismissed: { label: "Dismissed", cls: "bg-gray-100 text-gray-500 border-gray-200" },
    };
    const { label, cls } = map[status];
    return (
        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cls}`}>
            {label}
        </span>
    );
}

function ConditionDot({ condition }: { condition: Condition }) {
    const cls = condition === "critical" ? "bg-red-500" : condition === "injured" ? "bg-amber-500" : "bg-emerald-500";
    return <span className={`w-2 h-2 rounded-full ${cls} flex-shrink-0`} />;
}

function StatCard({ label, value, icon: Icon, trend, color }: {
    label: string; value: string | number; icon: React.ElementType;
    trend?: string; color: string;
}) {
    return (
        <div className="bg-white rounded-xl border border-border/60 p-4 flex items-start gap-3 hover:shadow-sm transition-shadow">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
                <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-2xl font-bold text-foreground leading-none">{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                {trend && (
                    <p className="text-[10px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" /> {trend}
                    </p>
                )}
            </div>
        </div>
    );
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────
function ReportModal({ report, onClose }: { report: IncidentReport; onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="h-1.5 bg-gradient-to-r from-brand-primary to-blue-500" />
                <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <p className="text-xs font-mono text-muted-foreground">{report.id}</p>
                            <h2 className="text-lg font-bold text-foreground mt-0.5">{report.type}</h2>
                        </div>
                        <StatusBadge status={report.status} />
                    </div>
                    <div className="space-y-3 text-sm">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <p className="text-[10px] uppercase text-muted-foreground font-semibold">Reporter</p>
                                <p className="font-medium text-foreground mt-0.5">{report.reporter}</p>
                                <p className="text-xs text-muted-foreground">{report.phone}</p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase text-muted-foreground font-semibold">Condition</p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <ConditionDot condition={report.condition} />
                                    <p className="font-medium capitalize">{report.condition}</p>
                                </div>
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase text-muted-foreground font-semibold">Location</p>
                            <div className="flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                                <p className="font-medium">{report.location}</p>
                            </div>
                        </div>
                        {report.dispatchedUnits.length > 0 && (
                            <div>
                                <p className="text-[10px] uppercase text-muted-foreground font-semibold">Dispatched Units</p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {report.dispatchedUnits.map((u) => (
                                        <span key={u} className="text-[11px] bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded-full font-medium">{u}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                        {report.notes && (
                            <div className="bg-muted/40 rounded-lg p-3">
                                <p className="text-[10px] uppercase text-muted-foreground font-semibold mb-1">Notes</p>
                                <p className="text-xs text-foreground">{report.notes}</p>
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                            <div>
                                <span className="text-[10px] uppercase font-semibold">Reported</span>
                                <p className="mt-0.5">{new Date(report.createdAt).toLocaleString("en-IN")}</p>
                            </div>
                            {report.resolvedAt && (
                                <div>
                                    <span className="text-[10px] uppercase font-semibold">Resolved</span>
                                    <p className="mt-0.5">{new Date(report.resolvedAt).toLocaleString("en-IN")}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="px-6 pb-6">
                    <Button variant="outline" className="w-full" onClick={onClose}>Close</Button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ReportsPage() {
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<ReportStatus | "all">("all");
    const [selected, setSelected] = useState<IncidentReport | null>(null);

    const filtered = MOCK_REPORTS.filter((r) => {
        const matchSearch =
            r.id.toLowerCase().includes(search.toLowerCase()) ||
            r.reporter.toLowerCase().includes(search.toLowerCase()) ||
            r.location.toLowerCase().includes(search.toLowerCase()) ||
            r.type.toLowerCase().includes(search.toLowerCase());
        const matchFilter = filter === "all" || r.status === filter;
        return matchSearch && matchFilter;
    });

    const stats = {
        total: MOCK_REPORTS.length,
        critical: MOCK_REPORTS.filter((r) => r.condition === "critical").length,
        resolved: MOCK_REPORTS.filter((r) => r.status === "resolved").length,
        dispatched: MOCK_REPORTS.filter((r) => r.status === "dispatched").length,
    };

    const filters: { label: string; value: ReportStatus | "all" }[] = [
        { label: "All", value: "all" },
        { label: "Confirmed", value: "confirmed" },
        { label: "Dispatched", value: "dispatched" },
        { label: "Resolved", value: "resolved" },
        { label: "Dismissed", value: "dismissed" },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-foreground">Incident Reports</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">Full log of all emergency submissions</p>
                </div>
                <Button variant="outline" size="sm" className="gap-2 text-xs">
                    <Download className="w-3.5 h-3.5" /> Export CSV
                </Button>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard label="Total Reports" value={stats.total} icon={FileText} color="bg-brand-primary/10 text-brand-primary" trend="+2 today" />
                <StatCard label="Critical" value={stats.critical} icon={AlertTriangle} color="bg-red-100 text-red-600" />
                <StatCard label="Resolved" value={stats.resolved} icon={CheckCircle2} color="bg-emerald-100 text-emerald-600" trend="83% rate" />
                <StatCard label="In Progress" value={stats.dispatched} icon={Activity} color="bg-blue-100 text-blue-600" />
            </div>

            {/* Search + Filter */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by ID, name, location, type..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 h-9 text-sm"
                    />
                </div>
                <div className="flex gap-1 flex-wrap">
                    {filters.map((f) => (
                        <button
                            key={f.value}
                            onClick={() => setFilter(f.value)}
                            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all border ${filter === f.value
                                ? "bg-brand-primary text-white border-brand-primary"
                                : "bg-white text-muted-foreground border-border/60 hover:border-brand-primary/40"
                                }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table/List */}
            <div className="bg-white rounded-xl border border-border/60 overflow-hidden">
                {/* Table header */}
                <div className="hidden sm:grid grid-cols-[1fr_1fr_1fr_auto_auto_auto] gap-4 px-4 py-2.5 bg-muted/30 border-b border-border/40 text-[10px] font-semibold uppercase text-muted-foreground">
                    <span>Reporter / ID</span>
                    <span>Location</span>
                    <span>Type</span>
                    <span>Condition</span>
                    <span>Status</span>
                    <span>Action</span>
                </div>

                {filtered.length === 0 ? (
                    <div className="p-12 text-center">
                        <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground font-medium">No reports found</p>
                        <p className="text-xs text-muted-foreground mt-1">Try a different search or filter</p>
                    </div>
                ) : (
                    filtered.map((report, i) => (
                        <div
                            key={report.id}
                            className={`grid sm:grid-cols-[1fr_1fr_1fr_auto_auto_auto] gap-3 sm:gap-4 px-4 py-3.5 items-center hover:bg-muted/20 transition-colors cursor-pointer ${i < filtered.length - 1 ? "border-b border-border/30" : ""}`}
                            onClick={() => setSelected(report)}
                        >
                            <div>
                                <p className="text-xs font-semibold text-foreground">{report.reporter}</p>
                                <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{report.id}</p>
                            </div>
                            <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                                <span className="text-xs text-foreground truncate">{report.location}</span>
                            </div>
                            <span className="text-xs text-foreground">{report.type}</span>
                            <div className="flex items-center gap-1.5">
                                <ConditionDot condition={report.condition} />
                                <span className="text-xs capitalize hidden sm:block">{report.condition}</span>
                            </div>
                            <StatusBadge status={report.status} />
                            <button className="flex items-center gap-1 text-[11px] text-brand-primary font-medium hover:underline">
                                <Eye className="w-3.5 h-3.5" />
                                <span className="hidden sm:block">View</span>
                            </button>
                        </div>
                    ))
                )}
            </div>

            <p className="text-[11px] text-muted-foreground text-center">
                Showing {filtered.length} of {MOCK_REPORTS.length} reports · Last updated {new Date().toLocaleTimeString("en-IN")}
            </p>

            {/* Detail modal */}
            {selected && <ReportModal report={selected} onClose={() => setSelected(null)} />}
        </div>
    );
}
