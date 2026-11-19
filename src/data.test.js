import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SKILLS, PROJECTS, projectAt } from './data.js';

test('projectAt: #work/<id> opens that project, any other hash none', () => {
  PROJECTS.forEach((p, i) => assert.equal(projectAt('#work/' + p.id), i));
  for (const h of ['', '#', '#work', '#work/', '#work/nope', '#services', 'work/invex', '#work/invex/']) assert.equal(projectAt(h), -1, h);
  assert.equal(new Set(PROJECTS.map((p) => p.id)).size, PROJECTS.length, 'ids are unique');
});

test('each static card in index.html matches data.js', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  for (const p of PROJECTS) {
    for (const s of [`href="#work/${p.id}"`, `<h3>${p.title}</h3>`, `<p>${p.desc}</p>`]) assert.ok(html.includes(s), `${p.id}: ${s}`);
  }
  // the skills card's static kicker is the count main.js renders for "All"
  assert.ok(html.includes(`data-bind="catKicker">${SKILLS.length} tools<`), 'catKicker');
});
