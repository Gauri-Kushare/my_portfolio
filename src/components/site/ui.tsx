import { useEffect, useRef, useState, type ReactNode } from "react";

export function Reveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => e?.isIntersecting && (el.classList.add("is-visible"), io.disconnect()),
      { threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`reveal ${className}`}>
      {children}
    </div>
  );
}

export function Cursor() {
  const ref = useRef<HTMLDivElement>(null);
  const [big, setBig] = useState(false);
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    setOn(true);
    const move = (e: MouseEvent) => {
      if (ref.current) ref.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      setBig(!!(e.target as HTMLElement).closest("a,button,[data-hover],input,textarea"));
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);
  if (!on) return null;
  return (
    <div ref={ref} className="pointer-events-none fixed left-0 top-0 z-[70] mix-blend-difference">
      <div
        className={`-translate-x-1/2 -translate-y-1/2 rounded-full bg-primary transition-all duration-200 ${big ? "h-14 w-14 opacity-80" : "h-3 w-3"}`}
      />
    </div>
  );
}

export function SectionLabel({ n, children }: { n: string; children: ReactNode }) {
  return (
    <p className="mb-6 flex items-center gap-3 font-display text-sm uppercase tracking-[0.25em] text-muted-foreground">
      <span className="text-primary">{n}</span>
      <span className="h-px w-10 bg-border" />
      {children}
    </p>
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
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4 animate-in fade-in"
      onClick={onClose}
    >
      <button
        aria-label="Close"
        className="absolute right-6 top-6 text-3xl text-foreground hover:text-primary"
      >
        ×
      </button>
      <div onClick={(e) => e.stopPropagation()} className="max-h-full w-full max-w-5xl">
        {children}
      </div>
    </div>
  );
}
