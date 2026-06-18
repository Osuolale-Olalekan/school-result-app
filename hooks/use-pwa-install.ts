"use client";

import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function detectPWAEnv() {
  if (typeof window === "undefined") {
    return { isIOSSafari: false, isStandalone: false };
  }
  const ua = window.navigator.userAgent;
  const ios = /iphone|ipad|ipod/i.test(ua);
  const safari = /safari/i.test(ua) && !/crios|fxios|opios/i.test(ua);
  const standalone = window.matchMedia("(display-mode: standalone)").matches;
  return { isIOSSafari: ios && safari, isStandalone: standalone };
}

export function usePWAInstall() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [{ isIOSSafari, isStandalone }] = useState(detectPWAEnv);

  useEffect(() => {
    if (isStandalone) return;

    function handler(e: Event) {
      e.preventDefault();
      setPromptEvent(e as BeforeInstallPromptEvent);
    }

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setIsInstalled(true));

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, [isStandalone]);

  async function triggerInstall() {
    if (!promptEvent) return;
    await promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    if (outcome === "accepted") setIsInstalled(true);
    setPromptEvent(null);
  }

  return {
    canInstall: !!promptEvent && !isInstalled && !isStandalone,
    triggerInstall,
    isInstalled: isInstalled || isStandalone,
    isIOSSafari: isIOSSafari && !isStandalone,
  };
}
