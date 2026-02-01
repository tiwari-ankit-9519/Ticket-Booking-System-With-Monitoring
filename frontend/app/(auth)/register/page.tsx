"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRegister } from "@/hooks/useAuth";
import { Eye, EyeOff, ArrowRight, Sparkles, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const registerSchema = z
  .object({
    firstName: z.string().min(2, "First name must be at least 2 characters"),
    lastName: z.string().min(2, "Last name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email"),
    phoneNumber: z
      .string()
      .min(10, "Phone number must be at least 10 digits")
      .regex(/^[0-9+\s()-]+$/, "Please enter a valid phone number"),
    password: z
      .string()
      .min(12, "Password must be at least 12 characters")
      .max(128, "Password too long")
      .refine(
        (password) => /[a-z]/.test(password),
        "Password must contain at least one lowercase letter",
      )
      .refine(
        (password) => /[A-Z]/.test(password),
        "Password must contain at least one uppercase letter",
      )
      .refine(
        (password) => /[0-9]/.test(password),
        "Password must contain at least one number",
      )
      .refine(
        (password) => /[^a-zA-Z0-9]/.test(password),
        "Password must contain at least one special character",
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState<boolean>(false);
  const { mutate: register, isPending } = useRegister();

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = (data: RegisterFormValues) => {
    const { confirmPassword, ...registerData } = data;
    register(registerData);
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Animated Background Gradient */}
      <div className="absolute inset-0 bg-linear-to-br from-violet-50 via-background to-blue-50 dark:from-violet-950/20 dark:via-background dark:to-blue-950/20" />

      {/* Decorative Elements */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-violet-200 dark:bg-violet-900/20 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-50 animate-blob" />
      <div className="absolute top-40 right-20 w-72 h-72 bg-blue-200 dark:bg-blue-900/20 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-50 animate-blob animation-delay-2000" />
      <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-200 dark:bg-pink-900/20 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-50 animate-blob animation-delay-4000" />

      {/* Left Side - Hero Section */}
      <div className="hidden lg:flex flex-1 items-center justify-center p-12 relative z-10">
        <div className="max-w-lg space-y-8 text-center">
          {/* Icon with gradient background */}
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-linear-to-r from-violet-600 to-blue-600 rounded-3xl blur-2xl opacity-50" />
            <div className="relative bg-linear-to-br from-violet-500 to-blue-500 p-6 rounded-3xl shadow-2xl">
              <span className="text-7xl">🎉</span>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-4xl font-bold bg-linear-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent">
              Join EventTicket Today
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Create your account and start discovering amazing events in your
              city. It only takes a minute!
            </p>
          </div>

          {/* Feature List */}
          <div className="space-y-4 text-left max-w-sm mx-auto">
            {[
              "Discover exclusive events",
              "Get personalized recommendations",
              "Book tickets instantly",
              "Access member-only deals",
            ].map((feature, index) => (
              <div key={index} className="flex items-center gap-3 text-sm">
                <div className="shrink-0 w-6 h-6 rounded-full bg-linear-to-r from-violet-500 to-blue-500 flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <span className="text-muted-foreground">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Form Section */}
      <div className="flex-1 flex items-center justify-center p-8 relative z-10 overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-8 text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              Start your journey
            </div>
            <h1 className="text-4xl font-bold tracking-tight bg-linear-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent">
              Create Account
            </h1>
            <p className="text-muted-foreground">
              Get started with your free account
            </p>
          </div>

          {/* Form Card */}
          <Card className="border-2 shadow-xl backdrop-blur-sm bg-background/80">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl">Sign up</CardTitle>
              <CardDescription>
                Fill in your details to create an account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Name Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-sm font-medium">
                      First Name
                    </Label>
                    <Input
                      {...registerField("firstName")}
                      id="firstName"
                      placeholder="Shubham"
                      className={`transition-all ${
                        errors.firstName
                          ? "border-destructive focus-visible:ring-destructive"
                          : "focus-visible:ring-violet-500"
                      }`}
                    />
                    {errors.firstName && (
                      <p className="text-xs text-destructive animate-in fade-in slide-in-from-top-1">
                        {errors.firstName.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-sm font-medium">
                      Last Name
                    </Label>
                    <Input
                      {...registerField("lastName")}
                      id="lastName"
                      placeholder="Gupta"
                      className={`transition-all ${
                        errors.lastName
                          ? "border-destructive focus-visible:ring-destructive"
                          : "focus-visible:ring-violet-500"
                      }`}
                    />
                    {errors.lastName && (
                      <p className="text-xs text-destructive animate-in fade-in slide-in-from-top-1">
                        {errors.lastName.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email
                  </Label>
                  <Input
                    {...registerField("email")}
                    id="email"
                    placeholder="you@example.com"
                    type="email"
                    className={`transition-all ${
                      errors.email
                        ? "border-destructive focus-visible:ring-destructive"
                        : "focus-visible:ring-violet-500"
                    }`}
                  />
                  {errors.email && (
                    <p className="text-xs text-destructive animate-in fade-in slide-in-from-top-1">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Phone Number Field */}
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber" className="text-sm font-medium">
                    Phone Number
                  </Label>
                  <Input
                    {...registerField("phoneNumber")}
                    id="phoneNumber"
                    placeholder="+91XXXXXXXXXX"
                    type="tel"
                    className={`transition-all ${
                      errors.phoneNumber
                        ? "border-destructive focus-visible:ring-destructive"
                        : "focus-visible:ring-violet-500"
                    }`}
                  />
                  {errors.phoneNumber && (
                    <p className="text-xs text-destructive animate-in fade-in slide-in-from-top-1">
                      {errors.phoneNumber.message}
                    </p>
                  )}
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      {...registerField("password")}
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••••••"
                      className={`pr-10 transition-all ${
                        errors.password
                          ? "border-destructive focus-visible:ring-destructive"
                          : "focus-visible:ring-violet-500"
                      }`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-destructive animate-in fade-in slide-in-from-top-1">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                {/* Confirm Password Field */}
                <div className="space-y-2">
                  <Label
                    htmlFor="confirmPassword"
                    className="text-sm font-medium"
                  >
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Input
                      {...registerField("confirmPassword")}
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••••••"
                      className={`pr-10 transition-all ${
                        errors.confirmPassword
                          ? "border-destructive focus-visible:ring-destructive"
                          : "focus-visible:ring-violet-500"
                      }`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-xs text-destructive animate-in fade-in slide-in-from-top-1">
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full h-11 bg-linear-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white font-medium shadow-lg shadow-violet-500/50 transition-all hover:shadow-xl hover:shadow-violet-500/50 hover:scale-[1.02]"
                  disabled={isPending}
                >
                  {isPending ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating account...
                    </span>
                  ) : (
                    <>
                      Create account
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 pb-6">
              <div className="relative w-full">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
                  Or
                </span>
              </div>
              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300 font-medium hover:underline transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </Card>

          {/* Trust Indicators */}
          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground">
              By creating an account, you agree to our{" "}
              <Link href="/terms" className="underline hover:text-foreground">
                Terms
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="underline hover:text-foreground">
                Privacy Policy
              </Link>
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
