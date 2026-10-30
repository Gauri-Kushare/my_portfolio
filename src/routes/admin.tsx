import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Modal } from "@/components/site/ui";
import {
  checkAdminSession,
  createAdminProject,
  deleteAdminProject,
  extractVideoPosterFile,
  fetchAdminProjects,
  logoutAdmin,
  reorderAdminProjects,
  requestAdminOtp,
  updateAdminProject,
  uploadAdminMedia,
  verifyAdminOtp,
} from "@/lib/cms-client";
import {
  AUTHORIZED_ADMIN_EMAIL,
  PORTFOLIO_CATEGORIES,
  WEBSITE_SCREENSHOT_LABELS,
  validateExternalUrl,
  type CreateProjectInput,
  type PortfolioProject,
  type ProjectCategory,
  type ProjectStatus,
  type WebsiteScreenshot,
} from "@/lib/cms-types";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin CMS — Gauri Kushare Portfolio" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminDashboardPage,
});

type AdminSection =
  | "overview"
  | "add"
  | "all"
  | "reels"
  | "graphics"
  | "cinematics"
  | "websites"
  | "drafts"
  | "published"
  | "settings";

interface ProjectFormState {
  editingId: string | null;
  category: ProjectCategory;
  title: string;
  shortDescription: string;
  detailedDescription: string;
  status: ProjectStatus;
  featured: boolean;
  createdAt: string;
  coverImage: string;
  videoUrl: string;
  images: string[];
  screenshots: WebsiteScreenshot[];
  externalUrl: string;
  industry: string;
  technologiesText: string;
  tagsText: string;
}

function createEmptyFormState(category: ProjectCategory = "reels"): ProjectFormState {
  return {
    editingId: null,
    category,
    title: "",
    shortDescription: "",
    detailedDescription: "",
    status: "published",
    featured: false,
    createdAt: new Date().toISOString().slice(0, 10),
    coverImage: "",
    videoUrl: "",
    images: [],
    screenshots: [],
    externalUrl: "",
    industry: "",
    technologiesText: "",
    tagsText: "",
  };
}

function projectToFormState(project: PortfolioProject): ProjectFormState {
  return {
    editingId: project.id,
    category: project.category,
    title: project.title,
    shortDescription: project.shortDescription,
    detailedDescription: project.detailedDescription ?? "",
    status: project.status,
    featured: project.featured,
    createdAt: project.createdAt.slice(0, 10),
    coverImage: project.coverImage,
    videoUrl: project.videoUrl ?? "",
    images: [...project.images],
    screenshots: project.screenshots.map((s) => ({ ...s })),
    externalUrl: project.externalUrl ?? "",
    industry: project.industry ?? "",
    technologiesText: project.technologies.join(", "),
    tagsText: project.tags.join(", "),
  };
}

