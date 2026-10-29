import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { profile, services } from "@/data/projects";
import { Work } from "@/components/site/Work";
import { Cursor, Reveal, SectionLabel, TiltCard } from "@/components/site/ui";
import { Hero3D } from "@/components/site/Hero3D";

const title = `${profile.name} — ${profile.role}`;
const description =
  "Portfolio of Gauri Kushare: AI reels, cinematic visuals, brand identities, and high-impact website experiences.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
    ],
  }),
  component: Index,
});

const navLinks = [
  { id: "work", label: "Work" },
  { id: "about", label: "About" },
  { id: "services", label: "Services" },
  { id: "contact", label: "Contact" },
];

const tickerSkills = [
  "AI Reels",
  "Websites",
  "Cinematics",
  "Brand Identity",
  "Graphic Design",
  "The Velora Edit",
  "Motion Art",
  "Creative Direction",
];

function Navbar() {
  const [active, setActive] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: "-40% 0px -55% 0px" },
    );

    ["home", ...navLinks.map((n) => n.id)].forEach((id) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });

    return () => {
      window.removeEventListener("scroll", onScroll);
      io.disconnect();
    };
  }, []);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
          isScrolled ? "py-3" : "py-6"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 md:px-10">
          {/* Logo / Monogram */}
          <a
            href="#home"
            className="group flex items-center gap-2.5 rounded-full border border-white/10 bg-slate-950/70 px-4 py-2 backdrop-blur-xl transition-all hover:border-violet-500/40"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 text-xs font-bold text-white shadow-[0_0_12px_rgba(139,92,246,0.5)]">
              G
            </span>
            <span className="font-display text-sm font-bold tracking-tight text-white">
              {profile.name}
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400 group-hover:animate-ping" />
          </a>

          {/* Floating Desktop Navigation Capsule */}
          <nav className="hidden items-center gap-1 rounded-full border border-white/10 bg-slate-950/80 p-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur-2xl md:flex">
            {navLinks.map((link) => {
              const isActive = active === link.id;
              return (
                <a
                  key={link.id}
                  href={`#${link.id}`}
                  className={`relative rounded-full px-4 py-1.5 font-display text-xs font-semibold tracking-wide transition-all ${
                    isActive
                      ? "bg-violet-600 text-white shadow-[0_0_15px_rgba(139,92,246,0.5)]"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {link.label}
                </a>
              );
            })}
          </nav>

          {/* Quick Header CTA */}
          <div className="hidden md:flex">
            <a
              href="#contact"
              className="rounded-full border border-violet-500/30 bg-violet-950/40 px-5 py-2 font-display text-xs font-semibold tracking-wide text-violet-300 shadow-[0_0_15px_rgba(139,92,246,0.2)] backdrop-blur-xl transition-all hover:border-violet-400 hover:bg-violet-600 hover:text-white"
            >
              Get in Touch
            </a>
          </div>

          {/* Mobile Hamburger Toggle */}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle mobile menu"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-slate-950/80 text-white backdrop-blur-xl md:hidden"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16m-7 6h7"
                />
              )}
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 flex flex-col justify-center bg-slate-950/95 px-8 backdrop-blur-2xl md:hidden animate-in fade-in"
          onClick={() => setMobileOpen(false)}
        >
          <div className="flex flex-col gap-6 text-center">
            {navLinks.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                onClick={() => setMobileOpen(false)}
                className="font-display text-3xl font-bold text-white transition-colors hover:text-violet-400"
              >
                {link.label}
              </a>
            ))}
            <a
              href="#contact"
              onClick={() => setMobileOpen(false)}
              className="mt-4 inline-flex items-center justify-center rounded-full bg-violet-600 px-8 py-4 font-display text-base font-semibold text-white shadow-[0_0_25px_rgba(139,92,246,0.5)]"
            >
              Get in Touch
            </a>
          </div>
        </div>
      )}
    </>
  );
}

function Hero() {
  return (
    <section
      id="home"
      className="relative flex min-h-screen flex-col justify-between overflow-hidden pt-28 md:pt-32"
    >
      {/* Dynamic atmospheric lighting halos */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-b from-violet-600/20 via-indigo-600/15 to-transparent blur-[140px]" />
      <div className="pointer-events-none absolute top-1/3 -right-40 h-[400px] w-[500px] rounded-full bg-sky-500/10 blur-[130px]" />

      <div className="mx-auto w-full max-w-7xl px-5 md:px-10">
        <div className="grid items-center gap-8 lg:grid-cols-12">
          {/* Hero Typography & CTA Column */}
          <div className="z-10 lg:col-span-7">
            <Reveal>
              {/* Status Badge */}
              <div className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-violet-500/30 bg-violet-950/40 px-4 py-1.5 text-xs font-semibold tracking-wide text-violet-300 shadow-[0_0_15px_rgba(139,92,246,0.2)] backdrop-blur-xl">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <span>Available for select commissions ✦ 2026</span>
              </div>

              {/* Bold Editorial Headline */}
              <h1 className="font-display text-[14vw] font-black leading-[0.84] tracking-tighter text-white sm:text-[11vw] lg:text-[7.2vw]">
                {profile.name}
              </h1>

              {/* Dimensional Subtitle */}
              <h2 className="mt-5 font-display text-2xl font-semibold leading-tight text-slate-200 sm:text-4xl md:text-5xl">
                <span className="text-chrome">Creative Designer</span> &<br />
                <span className="text-violet-glow">Visual Storyteller</span>
              </h2>

              {/* Tagline */}
              <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-300 md:text-xl">
                {profile.tagline}
              </p>

              {/* Primary & Secondary CTAs */}
              <div className="mt-10 flex flex-wrap items-center gap-4">
                <a
                  href="#work"
                  className="group relative inline-flex items-center gap-3 overflow-hidden rounded-full bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-600 px-8 py-4 font-display text-sm font-bold tracking-wide text-white shadow-[0_0_30px_rgba(139,92,246,0.45)] transition-all hover:scale-105 hover:shadow-[0_0_45px_rgba(139,92,246,0.65)]"
                >
                  <span className="relative z-10">Explore Work</span>
                  <span className="relative z-10 transition-transform duration-300 group-hover:translate-x-1">
                    ↓
                  </span>
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
                </a>

                <a
                  href="#contact"
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.04] px-8 py-4 font-display text-sm font-semibold tracking-wide text-white backdrop-blur-xl transition-all hover:border-violet-400 hover:bg-violet-600/20"
                >
                  <span>Contact Me</span>
                  <span className="text-violet-400">→</span>
                </a>
              </div>
            </Reveal>
          </div>

          {/* Genuine 3D Centerpiece Column */}
          <div className="relative z-10 flex items-center justify-center lg:col-span-5">
            <Reveal delay={200} className="w-full">
              <Hero3D />
            </Reveal>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="mt-12 flex items-center justify-between border-t border-white/[0.08] pt-6 pb-8">
          <div className="flex items-center gap-3 text-xs tracking-widest text-slate-400">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
            <span>INTERACTIVE 3D EXPERIENCE</span>
          </div>

          <a
            href="#work"
            className="group flex items-center gap-2 text-xs font-semibold tracking-wider text-slate-400 transition-colors hover:text-white"
          >
            <span>SCROLL TO EXPLORE</span>
            <span className="flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-white/5 transition-transform group-hover:translate-y-0.5">
              ↓
            </span>
          </a>
        </div>
      </div>

      {/* Editorial Marquee Ticker */}
      <div className="overflow-hidden border-y border-white/[0.08] bg-slate-950/60 py-4 backdrop-blur-xl">
        <div className="animate-marquee flex w-max">
          {[0, 1].map((k) => (
            <div key={k} className="flex shrink-0 items-center">
              {[...tickerSkills, ...tickerSkills].map((item, i) => (
                <span
                  key={`${k}-${i}`}
                  className="flex items-center font-display text-xl font-bold tracking-tight text-slate-300 md:text-3xl"
                >
                  <span className="px-6">{item}</span>
                  <span className="text-violet-400">✦</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function About() {
  const disciplines = [
    "AI Filmmaking & Direction",
    "Digital Product Design",
    "Brand Systems & Identity",
    "Creative Direction",
    "Responsive Web Development",
    "Motion & 3D Visuals",
  ];

  return (
    <section id="about" className="relative py-28 md:py-40">
      {/* Ambient gradient */}
      <div className="pointer-events-none absolute right-10 top-1/2 h-[500px] w-[500px] -translate-y-1/2 rounded-full bg-violet-900/10 blur-[130px]" />

      <div className="mx-auto max-w-7xl px-5 md:px-10">
        <Reveal>
          <SectionLabel n="02">Creative Identity</SectionLabel>
        </Reveal>

        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Main Statement & Bio */}
          <div className="lg:col-span-7">
            <Reveal>
              <h2 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-white md:text-6xl">
                Designing at the intersection of{" "}
                <span className="text-violet-glow">artificial intelligence</span>, motion, and human
                emotion.
              </h2>

              <p className="mt-8 text-lg leading-relaxed text-slate-300 md:text-xl">
                {profile.bio}
              </p>

              {/* Disciplines Chips */}
              <div className="mt-10">
                <p className="font-display text-xs uppercase tracking-widest text-slate-400">
                  Core Disciplines
                </p>
                <div className="mt-4 flex flex-wrap gap-2.5">
                  {disciplines.map((d) => (
                    <span
                      key={d}
                      className="rounded-full border border-white/10 bg-slate-900/60 px-4 py-2 font-display text-xs font-medium text-slate-200 backdrop-blur-md"
                    >
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>

          {/* Stats & Credibility Card */}
          <div className="flex flex-col justify-between gap-8 lg:col-span-5">
            <Reveal delay={150}>
              <TiltCard className="rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900/80 to-slate-950/90 p-8 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl">
                <div className="mb-6 flex items-center justify-between border-b border-white/[0.08] pb-4">
                  <span className="font-display text-xs font-semibold tracking-widest text-violet-400">
                    CAREER HIGHLIGHTS
                  </span>
                  <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 lg:grid-cols-1">
                  {profile.stats.map((s) => (
                    <div
                      key={s.label}
                      className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 transition-colors hover:border-violet-500/30"
                    >
                      <p className="font-display text-4xl font-black tracking-tight text-white md:text-5xl">
                        <span className="text-violet-glow">{s.value}</span>
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-400">{s.label}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-8 rounded-2xl border border-violet-500/20 bg-violet-950/30 p-5 text-sm leading-relaxed text-slate-300">
                  <span className="font-semibold text-white">Focus:</span> Building memorable visual
                  narratives that elevate brands from ordinary to unforgettable.
                </div>
              </TiltCard>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

function Services() {
  return (
    <section id="services" className="relative py-28 md:py-40">
      <div className="mx-auto max-w-7xl px-5 md:px-10">
        <Reveal>
          <SectionLabel n="03">Capabilities</SectionLabel>
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <h2 className="font-display text-5xl font-extrabold tracking-tight text-white md:text-7xl">
              What I <span className="text-violet-glow">Deliver.</span>
            </h2>
            <p className="max-w-md text-base leading-relaxed text-slate-400 md:text-lg">
              End-to-end creative solutions tailored for brands seeking distinctive visual mastery.
            </p>
          </div>
        </Reveal>

        <div className="mt-16 space-y-4">
          {services.map((s, i) => (
            <Reveal key={s.id} delay={i * 80}>
              <a
                href={`#work-${s.id}`}
                className="group relative flex flex-col justify-between gap-4 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/60 p-6 shadow-lg backdrop-blur-xl transition-all duration-300 hover:border-violet-500/40 hover:bg-slate-900/80 md:flex-row md:items-center md:px-8 md:py-7"
              >
                {/* Index & Title */}
                <div className="flex items-center gap-6">
                  <span className="font-mono text-sm font-semibold text-violet-400">0{i + 1}</span>
                  <h3 className="font-display text-2xl font-bold tracking-tight text-white transition-colors group-hover:text-violet-300 md:text-3xl">
                    {s.title}
                  </h3>
                </div>

                {/* Description */}
                <p className="max-w-md text-sm text-slate-400 md:text-base">{s.text}</p>

                {/* Jump arrow */}
                <div className="flex items-center gap-2 font-display text-xs font-semibold text-slate-400 transition-colors group-hover:text-white">
                  <span>View Projects</span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 transition-transform duration-300 group-hover:translate-x-1 group-hover:border-violet-500 group-hover:bg-violet-600 group-hover:text-white">
                    →
                  </span>
                </div>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const inputClass =
    "w-full rounded-xl border border-white/10 bg-slate-900/60 px-5 py-4 text-base text-white placeholder:text-slate-500 outline-none backdrop-blur-xl transition-all focus:border-violet-500 focus:bg-slate-900/90 focus:ring-2 focus:ring-violet-500/20";

  return (
    <section id="contact" className="relative py-28 md:py-40">
      {/* Atmospheric lighting */}
      <div className="pointer-events-none absolute -bottom-20 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-violet-900/15 blur-[140px]" />

      <div className="mx-auto max-w-7xl px-5 md:px-10">
        <Reveal>
          <SectionLabel n="04">Initiate Collaboration</SectionLabel>
        </Reveal>

        <div className="grid gap-16 lg:grid-cols-12">
          {/* Headline & Channels */}
          <div className="lg:col-span-6">
            <Reveal>
              <h2 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-5xl xl:text-6xl">
                Let's make <br />
                <span className="text-violet-glow">something</span> <br />
                unforgettable.
              </h2>

              <p className="mt-8 max-w-md text-base leading-relaxed text-slate-300 md:text-lg">
                Have an upcoming project, website redesign, or visual campaign? Drop me a message
                and let's craft work people stop scrolling for.
              </p>

              {/* Direct Channels */}
              <div className="mt-12 space-y-4">
                <a
                  href={`mailto:${profile.email}`}
                  className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-slate-950/70 p-4 backdrop-blur-xl transition-all hover:border-violet-500/40 hover:bg-slate-900/80"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-950/60 text-lg text-violet-400">
                    ✉
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Direct Email
                    </p>
                    <p className="font-display text-base font-bold text-white group-hover:text-violet-300">
                      {profile.email}
                    </p>
                  </div>
                </a>

                <a
                  href={profile.whatsapp}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-slate-950/70 p-4 backdrop-blur-xl transition-all hover:border-emerald-500/40 hover:bg-slate-900/80"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-950/60 text-lg text-emerald-400">
                    ◉
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      WhatsApp Chat
                    </p>
                    <p className="font-display text-base font-bold text-white group-hover:text-emerald-300">
                      +91 75584 68233
                    </p>
                  </div>
                </a>

                <a
                  href={profile.instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-slate-950/70 p-4 backdrop-blur-xl transition-all hover:border-pink-500/40 hover:bg-slate-900/80"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-pink-950/60 text-lg text-pink-400">
                    ◎
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Instagram
                    </p>
                    <p className="font-display text-base font-bold text-white group-hover:text-pink-300">
                      @_gauri_k24
                    </p>
                  </div>
                </a>
              </div>
            </Reveal>
          </div>

          {/* Form */}
          <div className="lg:col-span-6">
            <Reveal delay={150}>
              <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-8 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl md:p-10">
                <h3 className="font-display text-2xl font-bold text-white">Send a Message</h3>
                <p className="mt-1 text-sm text-slate-400">
                  Fill in your details and your default mail client will compose your brief.
                </p>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = new FormData(e.currentTarget);
                    const name = form.get("name") || "";
                    const email = form.get("email") || "";
                    const message = form.get("message") || "";

                    window.location.href = `mailto:${profile.email}?subject=${encodeURIComponent(
                      "Project enquiry from " + name,
                    )}&body=${encodeURIComponent(
                      String(message) + "\n\nFrom: " + name + " (" + email + ")",
                    )}`;
                    setSubmitted(true);
                  }}
                  className="mt-8 space-y-5"
                >
                  <div>
                    <label className="mb-2 block font-display text-xs uppercase tracking-wider text-slate-400">
                      Your Name
                    </label>
                    <input required name="name" placeholder="Jane Doe" className={inputClass} />
                  </div>

                  <div>
                    <label className="mb-2 block font-display text-xs uppercase tracking-wider text-slate-400">
                      Email Address
                    </label>
                    <input
                      required
                      name="email"
                      type="email"
                      placeholder="jane@example.com"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block font-display text-xs uppercase tracking-wider text-slate-400">
                      Project Details
                    </label>
                    <textarea
                      required
                      name="message"
                      rows={5}
                      placeholder="Describe your vision, timeline, and deliverables..."
                      className={inputClass}
                    />
                  </div>

                  <button
                    type="submit"
                    className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-4 font-display text-sm font-bold tracking-wide text-white shadow-[0_0_25px_rgba(139,92,246,0.4)] transition-all hover:scale-[1.02] hover:from-violet-500 hover:to-indigo-500 hover:shadow-[0_0_35px_rgba(139,92,246,0.6)]"
                  >
                    <span>{submitted ? "Opening your mail client…" : "Send Inquiry"}</span>
                    <span className="transition-transform group-hover:translate-x-1">→</span>
                  </button>
                </form>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("en-IN", {
          timeZone: "Asia/Kolkata",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="relative border-t border-white/[0.08] bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-5 py-10 md:flex-row md:px-10">
        <div className="flex flex-col items-center gap-2 md:items-start">
          <p className="font-display text-sm font-semibold text-white">
            {profile.name} — {profile.role}
          </p>
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} All rights reserved. Crafted with 3D & generative
            direction.
          </p>
        </div>

        {/* Live IST Local Time indicator */}
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs text-slate-300">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
          <span>India (IST):</span>
          <span className="font-mono font-semibold text-white">{time || "Active"}</span>
        </div>

        {/* Links & Back to Top */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
          <a href={`mailto:${profile.email}`} className="transition-colors hover:text-white">
            {profile.email}
          </a>
          <a
            href={profile.instagram}
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-white"
          >
            Instagram
          </a>
          <a
            href={profile.whatsapp}
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-white"
          >
            WhatsApp
          </a>
          <a
            href="#home"
            className="flex items-center gap-1 font-semibold text-violet-400 hover:text-violet-300"
          >
            <span>Back to top</span>
            <span>↑</span>
          </a>
        </div>
      </div>
    </footer>
  );
}

function Index() {
  return (
    <>
      <Cursor />
      <Navbar />
      <main>
        <Hero />
        <Work />
        <About />
        <Services />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
