import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Route as IndexRoute } from "@/routes/index";
import { routeTree } from "@/routeTree.gen";

const VIEWPORTS: Array<[number, number]> = [
  [320, 700],
  [375, 812],
  [390, 844],
  [430, 932],
  [768, 1024],
  [1024, 768],
  [1366, 768],
  [1920, 1080],
];

describe("App routing and responsive portfolio verification", () => {
  it("matches a page for / instead of falling back to not found", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

    const matches = router.matchRoutes("/");

    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
  });

  it.each(VIEWPORTS)(
    "renders hero, 3D centerpiece, project categories, The Velora Edit, and contact links at %dx%d",
    (width, height) => {
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: width,
      });
      Object.defineProperty(window, "innerHeight", {
        writable: true,
        configurable: true,
        value: height,
      });
      window.dispatchEvent(new Event("resize"));

      const Component = IndexRoute.options.component!;
      const { unmount } = render(<Component />);

      // Hero & 3D centerpiece
      expect(screen.getAllByText("Gauri Kushare").length).toBeGreaterThanOrEqual(2);
      expect(screen.getByLabelText("Interactive 3D Dimensional Centerpiece")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /Explore Work/i })).toHaveAttribute("href", "#work");

      // Project Categories & The Velora Edit
      expect(screen.getAllByText("The Velora Edit").length).toBeGreaterThanOrEqual(1);
      const veloraLink = screen.getByRole("link", { name: /View Live Website/i });
      expect(veloraLink).toHaveAttribute("href", "https://the-velora-edit.netlify.app/");

      // Contact & Footer Email + Socials
      const emailLinks = screen
        .getAllByRole("link")
        .filter((a) => a.getAttribute("href") === "mailto:gaurikushare18@gmail.com");
      expect(emailLinks.length).toBeGreaterThanOrEqual(2);

      // Mobile menu open/close behavior
      const menuBtn = screen.getByRole("button", { name: /Open mobile menu/i });
      fireEvent.click(menuBtn);
      expect(screen.getByRole("dialog", { name: /Mobile navigation/i })).toBeInTheDocument();

      fireEvent.keyDown(window, { key: "Escape" });
      expect(screen.queryByRole("dialog", { name: /Mobile navigation/i })).not.toBeInTheDocument();

      unmount();
    },
  );

  it("has only verified internal anchors, social profiles, mailto links, and The Velora Edit live URL, with no unwanted redirects", () => {
    const Component = IndexRoute.options.component!;
    const { unmount } = render(<Component />);

    // Open mobile menu so its links are also audited
    fireEvent.click(screen.getByRole("button", { name: /Open mobile menu/i }));

    const allowedHrefs = new Set([
      "#home",
      "#work",
      "#about",
      "#services",
      "#contact",
      "#work-reels",
      "#work-graphics",
      "#work-cinematics",
      "#work-logos",
      "#work-websites",
      "mailto:gaurikushare18@gmail.com",
      "https://the-velora-edit.netlify.app/",
      "https://wa.me/917558468233",
      "https://www.instagram.com/_gauri_k24/",
    ]);

    const allLinks = screen.getAllByRole("link");
    for (const link of allLinks) {
      const href = link.getAttribute("href") ?? "";
      expect(allowedHrefs.has(href)).toBe(true);
      expect(href).not.toContain("canva");
      expect(href).not.toContain("outlook");
      expect(href).not.toContain("gauri.pro24@gmail.com");
    }

    // Close mobile menu
    fireEvent.keyDown(window, { key: "Escape" });

    // Verify Contact form submission prepares brief inline without automatic window redirect
    fireEvent.change(screen.getByLabelText(/Your Name/i), { target: { value: "Alex Rivera" } });
    fireEvent.change(screen.getByLabelText(/Email Address/i), {
      target: { value: "alex@studio.io" },
    });
    fireEvent.change(screen.getByLabelText(/Project Details/i), {
      target: { value: "Need a 3D brand campaign." },
    });
    fireEvent.click(screen.getByRole("button", { name: /Send Inquiry/i }));

    expect(screen.getByRole("status")).toHaveTextContent("Thanks, Alex Rivera!");
    const composedEmailLink = screen.getByRole("link", {
      name: /^Email gaurikushare18@gmail\.com/i,
    });
    expect(composedEmailLink.getAttribute("href")).toContain(
      "mailto:gaurikushare18@gmail.com?subject=",
    );

    unmount();
  });
});
