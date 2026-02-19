"use client";

import Image from "next/image";
import QRCode from "react-qr-code";
import { useEffect, useState } from "react";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setMounted(true);
    setOrigin(window.location.origin);
  }, []);

  const formUrl = origin ? `${origin}/emr-form` : "/emr-form";

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/60 via-white to-blue-50/40 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-brand-accent/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-brand-emergency/3 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(#c94e01 1px, transparent 1px), linear-gradient(90deg, #c94e01 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Top navigation bar */}
      <nav className="relative z-10 border-b border-brand-primary/10 bg-white/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image
              src="/jan-setu-logo.png"
              alt="Jan Setu"
              width={36}
              height={36}
              className="rounded-lg"
            />
            <span className="text-sm font-semibold text-foreground tracking-tight">
              Jan Setu <span className="text-brand-primary">Support</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-block text-xs text-muted-foreground bg-brand-emergency/8 text-brand-emergency px-3 py-1 rounded-full font-medium border border-brand-emergency/15">
              🚨 Emergency Response System
            </span>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 min-h-[calc(100vh-60px)] flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center py-12 lg:py-0">
          {/* Left side — Logo & Description */}
          <div
            className={`space-y-8 transition-all duration-700 ${mounted
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
              }`}
          >
            {/* Logo */}
            <div className="flex justify-center lg:justify-start">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-br from-brand-primary/10 to-brand-accent/10 rounded-3xl blur-xl" />
                <Image
                  src="/jan-setu-logo.png"
                  alt="Jan Setu Logo"
                  width={200}
                  height={200}
                  className="relative rounded-2xl drop-shadow-lg"
                  priority
                />
              </div>
            </div>

            {/* Text content */}
            <div className="text-center lg:text-left space-y-4">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground leading-tight">
                Emergency
                <br />
                <span className="bg-gradient-to-r from-brand-primary to-brand-primary-dark bg-clip-text text-transparent">
                  Response System
                </span>
              </h1>

              <p className="text-muted-foreground text-base sm:text-lg leading-relaxed max-w-md mx-auto lg:mx-0">
                Scan the QR code to quickly report an emergency. Your report
                will be instantly routed to the nearest responders.
              </p>
            </div>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
              <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-md shadow-black/5 border border-border/50">
                <span className="w-2 h-2 rounded-full bg-brand-success animate-pulse" />
                <span className="text-xs font-medium text-foreground">
                  GPS Auto-detect
                </span>
              </div>
              <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-md shadow-black/5 border border-border/50">
                <span className="text-xs">📸</span>
                <span className="text-xs font-medium text-foreground">
                  Photo & Video
                </span>
              </div>
              <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-md shadow-black/5 border border-border/50">
                <span className="text-xs">⚡</span>
                <span className="text-xs font-medium text-foreground">
                  Instant Report
                </span>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4 pt-2">
              <div className="text-center lg:text-left">
                <p className="text-2xl font-bold text-brand-primary">24/7</p>
                <p className="text-xs text-muted-foreground">Always Active</p>
              </div>
              <div className="text-center lg:text-left">
                <p className="text-2xl font-bold text-brand-accent">&lt;30s</p>
                <p className="text-xs text-muted-foreground">Response Time</p>
              </div>
              <div className="text-center lg:text-left">
                <p className="text-2xl font-bold text-brand-emergency">100%</p>
                <p className="text-xs text-muted-foreground">Secure</p>
              </div>
            </div>
          </div>

          {/* Right side — QR Code */}
          <div
            className={`flex justify-center lg:justify-end transition-all duration-700 delay-200 ${mounted
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
              }`}
          >
            <div className="relative group">
              {/* Decorative rings */}
              <div className="absolute -inset-8 border-2 border-dashed border-brand-primary/15 rounded-3xl group-hover:border-brand-primary/25 transition-colors duration-500" />
              <div className="absolute -inset-16 border border-dashed border-brand-primary/8 rounded-[2rem] group-hover:border-brand-primary/15 transition-colors duration-700" />

              {/* QR Card */}
              <div className="relative bg-white rounded-2xl shadow-2xl shadow-brand-primary/10 p-8 sm:p-10 border border-brand-primary/10 group-hover:shadow-brand-primary/20 transition-all duration-500 group-hover:-translate-y-1">
                {/* Header */}
                <div className="text-center mb-6 space-y-1">
                  <p className="text-xs font-semibold text-brand-primary uppercase tracking-widest">
                    Scan to Report
                  </p>
                  <h2 className="text-lg font-bold text-foreground">
                    Emergency QR Code
                  </h2>
                </div>

                {/* QR Code */}
                <div className="bg-white p-4 rounded-xl border-2 border-brand-primary/10">
                  {mounted ? (
                    <QRCode
                      size={220}
                      value={formUrl}
                      style={{
                        height: "auto",
                        maxWidth: "100%",
                        width: "100%",
                      }}
                      viewBox="0 0 256 256"
                      fgColor="#212121"
                      bgColor="#ffffff"
                    />
                  ) : (
                    <div className="w-[220px] h-[220px] bg-muted animate-pulse rounded-lg" />
                  )}
                </div>

                {/* URL display */}
                <div className="mt-5 text-center">
                  <div className="inline-flex items-center gap-2 bg-muted/60 rounded-full px-4 py-2">
                    <svg
                      className="w-3.5 h-3.5 text-brand-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.1m-.758-4.9a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.102"
                      />
                    </svg>
                    <code className="text-xs text-muted-foreground font-mono">
                      /emr-form
                    </code>
                  </div>
                </div>

                {/* Footer instruction */}
                <p className="text-center text-xs text-muted-foreground mt-4 leading-relaxed">
                  Point your phone camera at the QR code
                  <br />
                  to open the emergency report form
                </p>

                {/* Corner accents */}
                <div className="absolute top-3 left-3 w-3 h-3 border-t-2 border-l-2 border-brand-primary/30 rounded-tl-lg" />
                <div className="absolute top-3 right-3 w-3 h-3 border-t-2 border-r-2 border-brand-primary/30 rounded-tr-lg" />
                <div className="absolute bottom-3 left-3 w-3 h-3 border-b-2 border-l-2 border-brand-primary/30 rounded-bl-lg" />
                <div className="absolute bottom-3 right-3 w-3 h-3 border-b-2 border-r-2 border-brand-primary/30 rounded-br-lg" />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Image
              src="/jan-setu-logo.png"
              alt="Jan Setu"
              width={20}
              height={20}
              className="rounded"
            />
            <span className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Jan Setu Support. All rights
              reserved.
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            Emergency Response System v1.0
          </span>
        </div>
      </footer>
    </div>
  );
}
