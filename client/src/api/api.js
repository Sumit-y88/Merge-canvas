import axios from "axios";

let authToken = null;
let refreshPromise = null;

export const setAuthToken = (token) => {
    authToken = token || null;
};

export const getAuthToken = () => authToken;

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use(
    (config) => {
        if (authToken) {
            config.headers.Authorization = `Bearer ${authToken}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const request = error.config;
        if (error.response?.status !== 401 || request?._retry || request?.url?.includes("/auth/")) return Promise.reject(error);
        request._retry = true;
        try {
            refreshPromise ||= api.post("/auth/refresh", {}, { _skipRefresh: true });
            const response = await refreshPromise;
            setAuthToken(response.data.accessToken);
            request.headers.Authorization = `Bearer ${response.data.accessToken}`;
            return api(request);
        } catch (refreshError) {
            setAuthToken(null);
            return Promise.reject(refreshError);
        } finally {
            refreshPromise = null;
        }
    }
);

export default api;
