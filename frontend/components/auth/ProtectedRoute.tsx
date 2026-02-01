"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import { type UserRole } from "@/lib/constants";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
  requiredEmailVerification?: boolean;
}

export const ProtectedRoute = ({
  children,
  allowedRoles,
  requiredEmailVerification = false,
}: ProtectedRouteProps) => {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push("/login");
      return;
    }

    if (allowedRoles && !allowedRoles.includes(user.role as UserRole)) {
      router.push("/unauthorized");
      return;
    }

    if (requiredEmailVerification && !user.isEmailVerified) {
      router.push("/verify-email");
      return;
    }
  }, [isAuthenticated, allowedRoles, user, requiredEmailVerification, router]);

  if (!isAuthenticated || !user) {
    <div className="flex min-h-screen items-center justify-center ">
      <div className="animte-pulse text-lg">Loading...</div>
    </div>;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role as UserRole)) {
    return null;
  }

  if (requiredEmailVerification && !user?.isEmailVerified) {
    return null;
  }

  return <>{children}</>;
};

export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    allowedRoles?: UserRole[];
    requireEmailVerification?: boolean;
  },
) {
  return function AuthenticatedComponent(props: P) {
    return (
      <ProtectedRoute
        allowedRoles={options?.allowedRoles}
        requiredEmailVerification={options?.requireEmailVerification}
      >
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}

interface RequireRoleProps {
  children: ReactNode;
  roles: UserRole[];
  fallback?: ReactNode;
}

export const RequireRole = ({
  children,
  roles,
  fallback,
}: RequireRoleProps) => {
  const { user } = useAuthStore();
  if (!user || !roles.includes(user.role as UserRole)) {
    return <>{fallback || null}</>;
  }

  return <>{children}</>;
};

export const useRequireAuth = () => {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push("/");
    }
  }, [isAuthenticated, router, user]);

  return { isAuthenticated, user };
};

export const useRequireRole = (allowedRoles: UserRole[]) => {
  const router = useRouter();
  const { user } = useAuthStore();
  useEffect(() => {
    if (user && !allowedRoles.includes(user.role as UserRole)) {
      router.push("/unauthorized");
    }
  }, [user, allowedRoles, router]);

  return {
    user,
    hasAccess: user ? allowedRoles.includes(user.role as UserRole) : false,
  };
};
