/**
 * Where the site lives and where its agent-facing files sit.
 *
 * Every absolute URL the build emits (sitemap, llms.txt, AI Catalog, canonical
 * links) is built from ORIGIN, so moving the site is a one-line change. The
 * AgentReady checker derives the site's host from the robots.txt `Sitemap:`
 * line, so a second, drifting copy of the host would fail it.
 */

export const ORIGIN = "https://dice.kuhy.duckdns.org";
export const HOST = new URL(ORIGIN).host;
export const SITE_NAME = "KCD2 Dice Solver";
export const AUTHOR = "kuhy";

export const LLMS_PATH = "/llms.txt";
export const SITEMAP_PATH = "/sitemap.xml";
export const CATALOG_PATH = "/.well-known/ai-catalog.json";
export const CATALOG_TYPE = "application/ai-catalog+json";

export const WIKI_URL = "https://kingdom-come-deliverance.fandom.com/wiki/Dice/KCD2";
export const INARA_URL = "https://inara.cz/kingdom-come-2/items-dice/";

/**
 * Absolute URL on the canonical origin.
 *
 * @param path - Root-absolute site path.
 * @returns The full URL.
 */
export function absoluteUrl(path: string): string {
  return `${ORIGIN}${path}`;
}