function AdminDashboardPage() {
  const [authChecking, setAuthChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [adminEmail, setAdminEmail] = useState<string | null>(null);

  // Login flow state
  const [emailInput, setEmailInput] = useState("");
  const [otpRequested, setOtpRequested] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [generatedOtpPreview, setGeneratedOtpPreview] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [authBusy, setAuthBusy] = useState(false);

  // Dashboard state
  const [activeSection, setActiveSection] = useState<AdminSection>("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [projects, setProjects] = useState<PortfolioProject[]>([]);
  const [storageEngine, setStorageEngine] = useState("persistent-server-json");
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [bannerNotice, setBannerNotice] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Add / Edit project form state
  const [form, setForm] = useState<ProjectFormState>(() => createEmptyFormState("reels"));
  const [savingForm, setSavingForm] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadStatusText, setUploadStatusText] = useState<string>("");
  const [previewProject, setPreviewProject] = useState<PortfolioProject | null>(null);

  const loadProjects = useCallback(async () => {
    setLoadingProjects(true);
    try {
      const data = await fetchAdminProjects();
      setProjects(data.projects);
      setStorageEngine(data.storageEngine);
    } catch (err) {
      setBannerNotice({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to load projects.",
      });
    } finally {
      setLoadingProjects(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    checkAdminSession()
      .then((res) => {
        if (!mounted) return;
        setAuthenticated(res.authenticated);
        setAdminEmail(res.email);
        setAuthChecking(false);
        if (res.authenticated) {
          void loadProjects();
        }
      })
      .catch(() => {
        if (mounted) setAuthChecking(false);
      });
    return () => {
      mounted = false;
    };
  }, [loadProjects]);

  // Project counts
  const counts = useMemo(() => {
    return {
      all: projects.length,
      reels: projects.filter((p) => p.category === "reels").length,
      graphics: projects.filter((p) => p.category === "graphics").length,
      cinematics: projects.filter((p) => p.category === "cinematics").length,
      websites: projects.filter((p) => p.category === "websites").length,
      published: projects.filter((p) => p.status === "published").length,
      drafts: projects.filter((p) => p.status === "draft").length,
      featured: projects.filter((p) => p.featured).length,
    };
  }, [projects]);

  const filteredProjects = useMemo(() => {
    let list = projects;
    if (activeSection === "reels") list = list.filter((p) => p.category === "reels");
    if (activeSection === "graphics") list = list.filter((p) => p.category === "graphics");
    if (activeSection === "cinematics") list = list.filter((p) => p.category === "cinematics");
    if (activeSection === "websites") list = list.filter((p) => p.category === "websites");
    if (activeSection === "drafts") list = list.filter((p) => p.status === "draft");
    if (activeSection === "published") list = list.filter((p) => p.status === "published");

    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.shortDescription.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q),
    );
  }, [projects, activeSection, searchQuery]);

  // ============================================================================
  // AUTH HANDLERS
  // ============================================================================

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthMessage(null);
    setGeneratedOtpPreview(null);
    setAuthBusy(true);

    try {
      const res = await requestAdminOtp(emailInput);
      if (!res.ok) {
        setAuthError(res.error ?? "Access denied.");
        setOtpRequested(false);
        return;
      }
      setOtpRequested(true);
      setAuthMessage(res.message ?? `Verification code generated for ${AUTHORIZED_ADMIN_EMAIL}.`);
      if (res.verificationCode) {
        setGeneratedOtpPreview(res.verificationCode);
        setOtpInput(res.verificationCode);
      }
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Authentication request failed.");
    } finally {
      setAuthBusy(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthBusy(true);
    try {
      const res = await verifyAdminOtp(emailInput, otpInput);
      if (!res.authenticated) {
        setAuthError(res.error ?? "Invalid verification code.");
        return;
      }
      setAuthenticated(true);
      setAdminEmail(res.email ?? AUTHORIZED_ADMIN_EMAIL);
      setGeneratedOtpPreview(null);
      await loadProjects();
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Verification failed.");
    } finally {
      setAuthBusy(false);
    }
  };

  const handleLogout = async () => {
    await logoutAdmin();
    setAuthenticated(false);
    setAdminEmail(null);
    setOtpRequested(false);
    setOtpInput("");
    setGeneratedOtpPreview(null);
    setProjects([]);
  };

  // ============================================================================
  // MEDIA UPLOAD HANDLERS
  // ============================================================================

  const handleVideoFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerNotice(null);
    setUploadProgress(10);
    setUploadStatusText(`Uploading video "${file.name}"...`);

    try {
      const uploaded = await uploadAdminMedia(file, form.category, (pct) => setUploadProgress(pct));

      let nextCover = form.coverImage;
      if (!nextCover) {
        setUploadStatusText("Extracting matching poster frame from reel...");
        const posterFile = await extractVideoPosterFile(file);
        if (posterFile) {
          const uploadedPoster = await uploadAdminMedia(posterFile, form.category);
          nextCover = uploadedPoster.url;
        }
      }

      setForm((prev) => ({
        ...prev,
        videoUrl: uploaded.url,
        ...(nextCover ? { coverImage: nextCover } : {}),
      }));
      setBannerNotice({
        type: "success",
        text: `Uploaded video "${file.name}" successfully.`,
      });
    } catch (err) {
      setBannerNotice({
        type: "error",
        text: err instanceof Error ? err.message : "Video upload failed.",
      });
    } finally {
      setUploadProgress(null);
      setUploadStatusText("");
      e.target.value = "";
    }
  };

  const handleCoverFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerNotice(null);
    setUploadProgress(10);
    setUploadStatusText(`Uploading cover "${file.name}"...`);

    try {
      const uploaded = await uploadAdminMedia(file, form.category, (pct) => setUploadProgress(pct));
      setForm((prev) => ({
        ...prev,
        coverImage: uploaded.url,
        images: prev.images.includes(uploaded.url) ? prev.images : [uploaded.url, ...prev.images],
      }));
      setBannerNotice({
        type: "success",
        text: "Cover image uploaded.",
      });
    } catch (err) {
      setBannerNotice({
        type: "error",
        text: err instanceof Error ? err.message : "Cover upload failed.",
      });
    } finally {
      setUploadProgress(null);
      setUploadStatusText("");
      e.target.value = "";
    }
  };

  const handleMultiImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setBannerNotice(null);
    setUploadProgress(5);

    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const f = files[i]!;
        setUploadStatusText(`Uploading image ${i + 1} of ${files.length} ("${f.name}")...`);
        const res = await uploadAdminMedia(f, form.category, (pct) => {
          const overall = Math.round(((i + pct / 100) / files.length) * 100);
          setUploadProgress(overall);
        });
        uploadedUrls.push(res.url);
      }

      setForm((prev) => {
        const merged = [...prev.images, ...uploadedUrls];
        return {
          ...prev,
          images: merged,
          coverImage: prev.coverImage || merged[0] || "",
        };
      });
      setBannerNotice({
        type: "success",
        text: `Uploaded ${uploadedUrls.length} image${uploadedUrls.length > 1 ? "s" : ""} successfully.`,
      });
    } catch (err) {
      setBannerNotice({
        type: "error",
        text: err instanceof Error ? err.message : "Image upload failed.",
      });
    } finally {
      setUploadProgress(null);
      setUploadStatusText("");
      e.target.value = "";
    }
  };

  const handleWebsiteScreenshotsSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setBannerNotice(null);
    setUploadProgress(5);

    try {
      const newShots: WebsiteScreenshot[] = [];
      const existingCount = form.screenshots.length;

      for (let i = 0; i < files.length; i++) {
        const f = files[i]!;
        setUploadStatusText(`Uploading screenshot ${i + 1} of ${files.length} ("${f.name}")...`);
        const res = await uploadAdminMedia(f, "websites", (pct) => {
          const overall = Math.round(((i + pct / 100) / files.length) * 100);
          setUploadProgress(overall);
        });
        const defaultLabel =
          WEBSITE_SCREENSHOT_LABELS[existingCount + i] ?? `Screen ${existingCount + i + 1}`;
        newShots.push({
          id: `shot-${Date.now()}-${i}`,
          url: res.url,
          label: defaultLabel,
          isCover: existingCount === 0 && i === 0,
        });
      }

      setForm((prev) => {
        const combined = [...prev.screenshots, ...newShots];
        const coverShot = combined.find((s) => s.isCover) ?? combined[0];
        return {
          ...prev,
          screenshots: combined,
          images: combined.map((s) => s.url),
          coverImage: coverShot ? coverShot.url : prev.coverImage,
        };
      });

      setBannerNotice({
        type: "success",
        text: `Uploaded ${newShots.length} website screenshot${newShots.length > 1 ? "s" : ""}.`,
      });
    } catch (err) {
      setBannerNotice({
        type: "error",
        text: err instanceof Error ? err.message : "Screenshot upload failed.",
      });
    } finally {
      setUploadProgress(null);
      setUploadStatusText("");
      e.target.value = "";
    }
  };

  // ============================================================================
  // SAVE / EDIT / DELETE / REORDER PROJECT HANDLERS
  // ============================================================================

  const buildPayloadFromForm = (overrideStatus?: ProjectStatus): CreateProjectInput => {
    const status = overrideStatus ?? form.status;
    const technologies = form.technologiesText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const tags = form.tagsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const coverShot = form.screenshots.find((s) => s.isCover) ?? form.screenshots[0];
    const coverImage =
      form.category === "websites" && coverShot
        ? coverShot.url
        : form.coverImage || form.images[0] || "";

    return {
      title: form.title.trim(),
      shortDescription: form.shortDescription.trim(),
      ...(form.detailedDescription.trim()
        ? { detailedDescription: form.detailedDescription.trim() }
        : {}),
      category: form.category,
      status,
      featured: form.featured,
      createdAt: form.createdAt ? new Date(form.createdAt).toISOString() : new Date().toISOString(),
      coverImage,
      ...(form.videoUrl.trim() ? { videoUrl: form.videoUrl.trim() } : {}),
      images:
        form.category === "websites"
          ? form.screenshots.map((s) => s.url)
          : form.images.length > 0
            ? form.images
            : coverImage
              ? [coverImage]
              : [],
      screenshots: form.category === "websites" ? form.screenshots : [],
      ...(form.externalUrl.trim() ? { externalUrl: form.externalUrl.trim() } : {}),
      ...(form.industry.trim() ? { industry: form.industry.trim() } : {}),
      technologies,
      tags,
    };
  };

  const handleSaveProject = async (overrideStatus?: ProjectStatus) => {
    setBannerNotice(null);

    if (!form.title.trim()) {
      setBannerNotice({ type: "error", text: "Please enter a project title." });
      return;
    }

    if (form.externalUrl.trim()) {
      const check = validateExternalUrl(form.externalUrl);
      if (!check.valid) {
        setBannerNotice({
          type: "error",
          text: check.error ?? "Please enter a valid external URL.",
        });
        return;
      }
    }

    setSavingForm(true);
    try {
      const payload = buildPayloadFromForm(overrideStatus);
      if (form.editingId) {
        const res = await updateAdminProject(form.editingId, payload);
        setProjects(res.projects);
        setBannerNotice({
          type: "success",
          text: `Updated "${res.project.title}" (${res.project.status.toUpperCase()}).`,
        });
      } else {
        const res = await createAdminProject(payload);
        setProjects(res.projects);
        setBannerNotice({
          type: "success",
          text: `Created "${res.project.title}" in ${
            PORTFOLIO_CATEGORIES.find((c) => c.id === res.project.category)?.label ??
            res.project.category
          } (${res.project.status.toUpperCase()}).`,
        });
      }
      setForm(createEmptyFormState(form.category));
      setActiveSection(form.category);
    } catch (err) {
      setBannerNotice({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to save project.",
      });
    } finally {
      setSavingForm(false);
    }
  };

  const handleEditProject = (project: PortfolioProject) => {
    setForm(projectToFormState(project));
    setActiveSection("add");
    setBannerNotice(null);
  };

  const handleTogglePublish = async (project: PortfolioProject) => {
    const nextStatus: ProjectStatus = project.status === "published" ? "draft" : "published";
    try {
      const res = await updateAdminProject(project.id, { status: nextStatus });
      setProjects(res.projects);
      setBannerNotice({
        type: "success",
        text: `"${project.title}" is now ${nextStatus === "published" ? "Published on public portfolio" : "saved as a Private Draft"}.`,
      });
    } catch (err) {
      setBannerNotice({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to update status.",
      });
    }
  };

  const handleToggleFeatured = async (project: PortfolioProject) => {
    try {
      const res = await updateAdminProject(project.id, { featured: !project.featured });
      setProjects(res.projects);
    } catch (err) {
      setBannerNotice({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to update featured flag.",
      });
    }
  };

  const handleDeleteProject = async (project: PortfolioProject) => {
    try {
      const res = await deleteAdminProject(project.id);
      setProjects(res.projects);
      setBannerNotice({
        type: "success",
        text: `Deleted "${project.title}".`,
      });
    } catch (err) {
      setBannerNotice({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to delete project.",
      });
    }
  };

  const handleMoveOrder = async (project: PortfolioProject, direction: -1 | 1) => {
    const idx = projects.findIndex((p) => p.id === project.id);
    const swapIdx = idx + direction;
    if (idx < 0 || swapIdx < 0 || swapIdx >= projects.length) return;

    const next = [...projects];
    const temp = next[idx]!;
    next[idx] = next[swapIdx]!;
    next[swapIdx] = temp;

    try {
      const updated = await reorderAdminProjects(next.map((p) => p.id));
      setProjects(updated);
    } catch (err) {
      setBannerNotice({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to reorder projects.",
      });
    }
  };

  const handlePreviewCurrentForm = () => {
    const payload = buildPayloadFromForm();
    const preview: PortfolioProject = {
      id: form.editingId ?? "preview-draft",
      title: payload.title || "Untitled Project",
      shortDescription: payload.shortDescription || "Project preview description",
      ...(payload.detailedDescription ? { detailedDescription: payload.detailedDescription } : {}),
      category: payload.category,
      status: payload.status ?? "draft",
      featured: Boolean(payload.featured),
      sortOrder: 1,
      createdAt: payload.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      coverImage: payload.coverImage ?? "",
      ...(payload.videoUrl ? { videoUrl: payload.videoUrl } : {}),
      images: payload.images ?? [],
      screenshots: payload.screenshots ?? [],
      ...(payload.externalUrl ? { externalUrl: payload.externalUrl } : {}),
      ...(payload.industry ? { industry: payload.industry } : {}),
      technologies: payload.technologies ?? [],
      tags: payload.tags ?? [],
    };
    setPreviewProject(preview);
  };

  // ============================================================================
  // RENDER: LOADING OR SECURE LOGIN GATE
  // ============================================================================

  if (authChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#040309] px-4 text-white">
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/90 px-6 py-4 backdrop-blur-xl">
          <span className="h-3 w-3 animate-ping rounded-full bg-violet-500" />
          <span className="font-display text-sm font-semibold tracking-wide text-slate-200">
            Verifying Administrator Session…
          </span>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#040309] px-4 py-12 text-white">
        {/* Ambient 3D Luxury Glow */}
        <div className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[90vw] max-w-[760px] -translate-x-1/2 rounded-full bg-gradient-to-b from-violet-600/25 via-indigo-600/15 to-transparent blur-[120px]" />

        <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-slate-950/85 p-6 shadow-[0_25px_70px_rgba(0,0,0,0.85)] backdrop-blur-2xl sm:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 font-display text-sm font-bold text-white shadow-[0_0_15px_rgba(139,92,246,0.5)]">
                G
              </span>
              <div>
                <p className="font-display text-xs font-bold uppercase tracking-widest text-violet-400">
                  Private Admin CMS
                </p>
                <p className="text-xs text-slate-400">Gauri Kushare Portfolio</p>
              </div>
            </div>
            <Link
              to="/"
              className="rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 font-display text-xs font-medium text-slate-300 transition-colors hover:border-violet-400/40 hover:text-white"
            >
              ← Portfolio
            </Link>
          </div>

          <h1 className="font-display text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            Administrator Sign In
          </h1>
          <p className="mt-2 text-xs leading-relaxed text-slate-400 sm:text-sm">
            Protected dashboard restricted exclusively to the verified portfolio owner.
          </p>

          {authError && (
            <div
              role="alert"
              className="mt-4 rounded-xl border border-rose-500/40 bg-rose-950/40 p-3.5 text-xs leading-relaxed text-rose-200"
            >
              <p className="font-semibold text-rose-300">{authError}</p>
              <div className="mt-2">
                <Link
                  to="/"
                  className="inline-flex items-center gap-1 font-display text-xs font-semibold text-white underline decoration-rose-400 underline-offset-4"
                >
                  Return to public portfolio →
                </Link>
              </div>
            </div>
          )}

          {authMessage && (
            <div
              role="status"
              className="mt-4 rounded-xl border border-violet-500/35 bg-violet-950/35 p-3.5 text-xs text-violet-200"
            >
              <p>{authMessage}</p>
              {generatedOtpPreview && (
                <div className="mt-2.5 flex items-center justify-between rounded-lg border border-violet-400/30 bg-black/50 px-3 py-2">
                  <span className="text-[11px] text-slate-300">One-Time Passcode:</span>
                  <code className="font-mono text-sm font-bold tracking-widest text-emerald-400">
                    {generatedOtpPreview}
                  </code>
                </div>
              )}
            </div>
          )}

          {!otpRequested ? (
            <form onSubmit={handleRequestOtp} className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="admin-email-input"
                  className="mb-2 block font-display text-xs uppercase tracking-wider text-slate-300"
                >
                  Authorized Administrator Email
                </label>
                <input
                  id="admin-email-input"
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="Enter admin email..."
                  className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3.5 text-sm text-white placeholder:text-slate-500 outline-none transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                />
              </div>

              <button
                type="submit"
                disabled={authBusy}
                className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3.5 font-display text-sm font-bold text-white shadow-[0_0_25px_rgba(139,92,246,0.4)] transition-all hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50"
              >
                <span>{authBusy ? "Verifying Email…" : "Send Verification Code"}</span>
                <span>→</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="admin-otp-input"
                  className="mb-2 block font-display text-xs uppercase tracking-wider text-slate-300"
                >
                  6-Digit Verification Code
                </label>
                <input
                  id="admin-otp-input"
                  type="text"
                  inputMode="numeric"
                  required
                  maxLength={6}
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                  placeholder="000000"
                  className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3.5 text-center font-mono text-lg font-bold tracking-[0.35em] text-white outline-none transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                />
              </div>

              <button
                type="submit"
                disabled={authBusy}
                className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3.5 font-display text-sm font-bold text-white shadow-[0_0_25px_rgba(139,92,246,0.4)] transition-all hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50"
              >
                <span>{authBusy ? "Signing In…" : "Verify & Open Dashboard"}</span>
                <span>✓</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setOtpRequested(false);
                  setOtpInput("");
                  setAuthMessage(null);
                }}
                className="w-full py-2 text-center text-xs text-slate-400 hover:text-white"
              >
                Change email or request a new code
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER: AUTHENTICATED ADMIN DASHBOARD
  // ============================================================================

  const sidebarItems: Array<{
    id: AdminSection;
    label: string;
    count?: number;
    badgeColor?: string;
  }> = [
    { id: "overview", label: "Overview" },
    { id: "add", label: "Add New Project" },
    { id: "all", label: "All Projects", count: counts.all },
    { id: "reels", label: "AI Reels", count: counts.reels },
    { id: "graphics", label: "Graphics", count: counts.graphics },
    { id: "cinematics", label: "Cinematics", count: counts.cinematics },
    { id: "websites", label: "Websites", count: counts.websites },
    { id: "drafts", label: "Draft Projects", count: counts.drafts },
    { id: "published", label: "Published Projects", count: counts.published },
    { id: "settings", label: "Settings" },
  ];

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-slate-900/75 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20";

  return (
    <div className="min-h-screen bg-[#040309] text-slate-100">
      {/* Top Admin Header Bar */}
      <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-slate-950/90 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3 px-4 py-3.5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle admin menu"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-slate-900 text-white lg:hidden"
            >
              ☰
            </button>
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 font-display text-xs font-bold text-white shadow-[0_0_12px_rgba(139,92,246,0.5)]">
                G
              </span>
              <div>
                <p className="font-display text-sm font-bold text-white">
                  Gauri Kushare — Studio CMS
                </p>
                <p className="text-[11px] text-emerald-400">
                  ● Verified Admin: {adminEmail ?? AUTHORIZED_ADMIN_EMAIL}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={() => {
                setForm(createEmptyFormState("reels"));
                setActiveSection("add");
              }}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-full bg-violet-600 px-4 py-2 font-display text-xs font-bold text-white shadow-[0_0_18px_rgba(139,92,246,0.4)] transition-colors hover:bg-violet-500"
            >
              <span>+ Add New Project</span>
            </button>

            <Link
              to="/"
              className="hidden min-h-[38px] items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 font-display text-xs font-semibold text-slate-200 transition-colors hover:border-violet-400 hover:text-white sm:inline-flex"
            >
              <span>View Public Portfolio</span>
              <span>↗</span>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-950/30 px-3.5 py-2 font-display text-xs font-semibold text-rose-200 transition-colors hover:bg-rose-600 hover:text-white"
            >
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1600px] grid-cols-1 lg:grid-cols-12">
        {/* Sidebar Navigation */}
        <aside
          aria-label="Admin dashboard navigation"
          className={`${
            mobileMenuOpen ? "block" : "hidden"
          } border-b border-white/[0.08] bg-slate-950/75 p-4 lg:col-span-3 lg:block lg:min-h-[calc(100vh-65px)] lg:border-b-0 lg:border-r xl:col-span-2`}
        >
          <nav className="space-y-1.5">
            {sidebarItems.map((item) => {
              const isCurrent = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (item.id === "add" && form.editingId) {
                      setForm(createEmptyFormState("reels"));
                    }
                    setActiveSection(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left font-display text-xs font-semibold transition-all sm:text-sm ${
                    isCurrent
                      ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-[0_0_20px_rgba(139,92,246,0.35)]"
                      : "text-slate-400 hover:bg-white/[0.04] hover:text-white"
                  }`}
                >
                  <span>{item.label}</span>
                  {typeof item.count === "number" && (
                    <span
                      className={`rounded-full px-2 py-0.5 font-mono text-[10px] ${
                        isCurrent ? "bg-black/30 text-white" : "bg-white/[0.06] text-slate-300"
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}

            <div className="pt-4 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left font-display text-xs font-semibold text-rose-300 transition-colors hover:bg-rose-950/40 hover:text-rose-200 sm:text-sm"
              >
                <span>Logout</span>
                <span>→</span>
              </button>
            </div>
          </nav>
        </aside>

        {/* Main Workspace Column */}
        <main className="min-w-0 p-4 sm:p-6 lg:col-span-9 lg:p-8 xl:col-span-10">
          {bannerNotice && (
            <div
              role="status"
              className={`mb-6 flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-xs sm:text-sm ${
                bannerNotice.type === "success"
                  ? "border-emerald-500/40 bg-emerald-950/35 text-emerald-200"
                  : "border-rose-500/40 bg-rose-950/35 text-rose-200"
              }`}
            >
              <span>{bannerNotice.text}</span>
              <button
                type="button"
                onClick={() => setBannerNotice(null)}
                className="text-xs font-bold opacity-75 hover:opacity-100"
              >
                ✕
              </button>
            </div>
          )}

          {/* ================================================================
              1. OVERVIEW SECTION
             ================================================================ */}
          {activeSection === "overview" && (
            <div className="space-y-8">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                  <p className="font-mono text-xs uppercase tracking-widest text-violet-400">
                    Dashboard Overview
                  </p>
                  <h1 className="mt-1 font-display text-2xl font-extrabold text-white sm:text-3xl">
                    Portfolio Command Center
                  </h1>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(["reels", "graphics", "cinematics", "websites"] as ProjectCategory[]).map(
                    (cat) => {
                      const meta = PORTFOLIO_CATEGORIES.find((c) => c.id === cat)!;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            setForm(createEmptyFormState(cat));
                            setActiveSection("add");
                          }}
                          className="rounded-xl border border-white/10 bg-slate-900/80 px-3.5 py-2 font-display text-xs font-semibold text-slate-200 transition-colors hover:border-violet-400 hover:bg-violet-600/20 hover:text-white"
                        >
                          + Add {meta.shortLabel}
                        </button>
                      );
                    },
                  )}
                </div>
              </div>

              {/* Category & Status Metric Cards */}
              <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-6">
                <button
                  type="button"
                  onClick={() => setActiveSection("reels")}
                  className="rounded-2xl border border-white/10 bg-slate-950/80 p-4 text-left transition-all hover:border-violet-500/40"
                >
                  <p className="font-mono text-[11px] uppercase tracking-wider text-violet-400">
                    01 · AI Reels
                  </p>
                  <p className="mt-2 font-display text-3xl font-black text-white">{counts.reels}</p>
                  <p className="mt-1 text-[11px] text-slate-400">Vertical Videos</p>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSection("graphics")}
                  className="rounded-2xl border border-white/10 bg-slate-950/80 p-4 text-left transition-all hover:border-violet-500/40"
                >
                  <p className="font-mono text-[11px] uppercase tracking-wider text-violet-400">
                    02 · Graphics
                  </p>
                  <p className="mt-2 font-display text-3xl font-black text-white">
                    {counts.graphics}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">Visual Artworks</p>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSection("cinematics")}
                  className="rounded-2xl border border-white/10 bg-slate-950/80 p-4 text-left transition-all hover:border-violet-500/40"
                >
                  <p className="font-mono text-[11px] uppercase tracking-wider text-violet-400">
                    03 · Cinematics
                  </p>
                  <p className="mt-2 font-display text-3xl font-black text-white">
                    {counts.cinematics}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">Widescreen Stills</p>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSection("websites")}
                  className="rounded-2xl border border-white/10 bg-slate-950/80 p-4 text-left transition-all hover:border-violet-500/40"
                >
                  <p className="font-mono text-[11px] uppercase tracking-wider text-violet-400">
                    04 · Websites
                  </p>
                  <p className="mt-2 font-display text-3xl font-black text-white">
                    {counts.websites}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">Web Experiences</p>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSection("published")}
                  className="rounded-2xl border border-emerald-500/25 bg-emerald-950/20 p-4 text-left transition-all hover:border-emerald-400/50"
                >
                  <p className="font-mono text-[11px] uppercase tracking-wider text-emerald-400">
                    Published
                  </p>
                  <p className="mt-2 font-display text-3xl font-black text-white">
                    {counts.published}
                  </p>
                  <p className="mt-1 text-[11px] text-emerald-300/80">Live on Portfolio</p>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSection("drafts")}
                  className="rounded-2xl border border-amber-500/25 bg-amber-950/20 p-4 text-left transition-all hover:border-amber-400/50"
                >
                  <p className="font-mono text-[11px] uppercase tracking-wider text-amber-400">
                    Drafts
                  </p>
                  <p className="mt-2 font-display text-3xl font-black text-white">
                    {counts.drafts}
                  </p>
                  <p className="mt-1 text-[11px] text-amber-300/80">Private Only</p>
                </button>
              </div>

              {/* Recent Projects Quick List */}
              <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-5 sm:p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-display text-lg font-bold text-white">
                    Recent & Top-Ordered Projects
                  </h2>
                  <button
                    type="button"
                    onClick={() => setActiveSection("all")}
                    className="font-display text-xs font-semibold text-violet-400 hover:text-violet-300"
                  >
                    Manage All ({counts.all}) →
                  </button>
                </div>

                <ProjectTable
                  projects={projects.slice(0, 8)}
                  onEdit={handleEditProject}
                  onPreview={(p) => setPreviewProject(p)}
                  onTogglePublish={handleTogglePublish}
                  onToggleFeatured={handleToggleFeatured}
                  onDelete={handleDeleteProject}
                  onMoveOrder={handleMoveOrder}
                />
              </div>
            </div>
          )}

          {/* ================================================================
              2. ADD / EDIT PROJECT STUDIO
             ================================================================ */}
          {activeSection === "add" && (
            <div className="space-y-6">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <p className="font-mono text-xs uppercase tracking-widest text-violet-400">
                    {form.editingId ? "Edit Existing Project" : "Create New Project"}
                  </p>
                  <h1 className="mt-1 font-display text-2xl font-extrabold text-white sm:text-3xl">
                    {form.editingId ? `Editing: ${form.title}` : "Add New Portfolio Project"}
                  </h1>
                </div>
                {form.editingId && (
                  <button
                    type="button"
                    onClick={() => setForm(createEmptyFormState("reels"))}
                    className="self-start rounded-xl border border-white/15 bg-white/5 px-4 py-2 font-display text-xs font-semibold text-slate-300 hover:text-white"
                  >
                    Cancel Edit & Reset Form
                  </button>
                )}
              </div>

              {/* Category Selector Tabs */}
              <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-4 sm:p-6">
                <label className="mb-3 block font-display text-xs font-semibold uppercase tracking-wider text-slate-300">
                  1. Select Target Portfolio Category
                </label>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  {PORTFOLIO_CATEGORIES.map((cat, idx) => {
                    const selected = form.category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            category: cat.id,
                          }))
                        }
                        className={`flex flex-col items-start rounded-xl border p-3.5 text-left transition-all ${
                          selected
                            ? "border-violet-400 bg-violet-600/25 text-white shadow-[0_0_20px_rgba(139,92,246,0.3)]"
                            : "border-white/10 bg-slate-900/60 text-slate-300 hover:border-white/25 hover:text-white"
                        }`}
                      >
                        <span className="font-mono text-[10px] text-violet-300">0{idx + 1}</span>
                        <span className="mt-1 font-display text-sm font-bold">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Upload Progress Indicator */}
                {uploadProgress !== null && (
                  <div className="mt-5 rounded-xl border border-violet-500/40 bg-violet-950/30 p-4">
                    <div className="flex items-center justify-between text-xs text-violet-200">
                      <span>{uploadStatusText || "Uploading media..."}</span>
                      <span className="font-mono font-bold">{uploadProgress}%</span>
                    </div>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-900">
                      <div
                        className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-200"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Common Details */}
                <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="project-title-input"
                      className="mb-2 block font-display text-xs uppercase tracking-wider text-slate-300"
                    >
                      {form.category === "websites"
                        ? "Website / Project Name *"
                        : "Project Title *"}
                    </label>
                    <input
                      id="project-title-input"
                      type="text"
                      required
                      value={form.title}
                      onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                      placeholder={
                        form.category === "websites"
                          ? "e.g. The Velora Edit"
                          : form.category === "reels"
                            ? "e.g. AI Reel 08 — Cybernetic Couture"
                            : "e.g. Chromatic Poster Study"
                      }
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="project-date-input"
                      className="mb-2 block font-display text-xs uppercase tracking-wider text-slate-300"
                    >
                      Project Creation Date
                    </label>
                    <input
                      id="project-date-input"
                      type="date"
                      value={form.createdAt}
                      onChange={(e) => setForm((p) => ({ ...p, createdAt: e.target.value }))}
                      className={inputClass}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label
                      htmlFor="project-short-desc"
                      className="mb-2 block font-display text-xs uppercase tracking-wider text-slate-300"
                    >
                      Short Description *
                    </label>
                    <textarea
                      id="project-short-desc"
                      rows={2}
                      required
                      value={form.shortDescription}
                      onChange={(e) => setForm((p) => ({ ...p, shortDescription: e.target.value }))}
                      placeholder="Concise summary displayed on the project card..."
                      className={inputClass}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label
                      htmlFor="project-detailed-desc"
                      className="mb-2 block font-display text-xs uppercase tracking-wider text-slate-300"
                    >
                      Detailed Description / Project Notes (Optional)
                    </label>
                    <textarea
                      id="project-detailed-desc"
                      rows={3}
                      value={form.detailedDescription}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, detailedDescription: e.target.value }))
                      }
                      placeholder="Additional creative direction notes, deliverables, and context..."
                      className={inputClass}
                    />
                  </div>
                </div>

                {/* ============================================================
                    CATEGORY-SPECIFIC FORM: 1. AI REELS
                   ============================================================ */}
                {form.category === "reels" && (
                  <div className="mt-6 space-y-5 rounded-2xl border border-violet-500/25 bg-violet-950/15 p-4 sm:p-5">
                    <h3 className="font-display text-base font-bold text-white">
                      AI Reel Video & Cover Upload
                    </h3>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                      <div>
                        <label
                          htmlFor="reel-video-upload"
                          className="mb-2 block font-display text-xs uppercase tracking-wider text-slate-300"
                        >
                          Upload Reel Video File (MP4, WebM, MOV) *
                        </label>
                        <input
                          id="reel-video-upload"
                          type="file"
                          accept="video/mp4,video/webm,video/quicktime"
                          onChange={handleVideoFileSelect}
                          className="block w-full text-xs text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-violet-600 file:px-4 file:py-2 file:font-display file:text-xs file:font-semibold file:text-white hover:file:bg-violet-500"
                        />
                        {form.videoUrl && (
                          <div className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-black p-2">
                            <video
                              src={form.videoUrl}
                              poster={form.coverImage}
                              controls
                              playsInline
                              className="mx-auto max-h-56 rounded-lg"
                            />
                            <p className="mt-1 truncate font-mono text-[11px] text-emerald-400">
                              ✓ Video ready: {form.videoUrl}
                            </p>
                          </div>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="reel-cover-upload"
                          className="mb-2 block font-display text-xs uppercase tracking-wider text-slate-300"
                        >
                          Custom Cover / Thumbnail Image (Auto-extracted if omitted)
                        </label>
                        <input
                          id="reel-cover-upload"
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/webp"
                          onChange={handleCoverFileSelect}
                          className="block w-full text-xs text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-800 file:px-4 file:py-2 file:font-display file:text-xs file:font-semibold file:text-white hover:file:bg-slate-700"
                        />
                        {form.coverImage && (
                          <div className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-black p-2">
                            <img
                              src={form.coverImage}
                              alt="Reel thumbnail preview"
                              className="mx-auto max-h-56 rounded-lg object-contain"
                            />
                            <p className="mt-1 truncate font-mono text-[11px] text-violet-300">
                              ✓ Matching cover thumbnail set
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="reel-tags-input"
                        className="mb-2 block font-display text-xs uppercase tracking-wider text-slate-300"
                      >
                        Optional Tags (Comma-separated)
                      </label>
                      <input
                        id="reel-tags-input"
                        type="text"
                        value={form.tagsText}
                        onChange={(e) => setForm((p) => ({ ...p, tagsText: e.target.value }))}
                        placeholder="AI Directed, 9:16 Vertical, Generative Motion"
                        className={inputClass}
                      />
                    </div>
                  </div>
                )}

                {/* ============================================================
                    CATEGORY-SPECIFIC FORM: 2. GRAPHICS & 3. CINEMATICS
                   ============================================================ */}
                {(form.category === "graphics" || form.category === "cinematics") && (
                  <div className="mt-6 space-y-5 rounded-2xl border border-violet-500/25 bg-violet-950/15 p-4 sm:p-5">
                    <h3 className="font-display text-base font-bold text-white">
                      {form.category === "graphics"
                        ? "Graphics Multi-Image Gallery & Cover Selection"
                        : "Cinematics Widescreen Gallery & Optional Motion Preview"}
                    </h3>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                      <div>
                        <label
                          htmlFor="gallery-images-upload"
                          className="mb-2 block font-display text-xs uppercase tracking-wider text-slate-300"
                        >
                          Upload Project Images (PNG, JPG, JPEG, WebP — Multiple Allowed) *
                        </label>
                        <input
                          id="gallery-images-upload"
                          type="file"
                          multiple
                          accept="image/png,image/jpeg,image/jpg,image/webp"
                          onChange={handleMultiImageSelect}
                          className="block w-full text-xs text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-violet-600 file:px-4 file:py-2 file:font-display file:text-xs file:font-semibold file:text-white hover:file:bg-violet-500"
                        />
                      </div>

                      {form.category === "cinematics" && (
                        <div>
                          <label
                            htmlFor="cinematic-video-upload"
                            className="mb-2 block font-display text-xs uppercase tracking-wider text-slate-300"
                          >
                            Optional Cinematic Video Preview (MP4, WebM, MOV)
                          </label>
                          <input
                            id="cinematic-video-upload"
                            type="file"
                            accept="video/mp4,video/webm,video/quicktime"
                            onChange={handleVideoFileSelect}
                            className="block w-full text-xs text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-800 file:px-4 file:py-2 file:font-display file:text-xs file:font-semibold file:text-white hover:file:bg-slate-700"
                          />
                        </div>
                      )}
                    </div>

                    {form.images.length > 0 && (
                      <div>
                        <p className="mb-2 font-display text-xs font-semibold text-slate-300">
                          Uploaded Images ({form.images.length}) — Click "Set as Cover" to choose
                          thumbnail:
                        </p>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                          {form.images.map((imgUrl, idx) => {
                            const isCover = form.coverImage === imgUrl;
                            return (
                              <div
                                key={`${imgUrl}-${idx}`}
                                className={`overflow-hidden rounded-xl border bg-slate-950 p-2 ${
                                  isCover
                                    ? "border-violet-500 ring-2 ring-violet-500/40"
                                    : "border-white/10"
                                }`}
                              >
                                <img
                                  src={imgUrl}
                                  alt={`Uploaded ${idx + 1}`}
                                  className="aspect-video w-full rounded-lg object-cover"
                                />
                                <div className="mt-2 flex items-center justify-between gap-1">
                                  <button
                                    type="button"
                                    onClick={() => setForm((p) => ({ ...p, coverImage: imgUrl }))}
                                    className={`rounded px-2 py-1 text-[10px] font-semibold ${
                                      isCover
                                        ? "bg-violet-600 text-white"
                                        : "bg-white/10 text-slate-300 hover:text-white"
                                    }`}
                                  >
                                    {isCover ? "★ Cover" : "Set as Cover"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setForm((p) => {
                                        const nextImgs = p.images.filter((_, i) => i !== idx);
                                        return {
                                          ...p,
                                          images: nextImgs,
                                          coverImage:
                                            p.coverImage === imgUrl
                                              ? (nextImgs[0] ?? "")
                                              : p.coverImage,
                                        };
                                      })
                                    }
                                    className="rounded bg-rose-950/60 px-2 py-1 text-[10px] text-rose-300 hover:bg-rose-600 hover:text-white"
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div>
                      <label
                        htmlFor="visual-tags-input"
                        className="mb-2 block font-display text-xs uppercase tracking-wider text-slate-300"
                      >
                        Optional Tags / Details (Comma-separated)
                      </label>
                      <input
                        id="visual-tags-input"
                        type="text"
                        value={form.tagsText}
                        onChange={(e) => setForm((p) => ({ ...p, tagsText: e.target.value }))}
                        placeholder="Editorial Poster, 3D Visuals, Color Grading"
                        className={inputClass}
                      />
                    </div>
                  </div>
                )}

                {/* ============================================================
                    CATEGORY-SPECIFIC FORM: 4. WEBSITES (URL + LABELED SCREENSHOTS)
                   ============================================================ */}
                {form.category === "websites" && (
                  <div className="mt-6 space-y-5 rounded-2xl border border-violet-500/25 bg-violet-950/15 p-4 sm:p-5">
                    <h3 className="font-display text-base font-bold text-white">
                      Website URL, Industry & Labeled Screenshot Gallery
                    </h3>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                      <div>
                        <label
                          htmlFor="website-live-url"
                          className="mb-2 block font-display text-xs uppercase tracking-wider text-slate-300"
                        >
                          Live Website URL
                        </label>
                        <input
                          id="website-live-url"
                          type="url"
                          value={form.externalUrl}
                          onChange={(e) => setForm((p) => ({ ...p, externalUrl: e.target.value }))}
                          placeholder="https://the-velora-edit.netlify.app/"
                          className={inputClass}
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="website-industry"
                          className="mb-2 block font-display text-xs uppercase tracking-wider text-slate-300"
                        >
                          Project Type or Industry
                        </label>
                        <input
                          id="website-industry"
                          type="text"
                          value={form.industry}
                          onChange={(e) => setForm((p) => ({ ...p, industry: e.target.value }))}
                          placeholder="e.g. Luxury Fashion & E-Commerce, SaaS, Hospitality"
                          className={inputClass}
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label
                          htmlFor="website-tech"
                          className="mb-2 block font-display text-xs uppercase tracking-wider text-slate-300"
                        >
                          Optional Technology Details (Comma-separated)
                        </label>
                        <input
                          id="website-tech"
                          type="text"
                          value={form.technologiesText}
                          onChange={(e) =>
                            setForm((p) => ({ ...p, technologiesText: e.target.value }))
                          }
                          placeholder="React, TypeScript, Tailwind CSS, Three.js, Responsive UI"
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="website-screenshots-upload"
                        className="mb-2 block font-display text-xs uppercase tracking-wider text-slate-300"
                      >
                        Upload Website Screenshots (PNG, JPG, WebP — Multiple Allowed) *
                      </label>
                      <input
                        id="website-screenshots-upload"
                        type="file"
                        multiple
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        onChange={handleWebsiteScreenshotsSelect}
                        className="block w-full text-xs text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-violet-600 file:px-4 file:py-2 file:font-display file:text-xs file:font-semibold file:text-white hover:file:bg-violet-500"
                      />
                    </div>

                    {form.screenshots.length > 0 && (
                      <div className="space-y-3">
                        <p className="font-display text-xs font-semibold text-slate-300">
                          Website Screenshots ({form.screenshots.length}) — Label each page & choose
                          cover screenshot:
                        </p>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          {form.screenshots.map((shot, idx) => (
                            <div
                              key={shot.id}
                              className={`flex flex-col gap-3 rounded-xl border bg-slate-950/90 p-3 ${
                                shot.isCover
                                  ? "border-violet-500 ring-2 ring-violet-500/30"
                                  : "border-white/10"
                              }`}
                            >
                              <img
                                src={shot.url}
                                alt={shot.label}
                                className="aspect-[16/10] w-full rounded-lg object-cover object-top"
                              />
                              <div>
                                <label className="mb-1 block text-[11px] font-semibold text-slate-400">
                                  Screenshot Label
                                </label>
                                <input
                                  type="text"
                                  value={shot.label}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setForm((p) => ({
                                      ...p,
                                      screenshots: p.screenshots.map((s, i) =>
                                        i === idx ? { ...s, label: val } : s,
                                      ),
                                    }));
                                  }}
                                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-1.5 text-xs text-white"
                                />
                                <div className="mt-1.5 flex flex-wrap gap-1">
                                  {WEBSITE_SCREENSHOT_LABELS.map((preset) => (
                                    <button
                                      key={preset}
                                      type="button"
                                      onClick={() =>
                                        setForm((p) => ({
                                          ...p,
                                          screenshots: p.screenshots.map((s, i) =>
                                            i === idx ? { ...s, label: preset } : s,
                                          ),
                                        }))
                                      }
                                      className={`rounded px-2 py-0.5 text-[10px] ${
                                        shot.label === preset
                                          ? "bg-violet-600 text-white"
                                          : "bg-white/5 text-slate-400 hover:text-white"
                                      }`}
                                    >
                                      {preset}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div className="flex items-center justify-between border-t border-white/10 pt-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setForm((p) => ({
                                      ...p,
                                      coverImage: shot.url,
                                      screenshots: p.screenshots.map((s, i) => ({
                                        ...s,
                                        isCover: i === idx,
                                      })),
                                    }))
                                  }
                                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                                    shot.isCover
                                      ? "bg-violet-600 text-white"
                                      : "bg-white/10 text-slate-300 hover:text-white"
                                  }`}
                                >
                                  {shot.isCover ? "★ Cover Screenshot" : "Set as Cover"}
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    setForm((p) => {
                                      const next = p.screenshots.filter((_, i) => i !== idx);
                                      if (next.length > 0 && !next.some((s) => s.isCover)) {
                                        next[0] = { ...next[0]!, isCover: true };
                                      }
                                      return {
                                        ...p,
                                        screenshots: next,
                                        images: next.map((s) => s.url),
                                        coverImage:
                                          (next.find((s) => s.isCover) ?? next[0])?.url ?? "",
                                      };
                                    })
                                  }
                                  className="rounded-lg bg-rose-950/60 px-2.5 py-1 text-xs text-rose-300 hover:bg-rose-600 hover:text-white"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Featured & Publication Controls */}
                <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6">
                  <div className="flex flex-wrap items-center gap-6">
                    <label className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-200">
                      <input
                        type="checkbox"
                        checked={form.featured}
                        onChange={(e) => setForm((p) => ({ ...p, featured: e.target.checked }))}
                        className="h-4 w-4 rounded border-white/20 accent-violet-600"
                      />
                      <span className="font-display font-semibold">Featured Project</span>
                    </label>

                    <div className="flex items-center gap-2">
                      <span className="font-display text-xs uppercase tracking-wider text-slate-400">
                        Status:
                      </span>
                      <select
                        aria-label="Publication status"
                        value={form.status}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, status: e.target.value as ProjectStatus }))
                        }
                        className="rounded-xl border border-white/15 bg-slate-900 px-3 py-2 font-display text-xs font-semibold text-white"
                      >
                        <option value="published">Published (Live on Portfolio)</option>
                        <option value="draft">Draft (Private Only)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={handlePreviewCurrentForm}
                      className="rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2.5 font-display text-xs font-semibold text-slate-200 hover:border-violet-400 hover:text-white"
                    >
                      Preview Project
                    </button>

                    <button
                      type="button"
                      disabled={savingForm}
                      onClick={() => handleSaveProject("draft")}
                      className="rounded-xl border border-amber-500/40 bg-amber-950/30 px-4 py-2.5 font-display text-xs font-semibold text-amber-200 hover:bg-amber-900/50 disabled:opacity-50"
                    >
                      Save as Draft
                    </button>

                    <button
                      type="button"
                      disabled={savingForm}
                      onClick={() => handleSaveProject("published")}
                      className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-2.5 font-display text-xs font-bold text-white shadow-[0_0_25px_rgba(139,92,246,0.4)] hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50"
                    >
                      {savingForm
                        ? "Saving…"
                        : form.editingId
                          ? "Update & Publish"
                          : "Publish Project"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================
              3. PROJECT LIST SECTIONS (ALL / REELS / GRAPHICS / CINEMATICS / WEBSITES / DRAFTS / PUBLISHED)
             ================================================================ */}
          {(activeSection === "all" ||
            activeSection === "reels" ||
            activeSection === "graphics" ||
            activeSection === "cinematics" ||
            activeSection === "websites" ||
            activeSection === "drafts" ||
            activeSection === "published") && (
            <div className="space-y-6">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <p className="font-mono text-xs uppercase tracking-widest text-violet-400">
                    Portfolio Collection Manager
                  </p>
                  <h1 className="mt-1 font-display text-2xl font-extrabold text-white sm:text-3xl">
                    {sidebarItems.find((i) => i.id === activeSection)?.label ?? "Projects"} (
                    {filteredProjects.length})
                  </h1>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search projects..."
                    className="rounded-xl border border-white/10 bg-slate-900/80 px-3.5 py-2 text-xs text-white placeholder:text-slate-500 outline-none focus:border-violet-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const defaultCat: ProjectCategory =
                        activeSection === "reels" ||
                        activeSection === "graphics" ||
                        activeSection === "cinematics" ||
                        activeSection === "websites"
                          ? activeSection
                          : "reels";
                      setForm(createEmptyFormState(defaultCat));
                      setActiveSection("add");
                    }}
                    className="rounded-xl bg-violet-600 px-4 py-2 font-display text-xs font-bold text-white hover:bg-violet-500"
                  >
                    + Add New Project
                  </button>
                </div>
              </div>

              {loadingProjects ? (
                <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-8 text-center text-sm text-slate-400">
                  Loading projects...
                </div>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-4 sm:p-6">
                  <ProjectTable
                    projects={filteredProjects}
                    onEdit={handleEditProject}
                    onPreview={(p) => setPreviewProject(p)}
                    onTogglePublish={handleTogglePublish}
                    onToggleFeatured={handleToggleFeatured}
                    onDelete={handleDeleteProject}
                    onMoveOrder={handleMoveOrder}
                  />
                </div>
              )}
            </div>
          )}

          {/* ================================================================
              4. SETTINGS SECTION
             ================================================================ */}
          {activeSection === "settings" && (
            <div className="space-y-6">
              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-violet-400">
                  Security & Storage Configuration
                </p>
                <h1 className="mt-1 font-display text-2xl font-extrabold text-white sm:text-3xl">
                  CMS Settings
                </h1>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-6">
                  <h2 className="font-display text-lg font-bold text-white">
                    Administrator Access Policy
                  </h2>
                  <p className="mt-2 text-xs leading-relaxed text-slate-400">
                    Every admin route, media upload, and project mutation is protected on the server
                    and restricted exclusively to:
                  </p>
                  <div className="mt-4 rounded-xl border border-violet-500/30 bg-violet-950/30 p-3.5 font-mono text-sm font-bold text-violet-200">
                    {AUTHORIZED_ADMIN_EMAIL}
                  </div>
                  <ul className="mt-4 space-y-2 text-xs text-slate-300">
                    <li>✓ Backend-verified HMAC-SHA256 HttpOnly session cookies</li>
                    <li>✓ Strict MIME-type & file-size validation on `/api/admin/upload`</li>
                    <li>✓ Unpublished drafts filtered out on `/api/projects`</li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-6">
                  <h2 className="font-display text-lg font-bold text-white">
                    Database & Media Persistence
                  </h2>
                  <p className="mt-2 text-xs leading-relaxed text-slate-400">
                    Active Storage Engine:{" "}
                    <span className="font-mono font-semibold text-emerald-400">
                      {storageEngine}
                    </span>
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-slate-400">
                    Projects persist on the server in `data/portfolio-cms.json` and
                    `public/uploads/`. You can also connect Supabase PostgreSQL + Supabase Storage
                    via `.env` (see `.env.example` and `supabase/schema.sql`).
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Live Project Preview Modal inside Admin Dashboard */}
      <Modal open={!!previewProject} onClose={() => setPreviewProject(null)}>
        {previewProject && (
          <div className="flex flex-col bg-slate-950 p-4 sm:p-6">
            <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-violet-400">
                  Live Portfolio Preview ({previewProject.category.toUpperCase()})
                </span>
                <h3 className="font-display text-lg font-bold text-white">
                  {previewProject.title}
                </h3>
              </div>
              <span
                className={`rounded-full px-3 py-1 font-mono text-xs font-semibold ${
                  previewProject.status === "published"
                    ? "bg-emerald-950/60 text-emerald-300"
                    : "bg-amber-950/60 text-amber-300"
                }`}
              >
                {previewProject.status.toUpperCase()}
              </span>
            </div>

            <div className="flex max-h-[65dvh] items-center justify-center overflow-auto rounded-xl bg-black p-3">
              {previewProject.videoUrl ? (
                <video
                  src={previewProject.videoUrl}
                  poster={previewProject.coverImage}
                  controls
                  playsInline
                  className="max-h-[58dvh] rounded-lg"
                />
              ) : previewProject.coverImage ? (
                <img
                  src={previewProject.coverImage}
                  alt={previewProject.title}
                  className="max-h-[58dvh] rounded-lg object-contain"
                />
              ) : (
                <p className="py-12 text-xs text-slate-500">No media uploaded yet</p>
              )}
            </div>

            <p className="mt-4 text-sm text-slate-300">{previewProject.shortDescription}</p>
            {previewProject.externalUrl && (
              <div className="mt-3">
                <a
                  href={previewProject.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-display text-xs font-bold text-violet-400 hover:text-violet-300"
                >
                  <span>Visit Live Website ({previewProject.externalUrl})</span>
                  <span>↗</span>
                </a>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

function ProjectTable({
  projects,
  onEdit,
  onPreview,
  onTogglePublish,
  onToggleFeatured,
  onDelete,
  onMoveOrder,
}: {
  projects: PortfolioProject[];
  onEdit: (project: PortfolioProject) => void;
  onPreview: (project: PortfolioProject) => void;
  onTogglePublish: (project: PortfolioProject) => void;
  onToggleFeatured: (project: PortfolioProject) => void;
  onDelete: (project: PortfolioProject) => void;
  onMoveOrder: (project: PortfolioProject, direction: -1 | 1) => void;
}) {
  if (projects.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-slate-400">
        No projects match this view yet. Click "+ Add New Project" to create one.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] text-left text-xs sm:text-sm">
        <thead>
          <tr className="border-b border-white/10 font-mono text-[11px] uppercase tracking-wider text-slate-400">
            <th className="pb-3 pr-3">Order</th>
            <th className="pb-3 pr-3">Project</th>
            <th className="pb-3 pr-3">Category</th>
            <th className="pb-3 pr-3">Status</th>
            <th className="pb-3 pr-3">Featured</th>
            <th className="pb-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.06]">
          {projects.map((p, index) => {
            const catLabel =
              PORTFOLIO_CATEGORIES.find((c) => c.id === p.category)?.label ?? p.category;
            return (
              <tr key={p.id} className="group transition-colors hover:bg-white/[0.02]">
                <td className="py-3.5 pr-3">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => onMoveOrder(p, -1)}
                      aria-label={`Move ${p.title} up`}
                      className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-300 hover:bg-violet-600 hover:text-white disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      disabled={index === projects.length - 1}
                      onClick={() => onMoveOrder(p, 1)}
                      aria-label={`Move ${p.title} down`}
                      className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-300 hover:bg-violet-600 hover:text-white disabled:opacity-30"
                    >
                      ↓
                    </button>
                  </div>
                </td>

                <td className="py-3.5 pr-3">
                  <div className="flex items-center gap-3">
                    {p.coverImage ? (
                      <img
                        src={p.coverImage}
                        alt={p.title}
                        className="h-11 w-14 shrink-0 rounded-lg border border-white/10 object-cover"
                      />
                    ) : (
                      <div className="flex h-11 w-14 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-slate-900 font-mono text-[10px] text-slate-400">
                        {p.category.slice(0, 4).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-display font-bold text-white">{p.title}</p>
                      <p className="line-clamp-1 max-w-xs text-xs text-slate-400">
                        {p.shortDescription}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="py-3.5 pr-3">
                  <span className="rounded-full border border-violet-500/30 bg-violet-950/40 px-2.5 py-1 font-display text-[11px] font-semibold text-violet-300">
                    {catLabel}
                  </span>
                </td>

                <td className="py-3.5 pr-3">
                  <button
                    type="button"
                    onClick={() => onTogglePublish(p)}
                    className={`rounded-full px-3 py-1 font-mono text-[11px] font-semibold transition-colors ${
                      p.status === "published"
                        ? "border border-emerald-500/40 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/50"
                        : "border border-amber-500/40 bg-amber-950/40 text-amber-300 hover:bg-amber-900/50"
                    }`}
                  >
                    {p.status === "published" ? "● Published" : "○ Draft"}
                  </button>
                </td>

                <td className="py-3.5 pr-3">
                  <button
                    type="button"
                    onClick={() => onToggleFeatured(p)}
                    aria-label={`Toggle featured for ${p.title}`}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                      p.featured
                        ? "bg-violet-600/30 text-violet-200"
                        : "bg-white/5 text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    {p.featured ? "★ Featured" : "☆ Standard"}
                  </button>
                </td>

                <td className="py-3.5 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => onPreview(p)}
                      className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 font-display text-xs font-medium text-slate-200 hover:border-violet-400 hover:text-white"
                    >
                      Preview
                    </button>
                    <button
                      type="button"
                      onClick={() => onEdit(p)}
                      className="rounded-lg border border-violet-500/30 bg-violet-950/40 px-2.5 py-1.5 font-display text-xs font-semibold text-violet-200 hover:bg-violet-600 hover:text-white"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(p)}
                      aria-label={`Delete ${p.title}`}
                      className="rounded-lg border border-rose-500/30 bg-rose-950/40 px-2.5 py-1.5 font-display text-xs font-semibold text-rose-200 hover:bg-rose-600 hover:text-white"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
