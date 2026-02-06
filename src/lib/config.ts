export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
export const SERVER_API_BASE_URL =
  process.env.BACKEND_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? API_BASE_URL;
export const APP_ENV = process.env.NEXT_PUBLIC_APP_ENV ?? "HQ";
export const ORG_DOMAIN = process.env.NEXT_PUBLIC_ORG_DOMAIN ?? "bloom.com";

export function assertServerApiBaseUrl() {
  if (!SERVER_API_BASE_URL) {
    throw new Error(
      "BACKEND_API_BASE_URL is not set. Point this to the Fastify API base URL."
    );
  }
}
