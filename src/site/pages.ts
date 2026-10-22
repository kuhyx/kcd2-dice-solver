/**
 * Every prerendered page, and where each one's files live.
 *
 * PAGES is the sitemap: each entry becomes an HTML file and a markdown mirror.
 * The app has no client-side routes (its only URL state is the inventory in the
 * fragment), so these pages are the whole site.
 */

import { HOME_PAGE } from "./homePage.ts";
import { HOW_IT_WORKS_PAGE } from "./howItWorksPage.ts";
import type { SitePage } from "./pageTypes.ts";
import { SITE_NAME } from "./siteConfig.ts";

export { HOME_PAGE, HOW_IT_WORKS_PAGE };
export type { Block, SchemaType, Section, SiteLink, SitePage } from "./pageTypes.ts";

export const PAGES: readonly SitePage[] = [HOME_PAGE, HOW_IT_WORKS_PAGE];

/** Served by the host for any path that does not exist; never in the sitemap. */
export const NOT_FOUND_PAGE: SitePage = {
  path: "/404.html",
  navLabel: "Not found",
  title: `Page not found: ${SITE_NAME}`,
  heading: "Page not found",
  description: "There is no page at this address on the KCD2 Dice Solver.",
  schemaType: "WebPage",
  sections: [
    {
      heading: "Where to go instead",
      blocks: [
        {
          kind: "p",
          text:
            "This address does not exist. The KCD2 Dice Solver is a single page that picks the " +
            "best six dice and badges for the dice game in Kingdom Come: Deliverance II.",
        },
        {
          kind: "links",
          items: PAGES.map((page) => ({ label: page.navLabel, href: page.path, note: page.description })),
        },
      ],
    },
  ],
};

/**
 * Root-absolute path of a page's markdown mirror.
 *
 * @param page - A sitemap page.
 * @returns `/index.md` for `/`, `/x/index.md` for `/x/`.
 */
export function markdownPath(page: SitePage): string {
  return `${page.path}index.md`;
}

/**
 * dist-relative file name of a page's HTML.
 *
 * @param page - Any page.
 * @returns `index.html` for `/`, `x/index.html` for `/x/`, `404.html` as is.
 */
export function htmlFileName(page: SitePage): string {
  const rel = page.path.slice(1);
  return rel === "" || rel.endsWith("/") ? `${rel}index.html` : rel;
}
