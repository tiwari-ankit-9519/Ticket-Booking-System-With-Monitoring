import { z } from "zod";

export const passwordSchema = z
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
  );

export async function isPasswordCompromised(
  password: string,
): Promise<boolean> {
  const commonPasswords = [
    "password123",
    "admin123",
    "qwerty123",
    "welcome123",
    "Password1!",
    "123456789",
    "password1",
    "Abc123456!",
    "Welcome123!",
    "Password123!",
  ];

  return commonPasswords.some(
    (common) => password.toLowerCase() === common.toLowerCase(),
  );
}

export function calculatePasswordStrength(password: string): number {
  let strength = 0;

  if (password.length >= 12) strength++;
  if (password.length >= 16) strength++;

  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^a-zA-Z0-9]/.test(password)) strength++;

  if (/(.)\1{2,}/.test(password)) strength--;
  if (/123|abc|qwerty/i.test(password)) strength--;

  return Math.max(0, Math.min(4, strength));
}

export function generateSecurePassword(length: number = 16): string {
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  const symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?";

  const allChars = lowercase + uppercase + numbers + symbols;

  let password = "";

  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];

  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}
