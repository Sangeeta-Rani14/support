"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import {
  broadcastEmergency,
  fetchUserDetails,
  UserProfile,
} from "@/lib/emergency-channel";
import { submitEmrFormMultipart, uploadEmrVideo, ApiError } from "@/lib/api";
import EmrTopSection from "./_components/EmrTopSection";
import EvidenceCaptureCard from "./_components/EvidenceCaptureCard";
import VictimConditionCard from "./_components/VictimConditionCard";
import ReporterInfoCard from "./_components/ReporterInfoCard";
import SubmitSection from "./_components/SubmitSection";

// ─── Inner component that uses useSearchParams ───────────────────────────────
function EmergencyFormContent() {
  const [gps, setGps] = useState<string>("Detecting...");
  const [gpsStatus, setGpsStatus] = useState<"detecting" | "found" | "error">("detecting");
  const [gpsCoords, setGpsCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(0);
  const [condition, setCondition] = useState<string>("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

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
  };

  const handleVerifyOtp = () => {
    if (otp === "1234") {
      setOtpVerified(true);
    } else {
      setFormError("Invalid OTP. Use 1234 for testing.");
      setTimeout(() => setFormError(null), 3000);
    }
  };

  const progressRef = useRef<NodeJS.Timeout | null>(null);
  const liveStreamRef = useRef<MediaStream | null>(null);
  const liveVideoRef = useRef<HTMLVideoElement>(null!);

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
        setGpsCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      },
      () => {
        setGps("Permission denied");
        setGpsStatus("error");
      }
    );
  }, []);

  // Attach live camera stream once the <video> element mounts
  useEffect(() => {
    if (recording && liveVideoRef.current && liveStreamRef.current) {
      liveVideoRef.current.srcObject = liveStreamRef.current;
    }
  }, [recording]);

  // Video recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 640, max: 640 },
          height: { ideal: 360, max: 360 },
        },
        audio: true,
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "video/webm;codecs=vp8",
        videoBitsPerSecond: 500_000,
        audioBitsPerSecond: 64_000,
      });
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => {
        chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        setVideoBlob(blob);
        stream.getTracks().forEach((t) => t.stop());
        liveStreamRef.current = null;
        if (liveVideoRef.current) liveVideoRef.current.srcObject = null;
        setRecordingProgress(0);
        if (progressRef.current) clearInterval(progressRef.current);
      };

      mediaRecorder.start();
      liveStreamRef.current = stream;
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
      }, 12_000);
    } catch {
      setFormError("Camera access denied. Please allow camera access to record video.");
      setTimeout(() => setFormError(null), 4000);
    }
  };

  // ── TanStack mutation for EMR submission (multipart/form-data) ────────────
  const emrMutation = useMutation({
    mutationFn: submitEmrFormMultipart,
    onError: (err) => {
      if (err instanceof ApiError && err.status === 0) {
        console.warn("Backend unreachable — falling back to local broadcast");
        return;
      }
    },
  });

  const submitting = emrMutation.isPending;
  const submitError =
    emrMutation.isError && !(emrMutation.error instanceof ApiError && emrMutation.error.status === 0)
      ? (emrMutation.error as ApiError).message ?? "Submission failed"
      : null;

  // Submit handler
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    emrMutation.reset();

    const formData = new FormData(e.currentTarget);
    const reporterName = name || (formData.get("name") as string) || "Anonymous";
    const reporterMobile = mobile || (formData.get("mobile") as string) || "N/A";
    const notes = (formData.get("notes") as string) || "";
    const accidentType = (formData.get("accidentType") as string) || "";

    // ── 1. Upload video to dedicated endpoint (if recorded) ──────────────────
    if (videoBlob) {
      try {
        await uploadEmrVideo(videoBlob, "recording.webm");
      } catch (err) {
        console.warn("Video upload failed, continuing without video:", err);
      }
    }

    // ── 2. Build FormData for main submission ────────────────────────────────
    const payload = new FormData();
    payload.append("source", "webapp");

    if (photoFile) payload.append("photo", photoFile);

    payload.append(
      "victimCondition",
      JSON.stringify({
        currentCondition: condition || "conscious",
        additionalNotes: notes,
      })
    );

    payload.append(
      "reporterInfo",
      JSON.stringify({
        fullName: reporterName,
        mobile: reporterMobile,
      })
    );

    payload.append(
      "location",
      JSON.stringify({
        latitude: gpsCoords?.latitude ?? 0,
        longitude: gpsCoords?.longitude ?? 0,
        address: gps !== "Detecting..." && gps !== "Permission denied" ? gps : "Unknown location",
      })
    );

    if (accidentType) payload.append("accidentType", accidentType);

    // ── 3. POST main form data ────────────────────────────────────────────────
    let caseId: string | undefined;
    try {
      const res = await emrMutation.mutateAsync(payload);
      caseId = res.caseId ?? res.submissionId;
    } catch (err) {
      if (!(err instanceof ApiError && err.status === 0)) return;
    }

    // ── 4. Notify support dashboard via BroadcastChannel ─────────────────────
    broadcastEmergency({
      reporter: reporterName,
      phone: reporterMobile,
      location: gps,
      condition: condition || "unknown",
      notes,
      bloodGroup: userProfile?.bloodGroup,
      scannerNumber: caseId ?? userProfile?.scannerNumber,
      photoUrl: userProfile?.photoUrl,
      familyContact: userProfile?.familyContact,
      familyName: userProfile?.familyName,
      accidentType: accidentType || "Unknown",
      caseId, // ← support dashboard uses this as the ZEGOCLOUD room ID
    });

    // ── 5. Redirect emitter to the ZEGOCLOUD video room ──────────────────────
    const roomId = caseId ?? `emergency-${Date.now()}`;
    router.push(`/video-call?room=${encodeURIComponent(roomId)}&name=${encodeURIComponent(reporterName)}`);
  };

  // ─── Main Form ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/50 via-white to-red-50/30">
      <EmrTopSection
        gps={gps}
        gpsStatus={gpsStatus}
        callError={formError}
        onClearCallError={() => setFormError(null)}
        fetchingUser={fetchingUser}
        userFetchError={userFetchError}
        userProfile={userProfile}
      />

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-4 pb-8 pt-4 space-y-4">
        <EvidenceCaptureCard
          recording={recording}
          recordingProgress={recordingProgress}
          videoBlob={videoBlob}
          liveVideoRef={liveVideoRef}
          onStartRecording={startRecording}
          onPhotoChange={setPhotoFile}
        />

        <VictimConditionCard condition={condition} onConditionChange={setCondition} />

        <ReporterInfoCard
          name={name}
          mobile={mobile}
          otp={otp}
          otpSent={otpSent}
          otpVerified={otpVerified}
          userProfile={userProfile}
          onNameChange={setName}
          onMobileChange={setMobile}
          onOtpChange={setOtp}
          onSendOtp={handleSendOtp}
          onVerifyOtp={handleVerifyOtp}
        />

        <SubmitSection
          gps={gps}
          submitError={submitError}
          submitting={submitting}
          otpVerified={otpVerified}
        />
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
