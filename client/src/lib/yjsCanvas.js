const elementsMap = (doc) => doc.getMap("elements");
const orderArray = (doc) => doc.getArray("elementOrder");

export const canvasToYDoc = (doc, canvasData = [], origin = "local") => {
  doc.transact(() => {
    const elements = elementsMap(doc);
    const order = orderArray(doc);
    elements.clear();
    if (order.length) order.delete(0, order.length);
    canvasData.forEach((element) => {
      if (!element?.id) return;
      elements.set(element.id, JSON.stringify(element));
      order.push([element.id]);
    });
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
