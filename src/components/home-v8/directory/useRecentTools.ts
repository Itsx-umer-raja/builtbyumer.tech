import { useCallback, useEffect, useState } from "react";
import { TOOL_MAP, type Tool } from "@/data/tools";

/**
 * Recently-opened tools (Phase 6 directory). Honest by design:
 * only tools the user actually opened by clicking a tool link
 * inside the directory are recorded — never faked or seeded.
 * Client-only: read after mount so the server render (empty
 * state) matches the first client render.
 */

export const RECENT_TOOLS_KEY = "bbu-route145-recent-tools";
const MAX_RECENT = 6;

function readStoredIds(): string[] {
  try {
    const raw = window.localStorage.getItem(RECENT_TOOLS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string");
  } catch {
    return [];
  }
}

export function useRecentTools() {
  const [mounted, setMounted] = useState(false);
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    setIds(readStoredIds());
    setMounted(true);
  }, []);

  /** Record a real open: most-recent first, deduped, max 6. */
  const record = useCallback((toolId: string) => {
    if (!TOOL_MAP[toolId]) return;
    setIds((prev) => {
      const next = [toolId, ...prev.filter((id) => id !== toolId)].slice(
        0,
        MAX_RECENT,
      );
      try {
        window.localStorage.setItem(RECENT_TOOLS_KEY, JSON.stringify(next));
      } catch {
        // Storage full/blocked — the in-memory list still works.
      }
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setIds([]);
    try {
      window.localStorage.removeItem(RECENT_TOOLS_KEY);
    } catch {
      // Non-fatal.
    }
  }, []);

  // Resolve stored ids against the real registry, in stored order.
  const tools: Tool[] = ids
    .map((id) => TOOL_MAP[id])
    .filter((t): t is Tool => Boolean(t));

  return { mounted, tools, record, clear };
}
