// Shardlight — wave design. Ten waves, each a list of spawn groups. The director
// turns a wave number into a trickle of spawn events; the arena never holds more
// shades than the mix of the moment, so the late game is a siege, not an flood.

export const WAVE_TABLE = [
  [{ id: 'gloomling', count: 6 }],
  [{ id: 'gloomling', count: 8 }, { id: 'skitter', count: 3 }],
  [{ id: 'gloomling', count: 7 }, { id: 'skitter', count: 4 }, { id: 'bulwark', count: 1 }],
  [{ id: 'skitter', count: 7 }, { id: 'gloomling', count: 5 }, { id: 'witch', count: 1 }, { id: 'bulwark', count: 1 }],
  [{ id: 'mournwing', count: 4 }, { id: 'gloomling', count: 6 }, { id: 'witch', count: 2 }],
  [{ id: 'hound', count: 2 }, { id: 'skitter', count: 7 }, { id: 'bulwark', count: 2 }, { id: 'witch', count: 1 }],
  [{ id: 'knight', count: 1 }, { id: 'gloomling', count: 5 }, { id: 'mournwing', count: 4 }, { id: 'witch', count: 2 }],
  [{ id: 'skitter', count: 8 }, { id: 'hound', count: 2 }, { id: 'bulwark', count: 2 }, { id: 'witch', count: 2 }, { id: 'knight', count: 1 }],
  [{ id: 'mournwing', count: 6 }, { id: 'skitter', count: 6 }, { id: 'witch', count: 3 }, { id: 'hound', count: 2 }, { id: 'knight', count: 1 }],
  [{ id: 'knight', count: 3 }, { id: 'bulwark', count: 4 }, { id: 'gloomling', count: 8 }, { id: 'hound', count: 3 }, { id: 'witch', count: 3 }],
];

// Seconds between spawns, shrinking as the night wears on.
export function spawnInterval(wave) {
  return Math.max(0.42, 1.35 - wave * 0.105);
}

// Build a shuffled-but-deterministic queue of shade ids for a wave.
export function buildSpawnQueue(wave, rng) {
  const groups = WAVE_TABLE[Math.min(wave - 1, WAVE_TABLE.length - 1)];
  const queue = [];
  for (const group of groups) {
    for (let i = 0; i < group.count; i++) queue.push(group.id);
  }
  // Fisher–Yates with the seeded rng.
  for (let i = queue.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1));
    [queue[i], queue[j]] = [queue[j], queue[i]];
  }
  return queue;
}

export function waveSize(wave) {
  return WAVE_TABLE[Math.min(wave - 1, WAVE_TABLE.length - 1)]
    .reduce((total, group) => total + group.count, 0);
}
