'use client';

import { memo, useMemo } from "react";
import { TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface ResponseTimeChartProps {
  avgResponseTime: string;
}

function ResponseTimeChartComponent({ avgResponseTime }: ResponseTimeChartProps) {
  const data = useMemo(() => {
    const base = [5.2, 4.8, 6.1, 3.9, 4.2, 3.5];
    const current =
      avgResponseTime === "—" ? 4.0 : parseFloat(avgResponseTime as string);
    return [...base, current];
  }, [avgResponseTime]);

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-brand-primary" />
            Response Time Trend
          </CardTitle>
          <CardDescription className="text-[10px]">
            Last 7 incidents (minutes)
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-end gap-2 h-20">
          {data.map((val, i) => {
            const max = 7;
            const pct = Math.round((val / max) * 100);
            const isLast = i === data.length - 1;
            return (
              <div
                key={i}
                className="flex-1 flex flex-col items-center gap-1 group"
              >
                <span className="text-[9px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                  {val}m
                </span>
                <div
                  className={`w-full rounded-t-md transition-all duration-500 ${
                    isLast
                      ? "bg-brand-primary"
                      : val > 5
                      ? "bg-red-300"
                      : val > 4
                      ? "bg-amber-300"
                      : "bg-green-400"
                  }`}
                  style={{ height: `${pct}%` }}
                />
                <span className="text-[9px] text-muted-foreground">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Now"][i]}
                </span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-green-400" />
            <span className="text-[10px] text-muted-foreground">
              &lt; 4 min (Good)
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-amber-300" />
            <span className="text-[10px] text-muted-foreground">
              4–5 min (Fair)
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-red-300" />
            <span className="text-[10px] text-muted-foreground">
              &gt; 5 min (Slow)
            </span>
          </div>
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="w-3 h-3 rounded-sm bg-brand-primary" />
            <span className="text-[10px] text-muted-foreground">
              Current shift
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const ResponseTimeChart = memo(ResponseTimeChartComponent);

export default ResponseTimeChart;

