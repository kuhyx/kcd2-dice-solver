/**
 * Pages as markdown: the mirror advertised by each page's
 * `<link rel="alternate" type="text/markdown">`.
 *
 * Links are written absolute, because a mirror is often read outside the site
 * (pasted into a chat, cached by an agent) where a root-relative link is dead.
 */

import type { Block, SitePage } from "./pageTypes.ts";
import { PAGES } from "./pages.ts";
import { LLMS_PATH, absoluteUrl } from "./siteConfig.ts";

/**
 * Absolute form of a page link.
 *
 * @param href - Root-absolute path or external URL.
 * @returns A URL that works anywhere.
 */
function absolute(href: string): string {
  return href.startsWith("/") ? absoluteUrl(href) : href;
}

/**
 * One table row, with pipes in cells escaped so they cannot split a column.
 *
 * @param cells - Cell texts.
 * @returns A GFM table row.
 */
function tableRow(cells: readonly string[]): string {
  return `| ${cells.map((cell) => cell.replace(/\|/g, "\\|")).join(" | ")} |`;
}

/**
 * One body block as markdown.
 *
 * @param block - The block.
 * @returns Its markdown.
 */
function renderBlock(block: Block): string {
  switch (block.kind) {
    case "p":
      return block.text;
    case "ul":
      return block.items.map((item) => `- ${item}`).join("\n");
    case "table":
      return [tableRow(block.head), tableRow(block.head.map(() => "---")), ...block.rows.map(tableRow)].join(
        "\n",
      );
    case "links":
      return block.items.map((link) => `- [${link.label}](${absolute(link.href)}): ${link.note}`).join("\n");
  }
}

/**
 * The whole page as markdown.
 *
 * @param page - The page.
 * @returns The mirror's contents.
 */
export function renderMarkdown(page: SitePage): string {
  const nav = [
    ...PAGES.map((other) => `[${other.navLabel}](${absoluteUrl(other.path)})`),
    `[llms.txt](${absoluteUrl(LLMS_PATH)})`,
  ].join(" · ");
  const parts = [`# ${page.heading}`, `> ${page.description}`, `Canonical page: ${absoluteUrl(page.path)}`, nav];
  for (const section of page.sections) {
    parts.push(`## ${section.heading}`, ...section.blocks.map(renderBlock));
  }
  return `${parts.join("\n\n")}\n`;
}
