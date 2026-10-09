import { describe, expect, it } from "vitest";
import { preparePreview } from "@/lib/preview";
import { demoFiles } from "@/lib/mentor";

describe("Live project preview", () => {
  it("runs the loaded React demo, not a replacement sample", () => {
    const result = preparePreview(demoFiles);
    expect(result.supported).toBe(true);
    if (!result.supported) throw new Error("Expected a runnable demo");
    expect(result.template).toBe("react-ts");
    expect(result.files["/src/App.tsx"]).toBe(demoFiles["src/App.tsx"]);
    expect(result.files["/index.tsx"]).toContain("./src/App.tsx");
  });
  it("prepares loaded HTML and its CSS and JavaScript", () => {
    const result = preparePreview({ "index.html": '<h1>My website</h1><script src="app.js"></script>', "app.js": "document.title='My website'", "style.css": "h1{color:red}" });
    expect(result.supported).toBe(true);
    if (!result.supported) throw new Error("Expected a runnable website");
    expect(result.template).toBe("vanilla");
    expect(result.files["/app.js"]).toBe("document.title='My website'");
  });
  it("does not claim to run server-only projects", () => {
    expect(preparePreview({ "app.py": "print('hello')" }).supported).toBe(false);
    expect(preparePreview({ ...demoFiles, "package.json": '{"dependencies":{"next":"15.0.0","react":"19.0.0"}}' }).supported).toBe(false);
  });
  it("uses an existing React entry without mounting a second app", () => {
    const result = preparePreview({ ...demoFiles, "src/main.tsx": "import './App'" });
    if (!result.supported) throw new Error("Expected React preview");
    expect(result.files["/index.tsx"]).toBe("import './src/main.tsx';");
  });
});