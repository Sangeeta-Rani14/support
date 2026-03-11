import { Loader2, CheckCircle2, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { UserProfile } from "@/lib/emergency-channel";

interface EmrTopSectionProps {
  gps: string;
  gpsStatus: "detecting" | "found" | "error";
  callError: string | null;
  onClearCallError: () => void;
  fetchingUser: boolean;
  userFetchError: string | null;
  userProfile: UserProfile | null;
}

export default function EmrTopSection({
  gps,
  gpsStatus,
  callError,
  onClearCallError,
  fetchingUser,
  userFetchError,
  userProfile,
}: EmrTopSectionProps) {
  return (
    <>
      {/* Emergency Header Banner */}
      <div className="bg-gradient-to-r from-brand-emergency to-red-700 text-white">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          {/* Pulsing emergency icon */}
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center animate-pulse-emergency">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Emergency Report</h1>
            <p className="text-red-100 text-xs">Jan Setu Support — Quick response system</p>
          </div>
        </div>
      </div>

      {/* GPS Status Bar */}
      <div className="max-w-2xl mx-auto px-4 mt-3">
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
            gpsStatus === "found"
              ? "bg-brand-success/10 text-brand-success"
              : gpsStatus === "error"
              ? "bg-brand-error/10 text-brand-error"
              : "bg-brand-info/10 text-brand-info"
          }`}
        >
          <div
            className={`w-2 h-2 rounded-full ${
              gpsStatus === "found"
                ? "bg-brand-success"
                : gpsStatus === "error"
                ? "bg-brand-error"
                : "bg-brand-info animate-pulse"
            }`}
          />
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>
            {gpsStatus === "found"
              ? `Location locked: ${gps}`
              : gpsStatus === "error"
              ? `Location: ${gps}`
              : "Detecting your location..."}
          </span>
        </div>
      </div>

      {/* Inline error banner — replaces all browser alert() popups */}
      {callError && (
        <div className="max-w-2xl mx-auto px-4 mt-3">
          <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl animate-in slide-in-from-top-2 fade-in">
            <span className="text-red-500 text-base shrink-0">⚠️</span>
            <p className="text-sm text-red-700 font-medium flex-1">{callError}</p>
            <button onClick={onClearCallError} className="text-red-400 hover:text-red-600 text-xs font-bold">
              ✕
            </button>
          </div>
        </div>
      )}

      {/* User Profile Banner (shown when fetched from QR scan) */}
      {fetchingUser && (
        <div className="max-w-2xl mx-auto px-4 mt-3">
          <div className="flex items-center gap-3 px-4 py-3 bg-brand-primary/5 border border-brand-primary/15 rounded-xl">
            <Loader2 className="w-4 h-4 text-brand-primary animate-spin" />
            <p className="text-sm text-brand-primary font-medium">Fetching user details from QR code...</p>
          </div>
        </div>
      )}

      {userFetchError && (
        <div className="max-w-2xl mx-auto px-4 mt-3">
          <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
            <span className="text-amber-500 text-sm">⚠️</span>
            <p className="text-sm text-amber-700">{userFetchError}</p>
          </div>
        </div>
      )}

      {userProfile && !fetchingUser && (
        <div className="max-w-2xl mx-auto px-4 mt-3">
          <div className="flex items-center gap-4 px-4 py-3 bg-brand-success/5 border border-brand-success/20 rounded-xl animate-slide-up">
            <div className="w-10 h-10 rounded-full bg-brand-success/20 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-brand-success" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-brand-success font-semibold uppercase tracking-wider">
                User Identified via QR Scan
              </p>
              <p className="text-sm font-medium text-foreground">
                {userProfile.name} · {userProfile.bloodGroup} · Scanner: {userProfile.scannerNumber}
              </p>
            </div>
            <Badge className="bg-brand-success/10 text-brand-success border-brand-success/20 text-[10px]" variant="outline">
              Verified
              <User className="w-2.5 h-2.5 ml-1" />
            </Badge>
          </div>
        </div>
      )}
    </>
  );
}

