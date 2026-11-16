// Mulberry32: all world randomness is owned by this explicit stream.
export function createRandom(seed) {
 let value = seed >>> 0;
 return function random() {
  value = (value + 0x6D2B79F5) | 0;
  let t = Math.imul(value ^ value >>> 15, 1 | value);
  t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
  return ((t ^ t >>> 14) >>> 0) / 4294967296;
 };
}
