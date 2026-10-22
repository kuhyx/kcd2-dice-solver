/** The file set the build emits next to the app bundle. */

/**
 * The Caddy container serves dist/ as plain files with no SPA fallback, so every
 * URL an agent may follow has to exist as a real file. These tests tie the URLs
 * the pages, llms.txt and the catalog advertise to the files actually emitted.
 */

import { describe, expect, it } from "vitest";
import { aiCatalog, llmsTxt } from "./discovery.ts";
import { injectIntoIndexHtml, siteFiles } from "./build.ts";
import { PAGES, markdownPath } from "./pages.ts";
import { ORIGIN } from "./siteConfig.ts";

const TEMPLATE = `<!doctype html>
<html lang="en">
  <head>
    <title>KCD2 Dice Solver</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
`;

/**
 * The emitted file a static host would serve for a site path.
 *
 * @param path - Absolute site path, e.g. `/how-it-works/`.
 * @returns The dist-relative file name.
 */
function fileFor(path: string): string {
  return path.endsWith("/") ? `${path.slice(1)}index.html` : path.slice(1);
}

describe("siteFiles", () => {
  const files = siteFiles("/assets/index-abc.css");
  const names = files.map((file) => file.fileName);

  it("emits every discovery file and the 404 page", () => {
    expect(names).toEqual(
      expect.arrayContaining([
        "robots.txt",
        "sitemap.xml",
        "llms.txt",
        ".well-known/ai-catalog.json",
        "404.html",
      ]),
    );
    expect(new Set(names).size).toBe(names.length);
  });

  it("emits a markdown mirror for every page and HTML for every non-root page", () => {
    for (const page of PAGES) {
      expect(names).toContain(markdownPath(page).slice(1));
      if (page.path !== "/") {
        expect(names).toContain(fileFor(page.path));
      }
    }
    // index.html is the Vite entry; emitting it again would clobber the app.
    expect(names).not.toContain("index.html");
  });

  it("resolves every URL that llms.txt and the catalog advertise", () => {
    const urls = [
      ...[...llmsTxt().matchAll(/\]\((https:[^)]+)\)/g)].map((match) => match[1]),
      ...aiCatalog().entries.map((entry) => entry.url),
    ];
    for (const url of urls) {
      expect(url.startsWith(ORIGIN)).toBe(true);
      const file = fileFor(url.slice(ORIGIN.length));
      expect(file === "index.html" || names.includes(file), file).toBe(true);
    }
  });

  it("serialises the catalog as JSON", () => {
    const catalog = files.find((file) => file.fileName === ".well-known/ai-catalog.json");
    expect(JSON.parse(catalog?.source ?? "")).toEqual(aiCatalog());
  });

  it("styles the standalone pages with the app stylesheet when there is one", () => {
    const howItWorks = files.find((file) => file.fileName === "how-it-works/index.html");
    expect(howItWorks?.source).toContain('<link rel="stylesheet" href="/assets/index-abc.css">');
    const bare = siteFiles(undefined).find((file) => file.fileName === "404.html");
    expect(bare?.source).not.toContain('rel="stylesheet"');
  });
});

describe("injectIntoIndexHtml", () => {
  const html = injectIntoIndexHtml(TEMPLATE);
  const doc = new DOMParser().parseFromString(html, "text/html");

  it("prerenders the home page inside #root for React to replace", () => {
    const root = doc.getElementById("root");
    expect(root?.querySelector("h1")?.textContent).toBe("KCD2 Dice Solver");
    expect((root?.textContent ?? "").length).toBeGreaterThan(800);
  });

  it("adds the discovery links and JSON-LD to the head", () => {
    expect(doc.head.querySelector('link[rel="ai-catalog"]')).not.toBeNull();
    expect(doc.head.querySelector('link[rel="alternate"][type="text/markdown"]')).not.toBeNull();
    expect(doc.head.querySelector('script[type="application/ld+json"]')).not.toBeNull();
  });

  it("refuses a template whose markers moved, rather than shipping an empty page", () => {
    expect(() => injectIntoIndexHtml("<html><body></body></html>")).toThrow(/#root/);
    expect(() => injectIntoIndexHtml('<div id="root"></div>')).toThrow(/<\/head>/);
  });
});
