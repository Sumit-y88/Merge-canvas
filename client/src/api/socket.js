import { io } from "socket.io-client";
import { getAuthToken } from "./api.js";

const socketUrl = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");

export const createRoomSocket = () => io(socketUrl, {
  autoConnect: false,
  withCredentials: true,
  auth: (callback) => callback({ token: getAuthToken() }),
});
