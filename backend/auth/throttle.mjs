import { performance } from 'node:perf_hooks';

// Process-local protection. Uses the transport peer, never untrusted forwarded headers.
export function createAuthThrottle({ now = () => performance.now(), windowMs = 60000,
  limits = { login: 12, restore: 120, profile: 20, logout: 12 }, globalLimit = 240,
  maxPeers = 1024, maxConcurrent = 8 } = {}) {
  for (const value of [windowMs, globalLimit, maxPeers, maxConcurrent, ...Object.values(limits)]) {
    if (!Number.isSafeInteger(value) || value < 1) throw new TypeError('Throttle limits must be positive integers.');
  }
  if (['login','restore','profile','logout'].some(key => !limits[key])) throw new TypeError('All auth lanes are required.');
  const peers = new Map(); let active = 0;
  const global = { tokens: globalLimit, updated: now() };
  function refill(bucket, capacity, time) {
    bucket.tokens = Math.min(capacity, bucket.tokens + Math.max(0, time - bucket.updated) * capacity / windowMs);
    bucket.updated = Math.max(time, bucket.updated);
  }
  const denied = seconds => ({ allowed: false, retryAfter: Math.max(1, Math.ceil(seconds)) });
  return Object.freeze({
    enter(peer, lane) {
      if (!Object.hasOwn(limits,lane)) throw new TypeError('Unknown auth lane.');
      const time = now();
      if (active >= maxConcurrent) return denied(1);
      refill(global,globalLimit,time);
      let entry = peers.get(peer);
      if (!entry && peers.size >= maxPeers) {
        for (const [key, value] of peers) if (time - value.lastUsed >= windowMs) peers.delete(key);
        if (peers.size >= maxPeers) return denied(windowMs / 1000);
      }
      if (!entry) { entry = { lastUsed: time, lanes: new Map() }; peers.set(peer,entry); }
      let bucket = entry.lanes.get(lane);
      if (!bucket) { bucket = { tokens: limits[lane], updated: time }; entry.lanes.set(lane,bucket); }
      refill(bucket,limits[lane],time);
      const wait = Math.max((1-bucket.tokens)*windowMs/limits[lane],(1-global.tokens)*windowMs/globalLimit);
      if (wait > 0) return denied(wait/1000);
      bucket.tokens--;global.tokens--;active++;entry.lastUsed=time;
      let released=false;
      return { allowed: true, release() { if (!released) { released=true;active--; } } };
    },
  });
}
