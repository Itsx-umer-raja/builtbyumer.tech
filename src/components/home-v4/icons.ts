"use client";

import {
  Briefcase,
  Calculator,
  Code2,
  Database,
  FileText,
  Globe,
  Image as ImageIcon,
  QrCode,
  Timer,
  Type as TypeIcon,
} from "lucide-react";

/** One lucide icon per tool category, shared by the bento and the popular strip. */
export const CATEGORY_ICONS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  "pdf-tools": FileText,
  "image-tools": ImageIcon,
  "qr-tools": QrCode,
  "network-tools": Globe,
  "developer-tools": Code2,
  "text-tools": TypeIcon,
  calculators: Calculator,
  "data-tools": Database,
  "business-tools": Briefcase,
  "productivity-tools": Timer,
};
