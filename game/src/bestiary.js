// Shardlight — the bestiary. Seven kinds of shade haunt the crater, each a row
// of behaviour the encounter teaches the player. Data only: how each shade
// moves and fights lives in entities.js, how it looks in render.js.

export const BESTIARY = [
  {
    id: 'gloomling',
    name: 'Gloomling',
    title: 'the Lesser Shade',
    lore: 'First to the lantern each night. Where one walks, the dark walks with it.',
    hp: 22, speed: 58, radius: 13, contact: 8, gnaw: 1.0, score: 50,
    behavior: 'drift',
    hue: '#8d7bd8',
  },
  {
    id: 'skitter',
    name: 'Skittershade',
    title: 'the Quick Dark',
    lore: 'It comes in threes, never straight. Your aim will learn its rhythm.',
    hp: 11, speed: 112, radius: 9, contact: 6, gnaw: 0.7, score: 70,
    behavior: 'zigzag',
    hue: '#6ee7c8',
  },
  {
    id: 'bulwark',
    name: 'Umbra Bulwark',
    title: 'the Wall That Walks',
    lore: 'A siege engine wearing the shape of a man. It does not run, because it has never needed to.',
    hp: 95, speed: 32, radius: 24, contact: 18, gnaw: 2.2, score: 160,
    behavior: 'drift',
    hue: '#4b3f72',
  },
  {
    id: 'witch',
    name: 'Mire Wispmother',
    title: 'the Lobe of Dark Bile',
    lore: 'She spits the dark she was born of. Keep her at bolt-range, never at arm\'s length.',
    hp: 34, speed: 46, radius: 14, contact: 8, gnaw: 0.8, score: 140,
    behavior: 'ranged',
    hue: '#c86eb4',
  },
  {
    id: 'mournwing',
    name: 'Mournwing',
    title: 'the Weeping Wing',
    lore: 'It circles once, twice, then falls out of the sky like grief itself.',
    hp: 16, speed: 84, radius: 11, contact: 10, gnaw: 0.9, score: 110,
    behavior: 'sine',
    hue: '#7bb3e0',
  },
  {
    id: 'hound',
    name: 'Shadehound',
    title: 'the Hound of the Rim',
    lore: 'Patient at the edge of the light, then a single, terrible lunge.',
    hp: 28, speed: 66, radius: 12, contact: 12, gnaw: 1.2, score: 120,
    behavior: 'lunge',
    hue: '#e08a6e',
  },
  {
    id: 'knight',
    name: 'Hollow Knight',
    title: 'the Broken Vigil',
    lore: 'A warden who let his lantern die. It remembers the post. It wants yours.',
    hp: 175, speed: 38, radius: 19, contact: 24, gnaw: 2.6, score: 300,
    behavior: 'elite',
    hue: '#b8b2d9',
  },
];

export const BESTIARY_BY_ID = Object.fromEntries(BESTIARY.map((def) => [def.id, def]));
