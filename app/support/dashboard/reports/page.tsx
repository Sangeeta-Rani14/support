"use client";

import Link from "next/link";
import {
    Ambulance, Shield, Zap, FileText,
    AlertTriangle, CheckCircle2, Activity, ChevronRight,
} from "lucide-react";
import { MOCK_REPORTS, filterByCategory } from "./shared";

// ─── category cards ───────────────────────────────────────────────────────────
const CATEGORIES = [
    {
        label: "All Reports",
        description: "Every emergency submission across all categories",
        href: "/support/dashboard/reports/all",
        icon: FileText,
        color: "bg-brand-primary/10 text-brand-primary",
        border: "border-brand-primary/20 hover:border-brand-primary",
        badge: "bg-brand-primary/10 text-brand-primary",
        count: () => MOCK_REPORTS.length,
    },
    {
        label: "Ambulance Reports",
        description: "Incidents where ambulance was dispatched",
        href: "/support/dashboard/reports/ambulance",
        icon: Ambulance,
        color: "bg-red-100 text-red-600",
        border: "border-red-200 hover:border-red-400",
        badge: "bg-red-100 text-red-600",
        count: () => filterByCategory(MOCK_REPORTS, "ambulance").length,
    },
    {
        label: "Police Reports",
        description: "Incidents involving police notification",
        href: "/support/dashboard/reports/police",
        icon: Shield,
        color: "bg-blue-100 text-blue-700",
        border: "border-blue-200 hover:border-blue-400",
        badge: "bg-blue-100 text-blue-700",
        count: () => filterByCategory(MOCK_REPORTS, "police").length,
    },
    {
        label: "Dispatch Control",
        description: "Reports with active or completed unit dispatches",
        href: "/support/dashboard/reports/dispatch",
        icon: Zap,
        color: "bg-amber-100 text-amber-700",
        border: "border-amber-200 hover:border-amber-400",
        badge: "bg-amber-100 text-amber-700",
        count: () => filterByCategory(MOCK_REPORTS, "dispatch").length,
    },
];

// ─── Stats ────────────────────────────────────────────────────────────────────
const stats = [
    { label: "Total Reports", value: MOCK_REPORTS.length, icon: FileText, color: "bg-brand-primary/10 text-brand-primary" },
    { label: "Critical", value: MOCK_REPORTS.filter((r) => r.condition === "critical").length, icon: AlertTriangle, color: "bg-red-100 text-red-600" },
    { label: "Resolved", value: MOCK_REPORTS.filter((r) => r.status === "resolved").length, icon: CheckCircle2, color: "bg-emerald-100 text-emerald-600" },
    { label: "In Progress", value: MOCK_REPORTS.filter((r) => r.status === "dispatched").length, icon: Activity, color: "bg-blue-100 text-blue-600" },
];

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ReportsHubPage() {
    return (
        <div className="space-y-7">
            {/* Header */}
            <div>
                <h1 className="text-xl font-bold text-foreground">Incident Reports</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                    Browse reports by category or select a view below
                </p>
            </div>

            {/* Stat bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {stats.map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="bg-white rounded-xl border border-border/60 p-4 flex items-center gap-3 hover:shadow-sm transition-shadow">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
                            <Icon className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-xl font-bold text-foreground leading-none">{value}</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Category cards */}
            <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Browse by Category
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                    {CATEGORIES.map(({ label, description, href, icon: Icon, color, border, badge, count }) => (
                        <Link
                            key={href}
                            href={href}
                            className={`group flex items-center gap-4 p-5 bg-white rounded-2xl border-2 transition-all duration-200 shadow-sm hover:shadow-md ${border}`}
                        >
                            {/* Icon */}
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color} transition-transform group-hover:scale-110 duration-200`}>
                                <Icon className="w-6 h-6" />
                            </div>

                            {/* Text */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className="font-bold text-foreground text-sm">{label}</p>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge}`}>
                                        {count()}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                            </div>

                            {/* Arrow */}
                            <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform group-hover:translate-x-1 duration-200" />
                        </Link>
                    ))}
                </div>
            </div>

            {/* Recent reports strip */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recent Activity</p>
                    <Link href="/support/dashboard/reports/all" className="text-xs text-brand-primary font-medium hover:underline flex items-center gap-1">
                        View all <ChevronRight className="w-3 h-3" />
                    </Link>
                </div>
                <div className="bg-white rounded-xl border border-border/60 overflow-hidden divide-y divide-border/30">
                    {MOCK_REPORTS.slice(0, 4).map((r) => (
                        <div key={r.id} className="flex items-center gap-4 px-4 py-3 hover:bg-muted/20 transition-colors">
                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${r.condition === "critical" ? "bg-red-500" : r.condition === "injured" ? "bg-amber-500" : "bg-emerald-500"}`} />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-foreground truncate">{r.type} — {r.reporter}</p>
                                <p className="text-[10px] text-muted-foreground font-mono">{r.id} · {r.location}</p>
                            </div>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${r.status === "resolved" ? "bg-emerald-100 text-emerald-700 border-emerald-200" : r.status === "dispatched" ? "bg-blue-100 text-blue-700 border-blue-200" : r.status === "confirmed" ? "bg-amber-100 text-amber-700 border-amber-200" : "bg-gray-100 text-gray-500 border-gray-200"}`}>
                                {r.status}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
