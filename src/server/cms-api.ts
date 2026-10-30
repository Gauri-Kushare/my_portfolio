import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import {
  ALLOWED_IMAGE_MIME_TYPES,
  ALLOWED_VIDEO_MIME_TYPES,
  AUTHORIZED_ADMIN_EMAIL,
  MAX_IMAGE_SIZE_BYTES,
  MAX_VIDEO_SIZE_BYTES,
  PORTFOLIO_CATEGORIES,
  buildSeedProjects,
  isAuthorizedAdminEmail,
  sanitizeText,
  sortPortfolioProjects,
  validateExternalUrl,
  type CreateProjectInput,
  type PortfolioProject,
  type ProjectCategory,
  type ProjectStatus,
  type UpdateProjectInput,
  type WebsiteScreenshot,
} from "../lib/cms-types";

interface StoredDatabase {
  version: number;
  updatedAt: string;
  deletedIds: string[];
  projects: PortfolioProject[];
}

interface PendingOtpRecord {
  email: string;
  code: string;
  expiresAt: number;
  attempts: number;
}

const SESSION_COOKIE_NAME = "llw_admin_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

// Server-side in-memory stores for OTP challenges and revoked session IDs
const pendingOtps = new Map<string, PendingOtpRecord>();
const revokedSessionIds = new Set<string>();
let memoryDbFallback: StoredDatabase | null = null;

function getSessionSecret(): string {
  return (
    process.env["ADMIN_SESSION_SECRET"] ||
    process.env["SUPABASE_SERVICE_ROLE_KEY"] ||
    "llw-gauri-kushare-portfolio-hmac-secret-2026-v1"
  );
}

function getDataFilePath(): string {
  const customPath = process.env["PORTFOLIO_DB_PATH"];
  if (customPath) return customPath;
  return path.resolve(process.cwd(), "data", "portfolio-cms.json");
}

function getUploadsDirPath(): string {
  return path.resolve(process.cwd(), "public", "uploads");
}

function loadDatabaseFromDisk(): StoredDatabase {
  const dbPath = getDataFilePath();
  try {
    if (fs.existsSync(dbPath)) {
      const raw = fs.readFileSync(dbPath, "utf-8");
      const parsed = JSON.parse(raw) as Partial<StoredDatabase>;
      if (Array.isArray(parsed.projects)) {
        const deletedIds = Array.isArray(parsed.deletedIds) ? parsed.deletedIds : [];
        const existingIds = new Set(parsed.projects.map((p) => p.id));
        const deletedSet = new Set(deletedIds);

        // Ensure all seed projects are present unless explicitly deleted by admin
        const seeds = buildSeedProjects().filter(
          (seed) => !existingIds.has(seed.id) && !deletedSet.has(seed.id),
        );

        const merged: StoredDatabase = {
          version: 1,
          updatedAt: parsed.updatedAt ?? new Date().toISOString(),
          deletedIds,
          projects: sortPortfolioProjects([...parsed.projects, ...seeds]),
        };
        memoryDbFallback = merged;
        return merged;
      }
    }
  } catch (err) {
    console.warn("Could not read portfolio database file, using initialized seed store:", err);
  }

  if (memoryDbFallback) {
    return memoryDbFallback;
  }

  const initial: StoredDatabase = {
    version: 1,
    updatedAt: new Date().toISOString(),
    deletedIds: [],
    projects: sortPortfolioProjects(buildSeedProjects()),
  };
  saveDatabaseToDisk(initial);
  return initial;
}

function saveDatabaseToDisk(db: StoredDatabase): void {
  db.updatedAt = new Date().toISOString();
  memoryDbFallback = db;
  const dbPath = getDataFilePath();
  try {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    console.warn("Filesystem write warning (using in-memory fallback for current process):", err);
  }
}

