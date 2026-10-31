#!/usr/bin/env node
/**
 * Integration tests for the design projects API and printable-card duplication.
 *
 * Creates isolated organisations/users directly in the SQLite database, signs
 * their JWTs with JWT_SECRET, exercises the running server, then deletes every
 * row and file it created.
 *
 * Usage: BASE_URL=http://localhost:3000 node scripts/test-designs-api.js
 */
require('dotenv').config();
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const sqlite3 = require('sqlite3');
const jwt = require('jsonwebtoken');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const DB_FILE = path.join(process.env.DATA_DIR || path.join(__dirname, '..', 'data'), 'cards.db');
const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(__dirname, '..', 'uploads');
const RUN = `t${Date.now().toString(36)}`;

const db = new sqlite3.Database(DB_FILE);
const run = (sql, p = []) => new Promise((res, rej) => db.run(sql, p, function cb(e) { return e ? rej(e) : res(this); }));
const get = (sql, p = []) => new Promise((res, rej) => db.get(sql, p, (e, r) => (e ? rej(e) : res(r))));

let passed = 0;
let failed = 0;
function check(name, condition, detail) {
  if (condition) { passed += 1; console.log(`  \u2713 ${name}`); } else { failed += 1; console.log(`  \u2717 ${name}${detail ? ` -> ${detail}` : ''}`); }
}

