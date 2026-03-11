"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
    Activity, Ambulance, Clock,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmergencyNotification, onEmergencyNotification } from "@/lib/emergency-channel";

import StatsRow from "./_components/StatsRow";
import ActivityAndUnitsRow from "./_components/ActivityAndUnitsRow";
import ResponseTimeChart from "./_components/ResponseTimeChart";
const ReportsTableWithPagination = dynamic(() => import("./_components/ReportsTableWithPagination"));
const EmrRecentSubmissions = dynamic(() => import("./_components/EmrRecentSubmissions"));

// ─── Main Dashboard Page ──────────────────────────────────────────────────────
export default function DashboardPage() {
    const [reports, setReports] = useState<EmergencyNotification[]>([]);
    const [selectedReport, setSelectedReport] = useState<EmergencyNotification | null>(null);

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

    // Listen for real-time updates — update reports list
    useEffect(() => {
        const cleanup = onEmergencyNotification((notification) => {
            if (notification.type === "new_report") {
                const report = notification as EmergencyNotification;
                setReports((prev) => [report, ...prev]);
            }
        });
        return cleanup;
    }, []);

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

            <StatsRow
                totalReports={totalReports}
                criticalCount={criticalCount}
                resolvedCount={resolvedCount}
                avgResponseTime={avgResponseTime as string}
                liveTime={liveTime}
            />

            <ActivityAndUnitsRow reports={reports} activityFeed={activityFeed} />

            <ResponseTimeChart avgResponseTime={avgResponseTime as string} />

            {/* ── Recent EMR Submissions (from API) ── */}
            <EmrRecentSubmissions />

            <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                    <ReportsTableWithPagination
                        reports={reports}
                        onSelectReport={setSelectedReport}
                    />
                </CardContent>
            </Card>
        </div >
    );
}
