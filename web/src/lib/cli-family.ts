// Pure module — no node: builtins. Safe to import from client components.
// clis.ts re-exports isClaudeFamily from here so server routes and client
// components share one source of truth for the Claude-family membership list
// (clis.ts itself imports node:fs/os/path for detection and must NOT be
// pulled into the client bundle).

/** CLIs that share Claude Code's invocation shape (flags, stream-json, tools). */
export const CLAUDE_FAMILY = ["claude", "claudeglm"] as const;

/** claudeglm is Claude Code pre-routed to z.ai/GLM — same CLI shape, same flags. */
export const isClaudeFamily = (id: string): boolean =>
  id === "claude" || id === "claudeglm";
