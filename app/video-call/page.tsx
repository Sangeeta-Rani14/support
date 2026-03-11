'use client';

import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Video, Copy, Check, X, PhoneOff, Shield } from 'lucide-react';

// No SSR — ZEGOCLOUD needs window / WebRTC APIs
const ZegoVideoCall = dynamic(() => import('@/components/ZegoVideoCall'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex items-center justify-center bg-slate-950">
            <div className="text-center space-y-4">
                <div className="w-14 h-14 rounded-full border-4 border-emerald-500/30 border-t-emerald-500 animate-spin mx-auto" />
                <p className="text-slate-400 text-sm font-medium">Connecting to video room…</p>
            </div>
        </div>
    ),
});

function VideoCallContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const roomID = searchParams.get('room') ?? 'emergency';
    const displayName = searchParams.get('name') ?? 'User';
    const role = searchParams.get('role') ?? 'user'; // 'user' | 'support'

    const [copied, setCopied] = useState(false);
    const [ended, setEnded] = useState(false);

    const isSupport = role === 'support';

    const handleCopy = () => {
        navigator.clipboard.writeText(window.location.href).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const handleEnd = () => {
        setEnded(true);
        setTimeout(() => {
            router.push(isSupport ? '/support/dashboard' : '/');
        }, 1800);
    };

    /* ── Call-ended screen ─────────────────────────────────────── */
    if (ended) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
                <div className="text-center space-y-5 animate-in fade-in zoom-in duration-500">
                    <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto ring-4 ring-emerald-500/30">
                        <PhoneOff className="w-9 h-9 text-emerald-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold mb-1">Call Ended</h2>
                        <p className="text-slate-400 text-sm">
                            Redirecting you {isSupport ? 'to dashboard' : 'home'}…
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    /* ── Main meeting page ─────────────────────────────────────── */
    return (
        <div className="flex flex-col h-screen bg-slate-950 overflow-hidden">

            {/* ── Top bar ─────────────────────────────────────────── */}
            <header className="flex items-center justify-between px-4 h-12 bg-slate-900/90 border-b border-slate-800/80 backdrop-blur-sm shrink-0 z-20">

                {/* Left: brand + room info */}
                <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                        <Video className="w-3.5 h-3.5 text-red-400" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-bold text-white leading-none truncate">
                            Jan Setu · Emergency Call
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5 truncate max-w-[200px] sm:max-w-xs">
                            Case&nbsp;#{roomID.slice(-10).toUpperCase()}
                        </p>
                    </div>

                    {/* Role chip */}
                    <span className={`hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${isSupport
                        ? 'bg-brand-primary/15 text-brand-primary border-brand-primary/30'
                        : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        }`}>
                        <Shield className="w-2.5 h-2.5" />
                        {isSupport ? 'Support Agent' : 'Citizen'}
                    </span>
                </div>

                {/* Right: actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                    <button
                        onClick={handleCopy}
                        className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 h-7 rounded-lg transition-colors"
                    >
                        {copied
                            ? <Check className="w-3 h-3 text-emerald-400" />
                            : <Copy className="w-3 h-3" />
                        }
                        <span className="hidden sm:inline">
                            {copied ? 'Copied!' : 'Copy link'}
                        </span>
                    </button>

                    <button
                        onClick={handleEnd}
                        className="flex items-center gap-1.5 text-[11px] font-medium text-red-400 hover:text-white bg-red-500/10 hover:bg-red-500 px-2.5 h-7 rounded-lg transition-colors border border-red-500/30 hover:border-red-500"
                    >
                        <X className="w-3 h-3" />
                        <span className="hidden sm:inline">End</span>
                    </button>
                </div>
            </header>

            {/* ── ZEGOCLOUD video room — fills remaining height ───── */}
            <div className="flex-1 min-h-0 relative">
                <ZegoVideoCall
                    roomID={roomID}
                    displayName={isSupport ? 'Support Agent' : displayName}
                    onCallEnd={handleEnd}
                />
            </div>
        </div>
    );
}

/* ── Page wrapper ───────────────────────────────────────────────── */
export default function VideoCallPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                    <div className="text-center space-y-4">
                        <div className="w-12 h-12 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin mx-auto" />
                        <p className="text-slate-400 text-sm">Joining video room…</p>
                    </div>
                </div>
            }
        >
            <VideoCallContent />
        </Suspense>
    );
}
