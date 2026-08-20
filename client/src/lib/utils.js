import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines conditional class names and merges Tailwind CSS classes cleanly.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
