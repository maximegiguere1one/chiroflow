export function addMinutes(time: string, minutes: number): string {
  const [hours, mins] = time.split(':').map(Number);
  const totalMins = hours * 60 + mins + minutes;
  const newHours = Math.floor(totalMins / 60) % 24;
  const newMins = totalMins % 60;
  return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
}

export function getCurrentTimeString(): string {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
}

export function getTimeUntil(time: string): string {
  const now = new Date();
  const [hours, minutes] = time.split(':').map(Number);
  const aptTime = new Date(now);
  aptTime.setHours(hours, minutes, 0);
  const diff = aptTime.getTime() - now.getTime();
  const mins = Math.floor(diff / 60000);

  if (mins < 0) return `En retard de ${Math.abs(mins)}min`;
  if (mins < 60) return `Dans ${mins}min`;
  return `Dans ${Math.floor(mins / 60)}h${mins % 60}`;
}

export function isTimeInRange(time: string, startTime: string, endTime: string): boolean {
  return time >= startTime && time < endTime;
}

export function getStartOfDay(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
}

export function getEndOfDay(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
}

export function formatTimeRange(startTime: string, duration: number): string {
  const endTime = addMinutes(startTime, duration);
  return `${startTime} - ${endTime}`;
}
