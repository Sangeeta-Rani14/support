"use client";

import { useState } from "react";
import {
    Settings, User, Bell, Shield, Users, Globe, Smartphone,
    Save, Eye, EyeOff, Mail, Phone, Building, Clock, Zap, Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// ─── Types ────────────────────────────────────────────────────────────────────
type TabKey = "profile" | "notifications" | "team" | "security" | "integrations";

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
    { key: "profile", label: "Profile", icon: User },
    { key: "notifications", label: "Notifications", icon: Bell },
    { key: "team", label: "Team", icon: Users },
    { key: "security", label: "Security", icon: Shield },
    { key: "integrations", label: "Integrations", icon: Zap },
];

// ─── Toggle component ─────────────────────────────────────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <button
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            className={`relative w-10 h-5.5 h-[22px] rounded-full transition-colors ${checked ? "bg-brand-primary" : "bg-gray-200"}`}
        >
            <span
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`}
            />
        </button>
    );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
    return (
        <div className="space-y-4">
            <div>
                <h3 className="text-sm font-semibold text-foreground">{title}</h3>
                {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
            </div>
            {children}
            <Separator className="opacity-50" />
        </div>
    );
}

// ─── Profile Tab ──────────────────────────────────────────────────────────────
function ProfileTab() {
    const [saved, setSaved] = useState(false);
    const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };
    return (
        <div className="space-y-6">
            <Section title="Personal Information" description="Update your name, contact details, and role.">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                        { label: "Full Name", placeholder: "Admin User", icon: User },
                        { label: "Email", placeholder: "admin@jansetu.gov.in", icon: Mail },
                        { label: "Phone", placeholder: "+91 98765 43210", icon: Phone },
                        { label: "Department", placeholder: "Emergency Response Unit", icon: Building },
                    ].map(({ label, placeholder, icon: Icon }) => (
                        <div key={label}>
                            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{label}</label>
                            <div className="relative">
                                <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                                <Input defaultValue="" placeholder={placeholder} className="pl-9 h-9 text-sm" />
                            </div>
                        </div>
                    ))}
                </div>
            </Section>
            <Section title="Shift Settings">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Shift Start</label>
                        <div className="relative">
                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                            <Input type="time" defaultValue="08:00" className="pl-9 h-9 text-sm" />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Shift End</label>
                        <div className="relative">
                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                            <Input type="time" defaultValue="20:00" className="pl-9 h-9 text-sm" />
                        </div>
                    </div>
                </div>
            </Section>
            <Button onClick={handleSave} className="gap-2 bg-brand-primary hover:bg-brand-primary/90 text-white">
                {saved ? <><Check className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Changes</>}
            </Button>
        </div>
    );
}

// ─── Notifications Tab ────────────────────────────────────────────────────────
function NotificationsTab() {
    const [prefs, setPrefs] = useState({
        newEmergency: true,
        dispatch: true,
        volunteerResponse: true,
        callIncoming: true,
        dailyReport: false,
        smsAlerts: true,
        emailAlerts: false,
        browserPush: true,
        soundAlerts: true,
    });

    const toggle = (key: keyof typeof prefs) => setPrefs((p) => ({ ...p, [key]: !p[key] }));

    const rows: { key: keyof typeof prefs; label: string; desc: string }[] = [
        { key: "newEmergency", label: "New Emergency Report", desc: "Alert when a new EMR form is submitted" },
        { key: "dispatch", label: "Dispatch Confirmed", desc: "Notify when a unit is dispatched" },
        { key: "volunteerResponse", label: "Volunteer Response", desc: "When a volunteer confirms their vehicle" },
        { key: "callIncoming", label: "Incoming Video Call", desc: "Incoming call from EMR reporter" },
        { key: "dailyReport", label: "Daily Summary Email", desc: "End-of-day incident summary" },
        { key: "smsAlerts", label: "SMS Alerts", desc: "Critical alerts via SMS" },
        { key: "emailAlerts", label: "Email Alerts", desc: "All alerts forwarded to email" },
        { key: "browserPush", label: "Browser Push", desc: "Push notifications when tab is in background" },
        { key: "soundAlerts", label: "Sound Alerts", desc: "Audio ping for new emergencies" },
    ];

    return (
        <div className="space-y-1">
            {rows.map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between py-3 border-b border-border/30 last:border-0">
                    <div>
                        <p className="text-sm font-medium text-foreground">{label}</p>
                        <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                    <Toggle checked={prefs[key]} onChange={() => toggle(key)} />
                </div>
            ))}
        </div>
    );
}

// ─── Team Tab ─────────────────────────────────────────────────────────────────
const TEAM = [
    { name: "Admin User", email: "admin@jansetu.gov.in", role: "Operator", status: "online" },
    { name: "Rajesh Kumar", email: "rajesh@jansetu.gov.in", role: "Supervisor", status: "online" },
    { name: "Neha Singh", email: "neha@jansetu.gov.in", role: "Operator", status: "offline" },
    { name: "Arjun Patel", email: "arjun@jansetu.gov.in", role: "Volunteer Coordinator", status: "away" },
];

function TeamTab() {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{TEAM.length} members</p>
                <Button size="sm" className="text-xs bg-brand-primary hover:bg-brand-primary/90 text-white gap-1.5">
                    <Users className="w-3.5 h-3.5" /> Invite Member
                </Button>
            </div>
            <div className="bg-white rounded-xl border border-border/60 overflow-hidden">
                {TEAM.map((m, i) => (
                    <div key={m.email} className={`flex items-center gap-3 p-4 ${i < TEAM.length - 1 ? "border-b border-border/30" : ""}`}>
                        <div className="w-9 h-9 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold text-sm flex-shrink-0">
                            {m.name.split(" ").map(n => n[0]).join("")}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">{m.name}</p>
                            <p className="text-xs text-muted-foreground">{m.email}</p>
                        </div>
                        <Badge variant="secondary" className="text-[10px] capitalize">{m.role}</Badge>
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${m.status === "online" ? "bg-emerald-500" : m.status === "away" ? "bg-amber-500" : "bg-gray-300"}`} />
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Security Tab ─────────────────────────────────────────────────────────────
function SecurityTab() {
    const [showPass, setShowPass] = useState(false);
    const [saved, setSaved] = useState(false);
    return (
        <div className="space-y-6">
            <Section title="Change Password">
                <div className="space-y-3 max-w-sm">
                    {["Current Password", "New Password", "Confirm New Password"].map((label) => (
                        <div key={label}>
                            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{label}</label>
                            <div className="relative">
                                <Input type={showPass ? "text" : "password"} placeholder="••••••••" className="pr-10 h-9 text-sm" />
                                <button className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPass(!showPass)}>
                                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </Section>
            <Section title="Two-Factor Authentication" description="Add an extra layer of security to your account.">
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50">
                    <div>
                        <p className="text-sm font-medium">Authenticator App</p>
                        <p className="text-xs text-muted-foreground">Use Google Authenticator or Authy</p>
                    </div>
                    <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px]">Not Enabled</Badge>
                </div>
                <Button variant="outline" size="sm" className="gap-2 text-xs"><Smartphone className="w-3.5 h-3.5" /> Enable 2FA</Button>
            </Section>
            <Button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }} className="gap-2 bg-brand-primary hover:bg-brand-primary/90 text-white">
                {saved ? <><Check className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Update Password</>}
            </Button>
        </div>
    );
}

