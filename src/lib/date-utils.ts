/**
 * Date utilities for consistent date handling without timezone issues
 */

/**
 * Formats a datetime-local input value to "YYYY-MM-DD HH:mm:ss" format
 * @param datetimeLocal - The value from a datetime-local input (e.g., "2024-01-15T14:30")
 * @returns Formatted string "YYYY-MM-DD HH:mm:ss"
 */
export function formatDateTimeLocal(datetimeLocal: string): string {
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
export function formatToDateTimeLocal(dateTimeString: string): string {
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
export function getCurrentDateTime(): string {
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
export function getCurrentDateTimeLocal(): string {
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
 *       - 'short': "MM/DD/YYYY" (e.g., "06/01/2024")
 *       - 'medium': "DD/MM/YYYY" (e.g., "01/06/2024")
 *       - 'long': "DD Month YYYY" (e.g., "01 June 2024")
 * @returns Formatted date string according to the specified options.
 *
 * @example
 * formatDateForDisplay("2024-06-01 14:30:00", { dateStyle: 'short' }); // "06/01/2024 14:30"
 * formatDateForDisplay("2024-06-01 14:30:00", { dateStyle: 'medium' }); // "01/06/2024 14:30"
 * formatDateForDisplay("2024-06-01 14:30:00", { dateStyle: 'long', includeTime: false }); // "01 June 2024"
 */
export function formatDateForDisplay(dateTimeString: string, options: {
    includeTime?: boolean;
    includeSeconds?: boolean;
    dateStyle?: 'short' | 'medium' | 'long';
} = {}): string {
    const { includeTime = true, includeSeconds = false, dateStyle = 'medium' } = options;

    const parts = dateTimeString.split(' ');
    if (parts.length !== 2) {
        throw new Error('Invalid date-time format');
    }

    const [datePart, timePart] = parts;
    const [year, month, day] = datePart.split('-');

    let formattedDate: string;

    switch (dateStyle) {
        case 'short':
            formattedDate = `${month}/${day}/${year}`;
            break;
        case 'medium':
            formattedDate = `${day}/${month}/${year}`;
            break;
        case 'long':
            const monthNames = [
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
            ];
            formattedDate = `${day} ${monthNames[parseInt(month) - 1]} ${year}`;
            break;
        default:
            formattedDate = `${day}/${month}/${year}`;
    }

    if (includeTime) {
        const timeToShow = includeSeconds ? timePart : timePart.substring(0, 5);
        return `${formattedDate} ${timeToShow}`;
    }

    return formattedDate;
}

/**
 * Gets the date part only from a date-time string
 * @param dateTimeString - Database date string "YYYY-MM-DD HH:mm:ss"
 * @returns Date part "YYYY-MM-DD"
 */
export function getDatePart(dateTimeString: string): string {
    return dateTimeString.split(' ')[0];
}

/**
 * Gets the time part only from a date-time string
 * @param dateTimeString - Database date string "YYYY-MM-DD HH:mm:ss"
 * @returns Time part "HH:mm:ss"
 */
export function getTimePart(dateTimeString: string): string {
    const timePart = dateTimeString.split(' ')[1] || '00:00:00';
    const [hours, minutes, seconds] = timePart.split(':').map(Number);

    const period = hours >= 12 ? 'PM' : 'AM';
    const adjustedHours = hours % 12 || 12; // Convert 0 to 12 for 12-hour format

    return `${adjustedHours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')} ${period}`;
}

/**
 * Gets the time part only from a date-time string without seconds
 * @param dateTimeString - Database date string "YYYY-MM-DD HH:mm:ss"
 * @returns Time part "HH:mm AM/PM"
 */
export function getTimePartWithoutSeconds(dateTimeString: string): string {
    const timePart = dateTimeString.split(' ')[1] || '00:00:00';
    const [hours, minutes] = timePart.split(':').map(Number);

    const period = hours >= 12 ? 'PM' : 'AM';
    const adjustedHours = hours % 12 || 12; // Convert 0 to 12 for 12-hour format

    return `${adjustedHours}:${String(minutes).padStart(2, '0')} ${period}`;
}

export function getCurrentDate(): string {
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
export function formatDateOnlyForDisplay(dateString: string, dateStyle: 'short' | 'medium' | 'long' = 'medium'): string {
    const [year, month, day] = dateString.split('-');

    switch (dateStyle) {
        case 'short':
            return `${month}/${day}/${year}`;
        case 'medium':
            return `${day}/${month}/${year}`;
        case 'long':
            const monthNames = [
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
            ];
            return `${day} ${monthNames[parseInt(month) - 1]} ${year}`;
        default:
            return `${day}/${month}/${year}`;
    }
}
