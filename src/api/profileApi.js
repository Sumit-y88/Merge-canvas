import api from "./api.js";

export const getProfile = async () => {
  const response = await api.get("/auth/profile");
  return response.data;
};

export const updateProfile = async (profile) => {
  const response = await api.patch("/auth/profile", profile);
  return response.data;
};

export const changePassword = async (passwords) => {
  const response = await api.patch("/auth/profile/password", passwords);
  return response.data;
};
