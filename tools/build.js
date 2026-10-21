'use strict';
// Builds index.html (the T32 table) and predictor.html from data/boards.json and the templates in tools/.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const boards = JSON.parse(read('data/boards.json'));
const predictorSrc = read('tools/predictor.src.html');
const indexSrc = read('tools/index.src.html');

const core = predictorSrc.split('/* CORE START */')[1].split('/* CORE END */')[0];
if (!core || core.length < 500) throw new Error('Could not find the scoring code in tools/predictor.src.html');

const data = Object.assign({stamp: crypto.createHash('sha1').update(JSON.stringify(boards)).digest('hex').slice(0, 10)}, boards);
const json = JSON.stringify(data).replace(/</g, '\\u003c').split(String.fromCharCode(0x2028)).join('\\u2028').split(String.fromCharCode(0x2029)).join('\\u2029');
const fill = (src, marker, value) => {
  const parts = src.split(marker);
  if (parts.length !== 2) throw new Error('Template marker missing or repeated: ' + marker);
  return parts[0] + value + parts[1];
};

let index = fill(indexSrc, '/*__CORE__*/', core);
index = fill(index, '/*__T32_BOARDS__*/null', json);

const head = '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n<style>[hidden]{display:none!important}body{margin:0}img{max-width:100%}:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}</style>\n';
const predictor = head + fill(predictorSrc, '/*__T32_BOARDS__*/null', json) + '\n</html>\n';

fs.writeFileSync(path.join(ROOT, 'index.html'), index);
fs.writeFileSync(path.join(ROOT, 'predictor.html'), predictor);

// Sanity check: run the same scoring code on each server and print the headline numbers.
const sandbox = {};
new Function('out', core + '\nout.project = project;')(sandbox);
for (const [label, b] of Object.entries(boards.servers)){
  const c = sandbox.project(b.rows.map(r => ({rank: r[0], name: r[1], points: r[2]})), {remaining: b.remaining, rate: boards.rate, win: boards.win, second: boards.second, third: boards.third, cutoff: ''});
  const bad = c.results.filter(r => (r.status === 'safe' || r.status === 'need') && r.final < c.target);
  if (bad.length) throw new Error(label + ': ' + bad.length + ' records fall short of the cutoff');
  console.log(label + ': ' + b.rows.length + ' guilds, ' + c.N + ' sieges left, 32nd ' + (c.cutRow ? c.cutRow.points : '-') + ', need ' + c.target);
}
console.log('Built index.html and predictor.html');
