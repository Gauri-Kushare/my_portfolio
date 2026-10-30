import { useEffect, useMemo, useRef, useState } from "react";
import { logos } from "@/data/projects";
import { usePublishedProjects } from "@/lib/cms-client";
import { PORTFOLIO_CATEGORIES, type PortfolioProject } from "@/lib/cms-types";
import { Modal, Reveal, SectionLabel, TiltCard } from "./ui";

interface LightboxMediaState {
  title: string;
  subtitle?: string;
  description?: string;
  mediaType: "image" | "video";
  src: string;
  poster?: string;
  gallery?: Array<{ url: string; label?: string }>;
  activeIndex?: number;
  externalUrl?: string;
  tags?: string[];
}

function CategoryHeading({
  title,
  count,
  subtitle,
}: {
  title: string;
  count: number;
  subtitle?: string;
}) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-3 border-b border-white/[0.08] pb-5 sm:mb-10 sm:pb-6 md:flex-row md:items-end">
      <div>
        <h3 className="font-display text-[clamp(1.75rem,5vw,3.5rem)] font-bold leading-tight tracking-tight text-white">
          {title}
        </h3>
        {subtitle && (
          <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-slate-400 sm:mt-2 sm:text-sm md:text-base">
            {subtitle}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2.5 self-start md:self-auto">
        <span className="font-display text-xs tracking-widest text-violet-400 sm:text-sm">
          COLLECTION
        </span>
        <span className="flex h-7 w-11 items-center justify-center rounded-full border border-violet-500/30 bg-violet-950/40 font-mono text-xs font-semibold text-violet-300 sm:h-8 sm:w-12">
          {String(count).padStart(2, "0")}
        </span>
      </div>
    </div>
  );
}

