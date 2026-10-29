import { useEffect, useRef, useState, type ReactNode } from "react";

export function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.classList.add("is-visible");
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          if (delay > 0) {
            setTimeout(() => {
              el.classList.add("is-visible");
            }, delay);
          } else {
            el.classList.add("is-visible");
          }
          io.disconnect();
        }
      },
      { threshold: 0.12 },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [delay]);

  return (
    <div ref={ref} className={`reveal ${className}`}>
      {children}
    </div>
  );
}

export function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [big, setBig] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    setVisible(true);

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ringX = mouseX;
    let ringY = mouseY;
    let animId: number;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
      }
      const isHoverable = !!(e.target as HTMLElement).closest(
        "a, button, [data-hover], input, textarea, select, [role='button']",
      );
      setBig(isHoverable);
    };

    const render = () => {
      // Smooth spring lag on the ring
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
      }
      animId = requestAnimationFrame(render);
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      cancelAnimationFrame(animId);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden">
      {/* Precision center dot */}
      <div
        ref={dotRef}
        className="fixed left-0 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white transition-opacity duration-150"
        style={{
          width: big ? "6px" : "4px",
          height: big ? "6px" : "4px",
          boxShadow: "0 0 10px rgba(255,255,255,0.8)",
        }}
      />
      {/* Outer aura ring */}
      <div
        ref={ringRef}
        className={`fixed left-0 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full border border-violet-400/60 transition-[width,height,background-color,border-color] duration-300 ease-out ${
          big
            ? "h-14 w-14 border-violet-400 bg-violet-500/15 backdrop-blur-[2px]"
            : "h-8 w-8 bg-transparent"
        }`}
        style={{
          boxShadow: big
            ? "0 0 25px rgba(139, 92, 246, 0.4), inset 0 0 15px rgba(56, 189, 248, 0.2)"
            : "none",
        }}
      />
    </div>
  );
}

export function SectionLabel({ n, children }: { n: string; children: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-center gap-2.5 font-display text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 sm:mb-6 sm:gap-3 sm:text-xs sm:tracking-[0.28em]">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-violet-500/30 bg-violet-950/40 text-[11px] text-violet-300 shadow-[0_0_12px_rgba(139,92,246,0.2)]">
        {n}
      </span>
      <span className="h-px w-6 shrink-0 bg-gradient-to-r from-violet-500/40 to-transparent sm:w-10" />
      <span className="text-slate-300">{children}</span>
    </div>
  );
}

export function Modal({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/85 p-3 backdrop-blur-2xl animate-in fade-in duration-300 sm:p-6"
      onClick={onClose}
    >
      <button
        type="button"
        aria-label="Close modal"
        onClick={onClose}
        className="group fixed right-3 top-3 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-slate-950/80 text-slate-200 shadow-lg backdrop-blur-md transition-all hover:scale-105 hover:border-violet-500 hover:bg-violet-600 hover:text-white sm:right-6 sm:top-6"
      >
        <svg
          className="h-5 w-5 transition-transform group-hover:rotate-90"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[88dvh] w-full max-w-5xl overflow-hidden rounded-2xl border border-white/10 bg-slate-950/90 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)]"
      >
        {children}
      </div>
    </div>
  );
}

export function TiltCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState("");

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (
      !card ||
      !window.matchMedia("(hover: hover) and (pointer: fine)").matches ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -6;
    const rotateY = ((x - centerX) / centerX) * 6;
    setTransform(
      `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateZ(6px)`,
    );
  };

  const handleMouseLeave = () => {
    if (!transform) return;
    setTransform("perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)");
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={
        transform
          ? {
              transform,
              transition: "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
              transformStyle: "preserve-3d",
            }
          : undefined
      }
      className={className}
    >
      {children}
    </div>
  );
}
