import api from "./api.js";

export const signup = async (userData) => {
    const response = await api.post("/auth/signup", userData);

    return response.data;
};

export const login = async (userData) => {
    const response = await api.post("/auth/login", userData);

    return response.data;
};

export const googleLogin = async (credential) => {
    const response = await api.post("/auth/google", { credential });
    return response.data;
};
