// Report forms display dates as "JJ/MM/AAAA" (fr-FR locale), but
// `new Date("28/08/2026")` is ambiguous/invalid in JavaScript (it expects
// MM/DD/YYYY or ISO for string parsing) — sending that straight to the API
// made Mongoose reject the whole report with a CastError. Convert to ISO
// before it ever leaves the device.
export function frenchDateToISO(value: string): string {
  const match = value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return value;
  const [, day, month, year] = match;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}
