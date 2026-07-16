"use client";

import { usePWAInstall } from "@/hooks/use-pwa-install";
import { Download, X, Share, MoreVertical } from "lucide-react";
import { useState } from "react";

export default function PWAInstallBanner() {
  const { canInstall, triggerInstall, isIOSSafari } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);

  // Nothing to show
  if (dismissed || (!canInstall && !isIOSSafari)) return null;

  // ── iOS Safari: manual instruction banner ─────────────────────────────────
  if (isIOSSafari) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:w-80">
        <div className="bg-[#1e3a5f] text-white rounded-2xl shadow-2xl p-4 relative">
          {/* Close */}
          <button
            onClick={() => setDismissed(true)}
            className="absolute top-3 right-3 text-white/40 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-2.5 mb-3 pr-5">
            <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <Download className="w-4 h-4 text-[#f59e0b]" />
            </div>
            <div>
              <p className="font-semibold text-sm leading-tight">Install GWMS App</p>
              <p className="text-xs text-white/50 leading-tight">Add to your Home Screen</p>
            </div>
          </div>

          {/* Step-by-step instructions */}
          <div className="space-y-2">
            <Step number={1}>
              Tap the{" "}
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-white/10 rounded text-[#f59e0b] font-semibold text-xs">
                <Share className="w-3 h-3" /> Share
              </span>{" "}
              button at the bottom of your browser
            </Step>
            <Step number={2}>
              Scroll down and tap{" "}
              <span className="px-1.5 py-0.5 bg-white/10 rounded text-[#f59e0b] font-semibold text-xs">
                Add to Home Screen
              </span>
            </Step>
            <Step number={3}>
              Tap{" "}
              <span className="px-1.5 py-0.5 bg-white/10 rounded text-[#f59e0b] font-semibold text-xs">
                Add
              </span>{" "}
              to confirm
            </Step>
          </div>

          {/* Arrow pointing down toward Safari toolbar */}
          <div className="flex justify-center mt-3">
            <div className="flex flex-col items-center gap-0.5 text-white/30">
              <span className="text-[10px] tracking-wide uppercase font-medium">Safari toolbar below</span>
              <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
                <path d="M8 10L0 0h16L8 10z" fill="currentColor" opacity="0.4" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Android / Chrome: native prompt banner ────────────────────────────────
  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:w-80">
      <div className="bg-[#1e3a5f] text-white rounded-2xl shadow-2xl p-4 flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
          <Download className="w-5 h-5 text-[#f59e0b]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm leading-snug">Install GWMS App</p>
          <p className="text-xs text-white/60 mt-0.5 leading-snug">
            Add to your home screen for faster access and offline use.
          </p>
          <button
            onClick={triggerInstall}
            className="mt-2.5 px-4 py-1.5 bg-[#f59e0b] text-[#1e3a5f] text-xs font-bold rounded-lg hover:bg-amber-400 transition-colors"
          >
            Install Now
          </button>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="flex-shrink-0 text-white/40 hover:text-white transition-colors mt-0.5"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ── Small helper component for numbered steps ─────────────────────────────────
function Step({ number, children }: { number: number; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#f59e0b] text-[#1e3a5f] text-[10px] font-black flex items-center justify-center mt-0.5">
        {number}
      </span>
      <p className="text-xs text-white/70 leading-relaxed">{children}</p>
    </div>
  );
}