//C:\Users\administrator\Documents\js\grejudec\frontend\src\api\api.js

import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Crucial para cookies funcionarem!
});

api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 1. Apenas lida com o redirecionamento de login se for 401
    if (error.response && error.response.status === 401) {
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    // 2. IMPORTANTE: Rejeita a promessa passando o erro original.
    // Isso garante que o componente receba o objeto 'response' íntegro.
    return Promise.reject(error);
  }
);

export default api;