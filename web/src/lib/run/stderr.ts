// Classify a Claude Code stderr line as fatal (a real auth/quota/runtime
// failure) vs benign noise to be dropped.
//
// Why this exists: the /api/run worker tags fatal stderr as a type:"error"
// stream event, and the client treats the FIRST error event as terminal
// (abandons the run). Claude prints the connectors notice below to stderr on
// every launch where ANTHROPIC_AUTH_TOKEN (e.g. the z.ai/GLM token) takes
// precedence over a claude.ai login — auth IS working; it only means org
// connectors won't load. That line contains "auth"/"login", so the old widened
// regex misclassified it fatal and killed every z.ai/GLM run instantly.
// Extracted here so it is unit-testable.

const FATAL =
  /error|denied|fatal|not found|unauthorized|forbidden|auth|login|credential|api[ -]?key|quota|rate limit|not authenticated/i;

// Benign stderr that happens to contain fatal keywords — excluded explicitly.
// Order matters: check BENIGN before FATAL.
const BENIGN = /connectors are disabled|takes precedence over your claude\.ai login/i;

export function isFatalStderr(line: string): boolean {
  if (!line || !line.trim()) return false;
  if (BENIGN.test(line)) return false;
  return FATAL.test(line);
}
