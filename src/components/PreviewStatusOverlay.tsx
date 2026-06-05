import { usePreviewWatchdog } from "../sandpack/useSandpackWatchdog";
import { PreviewOverlay } from "./PreviewOverlay";

export function PreviewStatusOverlay() {
  const { error: previewError } = usePreviewWatchdog();

  if (!previewError) return null;

  return (
    <PreviewOverlay className="preview-status" title={previewError.title}>
      <pre className="preview-status-message">{previewError.message}</pre>
    </PreviewOverlay>
  );
}
