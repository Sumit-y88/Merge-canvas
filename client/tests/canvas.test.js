import assert from "node:assert/strict";
import test from "node:test";
import {
  boundsFor,
  containsPoint,
  getBounds,
  moveElement,
  normalizeRect,
  resizeElement,
  snapVal,
  textDimensions,
} from "../src/lib/canvas/geometry.js";
import { createElement, createTextElement } from "../src/lib/canvas/elements.js";

const baseElement = () => ({ id: "a", type: "rectangle", x: 0, y: 0, width: 100, height: 60 });

test("textDimensions establishes width and height from content", () => {
  assert.deepEqual(textDimensions("Hi", 16), { width: 19.2, height: 19.2 });
  assert.equal(textDimensions("Hi\nThere", 16).height, 38.4);
});

test("getBounds derives implicit bounds for text and freehand", () => {
  assert.ok(getBounds({ type: "text", x: 0, y: 20, text: "Hi", fontSize: 16 }).height > 0);
  const stroke = { type: "freehand", points: [{ x: 0, y: 0 }, { x: 10, y: 5 }, { x: 4, y: 20 }] };
  assert.deepEqual(getBounds(stroke), { x: 0, y: 0, width: 10, height: 20 });
  assert.deepEqual(getBounds(baseElement()), { x: 0, y: 0, width: 100, height: 60 });
});

test("boundsFor spans a set of elements", () => {
  const bounds = boundsFor([baseElement(), { id: "b", type: "ellipse", x: 50, y: 40, width: 20, height: 20 }]);
  assert.deepEqual(bounds, { x: 0, y: 0, width: 100, height: 60 });
  assert.equal(boundsFor([]), null);
});

test("containsPoint respects padding", () => {
  const bounds = getBounds(baseElement());
  assert.equal(containsPoint(bounds, { x: -4, y: 5 }, 8), true);
  assert.equal(containsPoint(bounds, { x: -9, y: 5 }, 8), false);
});

test("normalizeRect handles negative drag directions", () => {
  assert.deepEqual(normalizeRect({ x: 50, y: 60 }, { x: 10, y: 20 }), { x: 10, y: 20, width: 40, height: 40 });
});

test("snapVal snaps only when enabled", () => {
  assert.equal(snapVal(23, false), 23);
  assert.equal(snapVal(23, true), 20);
  assert.equal(snapVal(28, true), 20);
  assert.equal(snapVal(35, true), 40);
});

test("moveElement translates x/y and freehand points", () => {
  assert.deepEqual(moveElement(baseElement(), 5, -5), { ...baseElement(), x: 5, y: -5 });
  const stroke = { type: "freehand", points: [{ x: 0, y: 0 }, { x: 10, y: 10 }] };
  assert.deepEqual(moveElement(stroke, 5, 5).points, [{ x: 5, y: 5 }, { x: 15, y: 15 }]);
});

test("resizeElement rescales points proportionally", () => {
  const stroke = { type: "freehand", points: [{ x: 0, y: 0 }, { x: 10, y: 10 }] };
  const resized = resizeElement(stroke, { x: 0, y: 0, width: 10, height: 10 }, { x: 0, y: 0, width: 20, height: 20 });
  assert.deepEqual(resized.points, [{ x: 0, y: 0 }, { x: 20, y: 20 }]);
});

test("createElement builds a rectangle from a drag", () => {
  const element = createElement({
    tool: "Rectangle",
    start: { x: 10, y: 10 },
    end: { x: 50, y: 70 },
    color: "#ff0000",
    fillColor: "transparent",
    strokeWidth: 2,
    strokeStyle: "solid",
  });
  assert.equal(element.type, "rectangle");
  assert.equal(element.x, 10);
  assert.equal(element.y, 10);
  assert.equal(element.width, 40);
  assert.equal(element.height, 60);
  assert.match(element.id, /^\d+-/);
});

test("createElement keeps freehand as a normalized line", () => {
  const element = createElement({
    tool: "Line",
    start: { x: 0, y: 0 },
    end: { x: 100, y: 100 },
    color: "#000",
  });
  assert.equal(element.type, "line");
  assert.deepEqual(element.points, [{ x: 0, y: 0 }, { x: 100, y: 100 }]);
});

test("createTextElement measures content via textDimensions", () => {
  const element = createTextElement({ x: 5, y: 10, value: "Hi", fontSize: 16, color: "#000" });
  assert.equal(element.type, "text");
  assert.equal(element.y, 26);
  assert.equal(element.fontSize, 16);
  assert.ok(element.width > 0);
});