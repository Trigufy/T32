'use strict';
// Reads swgt.io's siege leaderboard HTML (ajaxLoadSiege) into plain rows.
const LATIN1 = 'nbsp iexcl cent pound curren yen brvbar sect uml copy ordf laquo not shy reg macr deg plusmn sup2 sup3 acute micro para middot cedil sup1 ordm raquo frac14 frac12 frac34 iquest Agrave Aacute Acirc Atilde Auml Aring AElig Ccedil Egrave Eacute Ecirc Euml Igrave Iacute Icirc Iuml ETH Ntilde Ograve Oacute Ocirc Otilde Ouml times Oslash Ugrave Uacute Ucirc Uuml Yacute THORN szlig agrave aacute acirc atilde auml aring aelig ccedil egrave eacute ecirc euml igrave iacute icirc iuml eth ntilde ograve oacute ocirc otilde ouml divide oslash ugrave uacute ucirc uuml yacute thorn yuml'.split(' ');
const ENT = {amp: 38, lt: 60, gt: 62, quot: 34, apos: 39};
LATIN1.forEach((n, i) => { ENT[n] = 160 + i; });
'Alpha Beta Gamma Delta Epsilon Zeta Eta Theta Iota Kappa Lambda Mu Nu Xi Omicron Pi Rho'.split(' ').forEach((n, i) => { ENT[n] = 913 + i; });
'Sigma Tau Upsilon Phi Chi Psi Omega'.split(' ').forEach((n, i) => { ENT[n] = 931 + i; });
'alpha beta gamma delta epsilon zeta eta theta iota kappa lambda mu nu xi omicron pi rho sigmaf sigma tau upsilon phi chi psi omega'.split(' ').forEach((n, i) => { ENT[n] = 945 + i; });
Object.assign(ENT, {OElig: 338, oelig: 339, Scaron: 352, scaron: 353, Yuml: 376, fnof: 402, circ: 710, tilde: 732,
  ensp: 8194, emsp: 8195, thinsp: 8201, zwnj: 8204, zwj: 8205, lrm: 8206, rlm: 8207, ndash: 8211, mdash: 8212,
  lsquo: 8216, rsquo: 8217, sbquo: 8218, ldquo: 8220, rdquo: 8221, bdquo: 8222, dagger: 8224, Dagger: 8225, bull: 8226,
  hellip: 8230, permil: 8240, prime: 8242, Prime: 8243, lsaquo: 8249, rsaquo: 8250, oline: 8254, euro: 8364, trade: 8482,
  larr: 8592, uarr: 8593, rarr: 8594, darr: 8595, harr: 8596, infin: 8734, loz: 9674, spades: 9824, clubs: 9827, hearts: 9829, diams: 9830,
  thetasym: 977, upsih: 978, piv: 982, image: 8465, weierp: 8472, real: 8476, alefsym: 8501, star: 9734, starf: 9733});

function decode(s, unknown){
  return String(s).replace(/&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]*);/gi, (m, e) => {
    if (e[0] === '#'){ const cp = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10); return Number.isFinite(cp) ? String.fromCodePoint(cp) : m; }
    if (ENT[e] != null) return String.fromCodePoint(ENT[e]);
    if (unknown) unknown.add(m);
    return m;
  });
}
const clean = s => s.replace(/<[^>]*>/g, '').replace(/[‎‏]/g, '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();

function parseSiege(html){
  const unknown = new Set();
  const title = (html.match(/>\s*([^<>]*?)\s*-\s*SIEGE RANKINGS\s*</i) || [])[1] || null;
  const lu = (html.match(/Last Updated:\s*(\d{2})\/(\d{2})\/(\d{4})\s+(\d{1,2}):(\d{2})\s*(AM|PM)\s*UTC/i));
  let lastUpdated = null;
  if (lu){
    let h = +lu[4] % 12; if (/pm/i.test(lu[6])) h += 12;
    lastUpdated = new Date(Date.UTC(+lu[3], +lu[1] - 1, +lu[2], h, +lu[5])).toISOString();
  }
  const start = html.search(/SIEGE RANKINGS/i);
  if (start < 0) throw new Error('No "SIEGE RANKINGS" section found');
  const body = html.slice(start);
  const tb = body.indexOf('<tbody'), te = body.indexOf('</tbody>', tb);
  if (tb < 0 || te < 0) throw new Error('Rankings table not found');
  const rows = [];
  for (const tr of body.slice(tb, te).split(/<tr[\s>]/i).slice(1)){
    const cells = [...tr.matchAll(/<td([^>]*)>([\s\S]*?)<\/td>/gi)].map(m => ({attrs: m[1], html: m[2]}));
    if (!cells.length) continue;
    const rk = (cells[0].html.match(/#\s*(\d+)/) || [])[1];
    const nameCell = cells.find(c => !/class=/.test(c.attrs));
    const ptsCell = cells.find(c => /\d[\d,]*\s*pts/.test(c.html));
    if (!rk || !nameCell || !ptsCell) continue;
    const name = clean(decode(nameCell.html, unknown));
    const points = parseInt(ptsCell.html.match(/(\d[\d,]*)\s*pts/)[1].replace(/,/g, ''), 10);
    const ch = ptsCell.html.match(/\(\s*<span[^>]*>\s*([+\-−]?\d+)\s*<\/span>\s*\)/);
    const id = (tr.match(/guildID=(\d+)/) || [])[1] || null;
    if (!name || !Number.isFinite(points)) continue;
    rows.push({rank: +rk, name, points, change: ch ? parseInt(ch[1].replace('−', '-'), 10) : null, id});
  }
  return {title, lastUpdated, rows, unknownEntities: [...unknown]};
}
module.exports = {parseSiege, decode};
