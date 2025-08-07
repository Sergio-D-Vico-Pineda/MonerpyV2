/**
 * Date utilities for consistent date handling without timezone issues
 */
import { months } from "@/types/arrays";

/**
 * Formats a datetime-local input value to "YYYY-MM-DD HH:mm:ss" format
 * @param datetimeLocal - The value from a datetime-local input (e.g., "2024-01-15T14:30")
 * @returns Formatted string "YYYY-MM-DD HH:mm:ss"
 */
function formatDateTimeLocal(datetimeLocal: string): string {
    // datetime-local format: "YYYY-MM-DDTHH:mm" or "YYYY-MM-DDTHH:mm:ss"
    const parts = datetimeLocal.split('T');
    if (parts.length !== 2) {
        throw new Error('Invalid datetime-local format');
    }

    const [datePart, timePart] = parts;

    // Ensure time has seconds
    const timeWithSeconds = timePart.length === 5 ? `${timePart}:00` : timePart;

    return `${datePart} ${timeWithSeconds}`;
}

/**
 * Formats a "YYYY-MM-DD HH:mm:ss" string to datetime-local input format
 * @param dateTimeString - Database date string "YYYY-MM-DD HH:mm:ss"
 * @returns datetime-local format "YYYY-MM-DDTHH:mm"
 */
function formatToDateTimeLocal(dateTimeString: string): string {
    const parts = dateTimeString.split(' ');
    if (parts.length !== 2) {
        throw new Error('Invalid date-time format');
    }

    const [datePart, timePart] = parts;
    const timeWithoutSeconds = timePart.substring(0, 5); // Take only HH:mm

    return `${datePart}T${timeWithoutSeconds}`;
}

/**
 * Gets current date-time in "YYYY-MM-DD HH:mm:ss" format
 * @returns Current local date-time string
 */
