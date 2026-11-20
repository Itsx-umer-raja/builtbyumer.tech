"use client";

import type { ComponentType } from "react";

/**
 * A tool implementation is a client component that receives no props
 * and manages its own state. It renders inside the standard tool page.
 */
export type ToolComponent = ComponentType;

/* Registry segments — one file per category so batches can be built independently. */
import { pdfTools } from "./registry-pdf";
import { imageTools } from "./registry-image";
import { qrTools } from "./registry-qr";
import { networkTools } from "./registry-network";
import { developerTools } from "./registry-developer";
import { textTools } from "./registry-text";
import { calculatorsTools } from "./registry-calculators";
import { dataTools } from "./registry-data";
import { businessTools } from "./registry-business";
import { productivityTools } from "./registry-productivity";

export const TOOL_COMPONENTS: Record<string, ToolComponent> = {
  ...pdfTools,
  ...imageTools,
  ...qrTools,
  ...networkTools,
  ...developerTools,
  ...textTools,
  ...calculatorsTools,
  ...dataTools,
  ...businessTools,
  ...productivityTools,
};
