import { clsx, type ClassValue } from "clsx"
import { format, parseISO } from "date-fns"
import { isAxiosError } from "axios"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = 'INR'): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function getUserDateFormat(): string {
  try {
    const raw = localStorage.getItem('cashlytics_user');
    if (raw) {
      const user = JSON.parse(raw);
      if (user?.preferences?.date_format) return user.preferences.date_format;
    }
  } catch {}
  return 'd MMM yyyy';
}

export function formatDate(date: string): string {
  return format(parseISO(date), getUserDateFormat())
}

export function formatTime(time: string | null | undefined): string {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

export function getCurrencySymbol(currency = 'INR'): string {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency })
    .formatToParts(0)
    .find((p) => p.type === 'currency')?.value ?? currency;
}

export function getErrorMessage(error: unknown): string {
  if (isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message ?? "Something went wrong. Please try again."
  }

  return "Something went wrong. Please try again."
}
