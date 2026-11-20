"use client";

import { useState, type ReactNode } from "react";
import { StyleRegistry, createStyleRegistry } from "styled-jsx";

/**
 * StyledJsxRegistry — collects styled-jsx rules during SSR so they ship
 * inline with the HTML. Without this, every styled-jsx section renders
 * unstyled until the client runtime injects its styles (the flash).
 */
export default function StyledJsxRegistry({ children }: { children: ReactNode }) {
  const [registry] = useState(() => createStyleRegistry());
  return <StyleRegistry registry={registry}>{children}</StyleRegistry>;
}
