import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function thumbUrl(imgUrl: string): string {
  return imgUrl.replace('/images/', '/thumbs/')
}
