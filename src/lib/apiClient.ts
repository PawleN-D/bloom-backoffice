import axios from "axios";
import { resolveTenantFromWindow } from "@/lib/tenant";

export const apiClient = axios.create({
  baseURL: "",
  timeout: 15000,
  withCredentials: true,
});

if (typeof window !== "undefined") {
  apiClient.interceptors.request.use((config) => {
    const headers = config.headers ?? {};
    const hasTenantHeader =
      typeof (headers as Record<string, string>)["x-tenant"] !== "undefined";
    if (!hasTenantHeader) {
      const tenant = resolveTenantFromWindow();
      if (tenant) {
        (headers as Record<string, string>)["x-tenant"] = tenant;
      }
    }
    config.headers = headers;
    return config;
  });
}
