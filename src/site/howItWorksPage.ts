/**
 * The how-it-works page: the scoring table, the maths and the caveats.
 *
 * A condensed, user-facing form of the README's "How the recommendation is
 * computed" and "What the numbers are not" sections.
 */

import { DEFAULT_POLICY } from "../core/simulate.ts";
import type { SitePage } from "./pageTypes.ts";
import { INARA_URL, SITE_NAME, WIKI_URL } from "./siteConfig.ts";

const { bankThreshold, dieValueBonus } = DEFAULT_POLICY;

export const HOW_IT_WORKS_PAGE: SitePage = {
  path: "/how-it-works/",
  navLabel: "How it works",
  title: `How it works: ${SITE_NAME}`,
  heading: "How the KCD2 Dice Solver works",
  description:
    "How the KCD2 Dice Solver scores a throw, computes each dice set's exact expected value, " +
    "searches for the best six dice, values badges, and where its numbers are estimates.",
  schemaType: "TechArticle",
  sections: [
    {
      heading: "Scoring",
      blocks: [
        {
          kind: "p",
          text:
            "Scoring is the Kingdom Come wiki's table for the game's Farkle variant. A throw " +
            "scores the best way of splitting its dice into combinations; dice left over score nothing.",
        },
        {
          kind: "table",
          head: ["Combination", "Points"],
          rows: [
            ["Each 1", "100"],
            ["Each 5", "50"],
            ["Three 1s", "1000"],
            ["Three of a kind (2-6)", "100 x face"],
            ["Each die beyond three of a kind", "doubles the set"],
            ["Straight 1-5", "500"],
            ["Straight 2-6", "750"],
            ["Straight 1-6", "1500"],
          ],
        },
      ],
    },
    {
      heading: "Expected score per throw",
      blocks: [
        {
          kind: "p",
          text:
            "The expected value is exact. Scoring depends only on how many of each face a throw " +
            "shows, so the six dice are convolved into a distribution over those counts: at most " +
            "924 of them, instead of 46,656 ordered outcomes. The bust chance and the " +
            "90th-percentile throw come from the same distribution.",
        },
      ],
    },
    {
      heading: "Choosing the six dice",
      blocks: [
        {
          kind: "p",
          text:
            "The solver evaluates whole sets, because a set's value is not the sum of its dice. " +
            "Dice with identical face odds are pooled first (several of the game's dice are plain " +
            "fair dice under different names). Small inventories are enumerated exhaustively and " +
            "reported as provably optimal; larger ones use a multi-start steepest-ascent local " +
            "search and are reported as not proven.",
        },
      ],
    },
    {
      heading: "Points per turn",
      blocks: [
        {
          kind: "p",
          text:
            "Turn value depends on how you play, so it is a seeded Monte Carlo simulation of an " +
            `explicit policy: hold the subset that maximises points plus ${dieValueBonus} for each ` +
            `die left to throw, and bank at ${bankThreshold}.`,
        },
      ],
    },
    {
      heading: "Badges",
      blocks: [
        {
          kind: "p",
          text:
            "A badge only takes effect when the opponent brings a badge of the same tier, so the " +
            "solver recommends one badge per tier rather than one overall winner.",
        },
        {
          kind: "ul",
          items: [
            "The five badges that change the scoring table (the three Advantage formations, the gold Emperor's and Tyche badges) are valued exactly, by re-running the whole dice search with the rule switched on. Equipping one can change which dice you should bring.",
            "The rest are simulated one charge at a time, on paired random streams, so the measured difference is the badge and not a different run of luck.",
            "Badge points-per-game figures rank badges against each other; they do not predict a scoreline.",
          ],
        },
      ],
    },
    {
      heading: "What the numbers are not",
      blocks: [
        {
          kind: "ul",
          items: [
            "Balatro's die has no published face odds. It is modelled as a fair die whose 1 is replaced by its joker face.",
            "The Devil's head joker matches any combination but never scores on its own; Balatro's joker can be held alone as a 1.",
            "The point values of the three Advantage formations and the Headstart leads are not published. The solver uses marked estimates you can correct in the app.",
            "The wiki and Inara disagree on about six dice. The wiki is treated as canonical.",
          ],
        },
      ],
    },
    {
      heading: "Sources",
      blocks: [
        {
          kind: "links",
          items: [
            { label: "Dice (KCD2) on the Kingdom Come wiki", href: WIKI_URL, note: "face odds and the scoring table" },
            { label: "Inara dice list", href: INARA_URL, note: "cross-check for the face odds" },
            { label: "Open the solver", href: "/", note: "enter your dice and get the best loadout" },
          ],
        },
      ],
    },
  ],
};
