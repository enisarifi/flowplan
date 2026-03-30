import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
  timeout: 60000,
});

let isRefreshing = false;

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const url = error.config?.url || "";

    // Don't intercept 401s from auth endpoints — those are normal login/register failures
    if (url.startsWith("/auth/")) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !isRefreshing) {
      const refreshToken = localStorage.getItem("refresh_token");
      if (refreshToken) {
        isRefreshing = true;
        try {
          const { data } = await axios.post("/api/auth/refresh", { refresh_token: refreshToken });
          localStorage.setItem("access_token", data.access_token);
          localStorage.setItem("refresh_token", data.refresh_token);
          isRefreshing = false;
          error.config.headers.Authorization = `Bearer ${data.access_token}`;
          return api(error.config);
        } catch {
          isRefreshing = false;
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
