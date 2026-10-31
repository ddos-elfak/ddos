import { belgradeToday, monthCells, monthLabel, formatDate, shiftMonth } from '../utils/calendar';
import { cmsConfigured, fetchEntries } from '../lib/cms.mjs';
import { renderEntry, entryId } from '../lib/render-content.mjs';
import { calendarEvents } from '../utils/events.mjs';

const calendar = document.querySelector<HTMLElement>('.calendar');
const body = document.querySelector<HTMLElement>('#calendar-days');
const label = document.querySelector<HTMLElement>('#calendar-month');
if (calendar && body && label) {
  let entries = JSON.parse(calendar.dataset.events || '[]');
  let today = belgradeToday();
  let year = Number(today.slice(0, 4));
  let month = Number(today.slice(5, 7)) - 1;
  let request = 0;
  const list = document.querySelector<HTMLElement>('#calendar-event-list')!;
  const empty = document.querySelector<HTMLElement>('#no-events')!;
  const status = document.querySelector<HTMLElement>('#calendar-status')!;
  const render = () => {
    entries = calendarEvents(entries, today);
    label.textContent = monthLabel(year, month);
    const fragment = document.createDocumentFragment();
    let row: HTMLTableRowElement;
    monthCells(year, month).forEach((cell, index) => {
      if (index % 7 === 0) { row = document.createElement('tr'); fragment.append(row); }
      const td = document.createElement('td');
      td.classList.toggle('outside-month', !cell.inMonth);
      td.classList.toggle('today', cell.date === today);
      const time = document.createElement('time');
      time.dateTime = cell.date; time.textContent = String(cell.day);
      if (cell.date === today) time.setAttribute('aria-current', 'date');
      td.append(time);
      const dayEvents = entries.filter((event: any) => event.date === cell.date);
      if (dayEvents.length) {
        const link = document.createElement('a');
        link.className = 'event-marker'; link.href = '#' + encodeURIComponent(entryId(dayEvents[0], 'event'));
        link.textContent = String(dayEvents.length);
        link.setAttribute('aria-label', formatDate(cell.date) + ': ' + dayEvents.map((event: any) => event.title).join(', '));
        link.addEventListener('click', (event) => {
          event.preventDefault();
          // Susedni datumi već su učitani: prikaži opis bez dodatnog zahteva.
          const targetId = entryId(dayEvents[0], 'event');
          if (!document.getElementById(targetId)) list.insertAdjacentHTML('beforeend', renderEntry(dayEvents[0], 'event'));
          empty.hidden = true;
          location.hash = encodeURIComponent(targetId);
          document.getElementById(targetId)?.scrollIntoView();
        });
        td.append(link);
      }
      row!.append(td);
    });
    body.replaceChildren(fragment);
    const prefix = year + '-' + String(month + 1).padStart(2, '0');
    const current = entries.filter((event: any) => event.date.startsWith(prefix)).sort((a: any, b: any) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')));
    list.innerHTML = current.map((event: any) => renderEntry(event, 'event')).join('');
    empty.hidden = current.length > 0;
  };
  const refresh = async () => {
    const version = ++request;
    render();
    if (!cmsConfigured) return;
    status.textContent = 'Učitavanje događaja…'; empty.hidden = true;
    const cells = monthCells(year, month);
    const from = cells[0].date < today ? today : cells[0].date;
    if (from > cells.at(-1)!.date) { entries = []; render(); status.textContent = ''; return; }
    try {
      const all: any[] = []; let offset = 0; let hasMore = true;
      while (hasMore) {
        const result = await fetchEntries('event', { offset, limit: 100, from, to: cells.at(-1)!.date });
        if (version !== request) return;
        all.push(...result.items); offset += result.items.length; hasMore = result.hasMore;
      }
      entries = all; render(); status.textContent = '';
    } catch {
      if (version !== request) return;
      render(); status.textContent = '';
    }
  };
  calendar.querySelectorAll<HTMLButtonElement>('[data-direction]').forEach((button) => button.addEventListener('click', () => {
    ({ year, month } = shiftMonth(year, month, Number(button.dataset.direction))); entries = cmsConfigured ? [] : entries; void refresh();
  }));
  calendar.querySelector('[data-today]')?.addEventListener('click', () => {
    today = belgradeToday(); year = Number(today.slice(0, 4)); month = Number(today.slice(5, 7)) - 1; void refresh();
  });
  const updateDate = () => {
    const date = belgradeToday();
    if (date === today) return;
    const wasCurrent = year === Number(today.slice(0, 4)) && month === Number(today.slice(5, 7)) - 1;
    today = date;
    if (wasCurrent) { year = Number(date.slice(0, 4)); month = Number(date.slice(5, 7)) - 1; }
    void refresh();
  };
  // Osvežavanje uklanja povučene aktivnosti i dok je kalendar otvoren.
  setInterval(() => { if (belgradeToday() !== today) updateDate(); else if (!document.hidden) void refresh(); }, 60_000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) updateDate(); });
  void refresh();
  calendar.querySelector<HTMLElement>('.calendar-controls')!.hidden = false;
}