class Client {
  constructor(user) {
    this.cookies = {};
    if (user) {
      this.cookies.authToken = jwt.sign({ user_id: user.id, organisation_id: user.orgId, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    }
    this.csrf = null;
  }
  cookieHeader() { return Object.entries(this.cookies).map(([k, v]) => `${k}=${v}`).join('; '); }
  async request(method, url, { json, form, csrf = true } = {}) {
    if (csrf && method !== 'GET' && !this.csrf) {
      const r = await this.request('GET', '/api/csrf-token');
      this.csrf = r.body.csrfToken;
    }
    const headers = { Cookie: this.cookieHeader() };
    if (json !== undefined) headers['Content-Type'] = 'application/json';
    if (csrf && method !== 'GET' && this.csrf) headers['X-CSRF-Token'] = this.csrf;
    const res = await fetch(BASE_URL + url, { method, headers, body: json !== undefined ? JSON.stringify(json) : form });
    (res.headers.getSetCookie ? res.headers.getSetCookie() : []).forEach((c) => {
      const [pair] = c.split(';');
      const idx = pair.indexOf('=');
      this.cookies[pair.slice(0, idx)] = pair.slice(idx + 1);
    });
    const text = await res.text();
    let body = text;
    try { body = JSON.parse(text); } catch (e) { /* not json */ }
    return { status: res.status, body };
  }
}

const created = { orgs: [], users: [] };
async function makeUser(label, role, orgId) {
  const id = crypto.randomUUID();
  await run('INSERT INTO users (id, email, password_hash, organisation_id, role) VALUES (?, ?, ?, ?, ?)', [id, `${RUN}-${label}@example.test`, 'x', orgId, role]);
  created.users.push(id);
  return { id, orgId, role };
}
async function makeOrg(label) {
  const id = crypto.randomUUID();
  await run('INSERT INTO organisations (id, name, slug) VALUES (?, ?, ?)', [id, `${RUN} ${label}`, `${RUN}-${label}`]);
  created.orgs.push(id);
  return id;
}

const PNG_1PX = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

function sampleDoc(extra = {}) {
  return {
    unit: 'mm', width: 210, height: 297, bleed: 3, safe: 4, formatId: 'a4',
    pages: [{
      name: 'Recto',
      background: { color: '#ffeedd' },
      elements: [
        { id: 'title1', type: 'text', text: 'Bonjour <script>alert(1)</script>', x: 20, y: 20, w: 150, h: 20, size: 18, font: 'serif' },
        { id: 'img1', type: 'image', src: '/uploads/../../etc/passwd.png', x: 0, y: 0, w: 10, h: 10 },
        { id: 'shape1', type: 'rect', fill: 'javascript:alert(1)', x: 5, y: 5, w: 30, h: 30 },
        { type: 'evil', onload: 'x' }
      ]
    }],
    ...extra
  };
}

(async () => {
  console.log(`Design API tests against ${BASE_URL} (run ${RUN})`);
  const orgA = await makeOrg('a');
  const orgB = await makeOrg('b');
  const ownerA = await makeUser('owner-a', 'owner', orgA);
  const memberA = await makeUser('member-a', 'member', orgA);
  const memberA2 = await makeUser('member-a2', 'member', orgA);
  const ownerB = await makeUser('owner-b', 'owner', orgB);
  const cOwnerA = new Client(ownerA);
  const cMemberA = new Client(memberA);
  const cMemberA2 = new Client(memberA2);
  const cOwnerB = new Client(ownerB);
  const anon = new Client(null);

  try {
    console.log('\nAuthentication & CSRF');
    check('anonymous list is rejected (401)', (await anon.request('GET', '/api/designs')).status === 401);
    const noCsrf = await cMemberA.request('POST', '/api/flyers', { json: { data: sampleDoc() }, csrf: false });
    check('create without CSRF token is rejected (403)', noCsrf.status === 403, noCsrf.status);

    console.log('\nCRUD on every module alias');
    const aliases = { pocket: '/api/pockets', logo: '/api/logos', flyer: '/api/flyers', poster: '/api/posters', social_design: '/api/social-designs', other: '/api/other-designs' };
    const ids = {};
    for (const [type, url] of Object.entries(aliases)) {
      const res = await cMemberA.request('POST', url, { json: { title: `${RUN} ${type}`, subtype: type === 'other' ? 'menu' : undefined, data: sampleDoc() } });
      check(`${url} create (201, type=${type})`, res.status === 201 && res.body.type === type, `${res.status} ${JSON.stringify(res.body).slice(0, 160)}`);
      ids[type] = res.body.id;
      const read = await cMemberA.request('GET', `${url}/${res.body.id}`);
      check(`${url} read back`, read.status === 200 && read.body.title === `${RUN} ${type}`);
    }
    check('other-designs keeps subtype', (await cMemberA.request('GET', `/api/other-designs/${ids.other}`)).body.subtype === 'menu');

    console.log('\nServer-side validation');
    const flyer = (await cMemberA.request('GET', `/api/flyers/${ids.flyer}`)).body;
    const els = flyer.data.pages[0].elements;
    check('unknown element types are dropped', els.length === 3 && !els.some((e) => e.type === 'evil'));
    check('image path traversal is stripped', els.find((e) => e.id === 'img1').src === '');
    check('invalid colours fall back to safe values', els.find((e) => e.id === 'shape1').fill === '#4f46e5');
    check('text is stored as plain data', els.find((e) => e.id === 'title1').text.includes('<script>'));
    check('invalid type rejected', (await cMemberA.request('POST', '/api/designs', { json: { type: 'malware', data: sampleDoc() } })).status === 400);
    const huge = sampleDoc({ pages: [{ elements: Array.from({ length: 400 }, (_, i) => ({ type: 'text', text: 'x'.repeat(5000), id: `t${i}` })) }] });
    check('oversized project rejected (413)', (await cMemberA.request('POST', '/api/posters', { json: { data: huge } })).status === 413);
    check('bad thumbnail rejected (400)', (await cMemberA.request('PUT', `/api/flyers/${ids.flyer}`, { json: { thumbnail: 'data:text/html;base64,PHNjcmlwdD4=' } })).status === 400);

    console.log('\nUpdate, thumbnail, reload');
    const updated = await cMemberA.request('PUT', `/api/flyers/${ids.flyer}`, {
      json: { title: `${RUN} flyer v2`, data: { ...flyer.data, pages: [...flyer.data.pages, { name: 'Verso', elements: [] }] }, thumbnail: `data:image/png;base64,${PNG_1PX}` }
    });
    check('update returns 200', updated.status === 200, updated.status);
    check('thumbnail stored as webp upload', /^\/uploads\/design-thumb-.*\.webp$/.test(updated.body.thumbnail || ''), updated.body.thumbnail);
    check('thumbnail file exists', updated.body.thumbnail && fs.existsSync(path.join(UPLOADS_DIR, path.basename(updated.body.thumbnail))));
    const reread = await cMemberA.request('GET', `/api/flyers/${ids.flyer}`);
    check('changes persist after reload', reread.body.title === `${RUN} flyer v2` && reread.body.data.pages.length === 2);
    const list = await cMemberA.request('GET', '/api/flyers');
    check('list contains project', Array.isArray(list.body) && list.body.some((p) => p.id === ids.flyer));
    check('list does not leak document data', list.body.every((p) => p.data === undefined));
    const search = await cMemberA.request('GET', `/api/designs?type=flyer&q=${encodeURIComponent('flyer v2')}`);
    check('search by title', search.body.length >= 1 && search.body.every((p) => p.type === 'flyer'));

    console.log('\nDuplication');
    const dup = await cMemberA.request('POST', `/api/flyers/${ids.flyer}/duplicate`);
    check('duplicate returns new id', dup.status === 201 && dup.body.id !== ids.flyer, dup.status);
    check('duplicate copies pages', dup.body.data && dup.body.data.pages.length === 2);
    check('duplicate gets its own thumbnail file', dup.body.thumbnail && dup.body.thumbnail !== updated.body.thumbnail);

    console.log('\nAuthorisation & isolation');
    check('other organisation owner cannot read (403)', (await cOwnerB.request('GET', `/api/flyers/${ids.flyer}`)).status === 403);
    check('other organisation owner cannot update (403)', (await cOwnerB.request('PUT', `/api/flyers/${ids.flyer}`, { json: { title: 'pwned' } })).status === 403);
    check('other organisation owner cannot delete (403)', (await cOwnerB.request('DELETE', `/api/flyers/${ids.flyer}`)).status === 403);
    check('other organisation owner cannot duplicate (403)', (await cOwnerB.request('POST', `/api/flyers/${ids.flyer}/duplicate`)).status === 403);
    check('other organisation list excludes project', !(await cOwnerB.request('GET', '/api/designs')).body.some((p) => p.id === ids.flyer));
    check('another member of same org cannot read (403)', (await cMemberA2.request('GET', `/api/flyers/${ids.flyer}`)).status === 403);
    check('organisation owner can read member project', (await cOwnerA.request('GET', `/api/flyers/${ids.flyer}`)).status === 200);
    check('alias enforces type (logo via /api/flyers -> 404)', (await cMemberA.request('GET', `/api/flyers/${ids.logo}`)).status === 404);
    const summary = await cMemberA.request('GET', '/api/designs/summary');
    check('summary counts per type', summary.status === 200 && summary.body.counts.flyer === 2 && summary.body.counts.logo === 1, JSON.stringify(summary.body.counts));

    console.log('\nUploads');
    const fd = new FormData();
    fd.append('file', new Blob([Buffer.from(PNG_1PX, 'base64')], { type: 'image/png' }), 'pixel.png');
    const up = await cMemberA.request('POST', '/api/designs/uploads', { form: fd });
    check('valid PNG upload accepted', up.status === 201 && /^\/uploads\/[a-f0-9-]+\.png$/.test(up.body.url), `${up.status} ${JSON.stringify(up.body)}`);
    if (up.body.url) created.upload = up.body.url;
    const bad = new FormData();
    bad.append('file', new Blob(['<html><script>alert(1)</script></html>'], { type: 'image/png' }), 'fake.png');
    check('disguised HTML upload rejected', (await cMemberA.request('POST', '/api/designs/uploads', { form: bad })).status === 400);
    const exe = new FormData();
    exe.append('file', new Blob(['MZ'], { type: 'application/octet-stream' }), 'tool.exe');
    check('non-image extension rejected', (await cMemberA.request('POST', '/api/designs/uploads', { form: exe })).status >= 400);
    if (up.body.url) {
      const withImg = await cMemberA.request('PUT', `/api/logos/${ids.logo}`, { json: { data: { unit: 'px', width: 1000, height: 1000, pages: [{ elements: [{ id: 'logoimg', type: 'image', src: up.body.url, x: 0, y: 0, w: 100, h: 100 }] }] } } });
      check('uploaded image can be referenced in a design', withImg.body.data && withImg.body.data.pages[0].elements[0].src === up.body.url);
    }

    console.log('\nDeletion');
    const delThumb = updated.body.thumbnail;
    check('delete returns 200', (await cMemberA.request('DELETE', `/api/flyers/${ids.flyer}`)).status === 200);
    check('deleted project is gone (404)', (await cMemberA.request('GET', `/api/flyers/${ids.flyer}`)).status === 404);
    check('thumbnail file removed with project', !fs.existsSync(path.join(UPLOADS_DIR, path.basename(delThumb))));

    console.log('\nPrintable cards (existing editor)');
    const pc = await cMemberA.request('POST', '/api/printable-cards', { json: { name: `${RUN} printable`, config: {} } });
    check('printable card create still works', pc.status === 201, pc.status);
    const pcDup = await cMemberA.request('POST', `/api/printable-cards/${pc.body.id}/duplicate`);
    check('printable card duplicate', pcDup.status === 201 && pcDup.body.id !== pc.body.id && /\(copie\)$/.test(pcDup.body.name), JSON.stringify(pcDup.body).slice(0, 120));
    const pcRow = await get('SELECT payment_status FROM printable_cards WHERE id = ?', [pcDup.body.id]);
    check('printable duplicate is unpaid', pcRow && pcRow.payment_status === 'unpaid');
    check('printable duplicate forbidden for other org', (await cOwnerB.request('POST', `/api/printable-cards/${pc.body.id}/duplicate`)).status === 403);
    check('printable list includes duplicate', (await cMemberA.request('GET', '/api/printable-cards')).body.some((r) => r.id === pcDup.body.id));
  } catch (err) {
    failed += 1;
    console.error('Unexpected error:', err);
  } finally {
    const thumbs = await new Promise((res) => db.all(`SELECT thumbnail FROM design_projects WHERE user_id IN (${created.users.map(() => '?').join(',')})`, created.users, (e, rows) => res(rows || [])));
    thumbs.forEach((r) => { if (r.thumbnail) { try { fs.unlinkSync(path.join(UPLOADS_DIR, path.basename(r.thumbnail))); } catch (e) { /* ignore */ } } });
    if (created.upload) { try { fs.unlinkSync(path.join(UPLOADS_DIR, path.basename(created.upload))); } catch (e) { /* ignore */ } }
    const marks = created.users.map(() => '?').join(',');
    await run(`DELETE FROM design_projects WHERE user_id IN (${marks})`, created.users);
    await run(`DELETE FROM printable_cards WHERE user_id IN (${marks})`, created.users);
    await run(`DELETE FROM users WHERE id IN (${marks})`, created.users);
    await run(`DELETE FROM organisations WHERE id IN (${created.orgs.map(() => '?').join(',')})`, created.orgs);
    const left = await get(`SELECT COUNT(*) AS n FROM users WHERE email LIKE ?`, [`${RUN}-%`]);
    console.log(`\nCleanup: ${left.n === 0 ? 'ok' : `${left.n} users left!`}`);
    db.close();
    console.log(`\n${passed} passed, ${failed} failed`);
    process.exit(failed ? 1 : 0);
  }
})();
