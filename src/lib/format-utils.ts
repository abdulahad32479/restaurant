/**
 * Time formatting utilities for Duke's POS
 */

/**
 * Converts a 24-hour hour number (0-23) to a 12-hour string (e.g., "10 PM")
 */
export function formatHour12(hour: number | string): string {
  const hStr = typeof hour === 'string' ? hour.replace(/[^0-9]/g, '') : String(hour);
  const hNum = parseInt(hStr, 10);
  if (isNaN(hNum)) return String(hour);

  const h = hNum % 12 || 12;
  const ampm = hNum < 12 ? 'AM' : 'PM';
  return `${h.toString().padStart(2, '0')} ${ampm}`;
}

/**
 * Converts a ISO datetime string or Date object to a readable 12h time string (e.g., "08:30 PM")
 */
export function formatTime12(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}
