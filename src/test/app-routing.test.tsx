import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import {
  createAdminProject,
  deleteAdminProject,
  fetchAdminProjects,
  logoutAdmin,
  requestAdminOtp,
  setAdminBearerToken,
  updateAdminProject,
  verifyAdminOtp,
} from "@/lib/cms-client";
import { Route as AdminRoute } from "@/routes/admin";
import { Route as IndexRoute } from "@/routes/index";
import { routeTree } from "@/routeTree.gen";
import { handleCmsAndUploadRequest, resetDatabaseForTesting } from "@/server/cms-api";

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

describe("App routing, responsive portfolio, and Secure Admin CMS verification", () => {
  beforeEach(() => {
    resetDatabaseForTesting();
    setAdminBearerToken(null);
  });

  it("matches routes for / and /admin instead of falling back to not found", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

    const homeMatches = router.matchRoutes("/");
    expect(homeMatches.at(-1)?.routeId).not.toBe(rootRouteId);

    const adminMatches = router.matchRoutes("/admin");
    expect(adminMatches.at(-1)?.routeId).toBe("/admin");
  });

  it("enforces exact public portfolio section order: 1. AI Reels, 2. Graphics, 3. Cinematics, 4. Websites", () => {
    const Component = IndexRoute.options.component!;
    const { container, unmount } = render(<Component />);

    const catNav = screen.getByRole("navigation", { name: /Portfolio categories/i });
    const tabLinks = Array.from(catNav.querySelectorAll("a")).map((a) => a.getAttribute("href"));
    expect(tabLinks).toEqual([
      "#work-reels",
      "#work-graphics",
      "#work-cinematics",
      "#work-websites",
    ]);

    const sectionIds = Array.from(
      container.querySelectorAll("#work-reels, #work-graphics, #work-cinematics, #work-websites"),
    ).map((el) => el.id);
    expect(sectionIds).toEqual(["work-reels", "work-graphics", "work-cinematics", "work-websites"]);

    unmount();
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
      const veloraLink = screen.getByRole("link", { name: /Visit Live Website/i });
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

  it("completes the full Admin CMS workflow: auth protection, create/publish across all 4 categories, edit, unpublish draft, delete, and persistence", async () => {
    // 1. Verify unauthorized emails cannot log in
    const badAttempt1 = await requestAdminOtp("intruder@example.com");
    expect(badAttempt1.ok).toBe(false);
    expect(badAttempt1.error).toContain("Access denied");

    const badAttempt2 = await requestAdminOtp("gauri.pro24@gmail.com");
    expect(badAttempt2.ok).toBe(false);

    // 2. Verify unauthenticated API requests are blocked with 401
    await expect(
      createAdminProject({
        title: "Unauthorized Project",
        shortDescription: "Should fail",
        category: "reels",
        videoUrl: "/uploads/reels/test.mp4",
      }),
    ).rejects.toThrow(/Unauthorized/i);

    // 3. Authenticate with gaurikushare18@gmail.com
    const otpReq = await requestAdminOtp("gaurikushare18@gmail.com");
    expect(otpReq.ok).toBe(true);
    expect(otpReq.verificationCode).toMatch(/^\d{6}$/);

    const verifyRes = await verifyAdminOtp("gaurikushare18@gmail.com", otpReq.verificationCode!);
    expect(verifyRes.authenticated).toBe(true);
    expect(verifyRes.email).toBe("gaurikushare18@gmail.com");

    // 4. Test secure media upload endpoint with base64 image & video
    const uploadRes = await handleCmsAndUploadRequest(
      new Request("http://localhost/api/admin/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${verifyRes.sessionToken}`,
        },
        body: JSON.stringify({
          fileName: "test-cover.png",
          mimeType: "image/png",
          category: "graphics",
          base64Data:
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        }),
      }),
    );
    expect(uploadRes?.status).toBe(201);
    const uploadJson = (await uploadRes!.json()) as { url: string };
    expect(uploadJson.url).toContain("/uploads/graphics/");

    // 5. Create & publish an AI Reel -> appears automatically in AI Reels
    const createdReel = await createAdminProject({
      title: "AI Reel 99 — Quantum Horizon",
      shortDescription: "Futuristic AI-directed vertical reel.",
      category: "reels",
      status: "published",
      videoUrl: "/uploads/reels/quantum-horizon.mp4",
      coverImage: uploadJson.url,
      tags: ["AI Directed", "9:16 Vertical"],
    });
    expect(createdReel.project.category).toBe("reels");

    // 6. Create & publish a Graphics project
    const createdGraphic = await createAdminProject({
      title: "Chromatic Brutalism Poster",
      shortDescription: "Editorial graphic campaign.",
      category: "graphics",
      status: "published",
      coverImage: uploadJson.url,
      images: [uploadJson.url],
    });
    expect(createdGraphic.project.category).toBe("graphics");

    // 7. Create & publish a Cinematics project
    const createdCinematic = await createAdminProject({
      title: "Nocturne 2.39:1 Frame Study",
      shortDescription: "Anamorphic color grading showcase.",
      category: "cinematics",
      status: "published",
      coverImage: uploadJson.url,
      images: [uploadJson.url],
    });
    expect(createdCinematic.project.category).toBe("cinematics");

    // 8. Create & publish a Website project with URL & multiple labeled screenshots
    const createdWebsite = await createAdminProject({
      title: "Aether Luxury Studio",
      shortDescription: "Bespoke digital architecture platform.",
      category: "websites",
      status: "published",
      externalUrl: "https://aether-studio.example.com",
      industry: "Architecture & Luxury Design",
      technologies: ["React", "Three.js", "Tailwind CSS"],
      screenshots: [
        { id: "s1", url: uploadJson.url, label: "Home Page", isCover: true },
        { id: "s2", url: uploadJson.url, label: "About Page", isCover: false },
      ],
    });
    expect(createdWebsite.project.category).toBe("websites");
    expect(createdWebsite.project.externalUrl).toBe("https://aether-studio.example.com/");

    // 9. Render Public Portfolio and verify all 4 newly published projects appear automatically!
    const Component = IndexRoute.options.component!;
    const { unmount } = render(<Component />);

    await waitFor(() => {
      expect(screen.getByText("AI Reel 99 — Quantum Horizon")).toBeInTheDocument();
      expect(screen.getByText("Chromatic Brutalism Poster")).toBeInTheDocument();
      expect(screen.getByText("Nocturne 2.39:1 Frame Study")).toBeInTheDocument();
      expect(screen.getByText("Aether Luxury Studio")).toBeInTheDocument();
    });

    unmount();

    // 10. Edit an existing project
    await updateAdminProject(createdGraphic.project.id, {
      title: "Chromatic Brutalism Poster (Director's Cut)",
    });

    // 11. Unpublish the Website project (set to draft) and verify it disappears from public portfolio
    await updateAdminProject(createdWebsite.project.id, {
      status: "draft",
    });

    // 12. Delete the test Cinematic project and verify removal
    await deleteAdminProject(createdCinematic.project.id);

    // 13. Re-render public portfolio (simulating page refresh) and verify persistence & draft privacy
    const { unmount: unmountAfter } = render(<Component />);

    await waitFor(() => {
      expect(screen.getByText("AI Reel 99 — Quantum Horizon")).toBeInTheDocument();
      expect(screen.getByText("Chromatic Brutalism Poster (Director's Cut)")).toBeInTheDocument();
    });

    // Unpublished draft and deleted project must NOT appear on public portfolio
    expect(screen.queryByText("Aether Luxury Studio")).not.toBeInTheDocument();
    expect(screen.queryByText("Nocturne 2.39:1 Frame Study")).not.toBeInTheDocument();

    // Admin fetch still includes the private draft
    const adminList = await fetchAdminProjects();
    expect(
      adminList.projects.some((p) => p.title === "Aether Luxury Studio" && p.status === "draft"),
    ).toBe(true);

    unmountAfter();

    // 14. Logout invalidates admin session
    await logoutAdmin();
    await expect(fetchAdminProjects()).rejects.toThrow(/Unauthorized/i);
  });
});
