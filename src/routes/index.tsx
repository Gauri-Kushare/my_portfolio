import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { profile, services } from "@/data/projects";
import { Work } from "@/components/site/Work";
import { Cursor, Reveal, SectionLabel } from "@/components/site/ui";

const title = `${profile.name} — ${profile.role}`;
const description =
  "Portfolio of AI reels, graphic design, cinematics, logo design and website design.";

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

const nav = ["work", "about", "services", "contact"];
const skills = ["AI Reels", "Graphics", "Cinematics", "Logos", "Websites"];

function Navbar() {
  const [active, setActive] = useState("");
  useEffect(() => {
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: "-45% 0px -50% 0px" },
    );
    ["home", ...nav].forEach((id) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);
  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-border bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 md:px-10">
        <a href="#home" className="font-display text-lg font-bold">
          {profile.name}
          <span className="text-primary">.</span>
        </a>
        <nav className="flex gap-1 md:gap-2">
          {nav.map((n) => (
            <a
              key={n}
              href={`#${n}`}
              className={`rounded-full px-3 py-1.5 text-sm capitalize transition-colors ${active === n ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              {n}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section
      id="home"
      className="relative flex min-h-svh flex-col justify-end overflow-hidden pt-24"
    >
      <div className="mx-auto w-full max-w-7xl px-5 pb-16 md:px-10">
        <Reveal>
          <p className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
            <span className="h-2 w-2 animate-pulse rounded-full bg-primary" /> Available for
            projects
          </p>
          <h1 className="text-[15vw] font-bold leading-[0.85] md:text-[10vw]">{profile.name}</h1>
          <h2 className="mt-4 text-3xl font-medium leading-tight md:text-6xl">
            <span className="text-outline">Creative Designer</span> &<br />
            Visual <span className="text-primary">Storyteller</span>
          </h2>
          <div className="mt-10 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <p className="max-w-md text-lg text-muted-foreground">{profile.tagline}</p>
            <div className="flex gap-3">
              <a
                href="#work"
                className="rounded-full bg-primary px-7 py-4 font-medium text-primary-foreground transition-transform hover:scale-105"
              >
                View Work
              </a>
              <a
                href="#contact"
                className="rounded-full border border-border px-7 py-4 font-medium transition-colors hover:border-primary hover:text-primary"
              >
                Hire Me
              </a>
            </div>
          </div>
        </Reveal>
      </div>
      <div className="overflow-hidden border-y border-border py-5">
        <div className="animate-marquee flex w-max">
          {[0, 1].map((k) => (
            <div key={k} className="flex shrink-0">
              {[...skills, ...skills].map((s, i) => (
                <span
                  key={i}
                  className="flex items-center font-display text-3xl font-semibold md:text-5xl"
                >
                  <span className="px-6">{s}</span>
                  <span className="text-primary">✦</span>
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
  return (
    <section id="about" className="py-24 md:py-36">
      <div
        className={`mx-auto grid max-w-7xl items-center gap-12 px-5 md:gap-20 md:px-10 ${profile.portrait ? "md:grid-cols-2" : "grid-cols-1"}`}
      >
        {profile.portrait && (
          <Reveal>
            <img
              src={profile.portrait}
              alt={profile.name}
              width={896}
              height={1152}
              loading="lazy"
              className="w-full rounded-2xl object-cover"
            />
          </Reveal>
        )}
        <Reveal>
          <SectionLabel n="02">About</SectionLabel>
          <h2 className="text-5xl font-bold md:text-7xl">
            Hi, I'm {profile.name.split(" ")[0]}
            <span className="text-primary">.</span>
          </h2>
          <p className="mt-8 text-lg leading-relaxed text-muted-foreground">{profile.bio}</p>
          <div className="mt-12 grid grid-cols-3 gap-4 border-t border-border pt-8">
            {profile.stats.map((s) => (
              <div key={s.label}>
                <p className="font-display text-4xl font-bold text-primary md:text-5xl">
                  {s.value}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Services() {
  return (
    <section id="services" className="py-24 md:py-36">
      <div className="mx-auto max-w-7xl px-5 md:px-10">
        <Reveal>
          <SectionLabel n="03">Services</SectionLabel>
          <h2 className="mb-14 text-5xl font-bold md:text-7xl">
            What I do<span className="text-primary">.</span>
          </h2>
        </Reveal>
        <div className="border-t border-border">
          {services.map((s, i) => (
            <Reveal key={s.id}>
              <a
                href={`#work-${s.id}`}
                className="group grid items-center gap-2 border-b border-border py-8 transition-colors hover:bg-card md:grid-cols-12 md:px-4"
              >
                <span className="font-display text-muted-foreground md:col-span-1">0{i + 1}</span>
                <h3 className="text-3xl font-semibold transition-colors group-hover:text-primary md:col-span-5 md:text-5xl">
                  {s.title}
                </h3>
                <p className="text-muted-foreground md:col-span-5">{s.text}</p>
                <span className="hidden text-right text-2xl transition-transform group-hover:-rotate-45 group-hover:text-primary md:col-span-1 md:block">
                  →
                </span>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Contact() {
  const [sent, setSent] = useState(false);
  const field =
    "w-full border-b border-input bg-transparent py-4 text-lg outline-none transition-colors placeholder:text-muted-foreground focus:border-primary";
  return (
    <section id="contact" className="py-24 md:py-36">
      <div className="mx-auto grid max-w-7xl gap-16 px-5 md:grid-cols-2 md:px-10">
        <Reveal>
          <SectionLabel n="04">Contact</SectionLabel>
          <h2 className="text-6xl font-bold leading-[0.9] md:text-8xl">
            Let's work <span className="text-primary">together.</span>
          </h2>
          <div className="mt-12 flex flex-col gap-4 text-lg">
            <a href={`mailto:${profile.email}`} className="hover:text-primary">
              ✉ {profile.email}
            </a>
            <a
              href={profile.whatsapp}
              target="_blank"
              rel="noreferrer"
              className="hover:text-primary"
            >
              ◉ WhatsApp
            </a>
            <a
              href={profile.instagram}
              target="_blank"
              rel="noreferrer"
              className="hover:text-primary"
            >
              ◎ Instagram
            </a>
          </div>
        </Reveal>
        <Reveal>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              window.location.href = `mailto:${profile.email}?subject=${encodeURIComponent("Project enquiry from " + f.get("name"))}&body=${encodeURIComponent(String(f.get("message")) + "\n\n" + f.get("email"))}`;
              setSent(true);
            }}
            className="space-y-6"
          >
            <input required name="Gauri" placeholder="Gauri" className={field} />
            <input
              required
              name="email"
              type="email"
              placeholder="Email address"
              className={field}
            />
            <textarea
              required
              name="message"
              rows={5}
              placeholder="Tell me about your project"
              className={field}
            />
            <button className="rounded-full bg-primary px-8 py-4 font-medium text-primary-foreground transition-transform hover:scale-105">
              {sent ? "Opening your email…" : "Send message →"}
            </button>
          </form>
        </Reveal>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 py-8 text-sm text-muted-foreground md:flex-row md:px-10">
        <p>
          © {new Date().getFullYear()} {profile.name}. All rights reserved.
        </p>
        <div className="flex gap-6">
          <a href={profile.instagram} className="hover:text-primary">
            Instagram
          </a>
          <a href={profile.whatsapp} className="hover:text-primary">
            WhatsApp
          </a>
          <a href={`mailto:${profile.email}`} className="hover:text-primary">
            Email
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
