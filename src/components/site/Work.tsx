import { useEffect, useRef, useState } from "react";
import { reels, graphics, cinematics, logos, websites } from "@/data/projects";
import { Modal, Reveal, SectionLabel, TiltCard } from "./ui";

const cats = [
  { id: "reels", label: "AI Reels", count: reels.length },
  { id: "graphics", label: "Graphics", count: graphics.length },
  { id: "cinematics", label: "Cinematics", count: cinematics.length },
  { id: "logos", label: "Logos", count: logos.length },
  { id: "websites", label: "Websites", count: websites.length },
];

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
    <div className="mb-10 flex flex-col justify-between gap-3 border-b border-white/[0.08] pb-6 md:flex-row md:items-end">
      <div>
        <h3 className="font-display text-3xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl">
          {title}
        </h3>
        {subtitle && <p className="mt-2 text-sm text-slate-400 md:text-base">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <span className="font-display text-sm tracking-widest text-violet-400">COLLECTION</span>
        <span className="flex h-8 w-12 items-center justify-center rounded-full border border-violet-500/30 bg-violet-950/40 font-mono text-xs font-semibold text-violet-300">
          {String(count).padStart(2, "0")}
        </span>
      </div>
    </div>
  );
}

function ReelCard({ reel }: { reel: (typeof reels)[0] }) {
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

  return (
    <div
      data-hover
      onClick={togglePlay}
      onMouseEnter={() => {
        const v = videoRef.current;
        if (v && v.paused) {
          v.play()
            .then(() => setIsPlaying(true))
            .catch(() => {});
        }
      }}
      onMouseLeave={() => {
        const v = videoRef.current;
        if (v && !v.paused) {
          v.pause();
          setIsPlaying(false);
        }
      }}
      className="lift group relative aspect-[9/16] w-[74vw] max-w-[290px] shrink-0 snap-start cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-slate-950/80 shadow-[0_15px_35px_rgba(0,0,0,0.6)] backdrop-blur-md transition-all md:w-[280px]"
    >
      <video
        ref={videoRef}
        src={reel.video}
        poster={reel.poster}
        muted={isMuted}
        loop
        playsInline
        preload="metadata"
        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
      />

      {/* Atmospheric lighting gradient overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/30" />

      {/* Top badges */}
      <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
        <span className="flex items-center gap-1.5 rounded-full border border-white/15 bg-black/50 px-2.5 py-1 text-[11px] font-medium tracking-wide text-white/90 backdrop-blur-md">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              isPlaying ? "animate-pulse bg-emerald-400" : "bg-violet-400"
            }`}
          />
          {isPlaying ? "PLAYING" : "AI REEL"}
        </span>

        {/* Audio mute toggle */}
        <button
          type="button"
          onClick={toggleMute}
          aria-label={isMuted ? "Unmute reel" : "Mute reel"}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-black/60 text-white/80 backdrop-blur-md transition-colors hover:border-violet-400 hover:text-white"
        >
          {isMuted ? (
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

      {/* Play/Pause center overlay indicator */}
      {!isPlaying && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white/90 shadow-[0_0_20px_rgba(139,92,246,0.3)] backdrop-blur-md transition-transform group-hover:scale-110">
            <svg className="ml-0.5 h-5 w-5 fill-current" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}

      {/* Bottom title & metadata */}
      <div className="absolute inset-x-0 bottom-0 p-5">
        <p className="font-display text-lg font-semibold tracking-wide text-white">{reel.title}</p>
        <p className="mt-1 flex items-center gap-2 text-xs text-slate-400">
          <span>AI Generated & Directed</span>
          <span className="h-1 w-1 rounded-full bg-violet-400" />
          <span>9:16 Vertical</span>
        </p>
      </div>
    </div>
  );
}

function WebsiteCard({
  site,
  onZoom,
}: {
  site: (typeof websites)[0];
  onZoom: (title: string, src: string) => void;
}) {
  const [activeImage, setActiveImage] = useState(site.image);

  return (
    <TiltCard className="group relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/70 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-xl transition-all hover:border-violet-500/40 md:p-8">
      {/* Subtle ambient gradient sheen */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-violet-600/10 blur-[80px] transition-opacity duration-700 group-hover:opacity-100" />

      <div className="grid items-center gap-8 lg:grid-cols-12">
        {/* Dimensional Browser Frame */}
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/90 shadow-[0_15px_35px_rgba(0,0,0,0.7)] lg:col-span-7">
          {/* Browser Chrome Header */}
          <div className="flex items-center justify-between border-b border-white/[0.08] bg-slate-950/80 px-4 py-3 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-rose-500/80 shadow-[0_0_6px_rgba(244,63,94,0.5)]" />
              <span className="h-3 w-3 rounded-full bg-amber-500/80 shadow-[0_0_6px_rgba(245,158,11,0.5)]" />
              <span className="h-3 w-3 rounded-full bg-emerald-500/80 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
            </div>

            {/* Address Bar */}
            <div className="mx-3 flex flex-1 max-w-sm items-center justify-center rounded-lg border border-white/5 bg-slate-900/70 px-3 py-1 font-mono text-[11px] text-slate-400">
              <span className="mr-1.5 text-violet-400">🔒</span>
              <span className="truncate">
                {site.url
                  ? site.url.replace("https://", "")
                  : `${site.title.toLowerCase().replace(/\s+/g, "-")}.design`}
              </span>
            </div>

            <div className="w-10 text-right text-xs text-slate-500">2026</div>
          </div>

          {/* Main Screenshot Screen */}
          <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-950">
            <img
              src={activeImage}
              alt={site.title}
              loading="lazy"
              className="h-full w-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.02]"
            />
            {/* View Fullscreen overlay trigger */}
            <button
              type="button"
              onClick={() => onZoom(site.title, activeImage)}
              aria-label={`Enlarge ${site.title} screenshot`}
              className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full border border-white/15 bg-black/60 px-3 py-1.5 font-display text-xs text-white shadow-lg backdrop-blur-md transition-all hover:border-violet-400 hover:bg-violet-600 hover:text-white"
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
          {site.gallery.length > 1 && (
            <div className="grid grid-cols-4 gap-2 border-t border-white/[0.08] bg-slate-950/90 p-2.5">
              {site.gallery.map((thumb, index) => {
                const isActive = activeImage === thumb;
                return (
                  <button
                    key={`${site.title}-thumb-${index}`}
                    type="button"
                    onClick={() => setActiveImage(thumb)}
                    className={`group/thumb relative aspect-[4/3] overflow-hidden rounded-lg border transition-all ${
                      isActive
                        ? "border-violet-500 ring-2 ring-violet-500/40"
                        : "border-white/10 opacity-60 hover:opacity-100"
                    }`}
                    aria-label={`Switch to screenshot ${index + 1}`}
                  >
                    <img
                      src={thumb}
                      alt={`${site.title} preview ${index + 1}`}
                      loading="lazy"
                      className="h-full w-full object-cover object-top"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Project Details */}
        <div className="flex flex-col justify-center lg:col-span-5">
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-violet-500/30 bg-violet-950/40 px-3 py-1 text-xs font-semibold tracking-wider text-violet-300">
              FEATURED WEBSITE
            </span>
            {site.url && (
              <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                Live Deployment
              </span>
            )}
          </div>

          <h4 className="mt-4 font-display text-2xl font-bold tracking-tight text-white md:text-3xl lg:text-4xl">
            {site.title}
          </h4>

          <p className="mt-4 text-base leading-relaxed text-slate-300">{site.description}</p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            {site.url ? (
              <a
                href={site.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group/btn inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3.5 font-display text-sm font-semibold text-white shadow-[0_0_25px_rgba(139,92,246,0.4)] transition-all hover:scale-105 hover:from-violet-500 hover:to-indigo-500 hover:shadow-[0_0_35px_rgba(139,92,246,0.6)]"
              >
                <span>View Live Website</span>
                <span className="transition-transform duration-200 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-0.5">
                  ↗
                </span>
              </a>
            ) : (
              <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-slate-400">
                Conceptual Website Project
              </div>
            )}

            <button
              type="button"
              onClick={() => onZoom(site.title, activeImage)}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-5 py-3.5 font-display text-sm font-medium text-slate-200 transition-colors hover:border-violet-400 hover:text-white"
            >
              <span>Enlarge View</span>
            </button>
          </div>
        </div>
      </div>
    </TiltCard>
  );
}

export function Work() {
  const [active, setActive] = useState("websites");
  const [modalMedia, setModalMedia] = useState<{
    title: string;
    src: string;
  } | null>(null);

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
  }, []);

  return (
    <section id="work" className="relative py-28 md:py-40">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute left-1/2 top-40 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-violet-900/10 blur-[130px]" />

      <div className="mx-auto max-w-7xl px-5 md:px-10">
        <Reveal>
          <SectionLabel n="01">Curated Portfolio</SectionLabel>
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <h2 className="font-display text-5xl font-extrabold tracking-tight text-white md:text-7xl lg:text-8xl">
              Selected <span className="text-violet-glow">Work.</span>
            </h2>
            <p className="max-w-md text-base leading-relaxed text-slate-400 md:text-lg">
              A comprehensive showcase across digital product websites, AI reels, cinematics, brand
              identities, and graphic art.
            </p>
          </div>
        </Reveal>
      </div>

      {/* Sticky Category Filter Tabs */}
      <div className="sticky top-20 z-30 mt-16 border-y border-white/[0.08] bg-slate-950/80 backdrop-blur-2xl">
        <div className="no-scrollbar mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-5 py-3.5 md:px-10">
          {cats.map((c) => {
            const isActive = active === c.id;
            return (
              <a
                key={c.id}
                href={`#work-${c.id}`}
                className={`group flex shrink-0 items-center gap-2 rounded-full px-5 py-2.5 font-display text-xs font-semibold tracking-wide transition-all md:text-sm ${
                  isActive
                    ? "border border-violet-400/40 bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-[0_0_20px_rgba(139,92,246,0.35)]"
                    : "border border-transparent text-slate-400 hover:border-white/10 hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                <span>{c.label}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-mono transition-colors ${
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

      {/* Main Categories Display */}
      <div className="mx-auto max-w-7xl space-y-36 px-5 pt-20 md:px-10">
        {/* 1. Websites Category (Featuring The Velora Edit!) */}
        <div id="work-websites" className="scroll-mt-36">
          <Reveal>
            <CategoryHeading
              title="Websites"
              count={websites.length}
              subtitle="Full-scale interactive website experiences, e-commerce architectures, and bespoke brand platforms."
            />
            <div className="space-y-12">
              {websites.map((w) => (
                <WebsiteCard
                  key={w.title}
                  site={w}
                  onZoom={(title, src) => setModalMedia({ title, src })}
                />
              ))}
            </div>
          </Reveal>
        </div>

        {/* 2. AI Reels Category */}
        <div id="work-reels" className="scroll-mt-36">
          <Reveal>
            <CategoryHeading
              title="AI Reels"
              count={reels.length}
              subtitle="Scroll-stopping cinematic short-form video reels created through generative AI workflows."
            />
            <div className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-8 md:-mx-10 md:px-10">
              {reels.map((r) => (
                <ReelCard key={r.title} reel={r} />
              ))}
            </div>
          </Reveal>
        </div>

        {/* 3. Graphics Category */}
        <div id="work-graphics" className="scroll-mt-36">
          <Reveal>
            <CategoryHeading
              title="Graphics"
              count={graphics.length}
              subtitle="Editorial poster design, 3D visual campaigns, and digital art explorations."
            />
            <div className="columns-1 gap-6 sm:columns-2 lg:columns-3">
              {graphics.map((g, index) => (
                <button
                  key={g.title}
                  type="button"
                  onClick={() => setModalMedia({ title: g.title, src: g.src })}
                  className="lift group relative mb-6 block w-full overflow-hidden rounded-2xl border border-white/10 bg-slate-950/80 text-left shadow-[0_15px_30px_rgba(0,0,0,0.6)]"
                >
                  <img
                    src={g.src}
                    alt={g.title}
                    width={g.w}
                    height={g.h}
                    loading="lazy"
                    className="w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-between p-5 translate-y-3 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                    <span className="font-display text-base font-semibold text-white">
                      {g.title}
                    </span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-md">
                      ↗
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </Reveal>
        </div>

        {/* 4. Cinematics Category */}
        <div id="work-cinematics" className="scroll-mt-36">
          <Reveal>
            <CategoryHeading
              title="Cinematics"
              count={cinematics.length}
              subtitle="Atmospheric art direction, dramatic color grade, and widescreen visual storytelling."
            />
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {cinematics.map((c) => (
                <button
                  key={c.title}
                  type="button"
                  onClick={() => setModalMedia({ title: c.title, src: c.poster })}
                  className="lift group relative block w-full overflow-hidden rounded-2xl border border-white/10 bg-slate-950/80 text-left shadow-[0_15px_35px_rgba(0,0,0,0.7)]"
                  aria-label={`View cinematic frame ${c.title}`}
                >
                  <div className="relative aspect-[16/9] w-full overflow-hidden">
                    <img
                      src={c.poster}
                      alt={c.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                  </div>

                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-6">
                    <div>
                      <span className="rounded-full border border-violet-500/30 bg-violet-950/60 px-2.5 py-1 text-[11px] font-medium tracking-wider text-violet-300 backdrop-blur-md">
                        2.39:1 CINEMATIC
                      </span>
                      <h4 className="mt-2 font-display text-xl font-bold text-white md:text-2xl">
                        {c.title}
                      </h4>
                    </div>
                    <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white shadow-lg backdrop-blur-md transition-all group-hover:scale-110 group-hover:bg-violet-600">
                      ↗
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </Reveal>
        </div>

        {/* 5. Logos Category */}
        <div id="work-logos" className="scroll-mt-36">
          <Reveal>
            <CategoryHeading
              title="Logo Designs"
              count={logos.length}
              subtitle="Modern identities, brand marks, and typographic emblems created for distinctive presence."
            />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {logos.map((l) => (
                <div
                  key={l.brand}
                  data-hover
                  className="lift group relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-slate-900/60 to-slate-950/90 p-8 shadow-[0_10px_25px_rgba(0,0,0,0.5)] transition-all hover:border-violet-500/40"
                >
                  {/* Subtle specular sheen */}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.02] to-white/[0.06] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                  {l.mark.startsWith("/") || l.mark.startsWith("http") ? (
                    <img
                      src={l.mark}
                      alt={l.brand}
                      loading="lazy"
                      className="max-h-[60%] max-w-[70%] object-contain filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <span className="font-display text-3xl font-extrabold tracking-tight text-white transition-transform duration-500 group-hover:scale-110 md:text-4xl">
                      {l.mark}
                    </span>
                  )}

                  {/* Hover brand reveal caption */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <p className="font-display text-center text-xs font-semibold uppercase tracking-wider text-violet-300">
                      {l.brand}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>

      {/* Lightbox Modal */}
      <Modal open={!!modalMedia} onClose={() => setModalMedia(null)}>
        {modalMedia && (
          <div className="relative">
            <img
              src={modalMedia.src}
              alt={modalMedia.title}
              className="mx-auto max-h-[82vh] w-auto rounded-xl object-contain shadow-2xl"
            />
            <div className="border-t border-white/10 bg-slate-950/80 px-6 py-4 backdrop-blur-md">
              <p className="font-display text-base font-semibold text-white">{modalMedia.title}</p>
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
}
