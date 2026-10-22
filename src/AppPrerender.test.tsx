/** The prerendered page hands over to the app cleanly. */

/**
 * index.html ships the home page's static content inside #root so agents and
 * no-JS readers get a real answer. The app must replace it on mount rather than
 * render below it — this pins React's first-commit container clear, which is
 * what the whole prerender scheme leans on.
 */

import { act } from "@testing-library/react";
import { createRoot } from "react-dom/client";
import { describe, expect, it } from "vitest";
import { App } from "./App.tsx";
import { HOME_PAGE } from "./site/pages.ts";
import { renderArticle } from "./site/renderHtml.ts";

describe("prerendered #root", () => {
  it("is replaced by the app on first render", () => {
    const container = document.createElement("div");
    container.id = "root";
    container.innerHTML = renderArticle(HOME_PAGE);
    document.body.append(container);
    expect(container.querySelector(".prose")).not.toBeNull();

    const root = createRoot(container);
    act(() => {
      root.render(
        <App
          createPort={() => ({
            postMessage: () => undefined,
            addEventListener: () => undefined,
            removeEventListener: () => undefined,
          })}
          storage={{ getItem: () => null, setItem: () => undefined }}
          urlHash={{ read: () => "", clear: () => undefined, base: () => "https://x/" }}
        />,
      );
    });

    expect(container.querySelector(".prose")).toBeNull();
    expect(container.querySelectorAll("h1")).toHaveLength(1);
    expect(container.querySelector("h1")?.textContent).toBe(HOME_PAGE.heading);

    act(() => {
      root.unmount();
    });
    container.remove();
  });
});
