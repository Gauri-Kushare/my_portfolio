import { cinematics, graphics, logos, profile, reels, websites } from "@/data/projects";

export const AUTHORIZED_ADMIN_EMAIL = "gaurikushare18@gmail.com";

export type ProjectCategory = "reels" | "graphics" | "cinematics" | "websites";
export type ProjectStatus = "published" | "draft";

export interface WebsiteScreenshot {
  id: string;
  url: string;
  label: string;
  isCover?: boolean;
}

export interface PortfolioProject {
  id: string;
  title: string;
  shortDescription: string;
  detailedDescription?: string;
  category: ProjectCategory;
  status: ProjectStatus;
  featured: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  coverImage: string;
  videoUrl?: string;
  images: string[];
  screenshots: WebsiteScreenshot[];
  externalUrl?: string;
  industry?: string;
  technologies: string[];
  tags: string[];
  aspectWidth?: number;
  aspectHeight?: number;
  isSystemSeed?: boolean;
}

export interface CreateProjectInput {
  title: string;
  shortDescription: string;
  detailedDescription?: string;
  category: ProjectCategory;
  status?: ProjectStatus;
  featured?: boolean;
  sortOrder?: number;
  createdAt?: string;
  coverImage?: string;
  videoUrl?: string;
  images?: string[];
  screenshots?: WebsiteScreenshot[];
  externalUrl?: string;
  industry?: string;
  technologies?: string[];
  tags?: string[];
  aspectWidth?: number;
  aspectHeight?: number;
}

export type UpdateProjectInput = Partial<CreateProjectInput>;

export const PORTFOLIO_CATEGORIES: ReadonlyArray<{
  id: ProjectCategory;
  label: string;
  shortLabel: string;
  subtitle: string;
  serviceDescription: string;
}> = [
  {
    id: "reels",
    label: "AI Reels",
    shortLabel: "AI Reels",
    subtitle:
      "Scroll-stopping cinematic short-form video reels created through generative AI workflows.",
    serviceDescription: "Short-form, AI-powered reels built to stop the scroll.",
  },
  {
    id: "graphics",
    label: "Graphics",
    shortLabel: "Graphics",
    subtitle: "Editorial poster design, 3D visual campaigns, and digital art explorations.",
    serviceDescription: "Posters, campaigns and social visuals with bite.",
  },
  {
    id: "cinematics",
    label: "Cinematics",
    shortLabel: "Cinematics",
    subtitle:
      "Atmospheric art direction, dramatic color grade, and widescreen visual storytelling.",
    serviceDescription: "Edits, color grading and cinematic storytelling.",
  },
  {
    id: "websites",
    label: "Websites",
    shortLabel: "Websites",
    subtitle:
      "Full-scale interactive website experiences, e-commerce architectures, and bespoke brand platforms.",
    serviceDescription: "Fast, beautiful sites that convert visitors.",
  },
] as const;

export const WEBSITE_SCREENSHOT_LABELS = [
  "Home Page",
  "About Page",
  "Services",
  "Product Page",
  "Contact Page",
  "Dashboard",
] as const;

export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
] as const;

export const ALLOWED_VIDEO_MIME_TYPES = ["video/mp4", "video/webm", "video/quicktime"] as const;

export const MAX_IMAGE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB
export const MAX_VIDEO_SIZE_BYTES = 150 * 1024 * 1024; // 150 MB

export function sanitizeText(value: unknown, maxLength = 2000): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .trim()
    .slice(0, maxLength);
}

export function validateExternalUrl(url: string | undefined): {
  valid: boolean;
  normalized: string;
  error?: string;
} {
  const trimmed = (url ?? "").trim();
  if (!trimmed) {
    return { valid: true, normalized: "" };
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return {
        valid: false,
        normalized: trimmed,
        error: "URL must start with https:// or http://",
      };
    }
    return { valid: true, normalized: parsed.toString() };
  } catch {
    return {
      valid: false,
      normalized: trimmed,
      error: "Please enter a valid URL including https:// (e.g. https://example.com)",
    };
  }
}

export function isAuthorizedAdminEmail(email: unknown): boolean {
  if (typeof email !== "string") return false;
  return email.trim().toLowerCase() === AUTHORIZED_ADMIN_EMAIL.toLowerCase();
}

