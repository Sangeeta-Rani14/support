"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  broadcastEmergency,
  onEmergencyNotification,
  CallStartedNotification,
  EmergencyNotification,
  SupportReadyNotification,
  fetchUserDetails,
  UserProfile,
} from "@/lib/emergency-channel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Video, Mic, MicOff, VideoOff, PhoneOff, MapPin, RotateCcw, Loader2, Clock, CheckCircle2, User } from "lucide-react";
import Peer from "peerjs";

// ─── Inner component that uses useSearchParams ───────────────────────────────
function EmergencyFormContent() {
  const [gps, setGps] = useState<string>("Detecting...");
  const [gpsStatus, setGpsStatus] = useState<"detecting" | "found" | "error">("detecting");
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(0);
  const [condition, setCondition] = useState<string>("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reportId, setReportId] = useState<string | null>(null);
  const [incomingCall, setIncomingCall] = useState(false);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [myStream, setMyStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0); // seconds
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [callError, setCallError] = useState<string | null>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  const activeCallRef = useRef<ReturnType<Peer["call"]> | null>(null);
  const router = useRouter();

  // OTP State
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

  // User profile from QR scan
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [fetchingUser, setFetchingUser] = useState(false);
  const [userFetchError, setUserFetchError] = useState<string | null>(null);

  // Form fields (pre-filled from user profile)
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [accidentType, setAccidentType] = useState("");

  const searchParams = useSearchParams();
  const userId = searchParams.get("userId");

  // ─── fetchUserDetails: called on QR scan (userId in URL param) ────────────
  useEffect(() => {
    if (!userId) return;

    const loadUserDetails = async () => {
      setFetchingUser(true);
      setUserFetchError(null);
      try {
        const profile = await fetchUserDetails(userId);
        if (profile) {
          setUserProfile(profile);
          setName(profile.name);
          setMobile(profile.mobile);
        } else {
          setUserFetchError("User not found. Please fill in your details manually.");
        }
      } catch {
        setUserFetchError("Failed to fetch user details. Please fill in manually.");
      } finally {
        setFetchingUser(false);
      }
    };

    loadUserDetails();
  }, [userId]);

  const handleSendOtp = () => {
    setOtpSent(true);
    // In production: call backend to send real OTP
    // For testing, OTP is 1234 — shown inline below the input
  };

  const handleVerifyOtp = () => {
    if (otp === "1234") {
      setOtpVerified(true);
    } else {
      setCallError("Invalid OTP. Use 1234 for testing.");
      setTimeout(() => setCallError(null), 3000);
    }
  };

  const progressRef = useRef<NodeJS.Timeout | null>(null);
  const peerRef = useRef<Peer | null>(null);
  const peerIdRef = useRef<string | null>(null);

  // Initialize PeerJS on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const initPeer = async () => {
        const peer = new Peer();

        peer.on("open", (id) => {
          console.log("My peer ID is: " + id);
          peerIdRef.current = id;
        });

        peer.on("call", async (call) => {
          setIncomingCall(true);
          setCallError(null);
          try {
            const stream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: "environment" },
              audio: true,
            });
            setMyStream(stream);
            call.answer(stream);
            call.on("stream", (userVideoStream) => {
              setRemoteStream(userVideoStream);
            });
            call.on("close", () => {
              // Support ended the call — redirect home
              handleDisconnectAndRedirect();
            });
          } catch (err) {
            console.error("Failed to get local stream", err);
            setCallError("Camera access required. Please allow camera and microphone.");
          }
        });

        peerRef.current = peer;
      };

      initPeer();

      return () => {
        if (peerRef.current) {
          peerRef.current.destroy();
        }
      };
    }
  }, []);

  // GPS auto-detect
  useEffect(() => {
    if (!navigator.geolocation) {
      setGps("Geolocation not supported");
      setGpsStatus("error");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGps(`${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`);
        setGpsStatus("found");
      },
      () => {
        setGps("Permission denied");
        setGpsStatus("error");
      }
    );
  }, []);

  // Listen for call signal from support
  useEffect(() => {
    if (!reportId || !peerRef.current) return;

    const cleanup = onEmergencyNotification((notification) => {
      if (
        notification.type === "support_ready" &&
        (notification as SupportReadyNotification).reportId === reportId
      ) {
        const supportPeerId = (notification as SupportReadyNotification).supportPeerId;
        setIncomingCall(true);
        setCallError(null);

        navigator.mediaDevices
          .getUserMedia({ video: { facingMode: "environment" }, audio: true })
          .then((stream) => {
            setMyStream(stream);
            if (peerRef.current) {
              const call = peerRef.current.call(supportPeerId, stream);
              activeCallRef.current = call;
              call.on("stream", (remoteVideoStream) => {
                setRemoteStream(remoteVideoStream);
              });
              call.on("error", (err) => {
                console.error("Call error:", err);
                setCallError("Connection failed. Please tap Reconnect.");
              });
              call.on("close", () => {
                // Support ended the call — redirect home
                handleDisconnectAndRedirect();
              });
            }
          })
          .catch((err) => {
            console.error("Failed to access camera", err);
            setCallError("Camera access required for video call. Please allow access.");
          });
      }
    });

    return cleanup;
  }, [reportId]);

  // Video recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: true,
      });

      const mediaRecorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => {
        chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        setVideoBlob(blob);
        stream.getTracks().forEach((t) => t.stop());
        setRecordingProgress(0);
        if (progressRef.current) clearInterval(progressRef.current);
      };

      mediaRecorder.start();
      setRecording(true);
      setRecordingProgress(0);

      let progress = 0;
      progressRef.current = setInterval(() => {
        progress += 1;
        setRecordingProgress(progress);
        if (progress >= 100) {
          if (progressRef.current) clearInterval(progressRef.current);
        }
      }, 300);

      setTimeout(() => {
        if (mediaRecorder.state === "recording") {
          mediaRecorder.stop();
          setRecording(false);
        }
      }, 30000);
    } catch {
      setCallError("Camera access denied. Please allow camera access to record video.");
      setTimeout(() => setCallError(null), 4000);
    }
  };

  // Submit handler — sends data to backend (simulated) and broadcasts to support dashboard
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    formData.set("condition", condition);
    if (videoBlob) {
      formData.append("video", videoBlob, "emergency-video.webm");
    }

    // Simulate API call to backend
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Broadcast notification to support dashboard with full patient data
    const notification = broadcastEmergency({
      reporter: name || (formData.get("name") as string) || "Anonymous",
      phone: mobile || (formData.get("mobile") as string) || "N/A",
      location: gps,
      condition: condition || "unknown",
      notes: (formData.get("notes") as string) || "",
      peerId: peerIdRef.current || undefined,
      // Patient profile data from QR scan
      bloodGroup: userProfile?.bloodGroup,
      scannerNumber: userProfile?.scannerNumber,
      photoUrl: userProfile?.photoUrl,
      familyContact: userProfile?.familyContact,
      familyName: userProfile?.familyName,
      accidentType: accidentType || (formData.get("accidentType") as string) || "Unknown",
    });

    if (notification) {
      setReportId(notification.id);
    }

    setSubmitting(false);
    setSubmitted(true);
  };

  // ─── Call timer ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (incomingCall) {
      setCallDuration(0);
      callTimerRef.current = setInterval(() => setCallDuration((s) => s + 1), 1000);
    } else {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    }
    return () => { if (callTimerRef.current) clearInterval(callTimerRef.current); };
  }, [incomingCall]);

  const formatDuration = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  // ─── Mute toggle ──────────────────────────────────────────────────────────
  const handleToggleMute = () => {
    if (!myStream) return;
    myStream.getAudioTracks().forEach((t) => { t.enabled = isMuted; }); // flip
    setIsMuted((m) => !m);
  };

  // ─── Camera toggle ────────────────────────────────────────────────────────
  const handleToggleCamera = () => {
    if (!myStream) return;
    myStream.getVideoTracks().forEach((t) => { t.enabled = isCameraOff; }); // flip
    setIsCameraOff((c) => !c);
  };

  // ─── Disconnect + redirect home ───────────────────────────────────────────
  const handleDisconnectAndRedirect = () => {
    if (callTimerRef.current) clearInterval(callTimerRef.current);
    myStream?.getTracks().forEach((t) => t.stop());
    remoteStream?.getTracks().forEach((t) => t.stop());
    activeCallRef.current?.close();
    activeCallRef.current = null;
    // Redirect to home after call ends
    router.push("/");
  };

  const handleDisconnect = () => {
    handleDisconnectAndRedirect();
  };

  // ─── Reconnect ────────────────────────────────────────────────────────────
  const handleReconnect = async () => {
    if (!peerRef.current || !reportId) return;
    setIsReconnecting(true);
    setCallError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: true,
      });
      setMyStream(stream);
      setIsMuted(false);
      setIsCameraOff(false);
      setTimeout(() => setIsReconnecting(false), 2000);
    } catch {
      setCallError("Camera access required to reconnect.");
      setIsReconnecting(false);
    }
  };

  // ─── Video Call Interface ─────────────────────────────────────────────────
  if (incomingCall) {
    return (
      <div className="fixed inset-0 z-50 bg-black" style={{ display: "grid", gridTemplateRows: "1fr auto" }}>

        {/* ── Remote video (support agent) — fills available space ── */}
        <div className="relative bg-slate-950 overflow-hidden">
          {remoteStream ? (
            <video
              className="absolute inset-0 w-full h-full object-cover"
              autoPlay playsInline
              ref={(v) => { if (v && v.srcObject !== remoteStream) v.srcObject = remoteStream; }}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center animate-pulse">
                <Video className="w-10 h-10 text-white/40" />
              </div>
              <p className="text-slate-400 text-sm">Connecting to Support Agent...</p>
            </div>
          )}

          {/* ── HUD: top-left — Live badge + timer ── */}
          <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
            <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-semibold text-green-400 uppercase tracking-wider">Live Support</span>
            </div>
            <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full w-fit">
              <Clock className="w-3 h-3 text-white/60" />
              <span className="text-xs font-mono text-white/80">{formatDuration(callDuration)}</span>
            </div>
          </div>

          {/* ── HUD: top-right — status badges ── */}
          <div className="absolute top-4 right-4 flex flex-col gap-2 items-end z-10">
            {isMuted && (
              <div className="flex items-center gap-1.5 bg-red-600/90 backdrop-blur-md px-2.5 py-1 rounded-full">
                <MicOff className="w-3 h-3 text-white" />
                <span className="text-[10px] font-semibold text-white">Muted</span>
              </div>
            )}
            {isCameraOff && (
              <div className="flex items-center gap-1.5 bg-slate-700/90 backdrop-blur-md px-2.5 py-1 rounded-full">
                <VideoOff className="w-3 h-3 text-white" />
                <span className="text-[10px] font-semibold text-white">Camera Off</span>
              </div>
            )}
          </div>

          {/* ── PiP: self view ── */}
          <div className="absolute bottom-4 right-4 w-28 h-40 md:w-36 md:h-52 rounded-xl overflow-hidden border-2 border-white/20 shadow-2xl bg-slate-900 z-10">
            {myStream && !isCameraOff ? (
              <video
                className="w-full h-full object-cover"
                muted playsInline autoPlay
                ref={(v) => { if (v && v.srcObject !== myStream) v.srcObject = myStream; }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-800">
                <VideoOff className="w-6 h-6 text-white/30" />
              </div>
            )}
            <div className="absolute bottom-1.5 left-2 text-[10px] text-white/60 bg-black/40 px-1.5 py-0.5 rounded">You</div>
          </div>
        </div>

        {/* ── Controls bar — always visible at bottom ── */}
        <div className="bg-black border-t border-white/10 px-4 py-4 flex-shrink-0">
          <div className="flex items-center justify-center gap-6">

            {/* Mute */}
            <button onClick={handleToggleMute} className="flex flex-col items-center gap-1.5">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isMuted ? "bg-red-600 shadow-lg shadow-red-500/30" : "bg-white/15 hover:bg-white/25"
                }`}>
                {isMuted ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5 text-white" />}
              </div>
              <span className="text-[10px] text-white/50">{isMuted ? "Unmute" : "Mute"}</span>
            </button>

            {/* Camera */}
            <button onClick={handleToggleCamera} className="flex flex-col items-center gap-1.5">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isCameraOff ? "bg-slate-600 shadow-lg" : "bg-white/15 hover:bg-white/25"
                }`}>
                {isCameraOff ? <VideoOff className="w-5 h-5 text-white" /> : <Video className="w-5 h-5 text-white" />}
              </div>
              <span className="text-[10px] text-white/50">{isCameraOff ? "Show Cam" : "Hide Cam"}</span>
            </button>

            {/* End Call — biggest button, center */}
            <button onClick={handleDisconnect} className="flex flex-col items-center gap-1.5">
              <div className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center shadow-xl shadow-red-500/40 transition-all active:scale-95">
                <PhoneOff className="w-7 h-7 text-white" />
              </div>
              <span className="text-[10px] text-white/50">End Call</span>
            </button>

            {/* Reconnect */}
            <button onClick={handleReconnect} disabled={isReconnecting} className="flex flex-col items-center gap-1.5">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isReconnecting ? "bg-amber-600" : "bg-white/15 hover:bg-white/25"
                }`}>
                <RotateCcw className={`w-5 h-5 text-white ${isReconnecting ? "animate-spin" : ""}`} />
              </div>
              <span className="text-[10px] text-white/50">{isReconnecting ? "Reconnecting" : "Reconnect"}</span>
            </button>

          </div>

          {/* Patient info + error strip */}
          <div className="mt-3 space-y-2">
            {/* Inline error banner — replaces browser alert() */}
            {callError && (
              <div className="mx-4 flex items-center gap-2 bg-red-600/90 backdrop-blur-sm rounded-xl px-3 py-2 animate-in fade-in slide-in-from-top-2">
                <span className="text-white text-xs font-medium flex-1">{callError}</span>
                <button onClick={() => setCallError(null)} className="text-white/60 hover:text-white text-xs">✕</button>
              </div>
            )}
            {name && (
              <div className="flex items-center justify-center gap-3">
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1">
                  <MapPin className="w-3 h-3 text-white/40" />
                  <span className="text-[10px] text-white/50 font-mono truncate max-w-[160px]">{gps}</span>
                </div>
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1">
                  <span className="text-[10px] text-white/50">{name}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── Success state (Waiting for support) ─────────────────────────────────
  if (submitted) {
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
            onClick={() => {
              setSubmitted(false);
              setReportId(null);
            }}
            variant="ghost"
            className="text-slate-500 hover:text-white hover:bg-slate-800"
          >
            Cancel Request
          </Button>
        </div>
      </div>
    );
  }

  // ─── Main Form ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/50 via-white to-red-50/30">
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
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${gpsStatus === "found"
            ? "bg-brand-success/10 text-brand-success"
            : gpsStatus === "error"
              ? "bg-brand-error/10 text-brand-error"
              : "bg-brand-info/10 text-brand-info"
            }`}
        >
          <div
            className={`w-2 h-2 rounded-full ${gpsStatus === "found"
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
            <button onClick={() => setCallError(null)} className="text-red-400 hover:text-red-600 text-xs font-bold">✕</button>
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
            </Badge>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-4 pb-8 pt-4 space-y-4">
        {/* Section 1: Evidence Capture */}
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
                  className="file:mr-3 file:px-3 file:py-1 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-brand-primary/10 file:text-brand-primary hover:file:bg-brand-primary/20 cursor-pointer"
                />
              </div>
            </div>

            {/* Video */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Record Video <span className="text-muted-foreground font-normal">(30 seconds)</span>
              </Label>

              {recording && (
                <div className="space-y-1.5">
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-emergency rounded-full transition-all duration-100"
                      style={{ width: `${recordingProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-brand-emergency font-medium flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-brand-emergency animate-pulse" />
                    Recording... {Math.round((recordingProgress / 100) * 30)}s / 30s
                  </p>
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
                onClick={startRecording}
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

        {/* Section 2: Victim Condition */}
        <Card className="opacity-0 animate-slide-up stagger-2 border-0 shadow-lg shadow-black/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center text-xs font-bold">
                2
              </span>
              Victim Condition
            </CardTitle>
            <CardDescription className="text-xs">Assess and report the victim&apos;s current state</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Condition Select */}
            <div className="space-y-2">
              <Label htmlFor="condition" className="text-sm font-medium">
                Current Condition
              </Label>
              <Select value={condition} onValueChange={setCondition} name="condition">
                <SelectTrigger id="condition" className="w-full">
                  <SelectValue placeholder="Select victim condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stable">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-brand-success" />
                      Stable — Conscious &amp; responsive
                    </div>
                  </SelectItem>
                  <SelectItem value="injured">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-brand-warning" />
                      Injured — Needs medical attention
                    </div>
                  </SelectItem>
                  <SelectItem value="critical">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-brand-emergency" />
                      Critical — Life-threatening
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Condition badge */}
              {condition && (
                <Badge
                  className={`text-xs ${condition === "stable"
                    ? "bg-brand-success/10 text-brand-success border-brand-success/20"
                    : condition === "injured"
                      ? "bg-brand-warning/10 text-amber-700 border-brand-warning/20"
                      : "bg-brand-emergency/10 text-brand-emergency border-brand-emergency/20 animate-pulse-emergency"
                    }`}
                  variant="outline"
                >
                  {condition === "stable" && "✅ Stable"}
                  {condition === "injured" && "⚠️ Injured"}
                  {condition === "critical" && "🚨 Critical — Priority Response"}
                </Badge>
              )}
            </div>

            {/* Additional Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm font-medium">
                Additional Notes
              </Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Describe the situation, injuries, number of victims, hazards present..."
                className="min-h-[80px] resize-none text-sm"
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Reporter Info */}
        <Card className="opacity-0 animate-slide-up stagger-3 border-0 shadow-lg shadow-black/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center text-xs font-bold">
                3
              </span>
              Your Information
              {userProfile && (
                <Badge className="ml-auto text-[10px] bg-brand-success/10 text-brand-success border-brand-success/20" variant="outline">
                  <User className="w-2.5 h-2.5 mr-1" />
                  Auto-filled
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="text-xs">Help responders contact you if needed</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Full Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Enter your name"
                  className="text-sm"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobile" className="text-sm font-medium">
                  Mobile Number
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="mobile"
                    name="mobile"
                    type="tel"
                    placeholder="+91 XXXXX XXXXX"
                    className="text-sm flex-1"
                    disabled={otpVerified}
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                  />
                  {!otpVerified && (
                    <Button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={otpSent}
                      className="bg-brand-primary text-white text-xs whitespace-nowrap"
                    >
                      {otpSent ? "OTP Sent" : "Send OTP"}
                    </Button>
                  )}
                </div>

                {otpSent && !otpVerified && (
                  <div className="animate-in slide-in-from-top-2 fade-in mt-2 space-y-2">
                    <Label htmlFor="otp" className="text-sm font-medium">
                      Verify OTP
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="otp"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="Enter 4-digit OTP"
                        className="text-sm"
                        maxLength={4}
                      />
                      <Button
                        type="button"
                        onClick={handleVerifyOtp}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        Verify
                      </Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground">Use 1234 for testing</p>
                  </div>
                )}

                {otpVerified && (
                  <div className="flex items-center gap-2 text-green-600 text-xs font-medium animate-in fade-in">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Number Verified
                  </div>
                )}
              </div>
            </div>

            {/* Show blood group if available from profile */}
            {userProfile && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-100 rounded-lg">
                  <span className="text-red-500 text-sm">🩸</span>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-semibold">Blood Group</p>
                    <p className="text-sm font-bold text-red-600">{userProfile.bloodGroup}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-brand-primary/5 border border-brand-primary/10 rounded-lg">
                  <span className="text-brand-primary text-sm">📋</span>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-semibold">Scanner No.</p>
                    <p className="text-xs font-bold text-brand-primary">{userProfile.scannerNumber}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* GPS Hidden Field */}
        <input type="hidden" name="gps" value={gps} />

        {/* Submit */}
        <div className="opacity-0 animate-slide-up stagger-4 pt-2">
          <Button
            type="submit"
            disabled={submitting || !otpVerified}
            className="w-full h-12 text-base font-semibold bg-gradient-to-r from-brand-emergency to-red-700 hover:from-red-700 hover:to-brand-emergency transition-all duration-300 shadow-lg shadow-brand-emergency/25 hover:shadow-xl hover:shadow-brand-emergency/30"
          >
            {submitting ? (
              <div className="flex items-center gap-2">
                <svg
                  className="animate-spin h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Submitting Report...
              </div>
            ) : (
              <>🚨 Submit Emergency Report</>
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground mt-3">
            Your location and report will be shared with emergency responders
          </p>
        </div>

        {/* Footer branding */}
        <div className="opacity-0 animate-fade-in stagger-5 border-t border-border/50 pt-4 mt-8">
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <div className="w-5 h-5 rounded-md bg-brand-primary flex items-center justify-center">
              <span className="text-white text-[8px] font-bold">JS</span>
            </div>
            <span>Powered by Jan Setu Support</span>
          </div>
        </div>
      </form>
    </div>
  );
}

// ─── Page wrapper with Suspense (required for useSearchParams) ────────────────
export default function EmergencyFormPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50/50 via-white to-red-50/30">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 rounded-full border-4 border-brand-primary/20 border-t-brand-primary animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground">Loading emergency form...</p>
          </div>
        </div>
      }
    >
      <EmergencyFormContent />
    </Suspense>
  );
}
