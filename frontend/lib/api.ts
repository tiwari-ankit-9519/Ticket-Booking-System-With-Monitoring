import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { API_URL } from "./constants";

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const accessToken =
      typeof window !== "undefined"
        ? localStorage.getItem("accessToken")
        : null;

    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const { data } = await axios.post(
          `${API_URL}/api/auth/refresh`,
          {},
          { withCredentials: true },
        );

        if (typeof window !== "undefined") {
          localStorage.setItem("accessToken", data.data.accessToken);
        }

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
        }

        return api(originalRequest);
      } catch (refreshError) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("accessToken");
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export interface ValidationError {
  code: string;
  message: string;
  path: (string | number)[];
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: ValidationError[];
  code?: string;
}

export interface ApiResponse<T = unknown> {
  success: true;
  message?: string;
  data: T;
}

export type ApiResult<T = unknown> = ApiResponse<T> | ApiErrorResponse;

export interface PaginatedResponse<T> {
  success: true;
  data: {
    items: T[];
    total: number;
    page: number;
    totalPages: number;
  };
}

export function isApiSuccess<T>(
  response: ApiResult<T>,
): response is ApiResponse<T> {
  return response.success === true;
}

export function isApiError(
  response: ApiResult<unknown>,
): response is ApiErrorResponse {
  return response.success === false;
}

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiErrorResponse>;

    if (axiosError.response?.data?.message) {
      return axiosError.response.data.message;
    }

    if (
      axiosError.response?.data?.errors &&
      axiosError.response.data.errors.length > 0
    ) {
      return axiosError.response.data.errors
        .map((err) => err.message)
        .join(", ");
    }

    return axiosError.message || "An error occurred";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "An unknown error occurred";
}

export function getValidationErrors(error: unknown): ValidationError[] {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    return axiosError.response?.data?.errors || [];
  }
  return [];
}

export default api;
