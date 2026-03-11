'use client';

import { useEffect, useState, useCallback } from "react";
import {
    Activity, AlertTriangle, CheckCircle2, Clock,
    Phone, RefreshCw, User, FileText, Image as ImageIcon, Video,
    ChevronLeft, ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getEmrSubmissions, type EmrSubmissionItem } from "@/lib/api";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function conditionLabel(condition?: string) {
    if (!condition) return { text: "Unknown", color: "bg-slate-100 text-slate-600" };
    const lc = condition.toLowerCase();
    if (lc.includes("critical")) return { text: "Critical", color: "bg-red-100 text-red-700" };
    if (lc.includes("injured") || lc.includes("bleeding"))
        return { text: "Injured", color: "bg-amber-100 text-amber-700" };
    if (lc.includes("stable") || lc.includes("conscious")) return { text: "Stable", color: "bg-green-100 text-green-700" };
    return { text: condition.length > 20 ? condition.slice(0, 20) + "…" : condition, color: "bg-blue-100 text-blue-700" };
}

function formatRelativeTime(isoString: string) {
    const diff = Date.now() - new Date(isoString).getTime();
    const mins = Math.floor(diff / 60_000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (mins > 0) return `${mins}m ago`;
    return "Just now";
}

function shortId(id: string) {
    return `#${id.slice(-6).toUpperCase()}`;
}

// ─── Submission Row Card ──────────────────────────────────────────────────────

function SubmissionCard({ item, index }: { item: EmrSubmissionItem; index: number }) {
    const cond = conditionLabel(item.victimCondition?.currentCondition);
    const hasPhoto = !!(item.evidenceCapture?.photoUrl && !item.evidenceCapture.photoUrl.startsWith("["));
    const hasVideo = !!(item.evidenceCapture?.videoUrl && !item.evidenceCapture.videoUrl.startsWith("["));

    return (
        <div
            className="group flex items-start gap-3 px-4 py-3.5 rounded-xl border border-slate-100 bg-white hover:border-brand-primary/20 hover:shadow-sm transition-all duration-200"
            style={{ animationDelay: `${index * 40}ms` }}
        >
            {/* Index badge */}
            <div className="shrink-0 w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 mt-0.5 group-hover:bg-brand-primary/10 group-hover:text-brand-primary transition-colors">
                {index + 1}
            </div>

            {/* Main info */}
            <div className="flex-1 min-w-0 space-y-1.5">
                {/* Top row */}
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-800 font-mono">{shortId(item._id)}</span>
                    <Badge className={`text-[9px] px-1.5 py-0 border-0 font-semibold ${cond.color}`}>
                        {cond.text}
                    </Badge>
                    {item.source && (
                        <span className="text-[10px] text-muted-foreground bg-slate-50 border border-slate-200 px-1.5 py-0 rounded font-mono">
                            {item.source}
                        </span>
                    )}
                </div>

                {/* Reporter row */}
                <div className="flex items-center gap-3 flex-wrap">
                    {item.reporterInfo?.fullName && (
                        <span className="flex items-center gap-1 text-[11px] text-slate-700">
                            <User className="w-3 h-3 text-brand-primary shrink-0" />
                            {item.reporterInfo.fullName}
                        </span>
                    )}
                    {item.reporterInfo?.mobile && (
                        <span className="flex items-center gap-1 text-[11px] text-slate-500 font-mono">
                            <Phone className="w-3 h-3 shrink-0" />
                            {item.reporterInfo.mobile}
                        </span>
                    )}
                </div>

                {/* Notes */}
                {item.victimCondition?.additionalNotes && item.victimCondition.additionalNotes !== "" && item.victimCondition.additionalNotes !== "none" && (
                    <p className="text-[11px] text-slate-500 line-clamp-1 flex items-start gap-1">
                        <FileText className="w-3 h-3 mt-0.5 shrink-0" />
                        {item.victimCondition.additionalNotes}
                    </p>
                )}

                {/* Evidence tags */}
                {(hasPhoto || hasVideo) && (
                    <div className="flex items-center gap-1.5">
                        {hasPhoto && (
                            <span className="flex items-center gap-1 text-[9px] bg-purple-50 text-purple-600 border border-purple-100 px-1.5 py-0.5 rounded font-medium">
                                <ImageIcon className="w-2.5 h-2.5" /> Photo
                            </span>
                        )}
                        {hasVideo && (
                            <span className="flex items-center gap-1 text-[9px] bg-blue-50 text-blue-600 border border-blue-100 px-1.5 py-0.5 rounded font-medium">
                                <Video className="w-2.5 h-2.5" /> Video
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Time */}
            <div className="shrink-0 text-right space-y-1">
                <p className="text-[10px] text-muted-foreground font-medium whitespace-nowrap">
                    {formatRelativeTime(item.createdAt)}
                </p>
                <p className="text-[9px] text-muted-foreground/60 whitespace-nowrap">
                    {new Date(item.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit", month: "short", year: "numeric"
                    })}
                </p>
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

export default function EmrRecentSubmissions() {
    const [items, setItems] = useState<EmrSubmissionItem[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0); // 0-based skip pages
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

    const fetchData = useCallback(async (currentPage: number) => {
        setLoading(true);
        setError(null);
        try {
            const res = await getEmrSubmissions(PAGE_SIZE, currentPage * PAGE_SIZE);
            // Sort newest first (API already returns newest first, but enforce it)
            const sorted = [...res.items].sort(
                (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            setItems(sorted);
            setTotal(res.total);
            setLastRefreshed(new Date());
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to load submissions");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData(page);
    }, [page, fetchData]);

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    return (
        <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <Activity className="w-4 h-4 text-brand-primary" />
                            Recent EMR Submissions
                        </CardTitle>
                        {total > 0 && (
                            <Badge className="text-[10px] bg-brand-primary/10 text-brand-primary border-0">
                                {total} total
                            </Badge>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {lastRefreshed && (
                            <span className="text-[10px] text-muted-foreground hidden sm:flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {lastRefreshed.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                        )}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => fetchData(page)}
                            disabled={loading}
                            title="Refresh"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="pt-0">
                {/* Error state */}
                {error && (
                    <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <p>{error}</p>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="ml-auto text-red-600 hover:text-red-700 h-7 text-xs"
                            onClick={() => fetchData(page)}
                        >
                            Retry
                        </Button>
                    </div>
                )}

                {/* Loading skeleton */}
                {loading && !error && (
                    <div className="space-y-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" style={{ opacity: 1 - i * 0.15 }} />
                        ))}
                    </div>
                )}

                {/* Submission list */}
                {!loading && !error && (
                    <>
                        {items.length === 0 ? (
                            <div className="py-12 text-center">
                                <div className="w-14 h-14 rounded-full bg-muted mx-auto mb-3 flex items-center justify-center">
                                    <CheckCircle2 className="w-7 h-7 text-muted-foreground/40" />
                                </div>
                                <p className="text-sm font-medium text-muted-foreground">No submissions found</p>
                                <p className="text-xs text-muted-foreground/60 mt-1">EMR form submissions will appear here</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {items.map((item, i) => (
                                    <SubmissionCard key={item._id} item={item} index={page * PAGE_SIZE + i} />
                                ))}
                            </div>
                        )}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 text-[11px] text-muted-foreground">
                                <span>
                                    Showing <span className="font-semibold">{page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)}</span> of{" "}
                                    <span className="font-semibold">{total}</span>
                                </span>
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                                        disabled={page === 0}
                                    >
                                        <ChevronLeft className="w-3.5 h-3.5" />
                                    </Button>
                                    <span className="px-2">
                                        Page <span className="font-semibold">{page + 1}</span> of {totalPages}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                                        disabled={page >= totalPages - 1}
                                    >
                                        <ChevronRight className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
}
