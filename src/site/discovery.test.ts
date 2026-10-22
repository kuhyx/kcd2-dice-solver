/** robots.txt, sitemap.xml, llms.txt and the AI Catalog. */

/**
 * These files are what an agent reads before it reads any page, and a static
 * host serves them byte-for-byte. Each test pins the shape the shared
 * AgentReady checker (~/src/utils/agent_ready) requires, so a failure here
 * names the broken file instead of surfacing as a red post-deploy check.
 */

import { describe, expect, it } from "vitest";
import { aiCatalog, llmsTxt, robotsTxt, sitemapXml } from "./discovery.ts";
import { PAGES, markdownPath } from "./pages.ts";
import { CATALOG_PATH, LLMS_PATH, ORIGIN, SITEMAP_PATH } from "./siteConfig.ts";

const AGENTS = ["GPTBot", "ClaudeBot", "CCBot", "Google-Extended"];

describe("robotsTxt", () => {
  const robots = robotsTxt();

  it("has a wildcard group that allows everything", () => {
    expect(robots).toMatch(/^User-agent: \*\nAllow: \/$/m);
  });

  it.each(AGENTS)("explicitly allows %s and never disallows it", (agent) => {
    expect(robots).toContain(`User-agent: ${agent}\nAllow: /`);
  });

  it("disallows nothing at all", () => {
    expect(robots).not.toMatch(/^Disallow:\s*\S/m);
  });

  it("points at the sitemap on the canonical origin", () => {
    expect(robots).toContain(`Sitemap: ${ORIGIN}${SITEMAP_PATH}`);
  });
});

describe("sitemapXml", () => {
  const doc = new DOMParser().parseFromString(sitemapXml(), "application/xml");
  const locs = [...doc.getElementsByTagName("loc")].map((loc) => loc.textContent);

  it("is well-formed sitemaps.org XML", () => {
    expect(doc.getElementsByTagName("parsererror")).toHaveLength(0);
    expect(doc.documentElement.tagName).toBe("urlset");
    expect(doc.documentElement.namespaceURI).toBe("http://www.sitemaps.org/schemas/sitemap/0.9");
  });

  it("lists exactly the HTML pages, absolute and on-site", () => {
    expect(locs).toEqual(PAGES.map((page) => `${ORIGIN}${page.path}`));
  });
});

describe("llmsTxt", () => {
  const text = llmsTxt();
  const lines = text.split("\n");

  it("opens with an H1 and a blockquote summary", () => {
    expect(lines[0]).toBe("# KCD2 Dice Solver");
    expect(lines.slice(1).find((line) => line.trim() !== "")).toMatch(/^> \S.{40,}/);
  });

  it("links every page and every markdown mirror in H2 link lists", () => {
    expect(text).toMatch(/^## \S/m);
    for (const page of PAGES) {
      expect(text).toContain(`](${ORIGIN}${page.path}): `);
      expect(text).toContain(`](${ORIGIN}${markdownPath(page)}): `);
    }
  });

  it("only links the canonical origin", () => {
    const urls = [...text.matchAll(/^- \[[^\]]+\]\(([^)]+)\)/gm)].map((match) => match[1]);
    expect(urls.length).toBeGreaterThanOrEqual(PAGES.length * 2);
    for (const url of urls) {
      expect(url.startsWith(`${ORIGIN}/`)).toBe(true);
    }
  });

  it("contains no HTML", () => {
    expect(text).not.toMatch(/<[a-z!/]/i);
  });
});

describe("aiCatalog", () => {
  const catalog = aiCatalog();

  it("follows ai-catalog specVersion 1.0", () => {
    expect(catalog.specVersion).toMatch(/^\d+\.\d+$/);
    expect(catalog.host.displayName).not.toBe("");
    for (const entry of catalog.entries) {
      expect(entry.identifier).toMatch(/^urn:air:dice\.kuhy\.duckdns\.org:/);
      expect(entry.type).toMatch(/^[a-z]+\/[a-z0-9.+-]+$/);
      expect(entry.url.startsWith(`${ORIGIN}/`)).toBe(true);
    }
  });

  it("has unique identifiers", () => {
    const ids = catalog.entries.map((entry) => entry.identifier);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("lists llms.txt, the sitemap and every markdown mirror", () => {
    const urls = catalog.entries.map((entry) => entry.url);
    expect(urls).toContain(`${ORIGIN}${LLMS_PATH}`);
    expect(urls).toContain(`${ORIGIN}${SITEMAP_PATH}`);
    for (const page of PAGES) {
      expect(urls).toContain(`${ORIGIN}${markdownPath(page)}`);
    }
  });

  it("does not list itself", () => {
    expect(catalog.entries.map((entry) => entry.url)).not.toContain(`${ORIGIN}${CATALOG_PATH}`);
  });
});
