import { MapPin, Video } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SupportWaitingScreenProps {
  gps: string;
  onCancel: () => void;
}

export default function SupportWaitingScreen({ gps, onCancel }: SupportWaitingScreenProps) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-4 text-white">
      <div className="w-full max-w-md text-center space-y-8 animate-in fade-in zoom-in duration-500">
        {/* Pulsing Avatar/Icon */}
        <div className="relative mx-auto w-32 h-32 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping"></div>
          <div className="absolute inset-0 rounded-full bg-red-500/10 animate-pulse delay-75"></div>
          <div className="relative w-24 h-24 rounded-full bg-slate-900 border-2 border-red-500/50 flex items-center justify-center z-10 shadow-[0_0_40px_rgba(239,68,68,0.3)]">
            <Video className="w-10 h-10 text-red-500 animate-pulse" />
          </div>
          {/* Connecting dots */}
          <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-bounce delay-0"></div>
            <div className="w-2 h-2 rounded-full bg-red-500 animate-bounce delay-150"></div>
            <div className="w-2 h-2 rounded-full bg-red-500 animate-bounce delay-300"></div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent">
            Connecting to Support...
          </h2>
          <p className="text-slate-400 max-w-xs mx-auto text-lg leading-relaxed">
            Please hold. An emergency support agent is joining to assess your situation.
          </p>
        </div>

        <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-xl p-4 max-w-sm mx-auto">
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-full bg-brand-primary/20 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-brand-primary" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase font-semibold">Live Location Shared</p>
              <p className="text-sm font-mono text-white truncate">{gps || "Locating..."}</p>
            </div>
          </div>
        </div>

        <Button
          onClick={onCancel}
          variant="ghost"
          className="text-slate-500 hover:text-white hover:bg-slate-800"
        >
          Cancel Request
        </Button>
      </div>
    </div>
  );
}

