/**
 * Pages as static HTML: the body an agent reads and the head that points it at
 * the machine-readable files.
 *
 * Plain string templates rather than React's renderToString: the content is a
 * handful of headings, paragraphs and lists, and keeping it out of the React
 * tree means the vite config can render it without bundling the app.
 */

import type { Block, SitePage } from "./pageTypes.ts";
import { PAGES, markdownPath } from "./pages.ts";
import {
  AUTHOR,
  CATALOG_PATH,
  CATALOG_TYPE,
  LLMS_PATH,
  SITE_NAME,
  SITEMAP_PATH,
  absoluteUrl,
} from "./siteConfig.ts";

const ESCAPES: Readonly<Record<string, string>> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/**
 * Escape text for an HTML element body or a quoted attribute.
 *
 * @param text - Plain text.
 * @returns HTML-safe text.
 */
export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (char) => ESCAPES[char]);
}

/**
 * True for pages in the sitemap (they have a canonical URL and a mirror).
 *
 * @param page - Any page.
 * @returns Whether the page is a directory-style sitemap page.
 */
function isListed(page: SitePage): boolean {
  return page.path.endsWith("/");
}

/**
 * One body block as HTML.
 *
 * @param block - The block.
 * @returns Its markup.
 */
function renderBlock(block: Block): string {
  switch (block.kind) {
    case "p":
      return `<p>${escapeHtml(block.text)}</p>`;
    case "ul":
      return `<ul>${block.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
    case "table": {
      const head = block.head.map((cell) => `<th scope="col">${escapeHtml(cell)}</th>`).join("");
      const rows = block.rows
        .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`)
        .join("");
      return `<table><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table>`;
    }
    case "links":
      return `<ul>${block.items
        .map(
          (link) =>
            `<li><a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a>: ${escapeHtml(link.note)}</li>`,
        )
        .join("")}</ul>`;
  }
}

/**
 * The page's semantic content, including site navigation.
 *
 * @param page - The page.
 * @returns An `<article class="prose">` element.
 */
export function renderArticle(page: SitePage): string {
  const nav = [
    ...PAGES.map((other) => ({ href: other.path, label: other.navLabel })),
    { href: LLMS_PATH, label: "llms.txt" },
    ...(isListed(page) ? [{ href: markdownPath(page), label: "This page as markdown" }] : []),
  ]
    .map((link) => `<a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a>`)
    .join(" · ");
  const sections = page.sections
    .map(
      (section) =>
        `<section><h2>${escapeHtml(section.heading)}</h2>${section.blocks.map(renderBlock).join("")}</section>`,
    )
    .join("");
  return (
    `<article class="prose"><nav aria-label="Site">${nav}</nav>` +
    `<h1>${escapeHtml(page.heading)}</h1><p class="lead">${escapeHtml(page.description)}</p>` +
    `${sections}<footer><p>Made by ${AUTHOR}. Dice data from the Kingdom Come wiki.</p></footer></article>`
  );
}

/**
 * The page's schema.org description.
 *
 * @param page - The page.
 * @returns A JSON-LD object with an `@context`.
 */
export function jsonLd(page: SitePage): Record<string, unknown> {
  const base = {
    "@context": "https://schema.org",
    "@type": page.schemaType,
    url: absoluteUrl(page.path),
    description: page.description,
    inLanguage: "en",
    author: { "@type": "Person", name: AUTHOR },
  };
  if (page.schemaType !== "WebApplication") {
    return { ...base, headline: page.heading, isPartOf: { "@type": "WebSite", name: SITE_NAME, url: absoluteUrl("/") } };
  }
  return {
    ...base,
    name: SITE_NAME,
    applicationCategory: "GameApplication",
    operatingSystem: "Any (runs in a web browser)",
    browserRequirements: "Requires JavaScript",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
    about: { "@type": "VideoGame", name: "Kingdom Come: Deliverance II" },
  };
}

/**
 * Head tags: description, discovery links and JSON-LD.
 *
 * @param page - The page.
 * @returns Markup to place inside `<head>`.
 */
export function headTags(page: SitePage): string {
  const tags = [`<meta name="description" content="${escapeHtml(page.description)}">`];
  if (isListed(page)) {
    // `<` is escaped inside the JSON so no string can close the script element.
    const ld = JSON.stringify(jsonLd(page)).replace(/</g, "\\u003c");
    tags.push(
      `<link rel="canonical" href="${absoluteUrl(page.path)}">`,
      `<link rel="alternate" type="text/markdown" href="${markdownPath(page)}">`,
      `<script type="application/ld+json">${ld}</script>`,
    );
  } else {
    tags.push('<meta name="robots" content="noindex">');
  }
  tags.push(
    `<link rel="ai-catalog" type="${CATALOG_TYPE}" href="${CATALOG_PATH}">`,
    `<link rel="sitemap" type="application/xml" href="${SITEMAP_PATH}">`,
  );
  return tags.join("\n    ");
}

/**
 * A complete standalone document (every page except the app's index.html).
 *
 * @param page - The page.
 * @param cssHref - Root-absolute URL of the app stylesheet, when the build has one.
 * @returns The HTML document.
 */
export function renderDocument(page: SitePage, cssHref?: string): string {
  const css = cssHref === undefined ? "" : `\n    <link rel="stylesheet" href="${escapeHtml(cssHref)}">`;
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(page.title)}</title>
    ${headTags(page)}${css}
  </head>
  <body>
    ${renderArticle(page)}
  </body>
</html>
`;
}
