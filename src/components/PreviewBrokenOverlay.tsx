import { usePreviewWatchdog } from "../sandpack/useSandpackWatchdog";
import { PreviewOverlay } from "./PreviewOverlay";

export function PreviewBrokenOverlay() {
  const { isBroken } = usePreviewWatchdog();

  if (!isBroken) return null;

  return (
    <PreviewOverlay className="preview-broken" title="Preview crashed">
      <p className="preview-broken-sub">
        Click <strong>Restart Preview</strong> in the header to restore
      </p>
    </PreviewOverlay>
  );
}
