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

test("does not create an update when the canvas snapshot is unchanged", () => {
  const elements = [{ id: "stable", type: "rectangle", x: 10, y: 20 }];
  const doc = new Y.Doc();
  canvasToYDoc(doc, elements, "test");
  const stateVector = Y.encodeStateVector(doc);

  canvasToYDoc(doc, elements, "test");

  // An empty Yjs update is two bytes. A clear-and-rebuild implementation
  // would produce a full delete/reinsert update here.
  assert.equal(Y.encodeStateAsUpdate(doc, stateVector).byteLength, 2);
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

test("preserves concurrent drawings from two collaborators without dropping objects", () => {
  const docA = new Y.Doc();
  const docB = new Y.Doc();

  // Initial common element
  canvasToYDoc(docA, [{ id: "init", type: "rectangle", x: 0, y: 0 }], "initial");
  Y.applyUpdate(docB, Y.encodeStateAsUpdate(docA));

  const prevA = [{ id: "init", type: "rectangle", x: 0, y: 0 }];
  const prevB = [{ id: "init", type: "rectangle", x: 0, y: 0 }];

  // Peer A draws circle
  const stateVectorA = Y.encodeStateVector(docA);
  canvasToYDoc(docA, [...prevA, { id: "circle-A", type: "ellipse", x: 50, y: 50 }], "local", prevA);
  const updateA = Y.encodeStateAsUpdate(docA, stateVectorA);

  // Concurrently, Peer B draws triangle before receiving updateA
  const stateVectorB = Y.encodeStateVector(docB);
  canvasToYDoc(docB, [...prevB, { id: "triangle-B", type: "triangle", x: 100, y: 100 }], "local", prevB);
  const updateB = Y.encodeStateAsUpdate(docB, stateVectorB);

  // Both receive the other's update
  Y.applyUpdate(docA, updateB);
  Y.applyUpdate(docB, updateA);

  const canvasA = yDocToCanvas(docA);
  const canvasB = yDocToCanvas(docB);

  const idsA = canvasA.map((el) => el.id);
  const idsB = canvasB.map((el) => el.id);

  assert.ok(idsA.includes("init"));
  assert.ok(idsA.includes("circle-A"));
  assert.ok(idsA.includes("triangle-B"));

  assert.ok(idsB.includes("init"));
  assert.ok(idsB.includes("circle-A"));
  assert.ok(idsB.includes("triangle-B"));
  assert.equal(canvasA.length, 3);
  assert.equal(canvasB.length, 3);
});

test("subsequent drawings by one peer preserve concurrent objects from other peers", () => {
  const docA = new Y.Doc();
  const docB = new Y.Doc();

  canvasToYDoc(docA, [{ id: "init", type: "rectangle" }], "initial");
  Y.applyUpdate(docB, Y.encodeStateAsUpdate(docA));

  // A draws objA
  let stateA = Y.encodeStateVector(docA);
  canvasToYDoc(docA, [{ id: "init", type: "rectangle" }, { id: "objA", type: "circle" }], "local", [{ id: "init", type: "rectangle" }]);
  let updateA = Y.encodeStateAsUpdate(docA, stateA);

  // B draws objB
  let stateB = Y.encodeStateVector(docB);
  canvasToYDoc(docB, [{ id: "init", type: "rectangle" }, { id: "objB", type: "triangle" }], "local", [{ id: "init", type: "rectangle" }]);
  let updateB = Y.encodeStateAsUpdate(docB, stateB);

  // Sync
  Y.applyUpdate(docA, updateB);
  Y.applyUpdate(docB, updateA);

  // Peer A now draws another object objA2
  const canvasBeforeA2 = yDocToCanvas(docA);
  stateA = Y.encodeStateVector(docA);
  canvasToYDoc(docA, [...canvasBeforeA2, { id: "objA2", type: "star" }], "local", canvasBeforeA2);
  const updateA2 = Y.encodeStateAsUpdate(docA, stateA);

  // Peer B receives updateA2
  Y.applyUpdate(docB, updateA2);

  const finalBIds = yDocToCanvas(docB).map((el) => el.id);
  assert.ok(finalBIds.includes("objB"), "objB drawn by Peer B must NOT disappear");
  assert.ok(finalBIds.includes("objA"), "objA drawn by Peer A must be present");
  assert.ok(finalBIds.includes("objA2"), "objA2 drawn by Peer A must be present");
});

test("selective deletion only removes the intended object and keeps peer objects intact", () => {
  const docA = new Y.Doc();
  const docB = new Y.Doc();

  canvasToYDoc(docA, [{ id: "a1" }, { id: "b1" }], "initial");
  Y.applyUpdate(docB, Y.encodeStateAsUpdate(docA));

  // Peer B deletes b1:
  const prevCanvas = [{ id: "a1" }, { id: "b1" }];
  const newCanvas = [{ id: "a1" }];
  const stateB = Y.encodeStateVector(docB);
  canvasToYDoc(docB, newCanvas, "local", prevCanvas);
  const updateB = Y.encodeStateAsUpdate(docB, stateB);

  Y.applyUpdate(docA, updateB);

  const canvasA = yDocToCanvas(docA);
  assert.deepEqual(canvasA.map((el) => el.id), ["a1"]);
});

