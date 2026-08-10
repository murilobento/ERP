export const APP_TIME_ZONE = "America/Sao_Paulo";

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isValidDateOnly(value: string) {
	if (!DATE_ONLY_PATTERN.test(value)) return false;
	const date = new Date(`${value}T00:00:00.000Z`);
	return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function parseDateOnlyInAppTimeZone(value: string) {
	if (!isValidDateOnly(value)) return null;
	return new Date(`${value}T00:00:00.000-03:00`);
}

export function parseDateTimeInAppTimeZone(value: string) {
	if (!value) return null;
	const normalized = /(?:Z|[+-]\d{2}:?\d{2})$/.test(value)
		? value
		: `${value}:00-03:00`;
	const date = new Date(normalized);
	return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDateInAppTimeZone(value: Date | null | undefined) {
	if (!value) return null;
	const parts = new Intl.DateTimeFormat("en-US", {
		timeZone: APP_TIME_ZONE,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).formatToParts(value);
	const values = Object.fromEntries(parts.map(({ type, value: part }) => [type, part]));
	return `${values.year}-${values.month}-${values.day}`;
}
