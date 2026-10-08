import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

// Formats fractional total minutes: 24 -> "24 mins", 24.5 -> "24.5 mins",
// 90 -> "1h 30m", 60 -> "1h".
export function formatMinutes(total: number): string {
    const rounded = Math.round(total * 10) / 10;
    if (rounded < 60) {
        const mins = Number.isInteger(rounded) ? String(rounded) : String(rounded);
        return `${mins} mins`;
    }
    const hours = Math.floor(rounded / 60);
    const mins = Math.round((rounded - hours * 60) * 10) / 10;
    if (mins === 0) return `${hours}h`;
    const minsStr = Number.isInteger(mins) ? String(mins) : String(mins);
    return `${hours}h ${minsStr}m`;
}