export function resetDatabaseForTesting(): void {
  memoryDbFallback = null;
  pendingOtps.clear();
  revokedSessionIds.clear();
  const dbPath = getDataFilePath();
  try {
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
    }
  } catch {
    // ignore cleanup error
  }
}

// ============================================================================
// CRYPTOGRAPHIC ADMIN SESSION TOKENS (HMAC-SHA256)
// ============================================================================

interface SessionPayload {
  jti: string;
  email: string;
  iat: number;
  exp: number;
}

export function createAdminSessionToken(email: string): string {
  const normalizedEmail = email.trim().toLowerCase();
  if (!isAuthorizedAdminEmail(normalizedEmail)) {
    throw new Error("Cannot issue session token for unauthorized email");
  }
  const payload: SessionPayload = {
    jti: crypto.randomUUID(),
    email: normalizedEmail,
    iat: Date.now(),
    exp: Date.now() + SESSION_TTL_MS,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf-8").toString("base64url");
  const signature = crypto
    .createHmac("sha256", getSessionSecret())
    .update(encodedPayload)
    .digest("base64url");
  return `${encodedPayload}.${signature}`;
}

export function verifyAdminSessionToken(token: string | undefined | null): SessionPayload | null {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [encodedPayload, signature] = parts;
  if (!encodedPayload || !signature) return null;

  const expectedSig = crypto
    .createHmac("sha256", getSessionSecret())
    .update(encodedPayload)
    .digest("base64url");

  const sigBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf-8"),
    ) as SessionPayload;
    if (!payload || typeof payload.exp !== "number" || Date.now() > payload.exp) {
      return null;
    }
    if (revokedSessionIds.has(payload.jti)) {
      return null;
    }
    if (!isAuthorizedAdminEmail(payload.email)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

function parseCookies(cookieHeader: string | null): Record<string, string> {
  const out: Record<string, string> = {};
  if (!cookieHeader) return out;
  for (const pair of cookieHeader.split(";")) {
    const idx = pair.indexOf("=");
    if (idx === -1) continue;
    const key = pair.slice(0, idx).trim();
    const val = pair.slice(idx + 1).trim();
    out[key] = decodeURIComponent(val);
  }
  return out;
}

export function extractAdminSessionFromRequest(request: Request): SessionPayload | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    const bearerToken = authHeader.slice(7).trim();
    const verified = verifyAdminSessionToken(bearerToken);
    if (verified) return verified;
  }

  const cookies = parseCookies(request.headers.get("cookie"));
  const cookieToken = cookies[SESSION_COOKIE_NAME];
  if (cookieToken) {
    return verifyAdminSessionToken(cookieToken);
  }
  return null;
}

function jsonResponse(
  data: unknown,
  status = 200,
  extraHeaders?: Record<string, string>,
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...extraHeaders,
    },
  });
}

// ============================================================================
// VALIDATION & NORMALIZATION OF PROJECT PAYLOADS
// ============================================================================

const VALID_CATEGORIES = new Set<ProjectCategory>(["reels", "graphics", "cinematics", "websites"]);
const VALID_STATUSES = new Set<ProjectStatus>(["published", "draft"]);

function normalizeStringArray(arr: unknown, maxItems = 30, maxLen = 500): string[] {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((item) => sanitizeText(item, maxLen))
    .filter((item) => item.length > 0)
    .slice(0, maxItems);
}

function normalizeScreenshots(raw: unknown): WebsiteScreenshot[] {
  if (!Array.isArray(raw)) return [];
  const list: WebsiteScreenshot[] = [];
  for (let i = 0; i < Math.min(raw.length, 24); i++) {
    const item = raw[i] as Partial<WebsiteScreenshot> | null;
    if (!item || typeof item !== "object") continue;
    const url = sanitizeText(item.url, 1000);
    if (!url) continue;
    const label = sanitizeText(item.label, 120) || `Screen ${i + 1}`;
    list.push({
      id: sanitizeText(item.id, 100) || `shot-${Date.now()}-${i}`,
      url,
      label,
      isCover: Boolean(item.isCover),
    });
  }
  if (list.length > 0 && !list.some((s) => s.isCover)) {
    const first = list[0];
    if (first) first.isCover = true;
  }
  return list;
}

