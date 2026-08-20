import assert from "node:assert/strict";
import test from "node:test";
import * as Y from "yjs";
import {
  base64ToUpdate,
  canvasToYDoc,
  updateToBase64,
  yDocToCanvas,
} from "../src/lib/yjsCanvas.js";

test("round-trips canvas elements through a Yjs document", () => {
  const elements = [
    { id: "rectangle-1", type: "rectangle", x: 10, y: 20, width: 100, height: 50 },
    { id: "line-1", type: "line", x: 0, y: 0, x2: 80, y2: 80 },
  ];
  const doc = new Y.Doc();

  canvasToYDoc(doc, elements, "test");

  assert.deepEqual(yDocToCanvas(doc), elements);
});

test("preserves element order and skips elements without ids", () => {
  const doc = new Y.Doc();
  canvasToYDoc(doc, [
    { type: "rectangle", x: 1 },
    { id: "first", type: "ellipse" },
    null,
    { id: "second", type: "text", text: "Hello" },
  ], "test");

  assert.deepEqual(yDocToCanvas(doc).map((element) => element.id), ["first", "second"]);
});

test("replaces an existing Yjs canvas instead of appending to it", () => {
  const doc = new Y.Doc();
  canvasToYDoc(doc, [{ id: "old", type: "rectangle" }], "test");
  canvasToYDoc(doc, [{ id: "new", type: "ellipse" }], "test");

  assert.deepEqual(yDocToCanvas(doc), [{ id: "new", type: "ellipse" }]);
});

test("round-trips binary updates through base64", () => {
  const source = new Y.Doc();
  canvasToYDoc(source, [{ id: "shape", type: "rectangle", x: 4 }], "test");
  const encoded = updateToBase64(Y.encodeStateAsUpdate(source));
  const target = new Y.Doc();

  Y.applyUpdate(target, base64ToUpdate(encoded));

  assert.deepEqual(yDocToCanvas(target), [{ id: "shape", type: "rectangle", x: 4 }]);
});

test("ignores malformed serialized elements", () => {
  const doc = new Y.Doc();
  doc.getMap("elements").set("broken", "not-json");
  doc.getArray("elementOrder").push([["broken"]]);

  assert.deepEqual(yDocToCanvas(doc), []);
});
