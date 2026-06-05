import { useRef } from "react";
import {
  SandpackProvider,
  SandpackCodeEditor,
  SandpackFileExplorer,
  type SandboxEnvironment,
  SandpackPreview,
} from "@codesandbox/sandpack-react";
import { autocompletion } from "@codemirror/autocomplete";
import type { Template } from "./sandpack/types";
import ResizableLayout from "./components/ResizableLayout";
import Header from "./components/Header";
import { PreviewBrokenOverlay } from "./components/PreviewBrokenOverlay";
import { PreviewStatusOverlay } from "./components/PreviewStatusOverlay";
import { SandpackRuntimeSync } from "./components/SandpackRuntimeSync";
import { getSandboxDependencies } from "./sandpack/dependencies";
import { useSandpackData } from "./sandpack/useSandpackData";
import { getBundlerUrl } from "./sandpack/bundlerUrl";
import { PreviewWatchdogProvider } from "./sandpack/useSandpackWatchdog";
import "./App.css";

const extensions = [autocompletion()];

const DEFAULT_TEMPLATE = "hello-world";
const VALID_TEMPLATES = new Set<Template>(["hello-world", "todo", "chat", "matrix"]);

function getTemplateParam() {
  const tmpl = new URLSearchParams(window.location.search).get("template") as Template | null;
  if (tmpl && VALID_TEMPLATES.has(tmpl)) return tmpl;

  return DEFAULT_TEMPLATE;
}

export default function App() {
  const appRef = useRef<HTMLDivElement>(null);
  const previewVisibleRef = useRef(true);
  const tmpl = getTemplateParam();
  const sandpackData = useSandpackData(tmpl);

  const togglePreview = () => {
    const app = appRef.current;
    if (!app) return;

    previewVisibleRef.current = !previewVisibleRef.current;
    app.dataset.preview = previewVisibleRef.current ? "visible" : "hidden";
  };

  return (
    <div ref={appRef} className="app" data-preview="visible">
      {sandpackData ? (
        <SandpackProvider
          key={tmpl}
          files={sandpackData.files}
          options={{
            activeFile: sandpackData.activeFile,
            visibleFiles: [sandpackData.activeFile],
            initMode: "user-visible",
            bundlerURL: getBundlerUrl(),
            recompileMode: "immediate",
            externalResources: [],
            autoReload: true,
            autorun: true,
          }}
          customSetup={{
            environment: (sandpackData.environment ?? "create-react-app") as SandboxEnvironment,
            entry: sandpackData.entry,
            dependencies: getSandboxDependencies(sandpackData),
          }}
        >
          <Header template={tmpl} onTogglePreview={togglePreview} />
          <main className="app-main">
            <SandpackRuntimeSync
              entry={sandpackData.entry}
              environment={sandpackData.environment}
              tmpl={tmpl}
            />
            <ResizableLayout
              left={<SandpackFileExplorer autoHiddenFiles={false} />}
              middle={
                <SandpackCodeEditor showTabs showLineNumbers closableTabs extensions={extensions} />
              }
              right={
                <div className="preview-pane">
                  <PreviewWatchdogProvider>
                    <SandpackPreview startRoute="" />
                    <PreviewStatusOverlay />
                    <PreviewBrokenOverlay />
                  </PreviewWatchdogProvider>
                </div>
              }
            />
          </main>
        </SandpackProvider>
      ) : null}
    </div>
  );
}
