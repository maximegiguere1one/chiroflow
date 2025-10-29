export function formatDateForQuery(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getStartOfDay(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export function getEndOfDay(date: Date): string {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

export function extractTime(isoString: string | null): string | null {
  if (!isoString) return null;
  const date = new Date(isoString);
  return date.toTimeString().slice(0, 5);
}

export function extractDate(isoString: string | null): string | null {
  if (!isoString) return null;
  const date = new Date(isoString);
  return formatDateForQuery(date);
}

export function combineDateTime(date: string, time: string): string {
  return `${date}T${time}:00`;
}

export function getTodayRange(): { start: string; end: string } {
  const today = new Date();
  return {
    start: getStartOfDay(today),
    end: getEndOfDay(today)
  };
}

export function getWeekRange(startDate: Date): { start: string; end: string } {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 7);

  return {
    start: start.toISOString(),
    end: end.toISOString()
  };
}
