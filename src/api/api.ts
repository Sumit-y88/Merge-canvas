import axios, { type InternalAxiosRequestConfig } from "axios";

declare module "axios" {
  export interface AxiosRequestConfig {
    _retry?: boolean;
    _skipRefresh?: boolean;
  }
}

let authToken: string | null = null;
let refreshPromise: Promise<any> | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token || null;
};

export const getAuthToken = (): string | null => authToken;

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
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
    if (error.response?.status !== 401 || request?._retry || request?.url?.includes("/auth/")) {
      return Promise.reject(error);
    }
    request._retry = true;
    try {
      refreshPromise ||= api.post("/auth/refresh", {}, { _skipRefresh: true } as any);
      const response = await refreshPromise;
      setAuthToken(response.data.accessToken);
      if (request.headers) {
        request.headers.Authorization = `Bearer ${response.data.accessToken}`;
      }
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
