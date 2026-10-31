// Aktivnosti su jedini izvor kalendara. Stare aktivnosti ostaju u arhivi aktivnosti.
export function calendarEvents(entries, today) {
  return entries.filter((entry) => entry && typeof entry.date === 'string' && entry.date >= today && (!entry._type || entry._type === 'event'));
}
