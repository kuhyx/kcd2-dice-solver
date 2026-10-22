/** The prerendered HTML and its markdown mirror. */

/**
 * An agent that does not run JavaScript sees only what these renderers emit, so
 * the assertions mirror what the AgentReady checker measures: visible text,
 * real links, JSON-LD, and the discovery `<link>`s in the head.
 */

import { describe, expect, it } from "vitest";
import { BADGES } from "../data/badges.ts";
import { DICE } from "../data/dice.ts";
import { HOME_PAGE, HOW_IT_WORKS_PAGE, NOT_FOUND_PAGE, PAGES, markdownPath } from "./pages.ts";
import type { SitePage } from "./pages.ts";
import { escapeHtml, headTags, jsonLd, renderArticle, renderDocument } from "./renderHtml.ts";
import { renderMarkdown } from "./renderMarkdown.ts";
import { CATALOG_PATH, LLMS_PATH, ORIGIN } from "./siteConfig.ts";

/**
 * Parse a full document the way a browser would.
 *
 * @param html - The document source.
 * @returns The parsed document.
 */
function parse(html: string): Document {
  return new DOMParser().parseFromString(html, "text/html");
}

/**
 * Visible body text, ignoring scripts and styles like a non-JS agent does.
 *
 * @param doc - A parsed document.
 * @returns Whitespace-collapsed text.
 */
function visibleText(doc: Document): string {
  for (const hidden of doc.body.querySelectorAll("script, style, noscript, template")) {
    hidden.remove();
  }
  return doc.body.textContent.replace(/\s+/g, " ").trim();
}

describe("escapeHtml", () => {
  it("escapes every character that could open markup or an attribute", () => {
    expect(escapeHtml(`<a href="x">Tom & 'Jerry'</a>`)).toBe(
      "&lt;a href=&quot;x&quot;&gt;Tom &amp; &#39;Jerry&#39;&lt;/a&gt;",
    );
  });
});

describe.each(PAGES.map((page) => [page.path, page] as const))("page %s", (_path, page) => {
  const doc = parse(renderDocument(page));

  it("carries a real answer in the initial HTML", () => {
    expect(visibleText(doc).length).toBeGreaterThan(800);
    expect(doc.querySelector("h1")?.textContent).toBe(page.heading);
  });

  it("links the other pages and llms.txt with plain anchors", () => {
    const hrefs = [...doc.querySelectorAll("a[href]")].map((a) => a.getAttribute("href"));
    for (const other of PAGES) {
      expect(hrefs).toContain(other.path);
    }
    expect(hrefs).toContain(LLMS_PATH);
  });

  it("advertises its markdown mirror, the AI Catalog and a canonical URL", () => {
    const head = doc.head;
    expect(head.querySelector('link[rel="alternate"][type="text/markdown"]')?.getAttribute("href")).toBe(
      markdownPath(page),
    );
    expect(head.querySelector('link[rel="ai-catalog"]')?.getAttribute("href")).toBe(CATALOG_PATH);
    expect(head.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe(`${ORIGIN}${page.path}`);
    expect(head.querySelector('meta[name="description"]')?.getAttribute("content")).toBe(page.description);
  });

  it("embeds parseable JSON-LD with a schema.org @context", () => {
    const script = doc.querySelector('script[type="application/ld+json"]');
    const data = JSON.parse(script?.textContent ?? "") as Record<string, unknown>;
    expect(data["@context"]).toBe("https://schema.org");
    expect(data.url).toBe(`${ORIGIN}${page.path}`);
  });

  it("renders a markdown mirror without any HTML", () => {
    const md = renderMarkdown(page);
    expect(md.startsWith(`# ${page.heading}\n`)).toBe(true);
    expect(md).not.toMatch(/<[a-z!/]/i);
    expect(md).not.toContain("```");
    for (const section of page.sections) {
      expect(md).toContain(`## ${section.heading}`);
    }
  });
});

describe("home page", () => {
  it("is a WebApplication about KCD2", () => {
    const data = jsonLd(HOME_PAGE);
    expect(data["@type"]).toBe("WebApplication");
    expect(data.applicationCategory).toBe("GameApplication");
    expect(JSON.stringify(data.about)).toContain("Kingdom Come: Deliverance II");
  });

  it("quotes the real dice and badge counts", () => {
    const text = renderMarkdown(HOME_PAGE);
    expect(text).toContain(`${DICE.length} dice`);
    expect(text).toContain(`${BADGES.length} badges`);
  });
});

describe("how-it-works page", () => {
  it("is a TechArticle and carries the scoring table", () => {
    expect(jsonLd(HOW_IT_WORKS_PAGE)["@type"]).toBe("TechArticle");
    const doc = parse(renderDocument(HOW_IT_WORKS_PAGE));
    const cells = [...doc.querySelectorAll("td")].map((td) => td.textContent);
    expect(cells).toEqual(expect.arrayContaining(["Straight 1-6", "1500", "Each 5", "50"]));
    expect(renderMarkdown(HOW_IT_WORKS_PAGE)).toContain("| Straight 1-6 | 1500 |");
  });
});

describe("404 page", () => {
  const doc = parse(renderDocument(NOT_FOUND_PAGE));

  it("explains the miss and links back with root-absolute hrefs", () => {
    expect(visibleText(doc)).toMatch(/not found/i);
    const hrefs = [...doc.querySelectorAll("a[href], link[href]")].map((el) => el.getAttribute("href"));
    expect(hrefs).toContain("/");
    for (const href of hrefs) {
      expect(href).toMatch(/^(\/|https:\/\/)/);
    }
  });

  it("is not indexed", () => {
    expect(doc.head.querySelector('meta[name="robots"]')?.getAttribute("content")).toBe("noindex");
  });
});

describe("renderers", () => {
  const hostile: SitePage = {
    ...HOME_PAGE,
    heading: "<script>alert(1)</script>",
    description: "</script>alert(2)",
    sections: [{ heading: "a|b", blocks: [{ kind: "table", head: ["x|y"], rows: [["<b>"]] }] }],
  };

  it("never lets content break out of its element", () => {
    const html = renderArticle(hostile);
    expect(html).not.toContain("<script>alert");
    expect(html).toContain("&lt;b&gt;");
  });

  it("keeps </script> out of the JSON-LD block", () => {
    expect(headTags(hostile)).not.toMatch(/<\/script>alert/);
    expect(headTags(hostile)).toContain("\\u003c/script>alert(2)");
  });

  it("escapes pipes inside markdown table cells", () => {
    expect(renderMarkdown(hostile)).toContain("| x\\|y |");
  });
});