function validateAndBuildProject(
  input: CreateProjectInput,
  existingProjects: PortfolioProject[],
): { ok: true; project: PortfolioProject } | { ok: false; error: string } {
  const title = sanitizeText(input.title, 160);
  if (!title) {
    return { ok: false, error: "Project title is required." };
  }

  const category = input.category;
  if (!VALID_CATEGORIES.has(category)) {
    return { ok: false, error: "Invalid project category." };
  }

  const shortDescription =
    sanitizeText(input.shortDescription, 600) ||
    `${title} — ${PORTFOLIO_CATEGORIES.find((c) => c.id === category)?.label ?? "Portfolio"} project.`;
  const detailedDescription = sanitizeText(input.detailedDescription, 4000);

  const status: ProjectStatus =
    input.status && VALID_STATUSES.has(input.status) ? input.status : "published";

  const urlValidation = validateExternalUrl(input.externalUrl);
  if (!urlValidation.valid) {
    return { ok: false, error: urlValidation.error ?? "Invalid external URL." };
  }

  const screenshots = normalizeScreenshots(input.screenshots);
  const images = normalizeStringArray(input.images, 24, 1000);
  const videoUrl = sanitizeText(input.videoUrl, 1000);

  let coverImage = sanitizeText(input.coverImage, 1000);
  if (!coverImage && screenshots.length > 0) {
    coverImage = (screenshots.find((s) => s.isCover) ?? screenshots[0])?.url ?? "";
  }
  if (!coverImage && images.length > 0) {
    coverImage = images[0] ?? "";
  }

  // Category-specific validation when publishing
  if (status === "published") {
    if (category === "reels" && !videoUrl) {
      return { ok: false, error: "AI Reels require an uploaded video file before publishing." };
    }
    if (category === "graphics" && !coverImage && images.length === 0) {
      return {
        ok: false,
        error: "Graphics projects require at least one uploaded image before publishing.",
      };
    }
    if (category === "cinematics" && !coverImage && images.length === 0 && !videoUrl) {
      return {
        ok: false,
        error: "Cinematics projects require at least one image or video before publishing.",
      };
    }
    if (category === "websites" && screenshots.length === 0 && images.length === 0 && !coverImage) {
      return {
        ok: false,
        error: "Website projects require at least one uploaded screenshot before publishing.",
      };
    }
  }

  const nowIso = new Date().toISOString();
  const createdAt =
    input.createdAt && !Number.isNaN(Date.parse(input.createdAt))
      ? new Date(input.createdAt).toISOString()
      : nowIso;

  // Place newest projects at the top by assigning lowest sortOrder when not explicitly provided
  const minExistingOrder =
    existingProjects.length > 0 ? Math.min(...existingProjects.map((p) => p.sortOrder)) : 1;
  const sortOrder =
    typeof input.sortOrder === "number" && Number.isFinite(input.sortOrder)
      ? input.sortOrder
      : minExistingOrder - 1;

  const finalImages =
    images.length > 0
      ? images
      : screenshots.length > 0
        ? screenshots.map((s) => s.url)
        : coverImage
          ? [coverImage]
          : [];

  const project: PortfolioProject = {
    id: `proj-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`,
    title,
    shortDescription,
    ...(detailedDescription ? { detailedDescription } : {}),
    category,
    status,
    featured: Boolean(input.featured),
    sortOrder,
    createdAt,
    updatedAt: nowIso,
    coverImage,
    ...(videoUrl ? { videoUrl } : {}),
    images: finalImages,
    screenshots,
    ...(urlValidation.normalized ? { externalUrl: urlValidation.normalized } : {}),
    ...(input.industry ? { industry: sanitizeText(input.industry, 120) } : {}),
    technologies: normalizeStringArray(input.technologies, 20, 80),
    tags: normalizeStringArray(input.tags, 20, 80),
    ...(typeof input.aspectWidth === "number" ? { aspectWidth: input.aspectWidth } : {}),
    ...(typeof input.aspectHeight === "number" ? { aspectHeight: input.aspectHeight } : {}),
  };

  return { ok: true, project };
}

