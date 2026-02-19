"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    FileText,
    MapPin,
    Settings,
    Bell,
    LogOut,
    Menu,
    X,
    Shield,
    AlertTriangle,
    Zap,
    Radio,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { useState, useEffect, useCallback } from "react";
import {
    onEmergencyNotification,
    EmergencyNotification,
    CallStartedNotification,
    SupportReadyNotification,
} from "@/lib/emergency-channel";

const sidebarLinks = [
    {
        label: "Dashboard",
        href: "/support/dashboard",
        icon: LayoutDashboard,
    },
    {
        label: "Dispatch Control",
        href: "/support/dashboard/dispatch",
        icon: Zap,
    },
    {
        label: "Reports",
        href: "/support/dashboard/reports",
        icon: FileText,
    },
    {
        label: "Live Map",
        href: "/support/dashboard/map",
        icon: MapPin,
    },
    {
        label: "Settings",
        href: "/support/dashboard/settings",
        icon: Settings,
    },
    {
        label: "Channel Monitor",
        href: "/support/channal",
        icon: Radio,
    },
];

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [notificationCount, setNotificationCount] = useState(3);
    const [recentNotifications, setRecentNotifications] = useState<
        EmergencyNotification[]
    >([]);
    const [showNotifPanel, setShowNotifPanel] = useState(false);

    // Listen for emergency notifications from the EMR form
    const handleNotification = useCallback(
        (notification: EmergencyNotification | CallStartedNotification | SupportReadyNotification) => {
            if (notification.type !== "new_report") return; // ignore call_started / support_ready
            setNotificationCount((prev) => prev + 1);
            setRecentNotifications((prev) => [notification, ...prev].slice(0, 10));


            // Play notification sound (browser built-in)
            try {
                const audioCtx = new AudioContext();
                const oscillator = audioCtx.createOscillator();
                const gainNode = audioCtx.createGain();
                oscillator.connect(gainNode);
                gainNode.connect(audioCtx.destination);
                oscillator.frequency.value = 880;
                oscillator.type = "sine";
                gainNode.gain.value = 0.3;
                oscillator.start();
                gainNode.gain.exponentialRampToValueAtTime(
                    0.01,
                    audioCtx.currentTime + 0.5
                );
                oscillator.stop(audioCtx.currentTime + 0.5);
            } catch {
                // Audio not supported
            }

            // Show toast notification
            toast.custom(
                () => (
                    <div className="w-[360px] bg-white rounded-xl shadow-2xl border border-brand-emergency/20 overflow-hidden animate-slide-up">
                        {/* Red top bar */}
                        <div className="h-1 bg-gradient-to-r from-brand-emergency to-red-500" />
                        <div className="p-4">
                            <div className="flex items-start gap-3">
                                {/* Icon */}
                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-brand-emergency/10 flex items-center justify-center animate-pulse-emergency">
                                    <AlertTriangle className="h-5 w-5 text-brand-emergency" />
                                </div>
                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-bold text-foreground">
                                            🚨 New Emergency Report
                                        </p>
                                        <Badge
                                            className={`text-[9px] px-1.5 py-0 h-4 border-0 ${notification.condition === "critical"
                                                ? "bg-brand-emergency text-white"
                                                : notification.condition === "injured"
                                                    ? "bg-brand-warning text-white"
                                                    : "bg-brand-success text-white"
                                                }`}
                                        >
                                            {notification.condition.toUpperCase()}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        <span className="font-semibold text-foreground">
                                            {notification.reporter}
                                        </span>{" "}
                                        reported an emergency
                                    </p>
                                    <div className="flex items-center gap-1 mt-1.5">
                                        <MapPin className="h-3 w-3 text-muted-foreground" />
                                        <span className="text-[10px] text-muted-foreground truncate">
                                            {notification.location}
                                        </span>
                                    </div>
                                    {notification.notes && (
                                        <p className="text-[10px] text-muted-foreground mt-1 bg-muted/50 rounded px-2 py-1 truncate">
                                            &ldquo;{notification.notes}&rdquo;
                                        </p>
                                    )}
                                    <div className="flex items-center gap-2 mt-2.5">
                                        <span className="text-[10px] font-mono text-muted-foreground">
                                            {notification.id}
                                        </span>
                                        <span className="text-muted-foreground text-[10px]">·</span>
                                        <span className="text-[10px] text-muted-foreground">
                                            Just now
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ),
                {
                    duration: 8000,
                    position: "top-right",
                }
            );
        },
        []
    );

    useEffect(() => {
        const cleanup = onEmergencyNotification(handleNotification);
        return cleanup;
    }, [handleNotification]);

    return (
        <div className="flex min-h-screen bg-[#FAFAFA]">
            {/* Sonner Toaster for notifications */}
            <Toaster
                position="top-right"
                toastOptions={{
                    style: {
                        background: "transparent",
                        border: "none",
                        boxShadow: "none",
                        padding: 0,
                    },
                }}
            />

            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed z-50 inset-y-0 left-0 w-64 bg-white border-r border-border/60 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                {/* Logo */}
                <div className="px-5 py-5 flex items-center justify-between">
                    <Link href="/support/dashboard" className="flex items-center gap-3">
                        <Image
                            src="/jan-setu-logo.png"
                            alt="Jan Setu"
                            width={36}
                            height={36}
                            className="rounded-lg"
                        />
                        <div>
                            <p className="text-sm font-bold text-foreground tracking-tight leading-none">
                                Jan Setu
                            </p>
                            <p className="text-[10px] text-brand-primary font-medium">
                                Support Dashboard
                            </p>
                        </div>
                    </Link>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden h-8 w-8"
                        onClick={() => setSidebarOpen(false)}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                <Separator className="opacity-50" />

                {/* Navigation */}
                <nav className="flex-1 px-3 py-4 space-y-1">
                    {sidebarLinks.map((link) => {
                        const isActive = pathname === link.href;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setSidebarOpen(false)}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${isActive
                                    ? "bg-brand-primary text-white shadow-md shadow-brand-primary/25"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                    }`}
                            >
                                <link.icon
                                    className={`h-4 w-4 ${isActive
                                        ? "text-white"
                                        : "text-muted-foreground group-hover:text-brand-primary"
                                        }`}
                                />
                                {link.label}
                                {link.label === "Reports" && (
                                    <Badge className="ml-auto text-[10px] px-1.5 py-0 h-5 bg-brand-emergency text-white border-0">
                                        {notificationCount}
                                    </Badge>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom section */}
                <div className="px-3 pb-4 space-y-2">
                    <Separator className="opacity-50 mb-3" />
                    <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-brand-primary/5 border border-brand-primary/10">
                        <Shield className="h-4 w-4 text-brand-primary" />
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-foreground truncate">
                                Admin Panel
                            </p>
                            <p className="text-[10px] text-muted-foreground">Full access</p>
                        </div>
                    </div>
                    <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-brand-emergency hover:bg-brand-emergency/5 transition-all w-full">
                        <LogOut className="h-4 w-4" />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top header */}
                <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-border/60">
                    <div className="flex items-center justify-between px-4 sm:px-6 h-14">
                        {/* Mobile menu button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="lg:hidden h-9 w-9"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <Menu className="h-5 w-5" />
                        </Button>

                        {/* Search (desktop) */}
                        <div className="hidden lg:flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-1.5 w-72 border border-border/50">
                            <svg
                                className="h-4 w-4 text-muted-foreground"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                            </svg>
                            <input
                                placeholder="Search reports, locations..."
                                className="bg-transparent text-sm outline-none w-full text-foreground placeholder:text-muted-foreground"
                            />
                        </div>

                        {/* Right side */}
                        <div className="flex items-center gap-3">
                            {/* Notifications bell */}
                            <div className="relative">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="relative h-9 w-9"
                                    onClick={() => setShowNotifPanel(!showNotifPanel)}
                                >
                                    <Bell className="h-4 w-4 text-muted-foreground" />
                                    {notificationCount > 0 && (
                                        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-brand-emergency text-white text-[9px] font-bold flex items-center justify-center border-2 border-white px-1">
                                            {notificationCount > 9 ? "9+" : notificationCount}
                                        </span>
                                    )}
                                </Button>

                                {/* Notification dropdown */}
                                {showNotifPanel && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-40"
                                            onClick={() => setShowNotifPanel(false)}
                                        />
                                        <div className="absolute right-0 top-12 z-50 w-80 bg-white rounded-xl shadow-2xl border border-border/60 overflow-hidden animate-slide-up">
                                            <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
                                                <p className="text-sm font-bold text-foreground">
                                                    Notifications
                                                </p>
                                                <Badge
                                                    variant="secondary"
                                                    className="text-[10px] bg-brand-emergency/10 text-brand-emergency"
                                                >
                                                    {recentNotifications.length} new
                                                </Badge>
                                            </div>
                                            <div className="max-h-80 overflow-y-auto">
                                                {recentNotifications.length === 0 ? (
                                                    <div className="p-6 text-center">
                                                        <Bell className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                                                        <p className="text-xs text-muted-foreground">
                                                            No new notifications
                                                        </p>
                                                    </div>
                                                ) : (
                                                    recentNotifications.map((notif, i) => (
                                                        <div
                                                            key={notif.id + i}
                                                            className="px-4 py-3 border-b border-border/30 hover:bg-muted/30 transition-colors cursor-pointer"
                                                        >
                                                            <div className="flex items-start gap-2.5">
                                                                <div className="w-8 h-8 rounded-full bg-brand-emergency/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                                    <AlertTriangle className="h-3.5 w-3.5 text-brand-emergency" />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-xs font-semibold text-foreground">
                                                                        {notif.reporter}
                                                                    </p>
                                                                    <p className="text-[10px] text-muted-foreground mt-0.5">
                                                                        Reported emergency —{" "}
                                                                        <span
                                                                            className={`font-semibold ${notif.condition === "critical"
                                                                                ? "text-brand-emergency"
                                                                                : notif.condition === "injured"
                                                                                    ? "text-amber-600"
                                                                                    : "text-brand-success"
                                                                                }`}
                                                                        >
                                                                            {notif.condition}
                                                                        </span>
                                                                    </p>
                                                                    <div className="flex items-center gap-1 mt-1">
                                                                        <MapPin className="h-2.5 w-2.5 text-muted-foreground" />
                                                                        <span className="text-[10px] text-muted-foreground truncate">
                                                                            {notif.location}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <span className="text-[9px] text-muted-foreground flex-shrink-0">
                                                                    now
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                            {recentNotifications.length > 0 && (
                                                <div className="px-4 py-2.5 border-t border-border/50">
                                                    <button
                                                        className="text-xs font-medium text-brand-primary hover:text-brand-primary-dark transition-colors w-full text-center"
                                                        onClick={() => {
                                                            setShowNotifPanel(false);
                                                            setNotificationCount(0);
                                                        }}
                                                    >
                                                        Mark all as read
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>

                            <Separator orientation="vertical" className="h-6 opacity-50" />

                            {/* User */}
                            <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8 border-2 border-brand-primary/20">
                                    <AvatarFallback className="bg-brand-primary/10 text-brand-primary text-xs font-bold">
                                        AD
                                    </AvatarFallback>
                                </Avatar>
                                <div className="hidden sm:block">
                                    <p className="text-xs font-semibold text-foreground leading-none">
                                        Admin
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">Operator</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 p-4 sm:p-6">{children}</main>
            </div>
        </div>
    );
}
