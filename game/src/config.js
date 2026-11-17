// Shardlight — tuning and world constants. One place for every number the game
// balances around, so wave design and feel can be tuned without touching logic.

export const VIEW = { w: 1280, h: 800 };

export const ARENA = {
  cx: 640,        // crater centre, x
  cy: 412,        // crater centre, y
  rim: 336,       // playable radius (shades enter from beyond it)
  floor: 264,     // inner stone-ring radius around the lantern
};

export const LANTERN = {
  x: 640,
  y: 400,
  maxFlame: 100,
  startFlame: 100,
  hurtRadius: 74,     // a shade this close gnaws the flame
  gnawDps: 1,         // multiplied per gnawing shade by its def.gnaw
  rekindlePerWave: 12,
};

export const PLAYER = {
  radius: 15,
  maxHp: 100,
  speed: 236,
  boltSpeed: 560,
  boltDamage: 12,
  boltCooldown: 0.21,
  boltRadius: 5,
  hurtCooldown: 0.9,  // seconds of invulnerability after a hit
  knockback: 210,
};

export const DAYBREAK = {
  max: 100,
  perHit: 5,
  perSecond: 1.6,
  damage: 70,
  knockback: 430,
  flameGift: 12,      // Daybreak also rekindles the lantern a little
  radius: 9999,       // the whole arena feels it
};

export const DASH = {
  speed: 640,
  duration: 0.16,
  cooldown: 0.85,
  invuln: 0.22,
};

export const SHARD_DROP = {
  radius: 10,
  pickupRadius: 32,
  magnetRadius: 145,
  magnetSpeed: 360,
  flameHeal: 5,
  hpHeal: 8,
  gaugeBoost: 10,
  score: 120,
  life: 16.0,
};

export const COMBO = {
  timeout: 2.4,
  maxMultiplier: 5,
};

export const WAVES = 10;             // survive this many waves to see the dawn
export const CALM_BETWEEN_WAVES = 3.4;
export const GAUGE_PER_WAVE = 14;
// Enemy caps per frame for particles/bolts, to keep the canvas cheap.
export const MAX_PARTICLES = 420;
export const MAX_BOLTS = 120;
