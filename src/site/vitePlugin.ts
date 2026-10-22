/**
 * Vite plugin that makes the build agent-readable.
 *
 * It prerenders the home page into index.html and emits robots.txt,
 * sitemap.xml, llms.txt, the AI Catalog, 404.html, the how-it-works page and a
 * markdown mirror of every page. All content comes from `build.ts`; this file
 * is only the Rollup wiring, and the AgentReady dist check
 * (`~/src/utils/agent_ready/check.sh dist dist`) is its end-to-end test.
 */

import type { Plugin } from "vite";
import { injectIntoIndexHtml, siteFiles } from "./build.ts";

/**
 * The plugin.
 *
 * @returns A Vite plugin; add it to `plugins` in vite.config.ts.
 */
export function agentReadySite(): Plugin {
  return {
    name: "kcd2-agent-ready-site",
    transformIndexHtml: injectIntoIndexHtml,
    generateBundle(_options, bundle) {
      // The app's one stylesheet, so the standalone pages share its look.
      const css = Object.values(bundle).find(
        (item) => item.type === "asset" && item.fileName.endsWith(".css"),
      );
      for (const file of siteFiles(css === undefined ? undefined : `/${css.fileName}`)) {
        this.emitFile({ type: "asset", fileName: file.fileName, source: file.source });
      }
    },
  };
}
