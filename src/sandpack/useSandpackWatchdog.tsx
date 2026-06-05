import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { PropsWithChildren } from "react";
import { getPreviewIframe, onRestartPreview, stopPreviewIframe } from "./previewIframe";

const TIMEOUT_MS = 3000;
const CHECK_INTERVAL = 1000;
const RESTART_DELAY_MS = 1000;
const HEARTBEAT_MESSAGE = "livecoding-preview-heartbeat";

export interface PreviewError {
  message: string;
  title: string;
}

export interface PreviewWatchdogState {
  error: PreviewError | null;
  isBroken: boolean;
}

const PreviewWatchdogContext = createContext<PreviewWatchdogState | null>(null);

export function PreviewWatchdogProvider({ children }: PropsWithChildren) {
  const [error, setError] = useState<PreviewError | null>(null);
  const [isBroken, setBroken] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);

  useEffect(() => {
    let lastHeartbeat: number | null = null;
    let restartTimer: number | undefined;

    const restartPreview = () => {
      stopPreviewIframe();
      setBroken(true);
      setError(null);

      window.clearTimeout(restartTimer);
      restartTimer = window.setTimeout(() => {
        lastHeartbeat = null;
        setPreviewKey((key) => key + 1);
        setBroken(false);
      }, RESTART_DELAY_MS);
    };

    const onMessage = (event: MessageEvent<unknown>) => {
      const iframe = getPreviewIframe();
      if (event.source !== iframe?.contentWindow) return;

      if (isHeartbeat(event.data)) {
        lastHeartbeat = Date.now();
        setBroken(false);
        return;
      }

      if (!isSandpackPreviewMessage(event.data)) return;

      if (event.data.type === "action" && event.data.action === "show-error") {
        setError({
          message: event.data.message ?? "Unknown preview error",
          title: event.data.title ?? "Preview not updated",
        });
        return;
      }

      if (event.data.type === "done" && !event.data.compilatonError) {
        setError(null);
      }
    };

    window.addEventListener("message", onMessage);

    const interval = window.setInterval(() => {
      const iframe = getPreviewIframe();
      if (!iframe) return;
      if (lastHeartbeat === null) return;

      if (Date.now() - lastHeartbeat > TIMEOUT_MS) {
        if (stopPreviewIframe()) {
          lastHeartbeat = null;
          setBroken(true);
        }
      }
    }, CHECK_INTERVAL);

    const unsubscribeRestart = onRestartPreview(restartPreview);

    return () => {
      window.removeEventListener("message", onMessage);
      window.clearInterval(interval);
      window.clearTimeout(restartTimer);
      unsubscribeRestart();
    };
  }, []);

  const value = useMemo<PreviewWatchdogState>(() => ({ error, isBroken }), [error, isBroken]);

  return (
    <PreviewWatchdogContext.Provider value={value}>
      <div className={isBroken ? "preview-watchdog preview-watchdog-broken" : "preview-watchdog"}>
        <div key={previewKey} className="preview-watchdog-sandbox">
          {children}
        </div>
      </div>
    </PreviewWatchdogContext.Provider>
  );
}

export function usePreviewWatchdog(): PreviewWatchdogState {
  const context = useContext(PreviewWatchdogContext);
  if (!context) {
    throw new Error("usePreviewWatchdog must be used inside PreviewWatchdogProvider");
  }

  return context;
}

function isHeartbeat(data: unknown) {
  return (
    typeof data === "object" &&
    data !== null &&
    "type" in data &&
    data.type === HEARTBEAT_MESSAGE
  );
}

function isSandpackPreviewMessage(data: unknown): data is {
  action?: string;
  compilatonError?: boolean;
  message?: string;
  title?: string;
  type: string;
} {
  return (
    typeof data === "object" &&
    data !== null &&
    "codesandbox" in data &&
    data.codesandbox === true &&
    "type" in data &&
    typeof data.type === "string"
  );
}
