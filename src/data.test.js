import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SKILLS, GROUPS, PROJECTS, projectAt } from './data.js';

test('projectAt: #work/<id> opens that project, any other hash none', () => {
  PROJECTS.forEach((p, i) => assert.equal(projectAt('#work/' + p.id), i));
  for (const h of ['', '#', '#work', '#work/', '#work/nope', '#services', 'work/invex', '#work/invex/']) assert.equal(projectAt(h), -1, h);
  assert.equal(new Set(PROJECTS.map((p) => p.id)).size, PROJECTS.length, 'ids are unique');
});

test('the menu closes (main.js) at the breakpoint where its button hides (styles.css)', () => {
  const css = readFileSync(new URL('./styles.css', import.meta.url), 'utf8'), js = readFileSync(new URL('./main.js', import.meta.url), 'utf8');
  const cssPx = css.match(/@media \(max-width:(\d+)px\)\{(?:[^{}]*\{[^{}]*\})*?[^{}]*\.mnb\{display:inline-flex\}/)?.[1];
  const jsPx = js.match(/matchMedia\('\(max-width:(\d+)px\)'\)/)?.[1];
  assert.ok(cssPx, 'styles.css menu breakpoint');
  assert.equal(jsPx, cssPx);
});

test('each static card in index.html matches data.js', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  for (const p of PROJECTS) {
    for (const s of [`href="#work/${p.id}"`, `<h3>${p.title}</h3>`, `<p>${p.desc}</p>`]) assert.ok(html.includes(s), `${p.id}: ${s}`);
  }
  // the skills card's static kicker is the count main.js renders for "All"
  assert.ok(html.includes(`data-bind="catKicker">${SKILLS.length} tools<`), 'catKicker');
  // the skills index lists every tool of a group, in data.js order, in that group's row
  for (const [id, name] of GROUPS) {
    const row = html.match(new RegExp(`<div data-g="${id}"><dt>${name}</dt><dd>(.*?)</dd></div>`));
    assert.ok(row, `index row ${id}`);
    assert.deepEqual(row[1].replace(/ <span class="lab">specialty<\/span>/, '').split(', '), SKILLS.filter((s) => s[1] === id).map((s) => s[0]), id);
  }
});
