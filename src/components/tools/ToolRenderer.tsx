"use client";

import { TOOL_COMPONENTS } from "./registry";
import type { ReactNode } from "react";

/**
 * Bridges the server-rendered tool page to the client component registry:
 * server components cannot read plain values out of "use client" modules,
 * so the lookup happens here on the client.
 */
export function ToolRenderer({ toolId, fallback }: { toolId: string; fallback: ReactNode }) {
  const Component = TOOL_COMPONENTS[toolId];
  if (!Component) return <>{fallback}</>;
  return <Component />;
}
