const elementsMap = (doc) => doc.getMap("elements");
const orderArray = (doc) => doc.getArray("elementOrder");

export const canvasToYDoc = (doc, canvasData = [], origin = "local") => {
  doc.transact(() => {
    const elements = elementsMap(doc);
    const order = orderArray(doc);

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

    // Remove deleted elements
    for (const id of [...elements.keys()]) {
      if (!newIds.has(id)) elements.delete(id);
    }

    // Rebuild order only if it actually changed
    const currentOrder = order.toArray();
    if (
      currentOrder.length !== newOrder.length ||
      currentOrder.some((id, i) => id !== newOrder[i])
    ) {
      if (order.length) order.delete(0, order.length);
      order.push(newOrder);
    }
  }, origin);
};

export const yDocToCanvas = (doc) => {
  const elements = elementsMap(doc);
  return orderArray(doc)
    .toArray()
    .map((id) => {
      const value = elements.get(id);
      try {
        return value ? JSON.parse(value) : null;
      } catch {
        return null;
      }
    })
    .filter(Boolean);
};

export const base64ToUpdate = (value) => Uint8Array.from(atob(value), (char) => char.charCodeAt(0));

export const updateToBase64 = (update) => {
  let binary = "";
  update.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
};
