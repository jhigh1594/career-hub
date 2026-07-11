import { test } from "node:test";
import assert from "node:assert/strict";
import { isFatalStderr } from "./stderr.ts";

// Regression: the connectors notice is emitted on stderr and contains
// "auth"/"login", so the old widened error-regex classified it fatal → the
// client's first error event aborted every z.ai/GLM run instantly.
test("claude.ai connectors notice is benign (not fatal)", () => {
  const line =
    "⚠ claude.ai connectors are disabled because ANTHROPIC_API_KEY or another auth source is set and takes precedence over your claude.ai login · Unset it to load your organization's connectors";
  assert.equal(isFatalStderr(line), false);
});

test("real auth / quota / runtime errors are fatal", () => {
  assert.equal(isFatalStderr("Error: Invalid API Key"), true);
  assert.equal(isFatalStderr("401 Unauthorized"), true);
  assert.equal(isFatalStderr("403 Forbidden"), true);
  assert.equal(isFatalStderr("quota exceeded"), true);
  assert.equal(isFatalStderr("rate limit exceeded"), true);
  assert.equal(isFatalStderr("not authenticated"), true);
  assert.equal(isFatalStderr("fatal: credential login denied"), true);
});

test("empty / benign noise is not fatal", () => {
  assert.equal(isFatalStderr(""), false);
  assert.equal(isFatalStderr("   "), false);
  assert.equal(isFatalStderr("node: memory usage"), false);
});
