export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
export const SERVER_API_BASE_URL = process.env.BACKEND_API_BASE_URL ?? API_BASE_URL;

export function assertServerApiBaseUrl() {
  if (!SERVER_API_BASE_URL) {
    throw new Error(
      "BACKEND_API_BASE_URL is not set. Point this to the Fastify API base URL."
    );
  }
}
