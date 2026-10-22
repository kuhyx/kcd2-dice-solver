/**
 * The machine-readable files agents look for before reading any page:
 * robots.txt, sitemap.xml, llms.txt and the AI Catalog.
 *
 * Formats: robots.txt per RFC 9309, sitemaps.org 0.9, llms.txt per
 * llmstxt.org (H1, blockquote summary, H2 link lists) and the AI Catalog
 * specVersion 1.0 (see ~/src/utils/agent_ready/DOCS-spec-notes.md).
 */

import { PAGES, markdownPath } from "./pages.ts";
import { HOW_IT_WORKS_PAGE } from "./howItWorksPage.ts";
import { HOME_PAGE } from "./homePage.ts";
import {
  AUTHOR,
  HOST,
  LLMS_PATH,
  SITE_NAME,
  SITEMAP_PATH,
  absoluteUrl,
} from "./siteConfig.ts";

/**
 * Crawlers named explicitly as well as covered by `*`. kuhy chose to allow
 * training crawlers too, so naming them is a statement, not a restriction.
 */
const NAMED_AGENTS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "CCBot",
  "Google-Extended",
  "PerplexityBot",
  "Applebot-Extended",
] as const;

/**
 * robots.txt: everything allowed for everyone, plus the sitemap.
 *
 * @returns The file contents.
 */
export function robotsTxt(): string {
  const groups = ["*", ...NAMED_AGENTS].map((agent) => `User-agent: ${agent}\nAllow: /\n`);
  return `${groups.join("\n")}\nSitemap: ${absoluteUrl(SITEMAP_PATH)}\n`;
}

/**
 * sitemap.xml listing every HTML page (never the mirrors or discovery files).
 *
 * @returns The file contents.
 */
export function sitemapXml(): string {
  const urls = PAGES.map((page) => `  <url>\n    <loc>${absoluteUrl(page.path)}</loc>\n  </url>`);
  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    `${urls.join("\n")}\n</urlset>\n`
  );
}

/**
 * llms.txt: a lean, described index of the site.
 *
 * @returns The file contents.
 */
export function llmsTxt(): string {
  const pages = PAGES.map((page) => `- [${page.navLabel}](${absoluteUrl(page.path)}): ${page.description}`);
  const mirrors = PAGES.map(
    (page) => `- [${page.navLabel} (markdown)](${absoluteUrl(markdownPath(page))}): the same page as plain markdown`,
  );
  return [
    `# ${SITE_NAME}`,
    `> ${HOME_PAGE.description}`,
    "The solver runs entirely in the browser; there is no API. To answer a question about " +
      "which dice to bring, read the pages below. To get a recommendation for a specific " +
      "inventory, open the solver and enter the dice.",
    `## Pages\n\n${pages.join("\n")}`,
    `## Markdown mirrors\n\n${mirrors.join("\n")}`,
    `## Optional\n\n- [Sitemap](${absoluteUrl(SITEMAP_PATH)}): every HTML page on the site`,
  ].join("\n\n") + "\n";
}

/** One AI Catalog entry; this site only ever links resources by URL. */
export interface CatalogEntry {
  readonly identifier: string;
  readonly displayName: string;
  readonly type: string;
  readonly url: string;
}

/** The AI Catalog document. */
export interface AiCatalog {
  readonly specVersion: string;
  readonly host: {
    readonly displayName: string;
    readonly identifier: string;
    readonly documentationUrl: string;
  };
  readonly entries: readonly CatalogEntry[];
}

/**
 * A catalog entry with a URN in the recommended `urn:air:` form.
 *
 * @param name - Entry name, unique within this host.
 * @param displayName - Human-readable label.
 * @param type - Media type of the resource.
 * @param path - Root-absolute path of the resource.
 * @returns The entry.
 */
function entry(name: string, displayName: string, type: string, path: string): CatalogEntry {
  return { identifier: `urn:air:${HOST}:docs:${name}`, displayName, type, url: absoluteUrl(path) };
}

/**
 * `/.well-known/ai-catalog.json`: every agent-facing resource the site ships.
 *
 * @returns The catalog document.
 */
export function aiCatalog(): AiCatalog {
  return {
    specVersion: "1.0",
    host: {
      displayName: `${SITE_NAME} (${AUTHOR})`,
      identifier: HOST,
      documentationUrl: absoluteUrl(HOW_IT_WORKS_PAGE.path),
    },
    entries: [
      entry("llms", "llms.txt index", "text/plain", LLMS_PATH),
      entry("sitemap", "Sitemap", "application/xml", SITEMAP_PATH),
      ...PAGES.map((page) =>
        entry(
          page.path === "/" ? "home-md" : `${page.path.replace(/\//g, "")}-md`,
          `${page.navLabel} (markdown)`,
          "text/markdown",
          markdownPath(page),
        ),
      ),
    ],
  };
}
