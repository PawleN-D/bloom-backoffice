import axios from "axios";
export const apiClient = axios.create({
  baseURL: "",
  timeout: 15000,
  withCredentials: true,
});
