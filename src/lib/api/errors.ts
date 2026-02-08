import type { AxiosError } from "axios";

type ApiErrorPayload = {
  message?: string;
  error?: string;
  details?: unknown;
};

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (!error || typeof error !== "object") {
    return fallback;
  }

  const axiosError = error as AxiosError<ApiErrorPayload>;
  const data = axiosError.response?.data;

  if (data?.message) return data.message;
  if (data?.error) return data.error;

  if (typeof (axiosError as { message?: string }).message === "string") {
    return (axiosError as { message?: string }).message as string;
  }

  return fallback;
}

export function getApiErrorDetails(error: unknown, fallback: string) {
  const message = getApiErrorMessage(error, fallback);

  if (!error || typeof error !== "object") {
    return { message };
  }

  const axiosError = error as AxiosError<ApiErrorPayload>;
  const status = axiosError.response?.status;
  const data = axiosError.response?.data;

  return { message, status, data };
}
