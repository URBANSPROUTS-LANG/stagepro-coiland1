// Dynamic Puter.js loader with pre-set auth to prevent popup entirely.
// Sets window.puter.env = 'app' and window.puter.authToken BEFORE the script loads,
// so Puter never enters its "needs authentication" flow.

import { useEffect, useRef, useState } from "react";

// Module-level guard to prevent double-loading across re-renders
let puterLoadState: "idle" | "loading" | "loaded" | "error" = "idle";
let puterLoadPromise: Promise<void> | null = null;

function blockPuterPopups() {
  // Block any window.open calls that go to puter.com
  const origOpen = window.open.bind(window);
  (window as any).open = (url: string, ...args: any[]) => {
    if (url && typeof url === "string" && url.includes("puter.com"))
      return null;
    return origOpen(url, ...args);
  };

  // Block postMessages from puter
  window.addEventListener(
    "message",
    (e) => {
      if (e.origin?.includes("puter.com")) e.stopImmediatePropagation();
    },
    true,
  );
}

function patchPuterAuth(token: string) {
  const puter = (window as any).puter;
  if (!puter) return;
  // Set token directly on the puter object
  puter.authToken = token;
  // Also set it on internal auth state if present
  if (puter.auth) {
    const noop = () => Promise.resolve(null);
    puter.auth.signIn = noop;
    puter.auth.signUp = noop;
    puter.auth.showDialog = noop;
    puter.auth.isSignedIn = () => true;
    puter.auth.getToken = () => Promise.resolve(token);
  }
  // Patch internal state fields Puter checks
  if (typeof puter._is_authenticated !== "undefined") {
    puter._is_authenticated = true;
  }
  if (typeof puter._token !== "undefined") {
    puter._token = token;
  }
}

function loadPuterScript(token: string): Promise<void> {
  if (puterLoadPromise) return puterLoadPromise;

  puterLoadState = "loading";
  puterLoadPromise = new Promise<void>((resolve, reject) => {
    // CRITICAL: Pre-configure window.puter BEFORE the script tag is injected
    // This prevents Puter from entering its auth flow on initialization
    (window as any).puter = (window as any).puter || {};
    (window as any).puter.env = "app";
    (window as any).puter.appID = "stagepro-app";
    (window as any).puter.__puter_no_auth__ = true;
    (window as any).puter.authToken = token;

    // Block popups before Puter loads
    blockPuterPopups();

    const script = document.createElement("script");
    script.src = "https://js.puter.com/v2/";
    script.async = true;

    script.onload = () => {
      // Patch auth immediately after script loads
      patchPuterAuth(token);
      puterLoadState = "loaded";

      // Keep patching for 30 seconds to handle any delayed re-auth attempts
      let patchCount = 0;
      const patchInterval = setInterval(() => {
        patchPuterAuth(token);
        patchCount++;
        if (patchCount >= 120) clearInterval(patchInterval); // 30s at 250ms
      }, 250);

      resolve();
    };

    script.onerror = (err) => {
      puterLoadState = "error";
      puterLoadPromise = null;
      reject(err);
    };

    document.head.appendChild(script);
  });

  return puterLoadPromise;
}

export function usePuter(actor: any): { puter: any; isReady: boolean } {
  const [isReady, setIsReady] = useState(false);
  const [puterInstance, setPuterInstance] = useState<any>(null);
  const initStartedRef = useRef(false);

  useEffect(() => {
    if (!actor) return;
    if (initStartedRef.current) return;
    initStartedRef.current = true;

    const init = async () => {
      // Check if Puter is already fully loaded (e.g., from a previous render cycle)
      if (puterLoadState === "loaded" && (window as any).puter?.ai) {
        setPuterInstance((window as any).puter);
        setIsReady(true);
        return;
      }

      // Fetch the auth token from the backend canister
      let token: string | null = null;
      try {
        token = await (actor as any).getPuterToken();
      } catch (err) {
        console.error(
          "[usePuter] Failed to fetch Puter token from backend:",
          err,
        );
        // Continue without token — Puter may work in a degraded mode
      }

      if (!token) {
        console.warn("[usePuter] No Puter token available — AI calls may fail");
        // Still try to load Puter.js
        token = "";
      }

      try {
        await loadPuterScript(token);
        const puter = (window as any).puter;
        if (puter) {
          setPuterInstance(puter);
          setIsReady(true);
        }
      } catch (err) {
        console.error("[usePuter] Failed to load Puter.js script:", err);
      }
    };

    init();
  }, [actor]);

  return { puter: puterInstance, isReady };
}