// ─── Integrations Tab ─────────────────────────────────────────────────────────
const INTEGRATIONS = [
    { name: "Police Control Room", desc: "Delhi Police API · Auto-dispatch on critical", status: "connected", icon: Shield },
    { name: "CATS Ambulance", desc: "Centralised Accident & Trauma Services", status: "connected", icon: Zap },
    { name: "Volunteer Network", desc: "Jan Setu volunteer microservice (SSE)", status: "connected", icon: Globe },
    { name: "Family Alert SMS", desc: "Twilio SMS gateway for family notifications", status: "disconnected", icon: Smartphone },
    { name: "Fire Station API", desc: "Delhi Fire Service dispatch", status: "disconnected", icon: Zap },
];

function IntegrationsTab() {
    return (
        <div className="space-y-3">
            {INTEGRATIONS.map(({ name, desc, status, icon: Icon }) => (
                <div key={name} className="flex items-center gap-3 p-4 bg-white rounded-xl border border-border/60 hover:shadow-sm transition-shadow">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${status === "connected" ? "bg-emerald-100 text-emerald-600" : "bg-gray-100 text-gray-400"}`}>
                        <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">{name}</p>
                        <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${status === "connected" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                            {status === "connected" ? "Connected" : "Disconnected"}
                        </span>
                        <Button variant="outline" size="sm" className="text-xs h-7">
                            {status === "connected" ? "Configure" : "Connect"}
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<TabKey>("profile");

    const tabContent: Record<TabKey, React.ReactNode> = {
        profile: <ProfileTab />,
        notifications: <NotificationsTab />,
        team: <TeamTab />,
        security: <SecurityTab />,
        integrations: <IntegrationsTab />,
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center">
                    <Settings className="w-5 h-5 text-brand-primary" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-foreground">Settings</h1>
                    <p className="text-sm text-muted-foreground">Manage your account, team, and integrations</p>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Tab sidebar */}
                <nav className="flex-shrink-0 lg:w-44 flex lg:flex-col gap-1 overflow-x-auto">
                    {TABS.map(({ key, label, icon: Icon }) => (
                        <button
                            key={key}
                            onClick={() => setActiveTab(key)}
                            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap text-left ${activeTab === key
                                ? "bg-brand-primary text-white shadow-sm"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                                }`}
                        >
                            <Icon className="w-4 h-4 flex-shrink-0" />
                            {label}
                        </button>
                    ))}
                </nav>

                {/* Content pane */}
                <div className="flex-1 min-w-0 bg-white rounded-xl border border-border/60 p-6">
                    {tabContent[activeTab]}
                </div>
            </div>
        </div>
    );
}
