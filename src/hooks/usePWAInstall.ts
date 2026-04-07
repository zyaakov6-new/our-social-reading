import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;

const DISMISS_KEY = 'pwa-install-dismissed';
const SNOOZE_KEY  = 'pwa-install-snooze-until';
const SNOOZE_DAYS = 3;

function isSnoozed() {
  const until = localStorage.getItem(SNOOZE_KEY);
  return until ? Date.now() < parseInt(until, 10) : false;
}

function isPermanentlyDismissed() {
  return localStorage.getItem(DISMISS_KEY) === '1';
}

/** Detects iOS Safari (where beforeinstallprompt never fires) */
export function detectIOS() {
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
  const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    || (navigator as any).standalone === true;
  return { isIOS, isSafari, isStandalone };
}

export function usePWAInstall() {
  const [canInstall, setCanInstall] = useState(false);   // Android: native prompt ready
  const [showIOS, setShowIOS]       = useState(false);   // iOS: manual instructions
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const { isIOS, isSafari, isStandalone } = detectIOS();

    if (isStandalone) { setIsInstalled(true); return; }
    if (isPermanentlyDismissed() || isSnoozed()) return;

    // iOS Safari: no beforeinstallprompt — show manual guide after a short delay
    if (isIOS && isSafari) {
      const t = setTimeout(() => setShowIOS(true), 8000);
      return () => clearTimeout(t);
    }

    // Android / Chrome: wait for the browser prompt
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e as BeforeInstallPromptEvent;
      setCanInstall(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const install = async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    setCanInstall(false);
    if (outcome === 'accepted') setIsInstalled(true);
    return outcome === 'accepted';
  };

  /** "Not now" — hide for SNOOZE_DAYS days, then show again */
  const snooze = () => {
    const until = Date.now() + SNOOZE_DAYS * 24 * 60 * 60 * 1000;
    localStorage.setItem(SNOOZE_KEY, String(until));
    setCanInstall(false);
    setShowIOS(false);
  };

  /** "Never show again" */
  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1');
    setCanInstall(false);
    setShowIOS(false);
  };

  return { canInstall, showIOS, isInstalled, install, snooze, dismiss };
}
