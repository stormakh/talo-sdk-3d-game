/**
 * Mulberry32 seeded PRNG.
 * Returns a function that produces deterministic pseudo-random numbers in [0, 1).
 */
export function createRng(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Convert a string seed to a numeric seed via simple hash. */
export function hashSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0;
  }
  return hash;
}

/** Convenience: create a seeded RNG from a string. */
export function createRngFromString(seed: string): () => number {
  return createRng(hashSeed(seed));
}
