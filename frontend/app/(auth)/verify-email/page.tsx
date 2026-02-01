"use client";

import { useEffect, useState, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useVerifyEmail, useSendVerification } from "@/hooks/useAuth";
import { useAuthStore } from "@/stores/useAuthStore";
import {
  Mail,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { user } = useAuthStore();
  const [status, setStatus] = useState<
    "idle" | "verifying" | "success" | "error"
  >("idle");
  const isVerifyingRef = useRef(false);

  const { mutate: verifyEmail } = useVerifyEmail();
  const { mutate: resendEmail, isPending: isResending } = useSendVerification();

  useEffect(() => {
    if (token && status === "idle" && !isVerifyingRef.current) {
      isVerifyingRef.current = true;

      verifyEmail(token, {
        onSuccess: () => {
          setStatus("success");
          isVerifyingRef.current = false;
        },
        onError: () => {
          setStatus("error");
          isVerifyingRef.current = false;
        },
      });
    }
  }, [token, status, verifyEmail]);

  if (user?.isEmailVerified) {
    return (
      <div className="min-h-screen flex relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-violet-50 via-background to-blue-50 dark:from-violet-950/20 dark:via-background dark:to-blue-950/20" />

        <div className="absolute top-20 left-20 w-72 h-72 bg-green-200 dark:bg-green-900/20 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-50 animate-blob" />
        <div className="absolute top-40 right-20 w-72 h-72 bg-blue-200 dark:bg-blue-900/20 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-50 animate-blob animation-delay-2000" />

        <div className="flex-1 flex items-center justify-center p-8 relative z-10">
          <div className="w-full max-w-md">
            <Card className="border-2 shadow-xl backdrop-blur-sm bg-background/80">
              <CardHeader className="text-center pb-6">
                <div className="mx-auto w-16 h-16 rounded-full bg-linear-to-br from-green-500 to-emerald-500 flex items-center justify-center mb-4">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-3xl font-bold bg-linear-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  Email Already Verified
                </CardTitle>
                <CardDescription className="text-base mt-3">
                  Your email address has already been verified. You&apos;re all
                  set!
                </CardDescription>
              </CardHeader>

              <CardContent>
                <Link href="/dashboard">
                  <Button className="w-full h-11 bg-linear-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium shadow-lg shadow-green-500/50">
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        <style jsx global>{`
          @keyframes blob {
            0% {
              transform: translate(0px, 0px) scale(1);
            }
            33% {
              transform: translate(30px, -50px) scale(1.1);
            }
            66% {
              transform: translate(-20px, 20px) scale(0.9);
            }
            100% {
              transform: translate(0px, 0px) scale(1);
            }
          }
          .animate-blob {
            animation: blob 7s infinite;
          }
          .animation-delay-2000 {
            animation-delay: 2s;
          }
        `}</style>
      </div>
    );
  }

  if (status === "verifying") {
    return (
      <div className="min-h-screen flex relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-violet-50 via-background to-blue-50 dark:from-violet-950/20 dark:via-background dark:to-blue-950/20" />

        <div className="absolute top-20 left-20 w-72 h-72 bg-violet-200 dark:bg-violet-900/20 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-50 animate-blob" />
        <div className="absolute top-40 right-20 w-72 h-72 bg-blue-200 dark:bg-blue-900/20 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-50 animate-blob animation-delay-2000" />

        <div className="flex-1 flex items-center justify-center p-8 relative z-10">
          <Card className="border-2 shadow-xl backdrop-blur-sm bg-background/80 max-w-md">
            <CardHeader className="text-center pb-6">
              <div className="mx-auto w-16 h-16 rounded-full bg-linear-to-br from-violet-500 to-blue-500 flex items-center justify-center mb-4">
                <Loader2 className="h-8 w-8 text-white animate-spin" />
              </div>
              <CardTitle className="text-3xl font-bold bg-linear-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent">
                Verifying your email...
              </CardTitle>
              <CardDescription className="text-base mt-3">
                Please wait while we verify your email address
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <style jsx global>{`
          @keyframes blob {
            0% {
              transform: translate(0px, 0px) scale(1);
            }
            33% {
              transform: translate(30px, -50px) scale(1.1);
            }
            66% {
              transform: translate(-20px, 20px) scale(0.9);
            }
            100% {
              transform: translate(0px, 0px) scale(1);
            }
          }
          .animate-blob {
            animation: blob 7s infinite;
          }
          .animation-delay-2000 {
            animation-delay: 2s;
          }
        `}</style>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="min-h-screen flex relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-violet-50 via-background to-blue-50 dark:from-violet-950/20 dark:via-background dark:to-blue-950/20" />

        <div className="absolute top-20 left-20 w-72 h-72 bg-green-200 dark:bg-green-900/20 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-50 animate-blob" />
        <div className="absolute top-40 right-20 w-72 h-72 bg-blue-200 dark:bg-blue-900/20 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-50 animate-blob animation-delay-2000" />

        <div className="flex-1 flex items-center justify-center p-8 relative z-10">
          <div className="w-full max-w-md">
            <Card className="border-2 shadow-xl backdrop-blur-sm bg-background/80">
              <CardHeader className="text-center pb-6">
                <div className="mx-auto w-16 h-16 rounded-full bg-linear-to-br from-green-500 to-emerald-500 flex items-center justify-center mb-4">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-3xl font-bold bg-linear-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  Email Verified Successfully!
                </CardTitle>
                <CardDescription className="text-base mt-3">
                  Your email has been verified. You can now access all features.
                </CardDescription>
              </CardHeader>

              <CardContent>
                <Link href="/dashboard">
                  <Button className="w-full h-11 bg-linear-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium shadow-lg shadow-green-500/50">
                    Continue to Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        <style jsx global>{`
          @keyframes blob {
            0% {
              transform: translate(0px, 0px) scale(1);
            }
            33% {
              transform: translate(30px, -50px) scale(1.1);
            }
            66% {
              transform: translate(-20px, 20px) scale(0.9);
            }
            100% {
              transform: translate(0px, 0px) scale(1);
            }
          }
          .animate-blob {
            animation: blob 7s infinite;
          }
          .animation-delay-2000 {
            animation-delay: 2s;
          }
        `}</style>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-violet-50 via-background to-blue-50 dark:from-violet-950/20 dark:via-background dark:to-blue-950/20" />

        <div className="absolute top-20 left-20 w-72 h-72 bg-red-200 dark:bg-red-900/20 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-50 animate-blob" />
        <div className="absolute top-40 right-20 w-72 h-72 bg-orange-200 dark:bg-orange-900/20 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-50 animate-blob animation-delay-2000" />

        <div className="flex-1 flex items-center justify-center p-8 relative z-10">
          <div className="w-full max-w-md">
            <Card className="border-2 shadow-xl backdrop-blur-sm bg-background/80">
              <CardHeader className="text-center pb-6">
                <div className="mx-auto w-16 h-16 rounded-full bg-linear-to-br from-red-500 to-orange-500 flex items-center justify-center mb-4">
                  <XCircle className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-3xl font-bold bg-linear-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                  Verification Failed
                </CardTitle>
                <CardDescription className="text-base mt-3">
                  This verification link is invalid or has expired. Please
                  request a new one.
                </CardDescription>
              </CardHeader>

              <CardContent>
                <Button
                  onClick={() => resendEmail()}
                  disabled={isResending}
                  className="w-full h-11 bg-linear-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white font-medium shadow-lg shadow-violet-500/50"
                >
                  {isResending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      Resend Verification Email
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <style jsx global>{`
          @keyframes blob {
            0% {
              transform: translate(0px, 0px) scale(1);
            }
            33% {
              transform: translate(30px, -50px) scale(1.1);
            }
            66% {
              transform: translate(-20px, 20px) scale(0.9);
            }
            100% {
              transform: translate(0px, 0px) scale(1);
            }
          }
          .animate-blob {
            animation: blob 7s infinite;
          }
          .animation-delay-2000 {
            animation-delay: 2s;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-br from-violet-50 via-background to-blue-50 dark:from-violet-950/20 dark:via-background dark:to-blue-950/20" />

      <div className="absolute top-20 left-20 w-72 h-72 bg-violet-200 dark:bg-violet-900/20 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-50 animate-blob" />
      <div className="absolute top-40 right-20 w-72 h-72 bg-blue-200 dark:bg-blue-900/20 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-50 animate-blob animation-delay-2000" />
      <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-200 dark:bg-pink-900/20 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-50 animate-blob animation-delay-4000" />

      <div className="flex-1 flex items-center justify-center p-8 relative z-10">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              Email Verification
            </div>
            <h1 className="text-4xl font-bold tracking-tight bg-linear-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent">
              Verify your email
            </h1>
            <p className="text-muted-foreground">
              We&apos;ve sent a verification link to{" "}
              <span className="font-semibold text-foreground">
                {user?.email}
              </span>
            </p>
          </div>

          <Card className="border-2 shadow-xl backdrop-blur-sm bg-background/80">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-linear-to-br from-violet-500 to-blue-500 flex items-center justify-center mb-4">
                <Mail className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-xl">Check your inbox</CardTitle>
              <CardDescription className="text-sm mt-2">
                Click the verification link in the email to activate your
                account
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <p className="text-sm text-muted-foreground">
                  Didn&apos;t receive the email? Check your spam folder or
                  request a new one.
                </p>
              </div>

              <Button
                onClick={() => resendEmail()}
                disabled={isResending}
                className="w-full h-11 bg-linear-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white font-medium shadow-lg shadow-violet-500/50"
              >
                {isResending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    Resend Verification Email
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground">
              Make sure to check your spam or junk folder
            </p>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
