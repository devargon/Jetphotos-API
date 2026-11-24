#!/usr/bin/env node
/**
 * Smoke test against a running API (npm start).
 * Usage:
 *   npm start
 *   npm run test:api
 */
const base = (process.env.API_BASE || 'http://127.0.0.1:8787').replace(/\/$/, '');

async function main() {
  console.log('API base:', base);

  const healthRes = await fetch(`${base}/health`);
  const health = await healthRes.json();
  console.log('health:', health);
  if (!healthRes.ok || !health.ok) {
    throw new Error('Health check failed. Is the API running? (npm start)');
  }

  const qs =
    'page=1&sort-order=0&keywords=Boeing%20747&keywords-type=aircraft&keywords-contain=3';
  const searchRes = await fetch(`${base}/?${qs}`);
  const data = await searchRes.json();

  if (!searchRes.ok) {
    console.error('Search failed:', data);
    process.exit(2);
  }

  console.log('count:', data.count);
  console.log('mode:', data.meta?.mode);
  console.log('first:', data.photos?.[0]?.registration, data.photos?.[0]?.photoId);

  if (!data.count || !data.photos?.length) {
    console.error('FAIL: no photos returned');
    process.exit(3);
  }

  const potdRes = await fetch(`${base}/potd`);
  const potd = await potdRes.json();
  if (!potdRes.ok || !potd.photo?.photoId || potd.date !== new Date().toISOString().slice(0, 10)) {
    throw new Error(`Photo of the day failed: ${JSON.stringify(potd)}`);
  }
  const repeatRes = await fetch(`${base}/potd`);
  const repeat = await repeatRes.json();
  if (repeat.photo?.photoId !== potd.photo.photoId || repeatRes.headers.get('X-Cache') !== 'HIT') {
    throw new Error('Photo of the day did not remain cached');
  }
  const headRes = await fetch(`${base}/potd`, { method: 'HEAD' });
  if (!headRes.ok || (await headRes.text()) !== '') {
    throw new Error('Photo of the day HEAD response failed');
  }
  console.log('potd:', potd.date, potd.aircraft, potd.photo.photoId);

  console.log('PASS: free API returned photo results');
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
