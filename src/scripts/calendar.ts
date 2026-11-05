import { belgradeToday, monthCells, monthLabel, formatDate, shiftMonth } from '../utils/calendar';
import { cmsConfigured, fetchEntries } from '../lib/cms.mjs';
import { renderEntry, entryId } from '../lib/render-content.mjs';
import { calendarEvents } from '../utils/events.mjs';
import { examYear, filterExams, type Exam } from '../utils/exams';

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
  const examToggle = document.querySelector<HTMLButtonElement>('#exam-toggle')!;
  const examControls = document.querySelector<HTMLFormElement>('#exam-controls')!;
  const examYearSelect = document.querySelector<HTMLSelectElement>('#exam-year')!;
  const examTrackSelect = document.querySelector<HTMLSelectElement>('#exam-track')!;
  const examList = document.querySelector<HTMLElement>('#exam-list')!;
  const examListHeading = document.querySelector<HTMLElement>('#exam-list-heading')!;
  const examListBody = document.querySelector<HTMLElement>('#calendar-exam-list')!;
  const noExams = document.querySelector<HTMLElement>('#no-exams')!;
  let exams: Exam[] = [];
  let selectedExams: Exam[] = [];
  let examsLoaded = false;
  let examLoad: Promise<void> | undefined;
  const render = () => {
    const visibleEntries = calendarEvents(entries, today);
    const activeExams = selectedExams.filter((exam) => exam.date >= today);
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
      const dayEvents = visibleEntries.filter((event: any) => event.date === cell.date);
      const dayExams = activeExams.filter((exam) => exam.date === cell.date);
      const dayItems = [...dayExams.map((entry) => ({ entry, kind: 'exam' as const })), ...dayEvents.map((entry: any) => ({ entry, kind: 'event' as const }))];
      if (dayItems.length) {
        const link = document.createElement('a');
        link.className = 'event-marker';
        if (dayExams.length > 0) link.classList.add('exam-marker');
        const firstItem = dayItems[0];
        const targetId = entryId(firstItem.entry, firstItem.kind);
        link.href = '#' + encodeURIComponent(targetId);
        link.textContent = String(dayItems.length);
        link.setAttribute('aria-label', formatDate(cell.date) + ': ' + dayItems.map(({ entry }) => entry.title).join(', '));
        link.addEventListener('click', (event) => {
          event.preventDefault();
          if (!document.getElementById(targetId)) {
            if (firstItem.kind === 'exam') examListBody.append(createExamEntry(firstItem.entry));
            else list.insertAdjacentHTML('beforeend', renderEntry(firstItem.entry, 'event'));
          }
          if (firstItem.kind === 'event') empty.hidden = true;
          location.hash = encodeURIComponent(targetId);
          document.getElementById(targetId)?.scrollIntoView();
        });
        td.append(link);
      }
      row!.append(td);
    });
    body.replaceChildren(fragment);
    const prefix = year + '-' + String(month + 1).padStart(2, '0');
    const current = visibleEntries.filter((event: any) => event.date.startsWith(prefix)).sort((a: any, b: any) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')));
    list.innerHTML = current.map((event: any) => renderEntry(event, 'event')).join('');
    empty.hidden = current.length > 0;
    const currentExams = activeExams.filter((exam) => exam.date.startsWith(prefix)).sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')));
    examListBody.replaceChildren(...currentExams.map(createExamEntry));
    examList.hidden = !examsVisible;
    noExams.textContent = selectedExams.length
      ? 'Nema ispita za ovaj mesec. Izaberite drugi mesec u kalendaru.'
      : 'Nema ispita za izabranu godinu i smer.';
    noExams.hidden = currentExams.length > 0;
  };
  let examsVisible = false;
  const createExamEntry = (exam: Exam): HTMLElement => {
    const article = document.createElement('article');
    article.id = entryId(exam, 'exam');
    article.className = 'content-post';
    const date = document.createElement('time');
    date.dateTime = exam.date;
    date.textContent = formatDate(exam.date) + (exam.time ? ' u ' + exam.time : '');
    const title = document.createElement('h2');
    title.textContent = exam.title;
    const details = document.createElement('p');
    details.textContent = `Smer: ${exam.track} · Godina: ${examYear(exam.semester)}. · Semestar: ${exam.semester}. · Ispitni rok: ${exam.period}`;
    article.append(date, title, details);
    return article;
  };
  const loadExams = async () => {
    if (examsLoaded) return;
    if (examLoad) return examLoad;
    examLoad = (async () => {
      status.textContent = 'Učitavanje spiska ispita…';
      try {
        const response = await fetch('/data/svi_ispiti.xml');
        if (!response.ok) throw new Error(`Učitavanje ispita nije uspelo (${response.status}).`);
        const xml = new DOMParser().parseFromString(await response.text(), 'application/xml');
        if (xml.querySelector('parsererror') || xml.documentElement.tagName !== 'ispiti') throw new Error('Spisak ispita nije ispravan XML dokument.');
        exams = Array.from(xml.querySelectorAll('ispiti > ispit'), (node, index) => {
          const value = (name: string) => node.querySelector(name)?.textContent?.trim() || '';
          const title = value('ispit');
          const dateTime = value('datum');
          const track = value('smer');
          const semester = Number(value('semester'));
          const basicValue = value('osnovne').toLowerCase();
          const match = /^(\d{4}-\d{2}-\d{2})(?:T(\d{2}:\d{2})(?::\d{2}(?:\.\d+)?)?)?$/.exec(dateTime);
          const parsedDate = match ? new Date(`${match[1]}T00:00:00Z`) : undefined;
          if (!title || !track || !Number.isInteger(semester) || semester < 1 || semester > 8 || !match
            || Number.isNaN(parsedDate?.getTime()) || parsedDate?.toISOString().slice(0, 10) !== match[1]
            || !['true', 'false'].includes(basicValue)) {
            throw new Error(`Podatak o ispitu na poziciji ${index + 1} nije potpun ili ispravan.`);
          }
          return {
            id: `xml-${index}`,
            title,
            date: match[1],
            time: match[2] && match[2] !== '00:00' ? match[2] : undefined,
            track,
            semester,
            period: value('ispitniRok'),
            basic: basicValue === 'true',
          };
        });
        const tracks = [...new Set(exams.filter((exam) => exam.basic).map((exam) => exam.track))].sort((a, b) => a.localeCompare(b, 'sr-Latn'));
        examTrackSelect.replaceChildren(new Option('Izaberite smer', ''), ...tracks.map((track) => new Option(track, track)));
        examsLoaded = true;
        status.textContent = '';
      } catch (error) {
        console.error('Greška pri učitavanju ispita:', error);
        status.textContent = error instanceof Error ? error.message : 'Učitavanje ispita nije uspelo.';
        throw error;
      } finally {
        examLoad = undefined;
      }
    })();
    return examLoad;
  };
  examToggle.addEventListener('click', () => {
    const opening = examControls.hidden;
    examControls.hidden = !opening;
    examToggle.setAttribute('aria-expanded', String(opening));
    examToggle.textContent = opening ? 'Sakrij izbor ispita' : 'Prikaži ispite';
    if (opening) void loadExams().catch(() => {});
  });
  examControls.addEventListener('submit', (event) => {
    event.preventDefault();
    const year = Number(examYearSelect.value);
    const track = examTrackSelect.value;
    if (!examsLoaded || !track) return;
    selectedExams = filterExams(exams, year, track).filter((exam) => exam.date >= today);
    examsVisible = true;
    examListHeading.textContent = `Ispiti — ${year}. godina, smer ${track}`;
    render();
  });
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
