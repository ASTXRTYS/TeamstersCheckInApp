export function formatDurationFromNow(iso: string): string {
  const started = new Date(iso).getTime();
  const diffMinutes = Math.max(0, Math.round((Date.now() - started) / 60000));
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  if (hours <= 0) {
    return `${minutes}m`;
  }
  return `${hours}h ${minutes.toString().padStart(2, "0")}m`;
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  const formatter = new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit"
  });
  return formatter.format(date).replace(",", "");
}

export function formatHoursWorked(hours?: number): string {
  if (hours == null) {
    return "-";
  }
  const rounded = Math.round(hours * 100) / 100;
  return rounded.toString();
}
