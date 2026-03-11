'use client';

import { memo } from "react";
import {
  Activity,
  AlertTriangle,
  Ambulance,
  CheckCheck,
  Radio,
  Timer,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatsRowProps {
  totalReports: number;
  criticalCount: number;
  resolvedCount: number;
  avgResponseTime: string;
  liveTime: string;
}

function StatsRowComponent({
  totalReports,
  criticalCount,
  resolvedCount,
  avgResponseTime,
  liveTime,
}: StatsRowProps) {
  return (
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
          <p className="text-2xl font-bold text-foreground">
            {avgResponseTime}
            <span className="text-sm font-normal text-muted-foreground">m</span>
          </p>
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
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              LIVE
            </span>
          </div>
          <p className="text-lg font-bold font-mono tracking-tight">{liveTime}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">System Time</p>
        </CardContent>
      </Card>
    </div>
  );
}

const StatsRow = memo(StatsRowComponent);

export default StatsRow;

