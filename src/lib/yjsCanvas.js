const elementsMap = (doc) => doc.getMap("elements");
const orderArray = (doc) => doc.getArray("elementOrder");

export const canvasToYDoc = (doc, canvasData = [], origin = "local", prevCanvasData = null) => {
  doc.transact(() => {
    const elements = elementsMap(doc);
    const order = orderArray(doc);

    // Explicit clear canvas
    if (canvasData.length === 0 && (origin === "clear" || (prevCanvasData && prevCanvasData.length > 0))) {
      for (const id of [...elements.keys()]) {
        elements.delete(id);
      }
      if (order.length) {
        order.delete(0, order.length);
      }
      return;
    }

    const newIds = new Set();
    const newOrder = [];

    // Add or update elements
    for (const element of canvasData) {
      if (!element?.id) continue;
      newIds.add(element.id);
      newOrder.push(element.id);
      const serialized = JSON.stringify(element);
      if (elements.get(element.id) !== serialized) {
        elements.set(element.id, serialized);
      }
    }

    // Remove deleted elements:
    if (prevCanvasData) {
      // Differential deletion: ONLY delete elements that this client actually knew about
      // and removed. Never delete elements added concurrently by other collaborators.
      const prevIds = new Set(prevCanvasData.map((element) => element?.id).filter(Boolean));
      for (const id of prevIds) {
        if (!newIds.has(id)) {
          elements.delete(id);
          let currentOrder = order.toArray();
          let idx = currentOrder.indexOf(id);
          while (idx !== -1) {
            order.delete(idx, 1);
            currentOrder = order.toArray();
            idx = currentOrder.indexOf(id);
          }
        }
      }
    } else if (origin === "initial" || origin === "replace" || origin === "test") {
      // Full replacement for initial load or tests
      for (const id of [...elements.keys()]) {
        if (!newIds.has(id)) elements.delete(id);
      }
      const currentOrder = order.toArray();
      if (
        currentOrder.length !== newOrder.length ||
        currentOrder.some((id, i) => id !== newOrder[i])
      ) {
        if (order.length) order.delete(0, order.length);
        order.push(newOrder);
      }
      return;
    }

    // Maintain order: append newly created elements without deleting other peers' entries
    const existingOrderIds = new Set(order.toArray());
    for (const id of newOrder) {
      if (!existingOrderIds.has(id)) {
        order.push([id]);
        existingOrderIds.add(id);
      }
    }
  }, origin);
};

export const yDocToCanvas = (doc) => {
  const elements = elementsMap(doc);
  const order = orderArray(doc).toArray();
  const orderedElements = [];
  const seenIds = new Set();

  for (const id of order) {
    if (seenIds.has(id)) continue;
    const value = elements.get(id);
    if (value) {
      try {
        const parsed = JSON.parse(value);
        if (parsed) {
          orderedElements.push(parsed);
          seenIds.add(id);
        }
      } catch {
        // Skip invalid JSON
      }
    }
  }

  // Ensure any elements in elements map (e.g. from concurrent peer writes)
  // are never dropped even if orderArray hasn't caught up
  for (const [id, value] of elements.entries()) {
    if (!seenIds.has(id)) {
      try {
        const parsed = JSON.parse(value);
        if (parsed) {
          orderedElements.push(parsed);
          seenIds.add(id);
        }
      } catch {
        // Skip invalid JSON
      }
    }
  }

  return orderedElements;
};

export const base64ToUpdate = (value) => Uint8Array.from(atob(value), (char) => char.charCodeAt(0));

export const updateToBase64 = (update) => {
  let binary = "";
  update.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
};
