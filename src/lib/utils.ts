import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getEnv(key: string): string | undefined {
  // 1. Build-time (Vite)
  try {
    if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env[key]) {
      return import.meta.env[key];
    }
  } catch (e) {}

  // 2. Global process (Node/SSR)
  try {
    if (typeof process !== "undefined" && process.env && process.env[key]) {
      return process.env[key];
    }
  } catch (e) {}

  // 3. Cloudflare Global fallback
  try {
    if (typeof globalThis !== "undefined" && (globalThis as any)[key]) {
      return (globalThis as any)[key];
    }
  } catch (e) {}

  // 4. Cloudflare env object fallback
  try {
    if (
      typeof globalThis !== "undefined" &&
      (globalThis as any).env &&
      (globalThis as any).env[key]
    ) {
      return (globalThis as any).env[key];
    }
  } catch (e) {}

  return undefined;
}
