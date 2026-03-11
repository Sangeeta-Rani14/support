import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefObject } from "react";

interface EvidenceCaptureCardProps {
  recording: boolean;
  recordingProgress: number;
  videoBlob: Blob | null;
  liveVideoRef: RefObject<HTMLVideoElement | null>;
  onStartRecording: () => void;
  /** Called whenever the user selects (or clears) a photo file */
  onPhotoChange: (file: File | null) => void;
}

export default function EvidenceCaptureCard({
  recording,
  recordingProgress,
  videoBlob,
  liveVideoRef,
  onStartRecording,
  onPhotoChange,
}: EvidenceCaptureCardProps) {
  return (
    <Card className="opacity-0 animate-slide-up stagger-1 border-0 shadow-lg shadow-black/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center text-xs font-bold">
            1
          </span>
          Evidence Capture
        </CardTitle>
        <CardDescription className="text-xs">Capture photo and video evidence of the emergency</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Photo */}
        <div className="space-y-2">
          <Label htmlFor="photo" className="text-sm font-medium">
            Capture Photo
          </Label>
          <div className="relative">
            <Input
              id="photo"
              type="file"
              name="photo"
              accept="image/*"
              className="file:mr-3 file:px-3 file:py-1 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-brand-primary/10 file:text-brand-primary hover:file:bg-brand-primary/20 cursor-pointer"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                onPhotoChange(file);
              }}
            />
          </div>
        </div>

        {/* Video */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Record Video <span className="text-muted-foreground font-normal">(30 seconds)</span>
          </Label>

          {recording && (
            <div className="space-y-2">
              {/* Live camera preview */}
              <div className="relative w-full rounded-xl overflow-hidden bg-black border border-brand-emergency/30 shadow-md">
                <video
                  ref={liveVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full max-h-64 object-cover"
                />
                {/* REC badge */}
                <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[11px] font-bold text-white uppercase tracking-wider">REC</span>
                </div>
                {/* Timer */}
                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-full">
                  <span className="text-[11px] font-mono text-white">
                    {Math.round((recordingProgress / 100) * 30)}s / 30s
                  </span>
                </div>
              </div>
              {/* Progress bar */}
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-emergency rounded-full transition-all duration-100"
                  style={{ width: `${recordingProgress}%` }}
                />
              </div>
            </div>
          )}

          {videoBlob && !recording && (
            <div className="flex items-center gap-2 px-3 py-2 bg-brand-success/10 rounded-lg">
              <svg className="w-4 h-4 text-brand-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-xs text-brand-success font-medium">Video recorded successfully</span>
            </div>
          )}

          <Button
            type="button"
            onClick={onStartRecording}
            disabled={recording}
            variant={recording ? "destructive" : "outline"}
            className={`w-full ${!recording ? "border-brand-primary/30 text-brand-primary hover:bg-brand-primary/5 hover:text-brand-primary" : ""
              }`}
          >
            {recording ? (
              <>
                <span className="w-2 h-2 rounded-full bg-white animate-pulse mr-2" />
                Recording...
              </>
            ) : videoBlob ? (
              "Re-record Video"
            ) : (
              "Start Recording"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
