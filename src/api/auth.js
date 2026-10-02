import api from "./api";

export const signup = async (userData) => (await api.post("/auth/signup", userData)).data;
export const login = async (userData) => (await api.post("/auth/login", userData)).data;
export const googleLogin = async (credential) => (await api.post("/auth/google", { credential })).data;
