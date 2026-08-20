import api from "./api.js";

export const getRooms = async () => {
  const response = await api.get("/rooms");
  return response.data;
};

export const createRoom = async (name) => {
  const response = await api.post("/rooms", { name });
  return response.data;
};

export const getRoomById = async (id) => {
  const response = await api.get(`/rooms/${id}`);
  return response.data;
};

export const joinRoom = async (inviteCode) => {
  const response = await api.post("/rooms/join", { inviteCode });
  return response.data;
};

export const saveCanvas = async (id, canvasData) => {
  const response = await api.put(`/rooms/${id}/canvas`, { canvasData });
  return response.data;
};

export const updateCollaboratorRole = async (roomId, userId, role) => {
  const response = await api.patch(`/rooms/${roomId}/collaborators/${userId}/role`, { role });
  return response.data;
};

export const updateRoomSettings = async (roomId, settings) => {
  const response = await api.patch(`/rooms/${roomId}`, settings);
  return response.data;
};

export const regenerateInviteCode = async (roomId) => {
  const response = await api.post(`/rooms/${roomId}/invite/regenerate`);
  return response.data;
};

export const removeCollaborator = async (roomId, userId) => {
  const response = await api.delete(`/rooms/${roomId}/collaborators/${userId}`);
  return response.data;
};

export const leaveRoom = async (roomId) => {
  await api.post(`/rooms/${roomId}/leave`);
};

export const deleteRoom = async (roomId) => {
  await api.delete(`/rooms/${roomId}`);
};