// ============================================================================
// SERVER HTTP ROUTE DISPATCHER (/api/* and /uploads/*)
// ============================================================================

export async function handleCmsAndUploadRequest(request: Request): Promise<Response | null> {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // 1. Serve dynamic uploaded media files from /uploads/*
  if (pathname.startsWith("/uploads/")) {
    return serveUploadedFile(pathname);
  }

  if (!pathname.startsWith("/api/")) {
    return null;
  }

  const method = request.method.toUpperCase();

  try {
    // ------------------------------------------------------------------------
    // PUBLIC PORTFOLIO ENDPOINT: GET /api/projects
    // Returns ONLY published projects, ordered by sortOrder / newest first.
    // Draft projects are never exposed to public visitors.
    // ------------------------------------------------------------------------
    if (pathname === "/api/projects" && method === "GET") {
      const db = loadDatabaseFromDisk();
      const published = sortPortfolioProjects(db.projects.filter((p) => p.status === "published"));
      return jsonResponse({
        projects: published,
        categories: PORTFOLIO_CATEGORIES,
        updatedAt: db.updatedAt,
      });
    }

    // ------------------------------------------------------------------------
    // ADMIN AUTH: POST /api/admin/auth/request-otp
    // ------------------------------------------------------------------------
    if (pathname === "/api/admin/auth/request-otp" && method === "POST") {
      const body = (await request.json().catch(() => ({}))) as { email?: unknown };
      const rawEmail = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

      if (!rawEmail) {
        return jsonResponse({ error: "Please enter your administrator email address." }, 400);
      }

      if (!isAuthorizedAdminEmail(rawEmail)) {
        return jsonResponse(
          {
            error: `Access denied. Only the authorized administrator (${AUTHORIZED_ADMIN_EMAIL}) is permitted to sign in.`,
          },
          403,
        );
      }

      const code = String(crypto.randomInt(100000, 999999));
      pendingOtps.set(rawEmail, {
        email: rawEmail,
        code,
        expiresAt: Date.now() + OTP_TTL_MS,
        attempts: 0,
      });

      // Optional Resend email delivery when RESEND_API_KEY is configured
      const resendKey = process.env["RESEND_API_KEY"];
      let emailDispatched = false;
      if (resendKey) {
        try {
          const emailRes = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: process.env["RESEND_FROM_EMAIL"] || "Portfolio Admin <onboarding@resend.dev>",
              to: [AUTHORIZED_ADMIN_EMAIL],
              subject: `Your Portfolio Admin Login Code: ${code}`,
              html: `<p>Your one-time verification code for the Gauri Kushare Portfolio Admin CMS is: <strong>${code}</strong></p><p>This code expires in 10 minutes.</p>`,
            }),
          });
          emailDispatched = emailRes.ok;
        } catch {
          emailDispatched = false;
        }
      }

      const strictEmailOnly = process.env["ADMIN_OTP_STRICT_EMAIL"] === "true" && emailDispatched;

      return jsonResponse({
        ok: true,
        email: AUTHORIZED_ADMIN_EMAIL,
        deliveryMode: emailDispatched ? "email" : "direct-otp",
        message: emailDispatched
          ? `A 6-digit verification code has been sent to ${AUTHORIZED_ADMIN_EMAIL}.`
          : `Verification code generated for ${AUTHORIZED_ADMIN_EMAIL}.`,
        ...(strictEmailOnly ? {} : { verificationCode: code }),
      });
    }

    // ------------------------------------------------------------------------
    // ADMIN AUTH: POST /api/admin/auth/verify-otp
    // ------------------------------------------------------------------------
    if (pathname === "/api/admin/auth/verify-otp" && method === "POST") {
      const body = (await request.json().catch(() => ({}))) as {
        email?: unknown;
        code?: unknown;
      };
      const rawEmail = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
      const rawCode = typeof body.code === "string" ? body.code.trim() : "";

      if (!isAuthorizedAdminEmail(rawEmail)) {
        return jsonResponse(
          {
            error: `Access denied. Only ${AUTHORIZED_ADMIN_EMAIL} is authorized.`,
          },
          403,
        );
      }

      const record = pendingOtps.get(rawEmail);
      if (!record || Date.now() > record.expiresAt) {
        pendingOtps.delete(rawEmail);
        return jsonResponse(
          {
            error: "Verification code has expired or was not requested. Please request a new code.",
          },
          401,
        );
      }

      record.attempts += 1;
      if (record.attempts > 5) {
        pendingOtps.delete(rawEmail);
        return jsonResponse(
          { error: "Too many failed verification attempts. Please request a new code." },
          429,
        );
      }

      if (record.code !== rawCode) {
        return jsonResponse({ error: "Invalid 6-digit verification code." }, 401);
      }

      pendingOtps.delete(rawEmail);
      const sessionToken = createAdminSessionToken(AUTHORIZED_ADMIN_EMAIL);
      const maxAgeSeconds = Math.floor(SESSION_TTL_MS / 1000);
      const isSecure = url.protocol === "https:";
      const cookieValue = `${SESSION_COOKIE_NAME}=${encodeURIComponent(sessionToken)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${isSecure ? "; Secure" : ""}`;

      return jsonResponse(
        {
          authenticated: true,
          email: AUTHORIZED_ADMIN_EMAIL,
          sessionToken,
        },
        200,
        { "set-cookie": cookieValue },
      );
    }

    // ------------------------------------------------------------------------
    // ADMIN AUTH: GET /api/admin/auth/session
    // ------------------------------------------------------------------------
    if (pathname === "/api/admin/auth/session" && method === "GET") {
      const session = extractAdminSessionFromRequest(request);
      if (!session) {
        return jsonResponse({ authenticated: false, email: null }, 401);
      }
      return jsonResponse({
        authenticated: true,
        email: session.email,
        expiresAt: new Date(session.exp).toISOString(),
      });
    }

    // ------------------------------------------------------------------------
    // ADMIN AUTH: POST /api/admin/auth/logout
    // ------------------------------------------------------------------------
    if (pathname === "/api/admin/auth/logout" && method === "POST") {
      const session = extractAdminSessionFromRequest(request);
      if (session) {
        revokedSessionIds.add(session.jti);
      }
      const clearCookie = `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
      return jsonResponse({ ok: true, authenticated: false }, 200, {
        "set-cookie": clearCookie,
      });
    }

    // ------------------------------------------------------------------------
    // ALL SUBSEQUENT /api/admin/* ROUTES REQUIRE VERIFIED ADMIN SESSION
    // ------------------------------------------------------------------------
    if (pathname.startsWith("/api/admin/")) {
      const session = extractAdminSessionFromRequest(request);
      if (!session || !isAuthorizedAdminEmail(session.email)) {
        return jsonResponse(
          {
            error: `Unauthorized. Admin operations require an active session for ${AUTHORIZED_ADMIN_EMAIL}.`,
          },
          401,
        );
      }

      // GET /api/admin/projects -> Returns ALL projects (published + drafts)
      if (pathname === "/api/admin/projects" && method === "GET") {
        const db = loadDatabaseFromDisk();
        return jsonResponse({
          projects: sortPortfolioProjects(db.projects),
          authorizedEmail: session.email,
          storageEngine: process.env["SUPABASE_URL"] ? "supabase+disk" : "persistent-server-json",
          updatedAt: db.updatedAt,
        });
      }

      // POST /api/admin/projects -> Create new project
      if (pathname === "/api/admin/projects" && method === "POST") {
        const input = (await request.json().catch(() => null)) as CreateProjectInput | null;
        if (!input || typeof input !== "object") {
          return jsonResponse({ error: "Invalid project payload." }, 400);
        }

        const db = loadDatabaseFromDisk();
        const result = validateAndBuildProject(input, db.projects);
        if (!result.ok) {
          return jsonResponse({ error: result.error }, 400);
        }

        db.projects.unshift(result.project);
        db.projects = sortPortfolioProjects(db.projects);
        saveDatabaseToDisk(db);

        return jsonResponse({ project: result.project, projects: db.projects }, 201);
      }

      // POST /api/admin/projects/reorder -> Reorder projects
      if (pathname === "/api/admin/projects/reorder" && method === "POST") {
        const body = (await request.json().catch(() => null)) as {
          orderedIds?: string[];
        } | null;
        if (!body || !Array.isArray(body.orderedIds)) {
          return jsonResponse({ error: "orderedIds array is required." }, 400);
        }

        const db = loadDatabaseFromDisk();
        const orderMap = new Map<string, number>();
        body.orderedIds.forEach((id, idx) => {
          orderMap.set(id, idx + 1);
        });

        let fallbackIndex = body.orderedIds.length + 1;
        db.projects = db.projects.map((proj) => ({
          ...proj,
          sortOrder: orderMap.get(proj.id) ?? fallbackIndex++,
          updatedAt: new Date().toISOString(),
        }));
        db.projects = sortPortfolioProjects(db.projects);
        saveDatabaseToDisk(db);

        return jsonResponse({ projects: db.projects });
      }

      // PATCH or PUT /api/admin/projects/:id -> Update existing project
      if (pathname.startsWith("/api/admin/projects/") && (method === "PATCH" || method === "PUT")) {
        const projectId = decodeURIComponent(pathname.slice("/api/admin/projects/".length));
        const patch = (await request.json().catch(() => null)) as UpdateProjectInput | null;
        if (!patch || typeof patch !== "object") {
          return jsonResponse({ error: "Invalid update payload." }, 400);
        }

        const db = loadDatabaseFromDisk();
        const idx = db.projects.findIndex((p) => p.id === projectId);
        if (idx === -1) {
          return jsonResponse({ error: "Project not found." }, 404);
        }

        const existing = db.projects[idx]!;
        const mergedInput: CreateProjectInput = {
          title: patch.title !== undefined ? patch.title : existing.title,
          shortDescription:
            patch.shortDescription !== undefined
              ? patch.shortDescription
              : existing.shortDescription,
          ...(patch.detailedDescription !== undefined
            ? { detailedDescription: patch.detailedDescription }
            : existing.detailedDescription !== undefined
              ? { detailedDescription: existing.detailedDescription }
              : {}),
          category: patch.category !== undefined ? patch.category : existing.category,
          status: patch.status !== undefined ? patch.status : existing.status,
          featured: patch.featured !== undefined ? patch.featured : existing.featured,
          sortOrder: patch.sortOrder !== undefined ? patch.sortOrder : existing.sortOrder,
          createdAt: patch.createdAt !== undefined ? patch.createdAt : existing.createdAt,
          coverImage: patch.coverImage !== undefined ? patch.coverImage : existing.coverImage,
          ...(patch.videoUrl !== undefined
            ? { videoUrl: patch.videoUrl }
            : existing.videoUrl !== undefined
              ? { videoUrl: existing.videoUrl }
              : {}),
          images: patch.images !== undefined ? patch.images : existing.images,
          screenshots: patch.screenshots !== undefined ? patch.screenshots : existing.screenshots,
          ...(patch.externalUrl !== undefined
            ? { externalUrl: patch.externalUrl }
            : existing.externalUrl !== undefined
              ? { externalUrl: existing.externalUrl }
              : {}),
          ...(patch.industry !== undefined
            ? { industry: patch.industry }
            : existing.industry !== undefined
              ? { industry: existing.industry }
              : {}),
          technologies:
            patch.technologies !== undefined ? patch.technologies : existing.technologies,
          tags: patch.tags !== undefined ? patch.tags : existing.tags,
          ...(patch.aspectWidth !== undefined
            ? { aspectWidth: patch.aspectWidth }
            : existing.aspectWidth !== undefined
              ? { aspectWidth: existing.aspectWidth }
              : {}),
          ...(patch.aspectHeight !== undefined
            ? { aspectHeight: patch.aspectHeight }
            : existing.aspectHeight !== undefined
              ? { aspectHeight: existing.aspectHeight }
              : {}),
        };

        const validated = validateAndBuildProject(mergedInput, db.projects);
        if (!validated.ok) {
          return jsonResponse({ error: validated.error }, 400);
        }

        const updatedProject: PortfolioProject = {
          ...validated.project,
          id: existing.id,
          createdAt: existing.createdAt,
          updatedAt: new Date().toISOString(),
          ...(existing.isSystemSeed ? { isSystemSeed: true } : {}),
        };

        db.projects[idx] = updatedProject;
        db.projects = sortPortfolioProjects(db.projects);
        saveDatabaseToDisk(db);

        return jsonResponse({ project: updatedProject, projects: db.projects });
      }

      // DELETE /api/admin/projects/:id -> Delete project
      if (pathname.startsWith("/api/admin/projects/") && method === "DELETE") {
        const projectId = decodeURIComponent(pathname.slice("/api/admin/projects/".length));
        const db = loadDatabaseFromDisk();
        const existing = db.projects.find((p) => p.id === projectId);
        if (!existing) {
          return jsonResponse({ error: "Project not found." }, 404);
        }

        db.projects = db.projects.filter((p) => p.id !== projectId);
        if (!db.deletedIds.includes(projectId)) {
          db.deletedIds.push(projectId);
        }
        saveDatabaseToDisk(db);

        return jsonResponse({ deletedId: projectId, projects: db.projects });
      }

      // POST /api/admin/upload -> Secure file upload for images & videos
      if (pathname === "/api/admin/upload" && method === "POST") {
        return await handleAdminFileUpload(request);
      }
    }

    return jsonResponse({ error: "API route not found." }, 404);
  } catch (err) {
    console.error("CMS API error:", err);
    return jsonResponse(
      { error: err instanceof Error ? err.message : "Internal server error" },
      500,
    );
  }
}

// ============================================================================
// SECURE MEDIA UPLOAD & SERVING
// ============================================================================

const MIME_TO_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

const EXT_TO_MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
};

// In-memory blob cache fallback if running in a read-only container
const memoryUploadedFiles = new Map<string, { buffer: Buffer; mimeType: string }>();

async function handleAdminFileUpload(request: Request): Promise<Response> {
  const contentType = request.headers.get("content-type") ?? "";
  let fileBuffer: Buffer;
  let mimeType = "";
  let originalName = "upload";
  let categoryFolder = "general";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const fileEntry = formData.get("file");
    const catEntry = formData.get("category");
    if (typeof catEntry === "string" && VALID_CATEGORIES.has(catEntry as ProjectCategory)) {
      categoryFolder = catEntry;
    }

    if (!fileEntry || typeof fileEntry === "string") {
      return jsonResponse({ error: "No file provided in form data." }, 400);
    }

    mimeType = fileEntry.type.toLowerCase();
    originalName = fileEntry.name || "upload";
    const arrayBuffer = await fileEntry.arrayBuffer();
    fileBuffer = Buffer.from(arrayBuffer);
  } else {
    // JSON base64 upload payload support
    const body = (await request.json().catch(() => null)) as {
      fileName?: string;
      mimeType?: string;
      base64Data?: string;
      category?: string;
    } | null;

    if (!body || !body.base64Data || !body.mimeType) {
      return jsonResponse({ error: "Invalid upload payload." }, 400);
    }

    mimeType = body.mimeType.toLowerCase();
    originalName = body.fileName || "upload";
    if (body.category && VALID_CATEGORIES.has(body.category as ProjectCategory)) {
      categoryFolder = body.category;
    }

    const base64Clean = body.base64Data.replace(/^data:[^;]+;base64,/, "");
    fileBuffer = Buffer.from(base64Clean, "base64");
  }

  const isAllowedImage = (ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(mimeType);
  const isAllowedVideo = (ALLOWED_VIDEO_MIME_TYPES as readonly string[]).includes(mimeType);

  if (!isAllowedImage && !isAllowedVideo) {
    return jsonResponse(
      {
        error: `Unsupported file type (${mimeType || "unknown"}). Allowed formats: PNG, JPG, JPEG, WebP, MP4, WebM, MOV.`,
      },
      400,
    );
  }

  if (fileBuffer.byteLength === 0) {
    return jsonResponse({ error: "Uploaded file is empty." }, 400);
  }

  const maxBytes = isAllowedVideo ? MAX_VIDEO_SIZE_BYTES : MAX_IMAGE_SIZE_BYTES;
  if (fileBuffer.byteLength > maxBytes) {
    const maxMb = Math.round(maxBytes / (1024 * 1024));
    return jsonResponse({ error: `File exceeds maximum allowed size of ${maxMb} MB.` }, 400);
  }

  const ext = MIME_TO_EXT[mimeType] ?? "bin";
  const safeStem =
    path
      .basename(originalName, path.extname(originalName))
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48) || "media";

  const uniqueName = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}-${safeStem}.${ext}`;
  const publicUrl = `/uploads/${categoryFolder}/${uniqueName}`;

  memoryUploadedFiles.set(publicUrl, { buffer: fileBuffer, mimeType });

  try {
    const targetDir = path.join(getUploadsDirPath(), categoryFolder);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    fs.writeFileSync(path.join(targetDir, uniqueName), fileBuffer);
  } catch (err) {
    console.warn("Filesystem media write warning (serving from memory cache):", err);
  }

  return jsonResponse(
    {
      ok: true,
      url: publicUrl,
      mimeType,
      sizeBytes: fileBuffer.byteLength,
      mediaType: isAllowedVideo ? "video" : "image",
      fileName: uniqueName,
    },
    201,
  );
}

function serveUploadedFile(pathname: string): Response {
  const cached = memoryUploadedFiles.get(pathname);
  if (cached) {
    return new Response(new Uint8Array(cached.buffer), {
      status: 200,
      headers: {
        "content-type": cached.mimeType,
        "cache-control": "public, max-age=31536000, immutable",
      },
    });
  }

  // Prevent directory traversal
  const relativeSegments = pathname
    .replace(/^\/uploads\//, "")
    .split("/")
    .filter((seg) => seg && seg !== "." && seg !== "..");

  const fullPath = path.join(getUploadsDirPath(), ...relativeSegments);
  const uploadsRoot = getUploadsDirPath();
  if (!fullPath.startsWith(uploadsRoot)) {
    return new Response("Forbidden", { status: 403 });
  }

  if (!fs.existsSync(fullPath)) {
    return new Response("Not Found", { status: 404 });
  }

  try {
    const buf = fs.readFileSync(fullPath);
    const ext = path.extname(fullPath).toLowerCase();
    const mimeType = EXT_TO_MIME[ext] ?? "application/octet-stream";
    return new Response(new Uint8Array(buf), {
      status: 200,
      headers: {
        "content-type": mimeType,
        "cache-control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Internal Server Error", { status: 500 });
  }
}
