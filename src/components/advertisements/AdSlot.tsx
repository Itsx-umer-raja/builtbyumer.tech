/**
 * Reusable advertising slot.
 *
 * ADS_ENABLED stays false until Google AdSense is approved and the site
 * is hosted on a plan that permits commercial use. The slot renders
 * nothing while disabled — no fake advertisements, ever.
 */
import { SITE } from "@/data/site";

export const ADS_ENABLED: boolean = SITE.adsEnabled;

export function AdSlot({
  id,
  label = "Advertisement",
  className,
}: {
  id: string;
  label?: string;
  className?: string;
}) {
  if (!ADS_ENABLED) return null;
  return (
    <aside
      id={`ad-${id}`}
      aria-label={label}
      data-ad-slot={id}
      className={className ?? "my-8 min-h-[90px]"}
    >
      {/* AdSense script + ins element are inserted here once approved. */}
    </aside>
  );
}
