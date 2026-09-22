/**
 * Small, dependency-free helpers shared across the app.
 * Keep this folder free of React / platform UI imports.
 */

/** Format a Date/ISO string as e.g. "Sep 22, 2026". */
export function formatDate(value: Date | string): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Truncate a string to `max` chars, appending an ellipsis when cut. */
export function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, Math.max(0, max - 1))}…`;
}
