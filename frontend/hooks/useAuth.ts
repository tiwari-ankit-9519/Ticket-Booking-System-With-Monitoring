import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import api, { ApiResponse, getErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/stores/useAuthStore";
import { QUERY_KEYS } from "@/lib/constants";
import type { User, LoginFormData, RegisterFormData } from "@/types";

const authApi = {
  login: async (data: LoginFormData) => {
    const response = await api.post<
      ApiResponse<{
        user: User;
        accessToken: string;
        expiresIn: number;
      }>
    >("/api/auth/login", data);
    return response.data.data;
  },

  register: async (data: RegisterFormData) => {
    const response = await api.post<
      ApiResponse<{
        user: User;
        accessToken: string;
        expiresIn: number;
      }>
    >("/api/auth/register", data);
    return response.data.data;
  },

  logout: async () => {
    const response = await api.post<ApiResponse<User>>("/api/auth/logout");
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get<ApiResponse<null>>("/api/auth/me");
    return response.data.data;
  },

  changePassword: async (data: {
    currentPassword: string;
    newPassword: string;
  }) => {
    const response = await api.post<ApiResponse<null>>(
      "/api/auth/change-password",
      data,
    );
    return response.data;
  },

  resetPasword: async (data: { token: string; password: string }) => {
    const response = await api.post<ApiResponse<null>>(
      "/api/auth/reset-password",
      data,
    );
    return response.data;
  },

  resetPasswordRequest: async (email: string) => {
    const response = await api.post<ApiResponse<null>>(
      "/api/auth/forgot-password",
      { email },
    );
    return response.data;
  },

  sendVerificationMailRequest: async () => {
    const response = await api.post<ApiResponse<null>>(
      "/api/auth/send-verification",
    );
    return response.data;
  },

  verifyEmail: async (token: string) => {
    const response = await api.post<ApiResponse<null>>(
      "/api/auth/verify-email",
      { token },
    );
    return response.data;
  },
};

export const useLogin = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setUser, setAccessToken } = useAuthStore();

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setUser(data.user);
      setAccessToken(data.accessToken);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CURRENT_USER });
      toast.success("Welcome Back!");
      if (data.user.role === "USER") {
        router.push("/");
      } else if (data.user.role === "ORGANIZER") {
        router.push("/organizer-dashbaord");
      } else {
        router.push("/admin-dashboard");
      }
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useRegister = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setUser, setAccessToken } = useAuthStore();

  return useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      setUser(data.user);
      setAccessToken(data.accessToken);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CURRENT_USER });
      toast.success("Account created. Please verify your email");
      router.push("/verify-email");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useCurrentUser = () => {
  const { user, isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: QUERY_KEYS.CURRENT_USER,
    queryFn: authApi.getCurrentUser,
    enabled: isAuthenticated && !!user,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
};

export const useLogout = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { logout: logoutStore } = useAuthStore();
  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      logoutStore();
      queryClient.clear();
      toast.success("Logged out successfully");
      router.push("/login");
    },
    onError: (error) => {
      logoutStore();
      queryClient.clear();
      router.push("/login");
      toast.error(getErrorMessage(error));
    },
  });
};

export const useChangePassword = () => {
  return useMutation({
    mutationFn: authApi.changePassword,
    onSuccess: () => {
      toast.success("Password changed successfully");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useRequestPasswordReset = () => {
  return useMutation({
    mutationFn: authApi.resetPasswordRequest,
    onSuccess: () => {
      toast.success("Password reset email sent");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useResetPassword = () => {
  const router = useRouter();

  return useMutation({
    mutationFn: authApi.resetPasword,
    onSuccess: () => {
      toast.success("Password reset successful. You can login now");
      router.push("/login");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useVerifyEmail = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.verifyEmail,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CURRENT_USER });
      toast.success("Email verified successfully");
      router.push("/");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useSendVerification = () => {
  return useMutation({
    mutationFn: authApi.sendVerificationMailRequest,
    onSuccess: () => {
      toast.success("Verification mail sent successfully");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useAuth = () => {
  const authStore = useAuthStore();
  const { data: user, isLoading } = useCurrentUser();
  return {
    user: user || authStore.user,
    isAuthenticated: authStore.isAuthenticated,
    isLoading,
    logout: useLogout(),
  };
};
