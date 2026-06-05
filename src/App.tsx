import { useRef } from "react";
import {
  SandpackProvider,
  SandpackCodeEditor,
  SandpackFileExplorer,
  type SandboxEnvironment,
  SandpackPreview,
} from "@codesandbox/sandpack-react";
import { autocompletion } from "@codemirror/autocomplete";
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

const TEMPLATE_NAME_PATTERN = /^[a-z0-9][a-z0-9-]*$/;

function getTemplateParam(): string | null {
  const tmpl = new URLSearchParams(window.location.search).get("template");
  if (tmpl && TEMPLATE_NAME_PATTERN.test(tmpl)) return tmpl;

  return null;
}

export default function App() {
  const appRef = useRef<HTMLDivElement>(null);
  const previewVisibleRef = useRef(true);
  const requestedTemplate = getTemplateParam();
  const { data: sandpackData, template } = useSandpackData(requestedTemplate);

  const togglePreview = () => {
    const app = appRef.current;
    if (!app) return previewVisibleRef.current;

    previewVisibleRef.current = !previewVisibleRef.current;
    app.dataset.preview = previewVisibleRef.current ? "visible" : "hidden";
    return previewVisibleRef.current;
  };

  return (
    <div ref={appRef} className="app" data-preview="visible">
      {sandpackData ? (
        <SandpackProvider
          key={template}
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
          <Header template={template} onTogglePreview={togglePreview} />
          <main className="app-main">
            <SandpackRuntimeSync
              entry={sandpackData.entry}
              environment={sandpackData.environment}
              tmpl={template}
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
