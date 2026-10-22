/**
 * The home page's prerendered content: what the solver does and how to use it.
 *
 * This is what an agent or a no-JS reader gets at `/`; the app replaces it once
 * its script loads. Counts and policy numbers are read from the data and the
 * solver, not restated, so the page cannot drift from what the app computes.
 */

import { BADGES } from "../data/badges.ts";
import { DICE } from "../data/dice.ts";
import { DEFAULT_POLICY } from "../core/simulate.ts";
import type { SitePage } from "./pageTypes.ts";
import { LLMS_PATH, SITE_NAME } from "./siteConfig.ts";

const { bankThreshold, dieValueBonus } = DEFAULT_POLICY;

export const HOME_PAGE: SitePage = {
  path: "/",
  navLabel: "Solver",
  title: `${SITE_NAME}: the best dice and badges to bring in Kingdom Come: Deliverance II`,
  heading: SITE_NAME,
  description:
    "Free web tool for the dice game (Farkle) in Kingdom Come: Deliverance II: enter the dice and " +
    "badges you own and it finds the six dice and the badge for each tier that score the most, " +
    "with the expected points per throw and the bust chance behind the pick.",
  schemaType: "WebApplication",
  sections: [
    {
      heading: "What it does",
      blocks: [
        {
          kind: "p",
          text:
            `Kingdom Come: Deliverance II has ${DICE.length} dice, most of them weighted towards ` +
            `some faces, and ${BADGES.length} badges that bend the rules. You bring six dice to every ` +
            "game, so the question is which six of the ones you own score the most together.",
        },
        {
          kind: "p",
          text:
            "Tell the solver what you own. It evaluates every loadout your inventory allows and " +
            "reports the best one with the numbers behind it: the expected score per throw, the " +
            "chance a throw scores nothing (a bust), how good a lucky throw is, and the points a " +
            "whole turn is worth when played sensibly. It also ranks the badges you own, one per " +
            "tier, because a badge only works when your opponent brings one of the same tier.",
        },
      ],
    },
    {
      heading: "How to use it",
      blocks: [
        {
          kind: "ul",
          items: [
            "Click a die's row to add one to your inventory; scroll the mouse wheel over its counter to step it up or down.",
            "Search by name. The match is fuzzy, so \"wei\" finds the Weighted die and \"paintb\" finds Painter's die B. The same box filters the badges.",
            "Open the badge list and tick the badges you own (tin, silver and gold).",
            "Read the Best loadout panel: the six dice to bring, the expected score per throw, the bust chance, the 90th-percentile throw and the simulated points per turn.",
            "Read Best badge per tier for the badge to equip at each tier you hold.",
            "Use Import / export to move your inventory to another device: a .json file, the clipboard, or a link that carries the inventory in the URL fragment.",
          ],
        },
        {
          kind: "p",
          text:
            "The inventory is saved in your browser's local storage, so it survives a reload. " +
            "Nothing is sent to a server: the solver runs entirely in your browser.",
        },
      ],
    },
    {
      heading: "How the dice odds work",
      blocks: [
        {
          kind: "p",
          text:
            "Each die has its own probability for every face, taken from the Kingdom Come wiki. " +
            "Scoring follows the game's table: 100 for each 1, 50 for each 5, three of a kind for " +
            "100 times the face (1000 for three 1s), doubled for every die beyond three, and 500, " +
            "750 or 1500 for the straights 1-5, 2-6 and 1-6.",
        },
        {
          kind: "p",
          text:
            "The expected score per throw is computed exactly, not sampled: the six dice are " +
            "combined into a distribution over every possible throw. Dice are judged as a set, " +
            "because a set's value is not the sum of its dice: ranking dice one by one and taking " +
            "the top six gives the wrong answer. Small inventories are searched exhaustively and " +
            "the result is marked provably optimal; larger ones use a multi-start local search.",
        },
        {
          kind: "p",
          text:
            "The points per turn come from a seeded simulation of a stated policy: hold the dice " +
            `that maximise points plus ${dieValueBonus} for each die left to throw, and bank at ` +
            `${bankThreshold}. Every random number is seeded, so every figure is reproducible.`,
        },
      ],
    },
    {
      heading: "More",
      blocks: [
        {
          kind: "links",
          items: [
            {
              label: "How the solver works",
              href: "/how-it-works/",
              note: "the scoring table, the maths, how badges are valued and what the numbers are not",
            },
            {
              label: "llms.txt",
              href: LLMS_PATH,
              note: "a plain-text index of this site for AI agents",
            },
          ],
        },
      ],
    },
  ],
};
