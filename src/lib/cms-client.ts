import { useCallback, useEffect, useState } from "react";

import {
  buildSeedProjects,
  sortPortfolioProjects,
  type CreateProjectInput,
  type PortfolioProject,
  type ProjectCategory,
  type UpdateProjectInput,
} from "./cms-types";

let cachedSessionToken: string | null = null;

export function setAdminBearerToken(token: string | null): void {
  cachedSessionToken = token;
}

function getAuthHeaders(extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = { ...extra };
  if (cachedSessionToken) {
    headers["Authorization"] = `Bearer ${cachedSessionToken}`;
  }
  return headers;
}

// ============================================================================
// PUBLIC PORTFOLIO HOOK
// ============================================================================

export function usePublishedProjects() {
  const [projects, setProjects] = useState<PortfolioProject[]>(() =>
    sortPortfolioProjects(buildSeedProjects().filter((p) => p.status === "published")),
  );
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/projects", {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (res.ok) {
        const data = (await res.json()) as { projects?: PortfolioProject[] };
        if (Array.isArray(data.projects)) {
          setProjects(sortPortfolioProjects(data.projects));
        }
      }
    } catch {
      // Keep initial seed fallback if offline
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { projects, isLoading, refresh };
}

// ============================================================================
// ADMIN AUTHENTICATION API
// ============================================================================

export async function checkAdminSession(): Promise<{
  authenticated: boolean;
  email: string | null;
}> {
  try {
    const res = await fetch("/api/admin/auth/session", {
      method: "GET",
      credentials: "include",
      headers: getAuthHeaders({ Accept: "application/json" }),
      cache: "no-store",
    });
    if (!res.ok) {
      return { authenticated: false, email: null };
    }
    const data = (await res.json()) as { authenticated?: boolean; email?: string | null };
    return {
      authenticated: Boolean(data.authenticated),
      email: data.email ?? null,
    };
  } catch {
    return { authenticated: false, email: null };
  }
}

export async function requestAdminOtp(email: string): Promise<{
  ok: boolean;
  email?: string;
  message?: string;
  deliveryMode?: string;
  verificationCode?: string;
  error?: string;
}> {
  const res = await fetch("/api/admin/auth/request-otp", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    ok?: boolean;
    email?: string;
    message?: string;
    deliveryMode?: string;
    verificationCode?: string;
    error?: string;
  };
  if (!res.ok) {
    return { ok: false, error: data.error ?? "Failed to request verification code." };
  }
  return {
    ok: true,
    ...(data.email ? { email: data.email } : {}),
    ...(data.message ? { message: data.message } : {}),
    ...(data.deliveryMode ? { deliveryMode: data.deliveryMode } : {}),
    ...(data.verificationCode ? { verificationCode: data.verificationCode } : {}),
  };
}

export async function verifyAdminOtp(
  email: string,
  code: string,
): Promise<{
  authenticated: boolean;
  email?: string;
  sessionToken?: string;
  error?: string;
}> {
  const res = await fetch("/api/admin/auth/verify-otp", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email, code }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    authenticated?: boolean;
    email?: string;
    sessionToken?: string;
    error?: string;
  };
  if (!res.ok || !data.authenticated) {
    return {
      authenticated: false,
      error: data.error ?? "Verification failed. Please check your code.",
    };
  }
  if (data.sessionToken) {
    setAdminBearerToken(data.sessionToken);
  }
  return {
    authenticated: true,
    ...(data.email ? { email: data.email } : {}),
    ...(data.sessionToken ? { sessionToken: data.sessionToken } : {}),
  };
}

export async function logoutAdmin(): Promise<void> {
  await fetch("/api/admin/auth/logout", {
    method: "POST",
    credentials: "include",
    headers: getAuthHeaders({ Accept: "application/json" }),
  }).catch(() => {});
  setAdminBearerToken(null);
}

// ============================================================================
// ADMIN PROJECTS CRUD & UPLOAD API
// ============================================================================

