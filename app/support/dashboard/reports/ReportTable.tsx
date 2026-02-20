"use client";

import { useState } from "react";
import { Eye, MapPin, FileText, Search, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { IncidentReport, ReportStatus } from "./shared";

// ─── Helpers ──────────────────────────────────────────────────────────────────
export function StatusBadge({ status }: { status: ReportStatus }) {
    const map: Record<ReportStatus, { label: string; cls: string }> = {
        confirmed: { label: "Confirmed", cls: "bg-amber-100 text-amber-700 border-amber-200" },
        dispatched: { label: "Dispatched", cls: "bg-blue-100 text-blue-700 border-blue-200" },
        resolved: { label: "Resolved", cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
        dismissed: { label: "Dismissed", cls: "bg-gray-100 text-gray-500 border-gray-200" },
    };
    const { label, cls } = map[status];
    return (
        <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cls}`}>
            {label}
        </span>
    );
}

export function ConditionDot({ condition }: { condition: string }) {
    const cls = condition === "critical" ? "bg-red-500" : condition === "injured" ? "bg-amber-500" : "bg-emerald-500";
    return <span className={`w-2 h-2 rounded-full ${cls} flex-shrink-0`} />;
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────
function ReportModal({ report, onClose }: { report: IncidentReport; onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="h-1.5 bg-gradient-to-r from-brand-primary to-blue-500" />
                <div className="p-6 space-y-4">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-xs font-mono text-muted-foreground">{report.id}</p>
                            <h2 className="text-lg font-bold text-foreground mt-0.5">{report.type}</h2>
                        </div>
                        <StatusBadge status={report.status} />
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                            <p className="text-[10px] uppercase text-muted-foreground font-semibold">Reporter</p>
                            <p className="font-medium mt-0.5">{report.reporter}</p>
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
                            <p className="text-sm font-medium">{report.location}</p>
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
                <div className="px-6 pb-6">
                    <Button variant="outline" className="w-full" onClick={onClose}>Close</Button>
                </div>
            </div>
        </div>
    );
}

// ─── Reusable Table ───────────────────────────────────────────────────────────
export default function ReportTable({ reports, title, subtitle }: {
    reports: IncidentReport[];
    title: string;
    subtitle: string;
}) {
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState<IncidentReport | null>(null);

    const filtered = reports.filter((r) =>
        r.id.toLowerCase().includes(search.toLowerCase()) ||
        r.reporter.toLowerCase().includes(search.toLowerCase()) ||
        r.location.toLowerCase().includes(search.toLowerCase()) ||
        r.type.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-foreground">{title}</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
                </div>
                <Button variant="outline" size="sm" className="gap-2 text-xs">
                    <Download className="w-3.5 h-3.5" /> Export CSV
                </Button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                    placeholder="Search by ID, reporter, location, type..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 h-9 text-sm"
                />
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-border/60 overflow-hidden">
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
                        <p className="text-xs text-muted-foreground mt-1">Try a different search</p>
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
                                <span className="text-xs truncate">{report.location}</span>
                            </div>
                            <span className="text-xs">{report.type}</span>
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
                Showing {filtered.length} of {reports.length} reports
            </p>

            {selected && <ReportModal report={selected} onClose={() => setSelected(null)} />}
        </div>
    );
}
