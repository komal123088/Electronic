import axios from "axios";
import ENV from "../config/env.js";

const api = axios.create({
  baseURL: ENV.BASE_URL,
  headers: { "Content-Type": "application/json" },
});

export default api;
