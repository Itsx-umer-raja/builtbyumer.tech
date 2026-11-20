import Link from "next/link";
import { TOOLS } from "@/data/tools";
import { CATEGORIES } from "@/data/categories";
import { ToolSearch } from "./ToolSearch";

const POPULAR = [
  "merge-pdf",
  "image-compressor",
  "qr-code-generator",
  "json-formatter",
  "age-calculator",
  "what-is-my-ip",
  "word-counter",
  "invoice-generator",
] as const;

/**
 * The practical front door of the site. On the homepage it renders in the
 * light "Services" style of the landing page (white, rounded top, black
 * text); the dark BuiltByUmer theme stays on the /tools pages.
 */
export function ToolLauncher({ variant = "dark" }: { variant?: "dark" | "light" }) {
  const light = variant === "light";
  const popular = POPULAR.map((id) => TOOLS.find((t) => t.id === id)).filter(
    (t): t is (typeof TOOLS)[number] => Boolean(t),
  );

  return (
    <section
      id="tools"
      aria-label="Tool directory"
      className={
        light
          ? "rounded-t-[40px] bg-white px-5 pb-20 pt-16 sm:rounded-t-[50px] sm:px-8 sm:pb-24 sm:pt-24 md:rounded-t-[60px] md:px-10 md:pb-32 md:pt-28"
          : "relative z-10 border-t border-[#121212]/12 bg-[#ECEAE4] px-5 py-16 sm:py-20 lg:px-8"
      }
    >
      <div className="mx-auto max-w-7xl">
        <p
          className={
            "text-[11px] font-semibold uppercase tracking-[.24em] " +
            (light ? "text-[#0C0C0C]/50" : "text-[#163D2B]")
          }
        >
          The tool directory
        </p>

        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <h2
            className={
              "font-black uppercase leading-none tracking-tight " +
              (light ? "text-[#0C0C0C]" : "font-tight font-semibold text-cream sm:text-5xl")
            }
            style={light ? { fontSize: "clamp(3rem, 10vw, 130px)" } : undefined}
          >
            {light ? "Tools" : "Find your tool."}
          </h2>
          <p
            className={
              "max-w-md text-sm leading-relaxed sm:text-base " +
              (light ? "font-light text-[#0C0C0C]/60" : "text-muted")
            }
          >
            {TOOLS.length} free utilities that run entirely in your browser — no account, no
            uploads, nothing installed. Search or pick a category below.
          </p>
        </div>

        {/* Popular tools — one click from the hero */}
        <div className="mt-7 flex flex-wrap items-center gap-2">
          <span
            className={
              "py-1.5 text-xs font-semibold uppercase tracking-widest " +
              (light ? "text-[#0C0C0C]/50" : "text-muted")
            }
          >
            Popular:
          </span>
          {popular.map((t) => (
            <Link
              key={t.id}
              href={`/${t.category}/${t.id}`}
              className={
                "rounded-full border-2 px-4 py-1.5 text-xs font-medium uppercase tracking-wider transition " +
                (light
                  ? "border-[rgba(12,12,12,0.25)] text-[#0C0C0C] hover:border-[#0C0C0C] hover:bg-[#0C0C0C] hover:text-[#121212]"
                  : "border-[#163D2B]/40 bg-[#163D2B]/10 text-[#163D2B] hover:bg-lime hover:text-[#163D2B]")
              }
            >
              {t.title}
            </Link>
          ))}
        </div>

        {/* Live search over the full registry */}
        <div className="mt-10">
          <ToolSearch tools={TOOLS} variant={variant} />
        </div>

        {/* Category cards with counts */}
        <div className="mt-14">
          <h3
            className={
              "text-sm font-semibold uppercase tracking-widest " +
              (light ? "text-[#0C0C0C]/50" : "text-muted")
            }
          >
            Browse by category
          </h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {CATEGORIES.map((c) => {
              const count = TOOLS.filter((t) => t.category === c.slug).length;
              return (
                <Link
                  key={c.slug}
                  href={`/${c.slug}`}
                  className={
                    light
                      ? "tool-card-light block rounded-2xl border border-[rgba(12,12,12,0.15)] bg-white p-5"
                      : "tool-card rounded-xl border border-[#121212]/12 bg-white p-5"
                  }
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span
                      className={
                        "text-sm font-medium uppercase " +
                        (light ? "text-[#0C0C0C]" : "font-semibold text-cream")
                      }
                    >
                      {c.name}
                    </span>
                    <span
                      className={
                        "rounded-full px-2 py-0.5 text-[11px] font-bold " +
                        (light
                          ? "border border-[rgba(12,12,12,0.2)] text-[#0C0C0C]/70"
                          : "bg-[#163D2B]/10 text-[#163D2B]")
                      }
                    >
                      {count}
                    </span>
                  </div>
                  <p
                    className={
                      "mt-2 text-xs leading-relaxed sm:text-sm " +
                      (light ? "text-[#0C0C0C]/60" : "text-muted")
                    }
                  >
                    {c.short}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
