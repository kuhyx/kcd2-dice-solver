/**
 * Everything the build writes for agents, as plain (fileName, source) pairs.
 *
 * Kept free of Vite types so it is unit-testable; `vitePlugin.ts` only hands
 * these to Rollup. The host serves dist/ as static files with no SPA fallback,
 * so every URL the pages advertise must be one of these files.
 */

import { aiCatalog, llmsTxt, robotsTxt, sitemapXml } from "./discovery.ts";
import { HOME_PAGE, NOT_FOUND_PAGE, PAGES, htmlFileName, markdownPath } from "./pages.ts";
import { headTags, renderArticle, renderDocument } from "./renderHtml.ts";
import { renderMarkdown } from "./renderMarkdown.ts";
import { CATALOG_PATH, LLMS_PATH, SITEMAP_PATH } from "./siteConfig.ts";

/** One file to emit into dist/. */
export interface SiteFile {
  /** Path relative to dist/, no leading slash. */
  readonly fileName: string;
  readonly source: string;
}

const ROOT_MARKER = '<div id="root"></div>';
const HEAD_END = "</head>";

/**
 * Prerender the home page into the app's index.html.
 *
 * The content goes inside #root, where React's first render replaces it, so
 * no-JS readers get the page and JS users get the app in the same place.
 *
 * @param html - The index.html template.
 * @returns The template with head tags and prerendered body content.
 * @throws When the template no longer has the expected markers.
 */
export function injectIntoIndexHtml(html: string): string {
  if (!html.includes(ROOT_MARKER)) {
    throw new Error(`index.html has no empty ${ROOT_MARKER} (#root) to prerender into`);
  }
  if (!html.includes(HEAD_END)) {
    throw new Error("index.html has no </head> for the discovery tags");
  }
  // Replacer functions, not strings: a `$&` in page text must stay literal.
  return html
    .replace(HEAD_END, () => `  ${headTags(HOME_PAGE)}\n  ${HEAD_END}`)
    .replace(ROOT_MARKER, () => `<div id="root">${renderArticle(HOME_PAGE)}</div>`);
}

/**
 * The files emitted alongside the app bundle.
 *
 * @param cssHref - Root-absolute URL of the app stylesheet, if the build has one.
 * @returns Every non-entry file, index.html excluded (it is the Vite entry).
 */
export function siteFiles(cssHref: string | undefined): readonly SiteFile[] {
  const pages = PAGES.flatMap((page) => [
    { fileName: markdownPath(page).slice(1), source: renderMarkdown(page) },
    ...(page === HOME_PAGE ? [] : [{ fileName: htmlFileName(page), source: renderDocument(page, cssHref) }]),
  ]);
  return [
    { fileName: "robots.txt", source: robotsTxt() },
    { fileName: SITEMAP_PATH.slice(1), source: sitemapXml() },
    { fileName: LLMS_PATH.slice(1), source: llmsTxt() },
    { fileName: CATALOG_PATH.slice(1), source: `${JSON.stringify(aiCatalog(), null, 2)}\n` },
    { fileName: htmlFileName(NOT_FOUND_PAGE), source: renderDocument(NOT_FOUND_PAGE, cssHref) },
    ...pages,
  ];
}
