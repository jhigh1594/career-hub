import { test } from "node:test";
import assert from "node:assert/strict";
import { KNOWN, isClaudeFamily } from "./clis.ts";

test("isClaudeFamily: claude + claudeglm are family, others are not", () => {
  assert.equal(isClaudeFamily("claude"), true);
  assert.equal(isClaudeFamily("claudeglm"), true);
  assert.equal(isClaudeFamily("codex"), false);
  assert.equal(isClaudeFamily("opencode"), false);
  assert.equal(isClaudeFamily(""), false);
});

test("KNOWN: claudeglm entry is registered with correct shape", () => {
  const glm = KNOWN.find((c) => c.id === "claudeglm");
  assert.ok(glm, "claudeglm entry missing from KNOWN");
  assert.equal(glm!.bin, "claudeglm");
  assert.equal(glm!.run, "claudeglm -p");
  assert.deepEqual(glm!.args("hello"), ["-p", "hello"]);
});

test("KNOWN: claude entry still present", () => {
  const claude = KNOWN.find((c) => c.id === "claude");
  assert.ok(claude, "claude entry missing from KNOWN");
});
