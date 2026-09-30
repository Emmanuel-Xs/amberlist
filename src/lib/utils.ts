import { clsx } from 'clsx'
import type { ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** shadcn/ui class helper. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
