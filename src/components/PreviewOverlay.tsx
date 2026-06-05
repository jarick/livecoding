import type { ReactNode } from "react";

interface PreviewOverlayProps {
  children: ReactNode;
  className?: string;
  title: string;
}

export function PreviewOverlay({ children, className = "", title }: PreviewOverlayProps) {
  return (
    <div className={`preview-overlay ${className}`}>
      <div className="preview-overlay-content">
        <div className="preview-overlay-icon">!</div>
        <p className="preview-overlay-title">{title}</p>
        {children}
      </div>
    </div>
  );
}
