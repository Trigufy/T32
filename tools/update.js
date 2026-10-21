'use strict';
// Pulls the current siege leaderboards from swgt.io (with the site owner's permission)
// and writes data/boards.json. Run by .github/workflows/update.yml.
const fs = require('fs');
const path = require('path');
const {parseSiege} = require('./swgt-parse.js');
const {siegesLeft} = require('./sieges.js');

const ROOT = path.join(__dirname, '..');
const SETTINGS = path.join(ROOT, 'data', 'settings.json');
const BOARDS = path.join(ROOT, 'data', 'boards.json');
const UA = 'sw-t32.com leaderboard updater (+https://sw-t32.com)';
const readJSON = (f, d) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { return d; } };
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function get(url){
  const res = await fetch(url, {headers: {'User-Agent': UA, 'Referer': 'https://swgt.io/leaderboards/siege/', 'Accept': 'text/html'}});
  if (!res.ok) throw new Error('HTTP ' + res.status + ' for ' + url);
  return res.text();
}

async function currentSeason(){
  try {
    const html = await get('https://swgt.io/leaderboards/siege/');
    const nums = [...html.matchAll(/Season\s+(\d+)\s*-\s*Final/gi)].map(m => +m[1]);
    return nums.length ? 'Season ' + (Math.max(...nums) + 1) : '';
  } catch (e) { console.warn('Season lookup failed:', e.message); return ''; }
}

function cut32(rows){
  const pts = rows.map(r => r[2]).sort((a, b) => b - a);
  return pts.length >= 32 ? pts[31] : null;
}

async function main(){
  const settings = readJSON(SETTINGS, null);
  if (!settings) throw new Error('data/settings.json is missing or not valid JSON');
  const prev = readJSON(BOARDS, {servers: {}});
  const season = settings.season || await currentSeason() || prev.season || '';
  const sameSeason = !prev.season || prev.season === season;
  const out = {
    season, cutoffDate: settings.cutoffDate || '',
    rate: settings.rate, win: settings.win, second: settings.second, third: settings.third,
    servers: {}
  };
  let ok = 0;
  for (const s of settings.servers){
    const old = prev.servers && prev.servers[s.label];
    let board = null;
    try {
      const html = await get('https://swgt.io/controllers/leaderboards/ajaxLoadSiege?date=0&server=' + encodeURIComponent(s.key) + '&nocache=' + Date.now());
      const p = parseSiege(html);
      const rows = p.rows.filter(r => r.rank <= 100).map(r => [r.rank, r.name, r.points]);
      if (rows.length < 32 || !p.lastUpdated) throw new Error('only ' + rows.length + ' rows / no update time');
      if (p.unknownEntities.length) console.warn(s.label, 'unknown characters:', p.unknownEntities.join(' '));
      board = {key: s.key, lastUpdated: p.lastUpdated, rows};
      ok++;
    } catch (e) {
      console.warn(s.label + ': kept previous data (' + e.message + ')');
      if (old) board = {key: s.key, lastUpdated: old.lastUpdated, rows: old.rows};
    }
    if (!board) continue;
    const override = settings.siegesLeftOverride && settings.siegesLeftOverride[s.label];
    board.remaining = Number.isInteger(override) ? override
      : siegesLeft(board.lastUpdated, settings.cutoffDate, s.timeZone, settings.siegeEndsAt || '23:00');
    // One 32nd-place score per "sieges left" value, so the page can show the real rise per siege.
    const hist = new Map(((sameSeason && old && old.history) || []).map(h => [h.left, h]));
    const c = cut32(board.rows);
    if (c != null) hist.set(board.remaining, {left: board.remaining, cut32: c});
    board.history = [...hist.values()].sort((a, b) => b.left - a.left);
    out.servers[s.label] = board;
    await sleep(2000);
  }
  if (!ok && !Object.keys(out.servers).length) throw new Error('Could not read any leaderboard from swgt.io');
  const next = JSON.stringify(out, null, 1) + '\n';
  const before = fs.existsSync(BOARDS) ? fs.readFileSync(BOARDS, 'utf8') : '';
  if (next !== before){ fs.writeFileSync(BOARDS, next); console.log('boards.json updated'); }
  else console.log('No leaderboard changes');
  for (const [label, b] of Object.entries(out.servers)) console.log(label, b.lastUpdated, 'sieges left', b.remaining, '32nd', cut32(b.rows), 'guilds', b.rows.length);
}

main().catch(e => { console.error(e.message); process.exit(1); });
