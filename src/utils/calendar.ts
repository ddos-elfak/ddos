export interface MonthCell { date: string; day: number; inMonth: boolean; }

export function belgradeToday(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Belgrade', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const part = (type: string) => parts.find((item) => item.type === type)!.value;
  return part('year') + '-' + part('month') + '-' + part('day');
}
export function monthCells(year: number, month: number): MonthCell[] {
  const start = new Date(Date.UTC(year, month, 1));
  const offset = (start.getUTCDay() + 6) % 7;
  const count = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const total = Math.ceil((offset + count) / 7) * 7;
  return Array.from({ length: total }, (_, index) => {
    const day = new Date(Date.UTC(year, month, index - offset + 1));
    return { date: day.toISOString().slice(0, 10), day: day.getUTCDate(), inMonth: day.getUTCMonth() === month };
  });
}
export function monthLabel(year: number, month: number): string {
  return new Intl.DateTimeFormat('sr-Latn-RS', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(year, month, 1)));
}
export function formatDate(date: string): string {
  return new Intl.DateTimeFormat('sr-Latn-RS', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(date + 'T12:00:00Z'));
}
export function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const next = new Date(Date.UTC(year, month + delta, 1));
  return { year: next.getUTCFullYear(), month: next.getUTCMonth() };
}
