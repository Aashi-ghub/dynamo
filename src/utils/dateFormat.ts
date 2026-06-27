/**
 * Formats a date value for UI display as YYYY-MM-DD.
 * DynamoDB storage format remains unchanged; this only affects presentation.
 */
export function formatDateDisplay(value: unknown): string {
  if (value === null || value === undefined || value === '') return '-';

  if (typeof value === 'string') {
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  }

  const date = new Date(
    typeof value === 'number' || /^\d+$/.test(String(value)) ? Number(value) : String(value)
  );
  if (!Number.isNaN(date.getTime())) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  return String(value);
}

/**
 * Normalizes a date value to YYYY-MM-DD for form inputs (type="date").
 */
export function toDateInputValue(value: unknown): string | unknown {
  if (!value) return value ?? '';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);

  const date = new Date(
    typeof value === 'number' || /^\d+$/.test(String(value)) ? Number(value) : String(value)
  );
  if (Number.isNaN(date.getTime())) return value;

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
