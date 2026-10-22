/**
 * The shape of a prerendered page.
 *
 * Content is data, not markup: one description feeds the HTML renderer, the
 * markdown mirror and llms.txt, so the three can never say different things.
 * Text is plain (never HTML); the renderers escape it.
 */

/** A link inside a page's body. `href` is root-absolute or an external URL. */
export interface SiteLink {
  readonly label: string;
  readonly href: string;
  readonly note: string;
}

/** One block of body content. */
export type Block =
  | { readonly kind: "p"; readonly text: string }
  | { readonly kind: "ul"; readonly items: readonly string[] }
  | {
      readonly kind: "table";
      readonly head: readonly string[];
      readonly rows: readonly (readonly string[])[];
    }
  | { readonly kind: "links"; readonly items: readonly SiteLink[] };

/** A titled section of a page. */
export interface Section {
  readonly heading: string;
  readonly blocks: readonly Block[];
}

/** schema.org type the page's JSON-LD declares. */
export type SchemaType = "WebApplication" | "TechArticle" | "WebPage";

/** A page the build writes as static HTML plus a markdown mirror. */
export interface SitePage {
  /** Root-absolute path; directories end in `/`. */
  readonly path: string;
  /** Short name used in navigation and llms.txt. */
  readonly navLabel: string;
  /** Document `<title>`. */
  readonly title: string;
  /** The page's `<h1>`. */
  readonly heading: string;
  /** One-sentence summary: meta description, llms.txt note, JSON-LD. */
  readonly description: string;
  readonly schemaType: SchemaType;
  readonly sections: readonly Section[];
}
