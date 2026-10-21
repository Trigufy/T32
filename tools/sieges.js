'use strict';
// Counts siege rounds still to come before the season cutoff.
// Two rounds a week: Monday-Tuesday and Thursday-Friday, each ending at siegeEndsAt (server local time).
// A round counts when it starts on or before cutoffDate and its results came after the data's update time.

function offsetMinutes(ms, tz){
  const f = new Intl.DateTimeFormat('en-US', {timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit'});
  const p = Object.fromEntries(f.formatToParts(new Date(ms)).map(x => [x.type, x.value]));
  return (Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second) - ms) / 60000;
}
function localToUtc(y, m, d, h, mi, tz){
  const guess = Date.UTC(y, m - 1, d, h, mi);
  let t = guess - offsetMinutes(guess, tz) * 60000;
  const o2 = offsetMinutes(t, tz);
  return guess - o2 * 60000;
}
function localDate(ms, tz){
  const f = new Intl.DateTimeFormat('en-CA', {timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit'});
  return f.format(new Date(ms)); // YYYY-MM-DD
}

function siegesLeft(lastUpdatedISO, cutoffDate, tz, endsAt){
  const updated = Date.parse(lastUpdatedISO);
  const m = String(cutoffDate || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!Number.isFinite(updated) || !m) return 0;
  const [eh, em] = String(endsAt || '23:00').split(':').map(Number);
  const cutoffUTC = Date.UTC(+m[1], +m[2] - 1, +m[3]);
  const startDay = localDate(updated - 4 * 86400000, tz).split('-').map(Number);
  let count = 0;
  for (let day = Date.UTC(startDay[0], startDay[1] - 1, startDay[2]); day <= cutoffUTC; day += 86400000){
    const dow = new Date(day).getUTCDay();
    if (dow !== 1 && dow !== 4) continue; // rounds start Monday and Thursday
    const end = new Date(day + 86400000); // and end the next day
    const endMs = localToUtc(end.getUTCFullYear(), end.getUTCMonth() + 1, end.getUTCDate(), eh, em, tz);
    if (endMs > updated) count++;
  }
  return count;
}
module.exports = {siegesLeft};
