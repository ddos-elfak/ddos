import test from 'node:test';
import assert from 'node:assert/strict';
import { monthCells, shiftMonth, belgradeToday, formatDate } from '../src/utils/calendar.ts';
import { examYear, filterExams } from '../src/utils/exams.ts';

test('calendar starts on Monday and includes every day once', () => {
  for (let year = 2024; year <= 2028; year++) {
    for (let month = 0; month < 12; month++) {
      const cells = monthCells(year, month);
      assert.equal(cells.length % 7, 0);
      assert.equal(new Date(cells[0].date + 'T12:00:00Z').getUTCDay(), 1);
      assert.equal(new Set(cells.map((cell) => cell.date)).size, cells.length);
      assert.equal(cells.filter((cell) => cell.inMonth).length, new Date(Date.UTC(year, month + 1, 0)).getUTCDate());
    }
  }
});
test('leap years and year boundaries', () => {
  assert.equal(monthCells(2024, 1).filter((cell) => cell.inMonth).length, 29);
  assert.equal(monthCells(2025, 1).filter((cell) => cell.inMonth).length, 28);
  assert.deepEqual(shiftMonth(2026, 0, -1), { year: 2025, month: 11 });
  assert.deepEqual(shiftMonth(2026, 11, 1), { year: 2027, month: 0 });
});
test('today uses Serbian time during winter and summer', () => {
  assert.equal(belgradeToday(new Date('2026-01-01T23:30:00Z')), '2026-01-02');
  assert.equal(belgradeToday(new Date('2026-07-01T22:30:00Z')), '2026-07-02');
  assert.equal(belgradeToday(new Date('2026-10-31T12:00:00Z')), '2026-10-31');
  assert.match(formatDate('2026-10-31'), /31.*oktobar.*2026/);
});
test('semester numbers map to the requested study years', () => {
  assert.deepEqual([1, 2, 3, 4, 5, 6, 7, 8].map(examYear), [1, 1, 2, 2, 3, 3, 4, 4]);
});
test('exam filters match study year and track and exclude non-basic studies', () => {
  const exams = [1, 2, 3, 4, 5, 6, 7, 8].map((semester) => ({
    id: String(semester), title: `Ispit ${semester}`, date: '2027-01-01', track: 'SVI', semester, period: 'April', basic: true,
  }));
  exams.push({ ...exams[0], id: 'master', basic: false }, { ...exams[0], id: 'other-track', track: 'EEN' });
  assert.deepEqual(filterExams(exams, 1, 'SVI').map((exam) => exam.id), ['1', '2']);
  assert.deepEqual(filterExams(exams, 4, 'SVI').map((exam) => exam.id), ['7', '8']);
  assert.deepEqual(filterExams(exams, 1, 'EEN').map((exam) => exam.id), ['other-track']);
});
