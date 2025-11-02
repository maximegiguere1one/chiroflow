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

export function getDateFromScheduledAt(scheduled_at: string | null): string {
  if (!scheduled_at) return '';
  return scheduled_at.split('T')[0];
}

export function getTimeFromScheduledAt(scheduled_at: string | null): string {
  if (!scheduled_at) return '';
  const date = new Date(scheduled_at);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

export function createScheduledAt(date: string, time: string): string {
  const timeWithSeconds = time.length === 5 ? `${time}:00` : time;
  return `${date}T${timeWithSeconds}`;
}

export function formatScheduledAtForDisplay(scheduled_at: string | null): string {
  if (!scheduled_at) return '';
  const date = new Date(scheduled_at);
  return date.toLocaleString('fr-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatDistance(date: Date): string {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays}j`;
  if (diffHours > 0) return `${diffHours}h`;
  if (diffMins > 0) return `${diffMins}min`;
  if (diffMins < 0) return `${Math.abs(diffMins)}min ago`;
  return 'now';
}
