import { clearSandpackCache } from "../sandpack/storage";
import type { Template } from "../sandpack/types";
import { restartPreviewIframe } from "../sandpack/previewIframe";

export default function Header({
  onTogglePreview,
  template,
}: {
  onTogglePreview: () => void;
  template: Template;
}) {
  return (
    <header className="app-header">
      <div className="header-text">
        <h1>⚡ Live Code Sandbox</h1>
        <p>Self-hosted code editor &amp; sandbox</p>
      </div>
      <button
        className="repair-btn"
        type="button"
        onClick={restartPreviewIframe}
      >
        Restart Preview
      </button>
      <button
        className="toggle-btn"
        type="button"
        aria-label="Toggle preview"
        onClick={onTogglePreview}
      />
      <button
        className="reset-btn"
        type="button"
        onClick={() => {
          if (confirm("Reset editor data? All changes will be lost.")) {
            clearSandpackCache(template);
            location.reload();
          }
        }}
      >
        Reset
      </button>
    </header>
  );
}