function ReelCard({
  reel,
  onOpenLightbox,
}: {
  reel: PortfolioProject;
  onOpenLightbox: (project: PortfolioProject) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play()
        .then(() => setIsPlaying(true))
        .catch(() => {});
    } else {
      v.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const handleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current && !videoRef.current.paused) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
    onOpenLightbox(reel);
  };

  const canHover = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  return (
    <div
      data-hover
      role="button"
      tabIndex={0}
      aria-label={`${isPlaying ? "Pause" : "Play"} ${reel.title}`}
      onClick={togglePlay}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          togglePlay();
        }
      }}
      onMouseEnter={() => {
        if (!canHover()) return;
        const v = videoRef.current;
        if (v && v.paused) {
          v.play()
            .then(() => setIsPlaying(true))
            .catch(() => {});
        }
      }}
      onMouseLeave={() => {
        if (!canHover()) return;
        const v = videoRef.current;
        if (v && !v.paused) {
          v.pause();
          setIsPlaying(false);
        }
      }}
      className="lift group relative mx-auto aspect-[9/16] w-full max-w-[300px] cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-slate-950/80 shadow-[0_15px_35px_rgba(0,0,0,0.6)] backdrop-blur-md transition-all min-[420px]:max-w-none"
    >
      <video
        ref={videoRef}
        src={reel.videoUrl}
        poster={reel.coverImage}
        muted={isMuted}
        loop
        playsInline
        preload="metadata"
        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
      />

      {/* Atmospheric lighting gradient overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/30" />

      {/* Top badges */}
      <div className="absolute inset-x-0 top-0 flex items-center justify-between p-3 sm:p-4">
        <span className="flex items-center gap-1.5 rounded-full border border-white/15 bg-black/60 px-2.5 py-1 text-[10px] font-medium tracking-wide text-white/90 backdrop-blur-md sm:text-[11px]">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              isPlaying ? "animate-pulse bg-emerald-400" : "bg-violet-400"
            }`}
          />
          {isPlaying ? "PLAYING" : "AI REEL"}
        </span>

        <div className="flex items-center gap-1.5">
          {/* Cinema Lightbox Expand Button */}
          <button
            type="button"
            onClick={handleExpand}
            aria-label={`Open ${reel.title} in video lightbox`}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/65 text-white/90 backdrop-blur-md transition-colors hover:border-violet-400 hover:bg-violet-600 hover:text-white"
            title="Watch in theater mode"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
              />
            </svg>
          </button>

          {/* Audio mute toggle */}
          <button
            type="button"
            onClick={toggleMute}
            aria-label={isMuted ? `Unmute ${reel.title}` : `Mute ${reel.title}`}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/65 text-white/90 backdrop-blur-md transition-colors hover:border-violet-400 hover:text-white"
          >
            {isMuted ? (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
                />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Play/Pause center overlay indicator */}
      {!isPlaying && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white/95 shadow-[0_0_20px_rgba(139,92,246,0.35)] backdrop-blur-md transition-transform group-hover:scale-110">
            <svg className="ml-0.5 h-5 w-5 fill-current" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}

      {/* Bottom title & metadata */}
      <div className="absolute inset-x-0 bottom-0 p-3.5 sm:p-4">
        <p className="font-display text-base font-semibold tracking-wide text-white sm:text-lg">
          {reel.title}
        </p>
        <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-300 sm:mt-1 sm:gap-2 sm:text-xs">
          <span>{reel.tags[0] || "AI Directed"}</span>
          <span className="h-1 w-1 rounded-full bg-violet-400" />
          <span>{reel.tags[1] || "9:16 Vertical"}</span>
        </p>
      </div>
    </div>
  );
}

function WebsiteCard({
  site,
  onOpenGallery,
}: {
  site: PortfolioProject;
  onOpenGallery: (project: PortfolioProject, initialIndex: number) => void;
}) {
  const galleryItems = useMemo(() => {
    if (site.screenshots && site.screenshots.length > 0) {
      return site.screenshots.map((s) => ({ url: s.url, label: s.label }));
    }
    const imgs = site.images.length > 0 ? site.images : site.coverImage ? [site.coverImage] : [];
    return imgs.map((url, idx) => ({ url, label: `Screen ${idx + 1}` }));
  }, [site]);

  const defaultIndex = useMemo(() => {
    const idx = galleryItems.findIndex((g) => g.url === site.coverImage);
    return idx >= 0 ? idx : 0;
  }, [galleryItems, site.coverImage]);

  const [activeIndex, setActiveIndex] = useState(defaultIndex);
  const currentShot = galleryItems[activeIndex] ??
    galleryItems[0] ?? { url: site.coverImage, label: "Home Page" };

  return (
    <TiltCard className="group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950/70 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-xl transition-all hover:border-violet-500/40 sm:rounded-3xl sm:p-6 md:p-8">
      {/* Subtle ambient gradient sheen */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-violet-600/10 blur-[80px] transition-opacity duration-700 group-hover:opacity-100" />

      <div className="grid items-center gap-6 sm:gap-8 lg:grid-cols-12">
        {/* Dimensional Browser Frame */}
        <div className="min-w-0 overflow-hidden rounded-xl border border-white/10 bg-slate-900/90 shadow-[0_15px_35px_rgba(0,0,0,0.7)] sm:rounded-2xl lg:col-span-7">
          {/* Browser Chrome Header */}
          <div className="flex items-center justify-between gap-2 border-b border-white/[0.08] bg-slate-950/80 px-3 py-2.5 backdrop-blur-md sm:px-4 sm:py-3">
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80 shadow-[0_0_6px_rgba(244,63,94,0.5)] sm:h-3 sm:w-3" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80 shadow-[0_0_6px_rgba(245,158,11,0.5)] sm:h-3 sm:w-3" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80 shadow-[0_0_6px_rgba(16,185,129,0.5)] sm:h-3 sm:w-3" />
            </div>

            {/* Address Bar */}
            <div className="mx-1 flex min-w-0 flex-1 max-w-sm items-center justify-center rounded-lg border border-white/5 bg-slate-900/70 px-2.5 py-1 font-mono text-[10px] text-slate-400 sm:mx-3 sm:px-3 sm:text-[11px]">
              <span className="mr-1 shrink-0 text-violet-400 sm:mr-1.5">🔒</span>
              <span className="truncate">
                {site.externalUrl
                  ? site.externalUrl.replace(/^https?:\/\//, "")
                  : `${site.title} — ${currentShot.label || "Concept Preview"}`}
              </span>
            </div>

            <div className="hidden shrink-0 text-right font-mono text-[11px] text-violet-300 sm:block">
              {currentShot.label}
            </div>
          </div>

          {/* Main Screenshot Screen */}
          <div
            onClick={() => onOpenGallery(site, activeIndex)}
            className="relative aspect-[16/10] w-full cursor-zoom-in overflow-hidden bg-slate-950"
          >
            <img
              src={currentShot.url}
              alt={`${site.title} — ${currentShot.label}`}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.02]"
            />
            {/* Screenshot Label Pill */}
            {currentShot.label && (
              <span className="absolute bottom-2.5 left-2.5 rounded-full border border-white/15 bg-black/70 px-3 py-1 font-display text-[11px] font-medium text-slate-200 backdrop-blur-md sm:bottom-3 sm:left-3">
                {currentShot.label}
              </span>
            )}
            {/* View Fullscreen overlay trigger */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenGallery(site, activeIndex);
              }}
              aria-label={`Enlarge ${site.title} screenshot`}
              className="absolute bottom-2.5 right-2.5 flex min-h-[36px] items-center gap-1.5 rounded-full border border-white/15 bg-black/70 px-3 py-1.5 font-display text-xs text-white shadow-lg backdrop-blur-md transition-all hover:border-violet-400 hover:bg-violet-600 hover:text-white sm:bottom-3 sm:right-3"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                />
              </svg>
              <span>Inspect</span>
            </button>
          </div>

          {/* Gallery Thumbnails Switcher */}
          {galleryItems.length > 1 && (
            <div className="grid grid-cols-4 gap-1.5 border-t border-white/[0.08] bg-slate-950/90 p-2 sm:gap-2 sm:p-2.5">
              {galleryItems.map((thumb, index) => {
                const isActive = activeIndex === index;
                return (
                  <button
                    key={`${site.id}-thumb-${index}`}
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    className={`group/thumb relative aspect-[4/3] overflow-hidden rounded-md border transition-all sm:rounded-lg ${
                      isActive
                        ? "border-violet-500 ring-2 ring-violet-500/40"
                        : "border-white/10 opacity-65 hover:opacity-100"
                    }`}
                    aria-label={`Switch to ${site.title} ${thumb.label || `screenshot ${index + 1}`}`}
                  >
                    <img
                      src={thumb.url}
                      alt={`${site.title} — ${thumb.label || `preview ${index + 1}`}`}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover object-top"
                    />
                    {thumb.label && (
                      <span className="absolute inset-x-0 bottom-0 truncate bg-black/75 px-1 py-0.5 text-[9px] font-medium text-slate-200">
                        {thumb.label}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Project Details */}
        <div className="flex min-w-0 flex-col justify-center lg:col-span-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-violet-500/30 bg-violet-950/40 px-3 py-1 text-[11px] font-semibold tracking-wider text-violet-300 sm:text-xs">
              {site.industry ? site.industry.toUpperCase() : "FEATURED WEBSITE"}
            </span>
            {site.externalUrl && (
              <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                Live Deployment
              </span>
            )}
          </div>

          <h4 className="mt-3 font-display text-[clamp(1.5rem,4vw,2.25rem)] font-bold tracking-tight text-white sm:mt-4">
            {site.title}
          </h4>

          <p className="mt-3 text-sm leading-relaxed text-slate-300 sm:mt-4 sm:text-base">
            {site.shortDescription}
          </p>

          {site.technologies.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {site.technologies.map((tech) => (
                <span
                  key={tech}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 font-mono text-[11px] text-slate-300"
                >
                  {tech}
                </span>
              ))}
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3 min-[440px]:flex-row min-[440px]:flex-wrap min-[440px]:items-center sm:mt-8 sm:gap-4">
            {site.externalUrl ? (
              <a
                href={site.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group/btn inline-flex min-h-[46px] items-center justify-center gap-2.5 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 font-display text-sm font-semibold text-white shadow-[0_0_25px_rgba(139,92,246,0.4)] transition-all hover:scale-105 hover:from-violet-500 hover:to-indigo-500 hover:shadow-[0_0_35px_rgba(139,92,246,0.6)]"
              >
                <span>Visit Live Website</span>
                <span className="transition-transform duration-200 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-0.5">
                  ↗
                </span>
              </a>
            ) : (
              <div className="inline-flex min-h-[40px] items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-slate-400">
                Conceptual Website Project
              </div>
            )}

            <button
              type="button"
              onClick={() => onOpenGallery(site, activeIndex)}
              className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-5 py-3 font-display text-sm font-medium text-slate-200 transition-colors hover:border-violet-400 hover:text-white"
            >
              <span>Browse Screenshots ({galleryItems.length})</span>
            </button>
          </div>
        </div>
      </div>
    </TiltCard>
  );
}

export function Work() {
  const { projects } = usePublishedProjects();
  const [active, setActive] = useState<string>("reels");
  const [lightbox, setLightbox] = useState<LightboxMediaState | null>(null);

  const reelProjects = useMemo(() => projects.filter((p) => p.category === "reels"), [projects]);
  const graphicProjects = useMemo(
    () => projects.filter((p) => p.category === "graphics"),
    [projects],
  );
  const cinematicProjects = useMemo(
    () => projects.filter((p) => p.category === "cinematics"),
    [projects],
  );
  const websiteProjects = useMemo(
    () => projects.filter((p) => p.category === "websites"),
    [projects],
  );

  // Exact required section order: 1. AI Reels, 2. Graphics, 3. Cinematics, 4. Websites
  const cats = useMemo(
    () => [
      { id: "reels", label: "AI Reels", count: reelProjects.length },
      { id: "graphics", label: "Graphics", count: graphicProjects.length },
      { id: "cinematics", label: "Cinematics", count: cinematicProjects.length },
      { id: "websites", label: "Websites", count: websiteProjects.length },
    ],
    [reelProjects.length, graphicProjects.length, cinematicProjects.length, websiteProjects.length],
  );

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setActive(e.target.id.replace("work-", ""));
          }
        });
      },
      { rootMargin: "-35% 0px -55% 0px" },
    );

    cats.forEach((c) => {
      const el = document.getElementById("work-" + c.id);
      if (el) io.observe(el);
    });

    return () => io.disconnect();
  }, [cats]);

  const openProjectLightbox = (project: PortfolioProject, initialIndex = 0) => {
    if (project.category === "reels" || (project.videoUrl && project.images.length === 0)) {
      setLightbox({
        title: project.title,
        subtitle: "AI Directed Vertical Cinema",
        description: project.shortDescription,
        mediaType: "video",
        src: project.videoUrl ?? "",
        poster: project.coverImage,
        tags: project.tags,
        ...(project.externalUrl ? { externalUrl: project.externalUrl } : {}),
      });
      return;
    }

    const gallery =
      project.screenshots && project.screenshots.length > 0
        ? project.screenshots.map((s) => ({ url: s.url, label: s.label }))
        : (project.images.length > 0 ? project.images : [project.coverImage])
            .filter(Boolean)
            .map((url, idx) => ({ url, label: `${project.title} — ${idx + 1}` }));

    const current = gallery[initialIndex] ?? gallery[0] ?? { url: project.coverImage };

    setLightbox({
      title: project.title,
      ...(project.industry ? { subtitle: project.industry } : {}),
      description: project.shortDescription,
      mediaType: "image",
      src: current.url,
      gallery,
      activeIndex: initialIndex,
      tags: project.tags,
      ...(project.externalUrl ? { externalUrl: project.externalUrl } : {}),
    });
  };

  return (
    <section id="work" className="relative py-16 sm:py-24 md:py-36">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute left-1/2 top-40 h-[400px] w-[90vw] max-w-[800px] -translate-x-1/2 rounded-full bg-violet-900/10 blur-[110px] sm:h-[600px] sm:blur-[130px]" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-10">
        <Reveal>
          <SectionLabel n="01">Curated Portfolio</SectionLabel>
          <div className="flex flex-col justify-between gap-4 sm:gap-6 md:flex-row md:items-end">
            <h2 className="font-display text-[clamp(2.25rem,7vw,5.25rem)] font-extrabold leading-[1.02] tracking-tight text-white">
              Selected <span className="text-violet-glow">Work.</span>
            </h2>
            <p className="max-w-md text-sm leading-relaxed text-slate-400 sm:text-base md:text-lg">
              A comprehensive showcase across AI reels, graphics, cinematics, brand identities, and
              digital product websites.
            </p>
          </div>
        </Reveal>
      </div>

      {/* Sticky Category Filter Tabs — Exact Order: AI Reels, Graphics, Cinematics, Websites */}
      <div className="sticky top-16 z-30 mt-10 border-y border-white/[0.08] bg-slate-950/85 backdrop-blur-2xl sm:top-20 sm:mt-14">
        <div
          role="navigation"
          aria-label="Portfolio categories"
          className="no-scrollbar mx-auto flex max-w-7xl items-center gap-1.5 overflow-x-auto px-4 py-3 sm:gap-2 sm:px-6 sm:py-3.5 md:px-10"
        >
          {cats.map((c) => {
            const isActive = active === c.id;
            return (
              <a
                key={c.id}
                href={`#work-${c.id}`}
                className={`group flex min-h-[40px] shrink-0 items-center gap-2 rounded-full px-4 py-2 font-display text-xs font-semibold tracking-wide transition-all sm:min-h-[42px] sm:px-5 sm:py-2.5 md:text-sm ${
                  isActive
                    ? "border border-violet-400/40 bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-[0_0_20px_rgba(139,92,246,0.35)]"
                    : "border border-transparent text-slate-400 hover:border-white/10 hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                <span>{c.label}</span>
                <span
                  className={`rounded-full px-2 py-0.5 font-mono text-[10px] transition-colors ${
                    isActive
                      ? "bg-black/30 text-white"
                      : "bg-white/[0.06] text-slate-400 group-hover:text-white"
                  }`}
                >
                  {c.count}
                </span>
              </a>
            );
          })}
        </div>
      </div>

      {/* Main Categories Display in Exact Required Order */}
      <div className="mx-auto max-w-7xl space-y-20 px-4 pt-12 sm:space-y-28 sm:px-6 sm:pt-16 md:space-y-36 md:px-10 md:pt-20">
        {/* 1. AI Reels Category (First Category on Public Portfolio) */}
        <div id="work-reels" className="scroll-mt-28 sm:scroll-mt-36">
          <Reveal>
            <CategoryHeading
              title={PORTFOLIO_CATEGORIES[0]!.label}
              count={reelProjects.length}
              subtitle={PORTFOLIO_CATEGORIES[0]!.subtitle}
            />
            <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 sm:gap-5 md:grid-cols-3 xl:grid-cols-6">
              {reelProjects.map((r) => (
                <ReelCard key={r.id} reel={r} onOpenLightbox={openProjectLightbox} />
              ))}
            </div>
          </Reveal>
        </div>

        {/* 2. Graphics Category */}
        <div id="work-graphics" className="scroll-mt-28 sm:scroll-mt-36">
          <Reveal>
            <CategoryHeading
              title={PORTFOLIO_CATEGORIES[1]!.label}
              count={graphicProjects.length}
              subtitle={PORTFOLIO_CATEGORIES[1]!.subtitle}
            />
            <div className="columns-1 gap-5 sm:columns-2 sm:gap-6 lg:columns-3">
              {graphicProjects.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => openProjectLightbox(g, 0)}
                  aria-label={`View graphic ${g.title}`}
                  className="lift group relative mb-5 block w-full break-inside-avoid overflow-hidden rounded-2xl border border-white/10 bg-slate-950/80 text-left shadow-[0_15px_30px_rgba(0,0,0,0.6)] sm:mb-6"
                >
                  <div className="relative overflow-hidden">
                    <img
                      src={g.coverImage || g.images[0]}
                      alt={g.title}
                      width={g.aspectWidth ?? 1024}
                      height={g.aspectHeight ?? 1024}
                      loading="lazy"
                      decoding="async"
                      className="w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                    {g.images.length > 1 && (
                      <span className="absolute right-3 top-3 rounded-full border border-white/15 bg-black/70 px-2.5 py-1 font-mono text-[10px] font-semibold text-violet-300 backdrop-blur-md">
                        {g.images.length} Images
                      </span>
                    )}
                    <div className="pointer-events-none hidden bg-gradient-to-t from-black/85 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 sm:absolute sm:inset-0 sm:block" />
                  </div>
                  <div className="flex items-center justify-between border-t border-white/10 bg-slate-950/90 px-4 py-3 sm:absolute sm:inset-x-0 sm:bottom-0 sm:translate-y-3 sm:border-t-0 sm:bg-transparent sm:p-5 sm:opacity-0 sm:transition-all sm:duration-300 sm:group-hover:translate-y-0 sm:group-hover:opacity-100">
                    <div className="min-w-0 pr-2">
                      <span className="block truncate font-display text-sm font-semibold text-white sm:text-base">
                        {g.title}
                      </span>
                      {g.shortDescription && (
                        <span className="mt-0.5 line-clamp-1 block text-xs text-slate-300">
                          {g.shortDescription}
                        </span>
                      )}
                    </div>
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-xs text-white backdrop-blur-md">
                      ↗
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {/* Preserved Brand Identity & Logo Designs Collection within Graphics */}
            <div
              id="work-logos"
              className="mt-16 scroll-mt-28 pt-8 border-t border-white/[0.08] sm:mt-20"
            >
              <div className="mb-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
                <div>
                  <span className="font-mono text-xs font-semibold uppercase tracking-widest text-violet-400">
                    Brand Systems & Marks
                  </span>
                  <h4 className="mt-1 font-display text-2xl font-bold text-white sm:text-3xl">
                    Logo & Identity Collection
                  </h4>
                </div>
                <span className="font-mono text-xs text-slate-400">
                  {String(logos.length).padStart(2, "0")} Brand Marks
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
                {logos.map((l) => (
                  <button
                    key={l.brand}
                    type="button"
                    data-hover
                    onClick={() =>
                      setLightbox({
                        title: l.brand,
                        subtitle: "Brand Mark & Visual Identity",
                        mediaType: "image",
                        src: l.mark,
                      })
                    }
                    aria-label={`View ${l.brand}`}
                    className="lift group relative flex aspect-square w-full flex-col items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-slate-900/60 to-slate-950/90 p-4 pb-9 shadow-[0_10px_25px_rgba(0,0,0,0.5)] transition-all hover:border-violet-500/40 sm:p-8"
                  >
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.02] to-white/[0.06] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <img
                      src={l.mark}
                      alt={l.brand}
                      loading="lazy"
                      decoding="async"
                      className="max-h-[65%] max-w-[75%] object-contain filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] transition-transform duration-500 group-hover:scale-110 sm:max-h-[60%] sm:max-w-[70%]"
                    />
                    <div className="inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 via-slate-950/85 to-transparent px-2 py-2.5 transition-opacity duration-300 sm:absolute sm:p-4 sm:opacity-0 sm:group-hover:opacity-100">
                      <p className="truncate font-display text-center text-[11px] font-semibold uppercase tracking-wider text-violet-300 sm:text-xs">
                        {l.brand}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </Reveal>
        </div>

        {/* 3. Cinematics Category */}
        <div id="work-cinematics" className="scroll-mt-28 sm:scroll-mt-36">
          <Reveal>
            <CategoryHeading
              title={PORTFOLIO_CATEGORIES[2]!.label}
              count={cinematicProjects.length}
              subtitle={PORTFOLIO_CATEGORIES[2]!.subtitle}
            />
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6">
              {cinematicProjects.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    if (c.videoUrl) {
                      setLightbox({
                        title: c.title,
                        subtitle: "2.39:1 Widescreen Cinematic Preview",
                        description: c.shortDescription,
                        mediaType: "video",
                        src: c.videoUrl,
                        poster: c.coverImage,
                        tags: c.tags,
                      });
                    } else {
                      openProjectLightbox(c, 0);
                    }
                  }}
                  className="lift group relative block w-full overflow-hidden rounded-2xl border border-white/10 bg-slate-950/80 text-left shadow-[0_15px_35px_rgba(0,0,0,0.7)]"
                  aria-label={`View cinematic frame ${c.title}`}
                >
                  <div className="relative aspect-[16/9] w-full overflow-hidden">
                    <img
                      src={c.coverImage || c.images[0]}
                      alt={c.title}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                    {c.images.length > 1 && (
                      <span className="absolute right-3 top-3 rounded-full border border-white/15 bg-black/70 px-2.5 py-1 font-mono text-[10px] font-semibold text-violet-300 backdrop-blur-md">
                        {c.images.length} Stills
                      </span>
                    )}
                    {c.videoUrl && (
                      <span className="absolute left-3 top-3 rounded-full border border-emerald-400/30 bg-black/70 px-2.5 py-1 font-mono text-[10px] font-semibold text-emerald-300 backdrop-blur-md">
                        ▶ Motion Preview
                      </span>
                    )}
                    <div className="pointer-events-none hidden bg-gradient-to-t from-black/90 via-black/20 to-transparent sm:absolute sm:inset-0 sm:block" />
                  </div>

                  <div className="flex items-center justify-between gap-3 border-t border-white/10 bg-slate-950/90 p-4 sm:absolute sm:inset-x-0 sm:bottom-0 sm:items-end sm:border-t-0 sm:bg-transparent sm:p-6">
                    <div className="min-w-0">
                      <span className="inline-block rounded-full border border-violet-500/30 bg-violet-950/60 px-2.5 py-0.5 text-[10px] font-medium tracking-wider text-violet-300 backdrop-blur-md sm:py-1 sm:text-[11px]">
                        2.39:1 CINEMATIC
                      </span>
                      <h4 className="mt-1.5 truncate font-display text-base font-bold text-white sm:mt-2 sm:text-xl md:text-2xl">
                        {c.title}
                      </h4>
                    </div>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white shadow-lg backdrop-blur-md transition-all group-hover:scale-110 group-hover:bg-violet-600 sm:h-10 sm:w-10">
                      ↗
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </Reveal>
        </div>

        {/* 4. Websites Category (Featuring The Velora Edit!) */}
        <div id="work-websites" className="scroll-mt-28 sm:scroll-mt-36">
          <Reveal>
            <CategoryHeading
              title={PORTFOLIO_CATEGORIES[3]!.label}
              count={websiteProjects.length}
              subtitle={PORTFOLIO_CATEGORIES[3]!.subtitle}
            />
            <div className="space-y-8 sm:space-y-12">
              {websiteProjects.map((w) => (
                <WebsiteCard
                  key={w.id}
                  site={w}
                  onOpenGallery={(proj, idx) => openProjectLightbox(proj, idx)}
                />
              ))}
            </div>
          </Reveal>
        </div>
      </div>

      {/* Interactive Image & Video Lightbox Modal */}
      <Modal open={!!lightbox} onClose={() => setLightbox(null)}>
        {lightbox && (
          <div className="relative flex flex-col">
            <div className="flex max-h-[74dvh] items-center justify-center overflow-auto bg-black/75 p-2 sm:max-h-[78dvh] sm:p-4">
              {lightbox.mediaType === "video" ? (
                <video
                  src={lightbox.src}
                  poster={lightbox.poster}
                  controls
                  autoPlay
                  playsInline
                  className="mx-auto max-h-[70dvh] w-auto rounded-lg object-contain shadow-2xl sm:max-h-[74dvh] sm:rounded-xl"
                />
              ) : (
                <img
                  src={lightbox.src}
                  alt={lightbox.title}
                  className="mx-auto max-h-[70dvh] w-auto rounded-lg object-contain shadow-2xl sm:max-h-[74dvh] sm:rounded-xl"
                />
              )}
            </div>

            {/* Multi-image / screenshot gallery bar inside lightbox */}
            {lightbox.gallery && lightbox.gallery.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto border-t border-white/10 bg-slate-950/95 px-4 py-2.5">
                {lightbox.gallery.map((item, idx) => {
                  const isCurrent = (lightbox.activeIndex ?? 0) === idx;
                  return (
                    <button
                      key={`${item.url}-${idx}`}
                      type="button"
                      onClick={() =>
                        setLightbox((prev) =>
                          prev
                            ? {
                                ...prev,
                                src: item.url,
                                activeIndex: idx,
                              }
                            : null,
                        )
                      }
                      className={`flex shrink-0 items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs transition-all ${
                        isCurrent
                          ? "border-violet-500 bg-violet-600/25 text-white"
                          : "border-white/10 bg-white/5 text-slate-400 hover:text-white"
                      }`}
                    >
                      <img
                        src={item.url}
                        alt={item.label || `Slide ${idx + 1}`}
                        className="h-7 w-10 rounded object-cover"
                      />
                      <span className="font-display font-medium">
                        {item.label || `View ${idx + 1}`}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex flex-col justify-between gap-3 border-t border-white/10 bg-slate-950/95 px-4 py-3.5 backdrop-blur-md sm:flex-row sm:items-center sm:px-6 sm:py-4">
              <div>
                {lightbox.subtitle && (
                  <p className="font-mono text-[11px] uppercase tracking-wider text-violet-400">
                    {lightbox.subtitle}
                  </p>
                )}
                <p className="font-display text-sm font-semibold text-white sm:text-base">
                  {lightbox.title}
                </p>
                {lightbox.description && (
                  <p className="mt-0.5 max-w-2xl text-xs text-slate-300">{lightbox.description}</p>
                )}
              </div>

              {lightbox.externalUrl && (
                <a
                  href={lightbox.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[38px] shrink-0 items-center justify-center gap-2 rounded-full bg-violet-600 px-4 py-2 font-display text-xs font-semibold text-white transition-colors hover:bg-violet-500"
                >
                  <span>Visit Live Website</span>
                  <span>↗</span>
                </a>
              )}
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
}
