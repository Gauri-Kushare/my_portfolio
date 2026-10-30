import "@testing-library/jest-dom/vitest";
import path from "node:path";
import os from "node:os";

import { handleCmsAndUploadRequest } from "../server/cms-api";

// Use an isolated test database path in os.tmpdir() during Vitest runs
process.env["PORTFOLIO_DB_PATH"] = path.join(os.tmpdir(), "llw-portfolio-cms-test.json");

const originalFetch = globalThis.fetch;

globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const rawUrl =
    typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

  if (
    rawUrl.startsWith("/api/") ||
    rawUrl.startsWith("/uploads/") ||
    rawUrl.includes("localhost/api/")
  ) {
    const fullUrl = rawUrl.startsWith("http") ? rawUrl : `http://localhost${rawUrl}`;
    const req = new Request(fullUrl, init);
    const res = await handleCmsAndUploadRequest(req);
    if (res) return res;
  }

  return originalFetch(input, init);
};

Object.defineProperty(window, "scrollTo", {
  writable: true,
  value: () => {},
});

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

class MockIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(window, "IntersectionObserver", {
  writable: true,
  value: MockIntersectionObserver,
});

Object.defineProperty(window, "ResizeObserver", {
  writable: true,
  value: MockResizeObserver,
});

Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
  writable: true,
  value: () => null,
});
