import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export const api = axios.create({
  baseURL,
});

api.interceptors.request.use((config) => {
  const storedUser = localStorage.getItem("ce-user");
  if (storedUser) {
    const parsed = JSON.parse(storedUser);
    config.headers["X-User-Role"] = parsed.role;
    config.headers["X-User-Id"] = parsed.id;
  }
  return config;
});

