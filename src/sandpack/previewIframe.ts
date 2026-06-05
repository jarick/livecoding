const PREVIEW_IFRAME_SELECTOR = ".sp-preview-iframe";
const RESTART_PREVIEW_EVENT = "livecoding-restart-preview";

export function getPreviewIframe() {
  return document.querySelector<HTMLIFrameElement>(PREVIEW_IFRAME_SELECTOR);
}

export function restartPreviewIframe() {
  window.dispatchEvent(new CustomEvent(RESTART_PREVIEW_EVENT));
}

export function onRestartPreview(callback: () => void) {
  window.addEventListener(RESTART_PREVIEW_EVENT, callback);

  return () => {
    window.removeEventListener(RESTART_PREVIEW_EVENT, callback);
  };
}

export function stopPreviewIframe() {
  const iframe = getPreviewIframe();
  if (!iframe) return false;

  iframe.remove();
  return true;
}
