'use client';

import { memo, useMemo } from "react";
import { Ambulance, Heart, MapPin, Radio, Shield, Wifi } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { EmergencyNotification } from "@/lib/emergency-channel";

interface ActivityItem {
  id: string | number;
  icon: string;
  text: string;
  time: string;
  color: string;
}

interface ActivityAndUnitsRowProps {
  reports: EmergencyNotification[];
  activityFeed: ActivityItem[];
}

const UNITS = [
  { label: "AMB-042", type: "Ambulance", status: "en_route", location: "Sector 12" },
  { label: "AMB-019", type: "Ambulance", status: "available", location: "Base Station" },
  { label: "VOL-018", type: "Volunteer", status: "en_route", location: "MG Road" },
  { label: "VOL-007", type: "Volunteer", status: "available", location: "Nearby" },
  { label: "PS-North", type: "Police", status: "alerted", location: "North Station" },
] as const;

function ActivityAndUnitsRowComponent({
  reports,
  activityFeed,
}: ActivityAndUnitsRowProps) {
  const combinedFeed = useMemo<ActivityItem[]>(() => {
    const reportItems: ActivityItem[] = reports.map((r, i) => ({
      id: `r-${i}`,
      icon: r.condition === "critical" ? "🚨" : r.condition === "injured" ? "⚠️" : "📋",
      text: `New report from ${r.reporter} — ${r.condition} condition`,
      time: new Date(r.timestamp).toLocaleTimeString(),
      color:
        r.condition === "critical"
          ? "text-red-500"
          : r.condition === "injured"
          ? "text-amber-500"
          : "text-slate-500",
    }));

    return [...reportItems, ...activityFeed].slice(0, 7);
  }, [reports, activityFeed]);

  return (
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
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Live
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-1">
          {combinedFeed.map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors group"
            >
              <span className="text-base shrink-0 mt-0.5">{item.icon}</span>
              <p className="text-xs text-slate-700 flex-1 leading-relaxed">
                {item.text}
              </p>
              <span className="text-[10px] text-muted-foreground shrink-0 whitespace-nowrap">
                {item.time}
              </span>
            </div>
          ))}
          {reports.length === 0 && activityFeed.length === 0 && (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No activity yet
            </div>
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
          <CardDescription className="text-[10px]">
            Real-time field unit availability
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          {UNITS.map((unit) => (
            <div
              key={unit.label}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100"
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  unit.type === "Ambulance"
                    ? "bg-red-100"
                    : unit.type === "Police"
                    ? "bg-blue-100"
                    : "bg-green-100"
                }`}
              >
                {unit.type === "Ambulance" ? (
                  <Ambulance className="w-4 h-4 text-red-600" />
                ) : unit.type === "Police" ? (
                  <Shield className="w-4 h-4 text-blue-600" />
                ) : (
                  <Heart className="w-4 h-4 text-green-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900">{unit.label}</p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {unit.location}
                </p>
              </div>
              <Badge
                className={`text-[9px] px-1.5 py-0.5 border-0 shrink-0 ${
                  unit.status === "available"
                    ? "bg-green-100 text-green-700"
                    : unit.status === "en_route"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                {unit.status === "available"
                  ? "Free"
                  : unit.status === "en_route"
                  ? "En Route"
                  : "Alerted"}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

const ActivityAndUnitsRow = memo(ActivityAndUnitsRowComponent);

export default ActivityAndUnitsRow;