export function buildSeedProjects(): PortfolioProject[] {
  const baseTime = new Date("2026-01-15T10:00:00.000Z").getTime();
  let orderCounter = 1;

  // 1. AI Reels
  const seededReels: PortfolioProject[] = reels.map((r, index) => ({
    id: `seed-reel-${index + 1}`,
    title: r.title,
    shortDescription:
      "AI-directed vertical cinema reel crafted with generative motion and atmospheric sound design.",
    detailedDescription:
      "Directed and composited using generative video synthesis, custom lighting passes, and high-retention pacing for vertical social platforms.",
    category: "reels",
    status: "published",
    featured: index < 2,
    sortOrder: orderCounter++,
    createdAt: new Date(baseTime - index * 3600_000).toISOString(),
    updatedAt: new Date(baseTime - index * 3600_000).toISOString(),
    coverImage: r.poster,
    videoUrl: r.video,
    images: [r.poster],
    screenshots: [],
    technologies: ["Generative Video", "AI Direction", "Motion Grading"],
    tags: ["AI Directed", "9:16 Vertical", "Motion"],
    aspectWidth: 1080,
    aspectHeight: 1920,
    isSystemSeed: true,
  }));

  // 2. Graphics
  const seededGraphics: PortfolioProject[] = graphics.map((g, index) => ({
    id: `seed-graphic-${index + 1}`,
    title: g.title,
    shortDescription:
      "High-contrast editorial graphic artwork blending bold typography and dimensional visual composition.",
    detailedDescription:
      "Created as part of Gauri Kushare's visual design series exploring chromatic lighting, surreal form, and poster-grade layout systems.",
    category: "graphics",
    status: "published",
    featured: index < 2,
    sortOrder: orderCounter++,
    createdAt: new Date(baseTime - (index + 10) * 3600_000).toISOString(),
    updatedAt: new Date(baseTime - (index + 10) * 3600_000).toISOString(),
    coverImage: g.src,
    images: [g.src],
    screenshots: [],
    technologies: ["Visual Direction", "Typography", "Digital Compositing"],
    tags: ["Editorial Poster", "Visual Identity"],
    aspectWidth: g.w,
    aspectHeight: g.h,
    isSystemSeed: true,
  }));

  // 3. Cinematics
  const seededCinematics: PortfolioProject[] = cinematics.map((c, index) => ({
    id: `seed-cinematic-${index + 1}`,
    title: c.title,
    shortDescription:
      "Widescreen 2.39:1 cinematic frame study focusing on dramatic chiaroscuro lighting and color grading.",
    detailedDescription:
      "An exploration of narrative mood, lens diffusion, and theatrical color palettes designed for luxury campaigns and title sequences.",
    category: "cinematics",
    status: "published",
    featured: index < 2,
    sortOrder: orderCounter++,
    createdAt: new Date(baseTime - (index + 20) * 3600_000).toISOString(),
    updatedAt: new Date(baseTime - (index + 20) * 3600_000).toISOString(),
    coverImage: c.poster,
    images: [c.poster],
    screenshots: [],
    technologies: ["Color Grading", "Widescreen Direction", "2.39:1 Anamorphic"],
    tags: ["2.39:1 Cinematic", "Color Grade"],
    aspectWidth: 1920,
    aspectHeight: 1080,
    isSystemSeed: true,
  }));

  // 4. Websites
  const defaultLabelsByTitle: Record<string, string[]> = {
    "The Velora Edit": ["Home Page", "Collections", "Editorial", "Journal"],
    "Restaurant Website": ["Home Page", "About Page", "Services", "Contact Page"],
    "Vanta Website": [
      "Home Page",
      "About Page",
      "Services",
      "Product Page",
      "Dashboard",
      "Contact Page",
    ],
  };

  const defaultIndustryByTitle: Record<string, string> = {
    "The Velora Edit": "Luxury Fashion & E-Commerce",
    "Restaurant Website": "Hospitality & Fine Dining",
    "Vanta Website": "Creative Technology & Digital Studio",
  };

  const seededWebsites: PortfolioProject[] = websites.map((w, index) => {
    const labels = defaultLabelsByTitle[w.title] ?? [];
    const screenshots: WebsiteScreenshot[] = w.gallery.map((imgUrl, sIdx) => ({
      id: `seed-web-${index + 1}-shot-${sIdx + 1}`,
      url: imgUrl,
      label: labels[sIdx] ?? `Screen ${sIdx + 1}`,
      isCover: imgUrl === w.image || sIdx === 0,
    }));

    return {
      id: `seed-website-${index + 1}`,
      title: w.title,
      shortDescription: w.description,
      detailedDescription: w.description,
      category: "websites",
      status: "published",
      featured: Boolean(w.url) || index === 0,
      sortOrder: orderCounter++,
      createdAt: new Date(baseTime - (index + 30) * 3600_000).toISOString(),
      updatedAt: new Date(baseTime - (index + 30) * 3600_000).toISOString(),
      coverImage: w.image,
      images: w.gallery,
      screenshots,
      externalUrl: w.url,
      industry: defaultIndustryByTitle[w.title] ?? "Digital Experience",
      technologies: ["Responsive UI/UX", "Interactive Motion", "Modern Web Architecture"],
      tags: w.url
        ? ["Live Deployment", "Featured Website"]
        : ["Concept Preview", "UI/UX Architecture"],
      aspectWidth: 1600,
      aspectHeight: 1000,
      isSystemSeed: true,
    };
  });

  return [...seededReels, ...seededGraphics, ...seededCinematics, ...seededWebsites];
}

export function sortPortfolioProjects(projects: PortfolioProject[]): PortfolioProject[] {
  return [...projects].sort((a, b) => {
    // Non-seed (newly created) published projects with lower sortOrder or newer createdAt come first
    if (a.sortOrder !== b.sortOrder) {
      return a.sortOrder - b.sortOrder;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export { logos, profile };