function getCurrentDateTime(): string {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Gets current date-time in datetime-local input format
 * @returns Current local date-time for datetime-local input
 */
function getCurrentDateTimeLocal(): string {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Formats a date string for display.
 *
 * @param dateTimeString - Database date string in the format "YYYY-MM-DD HH:mm:ss".
 *   Example: "2024-06-01 14:30:00"
 * @param options - Formatting options:
 *   - includeTime: Whether to include the time part (default: true).
 *   - includeSeconds: Whether to include seconds in the time part (default: false).
 *   - dateStyle: The style of the date part. Options:
 *       - 'medium': "DD/MM/YYYY" (e.g., "01/06/2024")
 *       - 'long': "DD Month YYYY" (e.g., "01 June 2024")
 *   - pm: Whether to format the time in 12-hour format with AM/PM (default: false).
 * @returns Formatted date string according to the specified options.
 *
 * @example
 * formatDateForDisplay("2024-06-01 14:30:00", { dateStyle: 'normal' }); // "01/06/2024 14:30"
 * formatDateForDisplay("2024-06-01 14:30:00", { dateStyle: 'long', includeTime: false }); // "01 June 2024"
 * formatDateForDisplay("2024-06-01 14:30:00", { includeSeconds: true }); // "01/06/2024 14:30:00"
 * formatDateForDisplay("2024-06-01 14:30:00", { dateStyle: 'long', pm: true }); // "01 June 2024 2:30:00 PM"
 */
function formatDateForDisplay(
    dateTimeString: string,
    options: {
        includeTime?: boolean;
        includeSeconds?: boolean;
        dateStyle?: 'normal' | 'long';
        pm?: boolean;
    } = {}
): string {
    const {
        includeTime = true,
        includeSeconds = false,
        dateStyle = 'normal',
        pm = false,
    } = options;

    const parts = dateTimeString.split(' ');
    if (parts.length !== 2) {
        throw new Error('Invalid date-time format');
    }

    const [datePart, timePart] = parts;
    const [year, month, day] = datePart.split('-');

    let formattedDate: string;
    switch (dateStyle) {
        case 'normal':
            formattedDate = `${day}/${month}/${year}`;
            break;
        case 'long':
            formattedDate = `${day} ${months[parseInt(month) - 1].label} ${year}`;
            break;
        default:
            formattedDate = `${day}/${month}/${year}`;
    }

    if (!includeTime) {
        return formattedDate;
    }

    let hours = 0, minutes = 0, seconds = 0;
    const timeParts = timePart.split(':');
    if (timeParts.length >= 2) {
        hours = Number(timeParts[0]);
        minutes = Number(timeParts[1]);
        seconds = Number(timeParts[2] || '0');
    }

    let formattedTime: string;
    if (pm) {
        const period = hours >= 12 ? 'PM' : 'AM';
        const adjustedHours = hours % 12 || 12;
        if (includeSeconds) {
            formattedTime = `${adjustedHours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')} ${period}`;
        } else {
            formattedTime = `${adjustedHours}:${String(minutes).padStart(2, '0')} ${period}`;
        }
    } else {
        if (includeSeconds) {
            formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        } else {
            formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        }
    }

    return `${formattedDate} ${formattedTime}`;
}

/**
 * Gets the date part only from a date-time string
 * @param dateTimeString - Database date string "YYYY-MM-DD HH:mm:ss"
 * @returns Date part "YYYY-MM-DD"
 */
function getDatePart(dateTimeString: string): string {
    return dateTimeString.split(' ')[0];
}

/**
 * Gets the time part only from a date-time string
 * @param dateTimeString - Database date string "YYYY-MM-DD HH:mm:ss"
 * @param pm - Optional parameter to indicate if the time should be in 12-hour format with AM/PM
 *            (default: false, which returns 24-hour format)
 * @returns Time part "HH:mm:ss" (24-hour) or "HH:mm:ss AM/PM" (12-hour)
 *
 * @example
 * getTimePart("2024-06-01 14:30:45") // "14:30:45"
 * getTimePart("2024-06-01 14:30:45", true) // "2:30:45 PM"
 */
function getTimePart(dateTimeString: string, pm: boolean = false): string {
    const timePart = dateTimeString.split(' ')[1];
    if (!timePart) {
        throw new Error('Invalid date-time format');
    }
    const [hoursStr, minutesStr, secondsStr] = timePart.split(':');
    const hours = Number(hoursStr);
    const minutes = Number(minutesStr);
    const seconds = Number(secondsStr);

    if (pm) {
        const period = hours >= 12 ? 'PM' : 'AM';
        const adjustedHours = hours % 12 || 12; // Convert 0 to 12 for 12-hour format
        return `${adjustedHours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')} ${period}`;
    } else {
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
}

/**
 * Gets the time part only from a date-time string without seconds
 * @param dateTimeString - Database date string "YYYY-MM-DD HH:mm:ss"
 * @returns Time part "HH:mm AM/PM"
 */
function getTimePartWithoutSeconds(dateTimeString: string): string {
    const timePart = dateTimeString.split(' ')[1] || '00:00:00';
    const [hours, minutes] = timePart.split(':').map(Number);

    const period = hours >= 12 ? 'PM' : 'AM';
    const adjustedHours = hours % 12 || 12; // Convert 0 to 12 for 12-hour format

    return `${adjustedHours}:${String(minutes).padStart(2, '0')} ${period}`;
}

function getCurrentDate(): string {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

/**
 * Formats a date-only string for display
 * @param dateString - Database date string "YYYY-MM-DD"
 * @param dateStyle - Formatting style
 * @returns Formatted date string
 */
function formatDateOnlyForDisplay(dateString: string, dateStyle: 'normal' | 'long' = 'normal'): string {
    const [year, month, day] = dateString.split('-');

    switch (dateStyle) {
        case 'normal':
            return `${day}/${month}/${year}`;
        case 'long':
            return `${day} ${months[parseInt(month) - 1].label} ${year}`;
    }
}

/**
 * Formats a number as currency (EUR, es-ES locale by default)
 * @param amount - The numeric value to format
 * @param currency - The currency code (default: 'EUR')
 * @param locale - The locale string (default: 'es-ES')
 * @returns Formatted currency string
 */
function formatCurrency(amount: number, currency = 'EUR', locale = 'es-ES'): string {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
    }).format(amount);
}

export {
    formatDateTimeLocal,
    formatToDateTimeLocal,
    getCurrentDateTime,
    getCurrentDateTimeLocal,
    formatDateForDisplay,
    getDatePart,
    getTimePart,
    getTimePartWithoutSeconds,
    getCurrentDate,
    formatDateOnlyForDisplay,
    formatCurrency
}