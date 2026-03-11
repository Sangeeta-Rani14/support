'use client';

import { memo } from "react";
import { MapPin, Phone, PhoneOff } from "lucide-react";
import type { EmergencyNotification } from "@/lib/emergency-channel";

interface IncomingAlertOverlayProps {
  alert: EmergencyNotification;
  onAccept: () => void;
  onDecline: () => void;
}

function IncomingAlertOverlayComponent({
  alert,
  onAccept,
  onDecline,
}: IncomingAlertOverlayProps) {
  const conditionChipClasses =
    alert.condition === "critical"
      ? "bg-red-500/20 text-red-400 border border-red-500/30"
      : alert.condition === "injured"
      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
      : "bg-green-500/20 text-green-400 border border-green-500/30";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-300 p-4">
      <div className="w-full max-w-sm bg-slate-900 rounded-3xl shadow-2xl border border-white/10 overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="relative flex flex-col items-center pt-10 pb-6 px-6 gap-5">
          <div className="relative flex items-center justify-center">
            <div
              className="absolute w-32 h-32 rounded-full bg-red-500/10 animate-ping"
              style={{ animationDuration: "1.5s" }}
            />
            <div
              className="absolute w-24 h-24 rounded-full bg-red-500/15 animate-ping"
              style={{ animationDuration: "1.5s", animationDelay: "0.3s" }}
            />
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-xl shadow-red-500/40 z-10">
              <Phone className="w-8 h-8 text-white" />
            </div>
          </div>

          <div className="text-center space-y-1">
            <p className="text-xs font-semibold text-red-400 uppercase tracking-widest animate-pulse">
              Incoming Emergency
            </p>
            <h2 className="text-xl font-bold text-white">{alert.reporter}</h2>
            <p className="text-sm text-slate-400">{alert.phone}</p>
          </div>

          <div className="flex flex-wrap gap-2 justify-center">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${conditionChipClasses}`}
            >
              {alert.condition === "critical"
                ? "🚨"
                : alert.condition === "injured"
                ? "⚠️"
                : "✅"}{" "}
              {alert.condition}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-700 text-slate-300 border border-slate-600">
              <MapPin className="w-3 h-3 inline mr-1" />
              {alert.location.slice(0, 28)}
              {alert.location.length > 28 ? "…" : ""}
            </span>
          </div>

          <div className="flex items-center gap-8 pt-2">
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={onDecline}
                className="w-16 h-16 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition-all active:scale-95 shadow-lg"
              >
                <PhoneOff className="w-6 h-6 text-white" />
              </button>
              <span className="text-xs text-slate-400">Decline</span>
            </div>

            <div className="flex flex-col items-center gap-2">
              <button
                onClick={onAccept}
                className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-400 flex items-center justify-center transition-all active:scale-95 shadow-xl shadow-green-500/40 animate-bounce"
              >
                <Phone className="w-6 h-6 text-white" />
              </button>
              <span className="text-xs text-green-400 font-semibold">
                Accept
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const IncomingAlertOverlay = memo(IncomingAlertOverlayComponent);

export default IncomingAlertOverlay;

