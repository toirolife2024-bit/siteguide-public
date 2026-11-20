// SiteGuide Studio public delivery check: HTTP only, no GitHub tokens and no writes.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';

const origin = 'https://e2e-staging-mobiaid-app.toirolife2024.workers.dev';
const name = encodeURIComponent(origin).replace(/%/g, '_') + '.json';
const expected = JSON.parse(readFileSync(`guides/${name}`, 'utf8'));
const base = 'https://toirolife2024-bit.github.io/siteguide-public';
const cacheKey = (process.env.GITHUB_SHA || Date.now().toString()).slice(0, 40);
const endpoint = `${base}/guides/${name}?check=${cacheKey}`;

assert.equal(expected.version, 1);
assert.equal(expected.origin, origin);
assert.ok(expected.guides.some(g => g.path === '/core.html' && g.status === 'ready'));

async function verify() {
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {Origin: origin, 'Cache-Control': 'no-cache'},
    signal: AbortSignal.timeout(12000)
  });
  if (!response.ok) throw new Error(`GitHub Pages: HTTP ${response.status}`);
  const cors = response.headers.get('access-control-allow-origin');
  if (cors !== '*' && cors !== origin) {
    throw new Error(`CORS blocked: Access-Control-Allow-Origin=${cors ?? '(missing)'}`);
  }
  const live = await response.json();
  assert.deepEqual(live, expected, 'GitHub Pages JSON is not yet the current source');
  const runtime = await fetch(`${base}/siteguide-runtime.js?check=${cacheKey}`, {
    headers: {Origin: origin}, signal: AbortSignal.timeout(12000)
  });
  if (!runtime.ok) throw new Error(`SiteGuide runtime: HTTP ${runtime.status}`);
  if (!(await runtime.text()).includes('SiteGuide public viewer')) {
    throw new Error('SiteGuide runtime is not the expected viewer');
  }
  console.log('PASS: published TEST JSON matches GitHub source; CORS allows TEST origin; viewer present');
}

for (let attempt = 1; attempt <= 9; attempt++) {
  try {
    await verify();
    process.exit(0);
  } catch (error) {
    console.log(`Attempt ${attempt}/9: ${String(error.message || error)}`);
    if (attempt === 9) process.exit(1);
    await sleep(12000);
  }
}
