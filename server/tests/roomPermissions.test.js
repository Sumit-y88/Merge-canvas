import assert from "node:assert/strict";
import test from "node:test";
import { canEditRoom } from "../src/services/roomService.js";

test("owners and editors can edit rooms", () => {
    assert.equal(canEditRoom("owner"), true);
    assert.equal(canEditRoom("editor"), true);
});

test("viewers and unknown roles cannot edit rooms", () => {
    assert.equal(canEditRoom("viewer"), false);
    assert.equal(canEditRoom("member"), false);
    assert.equal(canEditRoom(undefined), false);
});
