import test from 'node:test';
import assert from 'node:assert/strict';
import { monthCells, shiftMonth, belgradeToday, formatDate } from '../src/utils/calendar.ts';

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
