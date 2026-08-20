import assert from "node:assert/strict";
import test from "node:test";
import { cn } from "../src/lib/utils.js";

test("combines conditional class names", () => {
  assert.equal(cn("px-2", { hidden: false }, "text-sm"), "px-2 text-sm");
});

test("merges conflicting Tailwind classes", () => {
  assert.equal(cn("px-2 text-sm", "px-4"), "text-sm px-4");
});