export async function fetchAdminProjects(): Promise<{
  projects: PortfolioProject[];
  authorizedEmail: string;
  storageEngine: string;
}> {
  const res = await fetch("/api/admin/projects", {
    method: "GET",
    credentials: "include",
    headers: getAuthHeaders({ Accept: "application/json" }),
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as {
    projects?: PortfolioProject[];
    authorizedEmail?: string;
    storageEngine?: string;
    error?: string;
  };
  if (!res.ok) {
    throw new Error(data.error ?? "Unauthorized to fetch admin projects.");
  }
  return {
    projects: Array.isArray(data.projects) ? data.projects : [],
    authorizedEmail: data.authorizedEmail ?? "",
    storageEngine: data.storageEngine ?? "persistent-server-json",
  };
}

export async function createAdminProject(input: CreateProjectInput): Promise<{
  project: PortfolioProject;
  projects: PortfolioProject[];
}> {
  const res = await fetch("/api/admin/projects", {
    method: "POST",
    credentials: "include",
    headers: getAuthHeaders({
      "Content-Type": "application/json",
      Accept: "application/json",
    }),
    body: JSON.stringify(input),
  });
  const data = (await res.json().catch(() => ({}))) as {
    project?: PortfolioProject;
    projects?: PortfolioProject[];
    error?: string;
  };
  if (!res.ok || !data.project) {
    throw new Error(data.error ?? "Failed to create project.");
  }
  return {
    project: data.project,
    projects: data.projects ?? [],
  };
}

export async function updateAdminProject(
  projectId: string,
  patch: UpdateProjectInput,
): Promise<{
  project: PortfolioProject;
  projects: PortfolioProject[];
}> {
  const res = await fetch(`/api/admin/projects/${encodeURIComponent(projectId)}`, {
    method: "PATCH",
    credentials: "include",
    headers: getAuthHeaders({
      "Content-Type": "application/json",
      Accept: "application/json",
    }),
    body: JSON.stringify(patch),
  });
  const data = (await res.json().catch(() => ({}))) as {
    project?: PortfolioProject;
    projects?: PortfolioProject[];
    error?: string;
  };
  if (!res.ok || !data.project) {
    throw new Error(data.error ?? "Failed to update project.");
  }
  return {
    project: data.project,
    projects: data.projects ?? [],
  };
}

export async function deleteAdminProject(projectId: string): Promise<{
  deletedId: string;
  projects: PortfolioProject[];
}> {
  const res = await fetch(`/api/admin/projects/${encodeURIComponent(projectId)}`, {
    method: "DELETE",
    credentials: "include",
    headers: getAuthHeaders({ Accept: "application/json" }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    deletedId?: string;
    projects?: PortfolioProject[];
    error?: string;
  };
  if (!res.ok) {
    throw new Error(data.error ?? "Failed to delete project.");
  }
  return {
    deletedId: data.deletedId ?? projectId,
    projects: data.projects ?? [],
  };
}

export async function reorderAdminProjects(orderedIds: string[]): Promise<PortfolioProject[]> {
  const res = await fetch("/api/admin/projects/reorder", {
    method: "POST",
    credentials: "include",
    headers: getAuthHeaders({
      "Content-Type": "application/json",
      Accept: "application/json",
    }),
    body: JSON.stringify({ orderedIds }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    projects?: PortfolioProject[];
    error?: string;
  };
  if (!res.ok) {
    throw new Error(data.error ?? "Failed to reorder projects.");
  }
  return data.projects ?? [];
}

export async function uploadAdminMedia(
  file: File,
  category: ProjectCategory,
  onProgress?: (percent: number) => void,
): Promise<{
  url: string;
  mimeType: string;
  sizeBytes: number;
  mediaType: "image" | "video";
  fileName: string;
}> {
  if (onProgress) onProgress(15);

  const formData = new FormData();
  formData.append("file", file);
  formData.append("category", category);

  const res = await fetch("/api/admin/upload", {
    method: "POST",
    credentials: "include",
    headers: getAuthHeaders({ Accept: "application/json" }),
    body: formData,
  });

  if (onProgress) onProgress(90);

  const data = (await res.json().catch(() => ({}))) as {
    url?: string;
    mimeType?: string;
    sizeBytes?: number;
    mediaType?: "image" | "video";
    fileName?: string;
    error?: string;
  };

  if (!res.ok || !data.url) {
    throw new Error(data.error ?? "Media upload failed.");
  }

  if (onProgress) onProgress(100);

  return {
    url: data.url,
    mimeType: data.mimeType ?? file.type,
    sizeBytes: data.sizeBytes ?? file.size,
    mediaType: data.mediaType ?? (file.type.startsWith("video/") ? "video" : "image"),
    fileName: data.fileName ?? file.name,
  };
}

/**
 * Extracts a matching poster thumbnail frame directly from an uploaded video file
 * so AI Reels always display a matching cover image even if no custom cover is uploaded.
 */
export async function extractVideoPosterFile(videoFile: File): Promise<File | null> {
  if (typeof document === "undefined" || typeof URL === "undefined") return null;

  return new Promise((resolve) => {
    const video = document.createElement("video");
    const objectUrl = URL.createObjectURL(videoFile);
    let settled = false;

    const cleanup = () => {
      try {
        URL.revokeObjectURL(objectUrl);
      } catch {
        // ignore
      }
    };

    const finish = (file: File | null) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(file);
    };

    const timeout = setTimeout(() => finish(null), 4000);

    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    video.src = objectUrl;

    video.onloadeddata = () => {
      try {
        video.currentTime = Math.min(0.5, (video.duration || 1) * 0.15);
      } catch {
        finish(null);
      }
    };

    video.onseeked = () => {
      clearTimeout(timeout);
      try {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 720;
        canvas.height = video.videoHeight || 1280;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          finish(null);
          return;
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              finish(null);
              return;
            }
            const posterFile = new File(
              [blob],
              `${videoFile.name.replace(/\.[^.]+$/, "")}-poster.jpg`,
              { type: "image/jpeg" },
            );
            finish(posterFile);
          },
          "image/jpeg",
          0.88,
        );
      } catch {
        finish(null);
      }
    };

    video.onerror = () => {
      clearTimeout(timeout);
      finish(null);
    };
  });
}
