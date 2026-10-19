import { useEffect, useState } from "react";
import { reels, graphics, cinematics, logos, websites } from "@/data/projects";
import { Modal, Reveal, SectionLabel } from "./ui";

const cats = [
  { id: "reels", label: "AI Reels" },
  { id: "graphics", label: "Graphics" },
  { id: "cinematics", label: "Cinematics" },
  { id: "logos", label: "Logos" },
  { id: "websites", label: "Websites" },
];

function Heading({ title, count }: { title: string; count: number }) {
  return (
    <div className="mb-8 flex items-end justify-between gap-4">
      <h3 className="text-4xl font-semibold md:text-6xl">{title}</h3>
      <span className="font-display text-muted-foreground">({String(count).padStart(2, "0")})</span>
    </div>
  );
}

export function Work() {
  const [active, setActive] = useState("reels");
  const [img, setImg] = useState<{
    title: string;
    src: string;
    w?: number;
    h?: number;
  } | null>(null);

  useEffect(() => {
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && setActive(e.target.id.replace("work-", ""))),
      { rootMargin: "-40% 0px -55% 0px" },
    );
    cats.forEach((c) => {
      const el = document.getElementById("work-" + c.id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  return (
    <section id="work" className="py-24 md:py-36">
      <div className="mx-auto max-w-7xl px-5 md:px-10">
        <Reveal>
          <SectionLabel n="01">Selected Work</SectionLabel>
          <h2 className="text-6xl font-bold md:text-9xl">
            Work<span className="text-primary">.</span>
          </h2>
        </Reveal>
      </div>

      <div className="sticky top-16 z-30 mt-12 border-y border-border bg-background/80 backdrop-blur-xl">
        <div className="no-scrollbar mx-auto flex max-w-7xl gap-2 overflow-x-auto px-5 py-3 md:px-10">
          {cats.map((c) => (
            <a
              key={c.id}
              href={`#work-${c.id}`}
              className={`shrink-0 rounded-full px-4 py-2 text-sm transition-colors ${active === c.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {c.label}
            </a>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-28 px-5 pt-20 md:px-10">
        {/* Reels */}
        <div id="work-reels" className="scroll-mt-36">
          <Reveal>
            <Heading title="AI Reels" count={reels.length} />
            <div className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-6 md:-mx-10 md:px-10">
              {reels.map((r) => (
                <div
                  key={r.title}
                  data-hover
                  className="lift group relative aspect-[9/16] w-[70vw] max-w-[300px] shrink-0 snap-start overflow-hidden rounded-xl bg-card"
                >
                  <video
                    src={r.video}
                    poster={r.poster}
                    muted
                    loop
                    playsInline
                    preload="none"
                    className="h-full w-full object-cover"
                    onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
                    onMouseLeave={(e) => e.currentTarget.pause()}
                    onClick={(e) =>
                      e.currentTarget.paused ? e.currentTarget.play() : e.currentTarget.pause()
                    }
                  />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-background to-transparent p-4">
                    <p className="font-display text-lg font-medium">{r.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>

        {/* Graphics */}
        <div id="work-graphics" className="scroll-mt-36">
          <Reveal>
            <Heading title="Graphics" count={graphics.length} />
            <div className="columns-2 gap-4 md:columns-3">
              {graphics.map((g) => (
                <button
                  key={g.title}
                  onClick={() => setImg(g)}
                  className="lift mb-4 block w-full overflow-hidden rounded-xl bg-card"
                >
                  <img
                    src={g.src}
                    alt={g.title}
                    width={g.w}
                    height={g.h}
                    loading="lazy"
                    className="w-full transition-transform duration-700 hover:scale-105"
                  />
                </button>
              ))}
            </div>
          </Reveal>
        </div>

        {/* Cinematics — image gallery */}
        <div id="work-cinematics" className="scroll-mt-36">
          <Reveal>
            <Heading title="Cinematics" count={cinematics.length} />
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {cinematics.map((c) => (
                <button
                  key={c.title}
                  type="button"
                  onClick={() =>
                    setImg({
                      title: c.title,
                      src: c.poster,
                    })
                  }
                  className="lift group relative block w-full overflow-hidden rounded-xl bg-card text-left"
                  aria-label={`View ${c.title}`}
                >
                  <img
                    src={c.poster}
                    alt={c.title}
                    loading="lazy"
                    className="aspect-video w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-5 pt-16">
                    <span className="font-display text-xl font-medium text-white">{c.title}</span>
                  </div>
                </button>
              ))}
            </div>
          </Reveal>
        </div>

        {/* Logos */}
        <div id="work-logos" className="scroll-mt-36">
          <Reveal>
            <Heading title="Logo Designs" count={logos.length} />
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {logos.map((l) => (
                <div
                  key={l.brand}
                  data-hover
                  className="lift group relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl bg-tile text-tile-foreground"
                >
                  {l.mark.startsWith("/") || l.mark.startsWith("http") ? (
                    <img
                      src={l.mark}
                      alt={l.brand}
                      loading="lazy"
                      className="max-h-[50%] max-w-[60%] object-contain"
                    />
                  ) : (
                    <span className="font-display text-3xl font-bold tracking-tight md:text-5xl">
                      {l.mark}
                    </span>
                  )}
                  <span className="absolute inset-0 flex items-end bg-primary p-5 font-display text-lg font-semibold text-primary-foreground opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    {l.brand}
                  </span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>

        {/* Websites */}
        <div id="work-websites" className="scroll-mt-36">
          <Reveal>
            <Heading title="Websites" count={websites.length} />
            <div className="space-y-10">
              {websites.map((w) => (
                <article
                  key={w.title}
                  className="lift grid items-center gap-8 overflow-hidden rounded-2xl border border-border bg-card p-4 md:grid-cols-5 md:p-8"
                >
                  <div className="overflow-hidden rounded-xl border border-border md:col-span-3">
                    <div className="flex gap-1.5 bg-secondary px-3 py-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40" />
                      <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40" />
                      <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                    </div>
                    <button
                      type="button"
                      onClick={() => setImg({ title: w.title, src: w.image })}
                      className="block w-full cursor-zoom-in bg-card text-left"
                      aria-label={`View ${w.title} screenshot`}
                    >
                      <img
                        src={w.image}
                        alt={w.title}
                        loading="lazy"
                        className="aspect-[16/10] w-full object-cover"
                      />
                    </button>
                    {w.gallery.length > 1 && (
                      <div className="grid grid-cols-4 gap-2 border-t border-border bg-background p-2">
                        {w.gallery.map((shot, index) => (
                          <button
                            key={`${w.title}-screenshot-${index}`}
                            type="button"
                            onClick={() =>
                              setImg({ title: `${w.title} — Screenshot ${index + 1}`, src: shot })
                            }
                            className="overflow-hidden rounded-md border border-border transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            aria-label={`View ${w.title} screenshot ${index + 1}`}
                          >
                            <img
                              src={shot}
                              alt={`${w.title} screenshot ${index + 1}`}
                              loading="lazy"
                              className="aspect-[4/3] w-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <h4 className="font-display text-3xl font-semibold md:text-4xl">{w.title}</h4>
                    <p className="mt-3 text-muted-foreground">{w.description}</p>
                    {w.url && (
                      <a
                        href={w.url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-6 inline-flex items-center gap-2 border-b border-primary pb-1 text-primary"
                      >
                        Visit Site ↗
                      </a>
                    )}
                    {!w.url && (
                      <p className="mt-6 text-sm text-muted-foreground">
                        Website design gallery · Click any screenshot to enlarge
                      </p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </Reveal>
        </div>
      </div>

      <Modal open={!!img} onClose={() => setImg(null)}>
        {img && (
          <img
            src={img.src}
            alt={img.title}
            className="mx-auto max-h-[85vh] rounded-xl object-contain"
          />
        )}
      </Modal>
    </section>
  );
}
