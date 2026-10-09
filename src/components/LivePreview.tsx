import { useMemo, useState } from "react";
import { SandpackProvider, SandpackCodeEditor, SandpackPreview, SandpackFileExplorer, SandpackLayout } from "@codesandbox/sandpack-react";
import { Monitor, Play, RotateCcw, Smartphone, Code2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "./ThemeToggle";
import { preparePreview } from "@/lib/preview";
import type { FileMap } from "@/lib/zip";

export default function LivePreview({ files }: { files: FileMap }) {
  const project = useMemo(() => preparePreview(files), [files]);
  const { theme } = useTheme();
  const [running, setRunning] = useState(false);
  const [revision, setRevision] = useState(0);
  const [mobile, setMobile] = useState(false);
  const [editor, setEditor] = useState(true);
  if (!project.supported) return <div className="border-y border-border py-10"><h2 className="text-lg font-semibold">Preview unavailable</h2><p className="mt-2 max-w-xl text-sm text-muted-foreground">{project.reason}</p></div>;
  if (!running) return <div className="border-y border-border py-10"><h2 className="text-lg font-semibold">Ready to preview</h2><p className="mt-2 max-w-xl text-sm text-muted-foreground">Runs the loaded website in an isolated CodeSandbox preview. Project files are sent to CodeSandbox to compile; missing assets or server services may not work.</p><Button className="mt-5" onClick={() => setRunning(true)}><Play />Run live preview</Button></div>;
  return <div className="live-preview space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <span className="flex items-center gap-2 text-sm text-success"><span className="size-2 rounded-full bg-success" />Live preview</span>
      <div className="flex items-center gap-1">
        <Button variant={editor ? "secondary" : "ghost"} size="icon" title="Toggle code editor" aria-label="Toggle code editor" aria-pressed={editor} onClick={() => setEditor(!editor)}><Code2 /></Button>
        <Button variant={!mobile ? "secondary" : "ghost"} size="icon" title="Desktop preview" aria-label="Desktop preview" aria-pressed={!mobile} onClick={() => setMobile(false)}><Monitor /></Button>
        <Button variant={mobile ? "secondary" : "ghost"} size="icon" title="Phone preview" aria-label="Phone preview" aria-pressed={mobile} onClick={() => setMobile(true)}><Smartphone /></Button>
        <Button variant="ghost" size="icon" title="Reset preview edits" aria-label="Reset preview edits" onClick={() => setRevision(revision + 1)}><RotateCcw /></Button>
      </div>
    </div>
    <p className="text-xs text-muted-foreground">Preview edits are temporary and do not change the imported source.</p>
    <SandpackProvider key={revision} template={project.template} files={project.files} customSetup={{ dependencies: project.dependencies }} theme={theme} options={{ activeFile: project.activeFile, autorun: true, recompileMode: "delayed", recompileDelay: 500 }}>
      <SandpackLayout>
        {editor && <div className="preview-editor"><SandpackFileExplorer /><SandpackCodeEditor showTabs showLineNumbers closableTabs={false} /></div>}
        <div className={mobile ? "preview-output preview-phone" : "preview-output"}><SandpackPreview showOpenInCodeSandbox={false} showRefreshButton showNavigator={false} /></div>
      </SandpackLayout>
    </SandpackProvider>
  </div>;
}