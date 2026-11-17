// Shardlight — the game's heart: the loop, the state machine and the rules that
// bind them. Title → vigil → calm between waves → victory or the fall; pause and
// the bestiary stand aside from both endings. Everything else lives in its own
// file; this one only conducts.

import {
  VIEW, ARENA, LANTERN, PLAYER, DAYBREAK, DASH, SHARD_DROP, COMBO,
  WAVES, CALM_BETWEEN_WAVES, GAUGE_PER_WAVE, MAX_PARTICLES, MAX_BOLTS,
} from './config.js';
import { makeRng } from './random.js';
import { Input } from './input.js';
import { AudioEngine } from './audio.js';
import { buildSpawnQueue, spawnInterval } from './waves.js';
import { Player, Shade, Bolt, Particle, FloatText, RadiantShard } from './entities.js';
import {
  drawBackdrop, drawLantern, drawShade, drawBolt, drawParticle, drawFloatText,
  drawPlayer, drawDaybreakNova, drawHud, drawVignette, drawShard, drawAimReticle,
} from './render.js';
import { drawTitle, drawPause, drawBestiary, drawWaveBanner, drawEnd } from './screens.js';

const canvas = document.getElementById('game');
const ctx = canvas && canvas.getContext('2d');
if (!ctx) {
  document.getElementById('fallback').style.display = 'flex';
  throw new Error('canvas 2d context unavailable');
}
const input = new Input(canvas);
const audio = new AudioEngine();

function loadBest() {
  try { return Number(localStorage.getItem('shardlight-best')) || 0; } catch { return 0; }
}
function saveBest(score) {
  try { localStorage.setItem('shardlight-best', String(score)); } catch { /* private mode */ }
}

const game = {
  state: 'title',       // title | playing | calm | paused | bestiary | gameover | victory
  prevState: 'title',   // where bestiary/pause return to
  time: 0,
  rng: makeRng(Date.now() & 0xffffffff),
  player: new Player(ARENA.cx, ARENA.cy + 150),
  shades: [],
  shards: [],
  shardsCount: 0,
  combo: 0,
  comboTimer: 0,
  maxCombo: 0,
  bolts: [],
  particles: [],
  texts: [],
  spawnQueue: [],
  spawnTimer: 0,
  spawnInterval: 1,
  wave: 1,
  totalWaves: WAVES,
  kills: 0,
  score: 0,
  best: loadBest(),
  flame: LANTERN.startFlame,
  maxFlame: LANTERN.maxFlame,
  gauge: 0,
  shake: 0,
  arenaFlash: 0,
  daybreakFx: null,
  bannerText: '',
  bannerTime: 0,
  bannerDuration: 2.6,
  calmTimer: 0,
  gnawSoundTimer: 0,
  overTimer: 0,
  audioMuted: false,
};

function resetRun(seed) {
  game.rng = makeRng(seed ?? (Date.now() & 0xffffffff));
  game.player = new Player(ARENA.cx, ARENA.cy + 150);
  game.shades = [];
  game.shards = [];
  game.shardsCount = 0;
  game.combo = 0;
  game.comboTimer = 0;
  game.maxCombo = 0;
  game.bolts = [];
  game.particles = [];
  game.texts = [];
  game.spawnQueue = [];
  game.spawnTimer = 0;
  game.wave = 1;
  game.kills = 0;
  game.score = 0;
  game.flame = LANTERN.startFlame;
  game.gauge = 0;
  game.shake = 0;
  game.arenaFlash = 0;
  game.daybreakFx = null;
  game.calmTimer = 0;
  game.overTimer = 0;
  audio.startAmbient();
  audio.setAmbientLevel(1.0);
  startWave(1);
  game.state = 'playing';
}

function startWave(n) {
  game.wave = n;
  game.spawnQueue = buildSpawnQueue(n, game.rng);
  game.spawnInterval = spawnInterval(n);
  game.spawnTimer = 0.9;
  game.bannerText = n === WAVES ? 'THE FINAL WAVE' : `WAVE ${n}`;
  game.bannerDuration = 2.4;
  game.bannerTime = game.bannerDuration;
  audio.waveRise();
}

function spawnFromQueue() {
  const id = game.spawnQueue.shift();
  const angle = game.rng.range(0, Math.PI * 2);
  const x = ARENA.cx + Math.cos(angle) * (ARENA.rim + 26);
  const y = ARENA.cy + Math.sin(angle) * (ARENA.rim + 26);
  game.shades.push(new Shade(id, x, y, game.rng));
}

function spawnDarkBolt(x, y, tx, ty, target) {
  if (game.bolts.length >= MAX_BOLTS) return;
  const dx = tx - x;
  const dy = ty - y;
  const len = Math.hypot(dx, dy) || 1;
  const speed = 300;
  game.bolts.push(new Bolt(x, y, (dx / len) * speed, (dy / len) * speed, {
    friendly: false, damage: 10, radius: 6, target,
  }));
}

function burst(x, y, { count = 10, color = '#ffd98a', speed = 130, size = 3.2, life = 0.7 }) {
  for (let i = 0; i < count && game.particles.length < MAX_PARTICLES; i++) {
    const angle = game.rng.range(0, Math.PI * 2);
    const spd = game.rng.range(speed * 0.3, speed);
    game.particles.push(new Particle(x, y, Math.cos(angle) * spd, Math.sin(angle) * spd, {
      life: game.rng.range(life * 0.5, life),
      size: game.rng.range(size * 0.6, size * 1.4),
      color,
    }));
  }
}

function addText(x, y, text, color = '#ffe9a8') {
  game.texts.push(new FloatText(x, y, text, color));
}

function firePlayerBolt() {
  const p = game.player;
  if (!p.canFire()) return;
  p.fire();
  const tipX = p.x + p.aim.x * 26;
  const tipY = p.y + p.aim.y * 26;
  game.bolts.push(new Bolt(tipX, tipY, p.aim.x * PLAYER.boltSpeed, p.aim.y * PLAYER.boltSpeed, {
    friendly: true, damage: PLAYER.boltDamage, radius: PLAYER.boltRadius,
  }));
  burst(tipX, tipY, { count: 3, color: '#ffe9a8', speed: 60, size: 1.8, life: 0.3 });
  audio.bolt();
}

function triggerDaybreak() {
  if (game.gauge < DAYBREAK.max) return;
  game.gauge = 0;
  game.daybreakFx = { t: 1.15, dur: 1.15 };
  game.arenaFlash = 0.7;
  game.shake = 16;
  game.flame = Math.min(game.maxFlame, game.flame + DAYBREAK.flameGift);
  audio.daybreak();
  // The dawn judges every shade in the bowl of the crater.
  for (const shade of game.shades) {
    shade.damage(DAYBREAK.damage);
    shade.knock(LANTERN.x, LANTERN.y, DAYBREAK.knockback);
  }
  burst(LANTERN.x, LANTERN.y, { count: 90, color: '#ffe98a', speed: 460, size: 4.2, life: 1.15 });
  addText(LANTERN.x, LANTERN.y - 90, 'DAYBREAK', '#fff6cf');
}

function killShade(index) {
  const shade = game.shades[index];
  game.shades.splice(index, 1);
  game.kills += 1;

  // Combo streak calculation
  game.combo += 1;
  game.comboTimer = COMBO.timeout;
  game.maxCombo = Math.max(game.maxCombo, game.combo);
  const mult = Math.min(game.combo, COMBO.maxMultiplier);
  const killScore = shade.def.score * mult;
  game.score += killScore;

  addText(shade.x, shade.y - 8, mult > 1 ? `+${killScore} (x${mult})` : `+${killScore}`, mult > 1 ? '#ffdf6d' : '#ffe9a8');
  burst(shade.x, shade.y, { count: 16, color: shade.def.hue, speed: 170, size: 3.4, life: 0.8 });
  audio.shadeDown();

  // Radiant Shards dropped by elites or with 28% chance
  const shardCarriers = ['bulwark', 'witch', 'mournwing', 'hound', 'knight'];
  if (shardCarriers.includes(shade.id) || (shade.def && shade.def.boss) || game.rng.range(0, 1) < 0.28) {
    game.shards.push(new RadiantShard(shade.x, shade.y, game.rng));
  }
}

function update(dt) {
  game.time += dt;
  game.shake = Math.max(0, game.shake - dt * 26);
  game.arenaFlash = Math.max(0, game.arenaFlash - dt);
  game.bannerTime = Math.max(0, game.bannerTime - dt);
  if (game.daybreakFx) {
    game.daybreakFx.t -= dt;
    if (game.daybreakFx.t <= 0) game.daybreakFx = null;
  }

  if (game.state === 'playing' || game.state === 'calm') {
    // Dash dodge input (Shift or Right Click)
    if (input.wasPressed('ShiftLeft') || input.wasPressed('ShiftRight') || input.wasPressed('Mouse2')) {
      if (game.player.dash(input.moveVector())) {
        audio.dash();
        burst(game.player.x, game.player.y, { count: 14, color: '#9ff0e4', speed: 180, size: 2.8, life: 0.35 });
      }
    }

    game.player.update(dt, input);
    if (input.mouse.down) firePlayerBolt();

    // Combo timer decay
    if (game.comboTimer > 0) {
      game.comboTimer -= dt;
      if (game.comboTimer <= 0) {
        game.combo = 0;
      }
    }

    // Radiant Shards update & magnetic pickup
    for (const s of game.shards) s.update(dt, game.player);
    for (const s of game.shards) {
      if (s.dead) continue;
      const dist = Math.hypot(s.x - game.player.x, s.y - game.player.y);
      if (dist < game.player.radius + s.radius + 10) {
        s.dead = true;
        game.shardsCount += 1;
        game.flame = Math.min(game.maxFlame, game.flame + SHARD_DROP.flameHeal);
        game.player.hp = Math.min(PLAYER.maxHp, game.player.hp + SHARD_DROP.hpHeal);
        game.gauge = Math.min(DAYBREAK.max, game.gauge + SHARD_DROP.gaugeBoost);
        const mult = Math.max(1, Math.min(game.combo, COMBO.maxMultiplier));
        const shardScore = SHARD_DROP.score * mult;
        game.score += shardScore;
        addText(s.x, s.y - 14, `+${shardScore} ✦`, '#ffe9a8');
        burst(s.x, s.y, { count: 14, color: '#fff0a8', speed: 140, size: 3.2, life: 0.6 });
        audio.shardPickup();
      }
    }
    game.shards = game.shards.filter((s) => !s.dead);

    // Wave spawning.
    if (game.state === 'playing' && game.spawnQueue.length > 0) {
      game.spawnTimer -= dt;
      if (game.spawnTimer <= 0) {
        spawnFromQueue();
        game.spawnTimer = game.spawnInterval;
      }
    }

    // Shades act.
    for (const shade of game.shades) shade.update(dt, game.player, spawnDarkBolt);

    // The lantern pays for every gnawing shade.
    let gnawTotal = 0;
    for (const shade of game.shades) gnawTotal += shade.gnawTick;
    if (gnawTotal > 0) {
      game.flame -= gnawTotal;
      game.gnawSoundTimer -= dt;
      if (game.gnawSoundTimer <= 0) {
        audio.lanternGnaw();
        game.gnawSoundTimer = 0.45;
        burst(LANTERN.x + game.rng.range(-14, 14), LANTERN.y - 20, { count: 2, color: '#ff9a3c', speed: 50, size: 2.4, life: 0.5 });
      }
      for (const shade of game.shades) shade.gnawTick = 0;
    }

    // The daybreak gauge breathes in on its own, slowly.
    game.gauge = Math.min(DAYBREAK.max, game.gauge + DAYBREAK.perSecond * dt);

    // Bolt flight and their arguments with matter.
    for (const bolt of game.bolts) bolt.update(dt);
    for (const bolt of game.bolts) {
      if (bolt.dead) continue;
      if (bolt.friendly) {
        for (let i = game.shades.length - 1; i >= 0; i--) {
          const shade = game.shades[i];
          if (Math.hypot(bolt.x - shade.x, bolt.y - shade.y) < shade.radius + bolt.radius) {
            bolt.dead = true;
            game.gauge = Math.min(DAYBREAK.max, game.gauge + DAYBREAK.perHit);
            burst(bolt.x, bolt.y, { count: 6, color: '#ffe9a8', speed: 110, size: 2.4, life: 0.45 });
            audio.hit();
            if (shade.damage(bolt.damage)) killShade(i);
            break;
          }
        }
      } else if (bolt.target === 'player') {
        if (Math.hypot(bolt.x - game.player.x, bolt.y - game.player.y) < game.player.radius + bolt.radius) {
          bolt.dead = true;
          game.player.hurt(bolt.damage, bolt.x, bolt.y);
          burst(bolt.x, bolt.y, { count: 8, color: '#c86eff', speed: 120, size: 2.6, life: 0.5 });
          audio.hurt();
        }
      } else if (bolt.target === 'lantern') {
        if (Math.hypot(bolt.x - LANTERN.x, bolt.y - LANTERN.y) < 34) {
          bolt.dead = true;
          game.flame -= 5;
          burst(bolt.x, bolt.y, { count: 10, color: '#c86eff', speed: 110, size: 2.6, life: 0.5 });
          audio.lanternGnaw();
        }
      }
    }

    // Shades paw at the warden.
    for (let i = game.shades.length - 1; i >= 0; i--) {
      const shade = game.shades[i];
      const dist = Math.hypot(shade.x - game.player.x, shade.y - game.player.y);
      if (dist < shade.radius + game.player.radius) {
        if (game.player.hurt(shade.def.contact, shade.x, shade.y)) {
          shade.knock(game.player.x, game.player.y, 160);
          burst(game.player.x, game.player.y, { count: 8, color: '#ff6a5e', speed: 130, size: 2.6, life: 0.5 });
          audio.hurt();
        }
      }
    }

    // Housekeeping.
    game.shades = game.shades.filter((s) => !s.dead);
    game.bolts = game.bolts.filter((b) => !b.dead);

    // Daybreak from the ashes of the gauge.
    if (input.wasPressed('Space')) triggerDaybreak();

    // A shade reduced to nothing by the nova still counts.
    for (let i = game.shades.length - 1; i >= 0; i--) {
      if (game.shades[i].hp <= 0) killShade(i);
    }

    // End of the wave?
    if (game.state === 'playing' && game.spawnQueue.length === 0 && game.shades.length === 0) {
      game.score += 250 * game.wave;
      game.flame = Math.min(game.maxFlame, game.flame + LANTERN.rekindlePerWave);
      game.gauge = Math.min(DAYBREAK.max, game.gauge + GAUGE_PER_WAVE);
      if (game.wave >= WAVES) {
        game.state = 'victory';
        game.best = Math.max(game.best, game.score);
        saveBest(game.best);
        audio.victory();
        audio.setAmbientLevel(0.3);
        burst(LANTERN.x, LANTERN.y, { count: 120, color: '#fff3b8', speed: 380, size: 4, life: 1.4 });
      } else {
        game.state = 'calm';
        game.calmTimer = CALM_BETWEEN_WAVES;
        game.bannerText = `WAVE ${game.wave} CLEANSED`;
        game.bannerDuration = CALM_BETWEEN_WAVES;
        game.bannerTime = CALM_BETWEEN_WAVES;
        audio.waveClear();
        audio.setAmbientLevel(0.65);
      }
    } else if (game.state === 'calm') {
      game.calmTimer -= dt;
      if (game.calmTimer <= 0) {
        audio.setAmbientLevel(1.0);
        startWave(game.wave + 1);
      }
    }

    // The flame dies; the vigil ends.
    if (game.flame <= 0) {
      game.flame = 0;
      game.state = 'gameover';
      game.overTimer = 0;
      game.best = Math.max(game.best, game.score);
      saveBest(game.best);
      audio.gameOver();
      audio.setAmbientLevel(0.3);
      burst(LANTERN.x, LANTERN.y, { count: 60, color: '#554488', speed: 220, size: 3.6, life: 1.3 });
    }
    if (game.player.hp <= 0) {
      game.state = 'gameover';
      game.overTimer = 0;
      game.best = Math.max(game.best, game.score);
      saveBest(game.best);
      audio.gameOver();
      audio.setAmbientLevel(0.3);
    }
  } else if (game.state === 'gameover' || game.state === 'victory') {
    game.overTimer += dt;
  }

  // Particles and floating words always drift.
  for (const p of game.particles) p.update(dt);
  game.particles = game.particles.filter((p) => !p.dead);
  for (const t of game.texts) t.update(dt);
  game.texts = game.texts.filter((t) => !t.dead);

  input.endFrame();
}

function handleGlobalKeys() {
  if (input.wasPressed('KeyM')) game.audioMuted = audio.toggleMute();
  if (input.wasPressed('KeyB')) {
    if (game.state === 'bestiary') {
      game.state = game.prevState;
      audio.setAmbientLevel(game.state === 'playing' || game.state === 'calm' ? 1.0 : 0.4);
    } else if (game.state === 'title' || game.state === 'paused' || game.state === 'playing' || game.state === 'calm') {
      game.prevState = game.state;
      game.state = 'bestiary';
      audio.setAmbientLevel(0.4);
    }
  }
  if (input.wasPressed('KeyP')) {
    if (game.state === 'playing' || game.state === 'calm') {
      game.prevState = game.state;
      game.state = 'paused';
      audio.setAmbientLevel(0.4);
    } else if (game.state === 'paused') {
      game.state = game.prevState === 'paused' ? 'playing' : game.prevState;
      audio.setAmbientLevel(1.0);
    }
  }
  if (input.wasPressed('Escape')) {
    if (game.state === 'bestiary') {
      game.state = game.prevState;
      audio.setAmbientLevel(game.state === 'playing' || game.state === 'calm' ? 1.0 : 0.4);
    } else if (game.state === 'paused') {
      game.state = game.prevState === 'paused' ? 'playing' : game.prevState;
      audio.setAmbientLevel(1.0);
    } else if (game.state === 'playing' || game.state === 'calm') {
      game.prevState = game.state;
      game.state = 'paused';
      audio.setAmbientLevel(0.4);
    }
  }
  if (input.wasPressed('KeyR') && (game.state === 'gameover' || game.state === 'victory' || game.state === 'paused')) {
    audio.uiClick();
    resetRun();
  }
  if (input.wasPressed('Enter')) {
    if (game.state === 'title') { audio.uiClick(); resetRun(); }
    else if (game.state === 'gameover' || game.state === 'victory') { audio.uiClick(); resetRun(); }
  }
}

function render() {
  ctx.save();
  if (game.shake > 0) {
    ctx.translate(game.rng.range(-game.shake, game.shake) * 0.5, game.rng.range(-game.shake, game.shake) * 0.5);
  }

  drawBackdrop(ctx, game.time);
  drawLantern(ctx, game.time, game.flame / game.maxFlame);
  for (const shard of game.shards) drawShard(ctx, shard, game.time);
  for (const bolt of game.bolts) drawBolt(ctx, bolt, game.time);
  for (const shade of game.shades) drawShade(ctx, shade, game.time);
  drawPlayer(ctx, game.player, game.time);
  if ((game.state === 'playing' || game.state === 'calm') && !frozen) {
    drawAimReticle(ctx, input.mouse, game.time);
  }
  for (const p of game.particles) drawParticle(ctx, p);
  for (const t of game.texts) drawFloatText(ctx, t);
  drawDaybreakNova(ctx, game, game.time);
  ctx.restore();

  // Arena flash of a fresh-breaken dawn.
  if (game.arenaFlash > 0) {
    ctx.fillStyle = `rgba(255, 240, 190, ${game.arenaFlash * 0.55})`;
    ctx.fillRect(0, 0, VIEW.w, VIEW.h);
  }

  drawVignette(ctx);

  const inGame = game.state === 'playing' || game.state === 'calm' || game.state === 'paused' || game.state === 'bestiary';
  if (inGame || game.state === 'gameover' || game.state === 'victory') drawHud(ctx, game);
  drawWaveBanner(ctx, game);

  switch (game.state) {
    case 'title': drawTitle(ctx, game.time, game.best); break;
    case 'paused': drawPause(ctx); break;
    case 'bestiary': drawBestiary(ctx, game.time); break;
    case 'gameover':
    case 'victory': drawEnd(ctx, game, game.time); break;
    default: break;
  }
}

// --- Screenshot mode (?shot=start|play|daybreak|end&seed=N), used to take the
// entry's screenshots deterministically. Plays no part otherwise.
function applyShot(kind, seed) {
  const shotRng = makeRng(seed);
  game.rng = shotRng;
  game.state = 'playing';
  game.time = 41.7;
  game.wave = 3;
  game.score = 1640;
  game.best = kind === 'start' ? 0 : 5200;
  game.flame = 74;
  game.gauge = kind === 'daybreak' ? DAYBREAK.max : 63;
  game.kills = 23;
  game.bannerTime = 0;
  game.shards = [];
  game.shardsCount = kind === 'start' ? 0 : (kind === 'end' ? 14 : 5);
  game.combo = kind === 'play' ? 3 : (kind === 'daybreak' ? 4 : 0);
  game.comboTimer = kind === 'play' || kind === 'daybreak' ? 2.1 : 0;
  game.maxCombo = kind === 'start' ? 0 : 5;
  game.player = new Player(ARENA.cx - 120, ARENA.cy + 128);
  game.player.aim = { x: 0.86, y: -0.5 };

  const place = (id, angleDeg, dist) => {
    const a = (angleDeg * Math.PI) / 180;
    game.shades.push(new Shade(id, ARENA.cx + Math.cos(a) * dist, ARENA.cy + Math.sin(a) * dist, shotRng));
  };
  place('gloomling', 205, 210);
  place('gloomling', 330, 260);
  place('skitter', 155, 180);
  place('skitter', 25, 225);
  place('bulwark', 282, 285);
  place('witch', 120, 300);
  place('mournwing', 65, 195);
  place('hound', 350, 160);
  game.spawnQueue = ['gloomling', 'skitter', 'gloomling', 'knight'];

  if (kind === 'play' || kind === 'daybreak') {
    const a = Math.atan2(-0.5, 0.86);
    game.bolts.push(new Bolt(game.player.x + Math.cos(a) * 60, game.player.y + Math.sin(a) * 60, Math.cos(a) * 500, Math.sin(a) * 500, { friendly: true }));
    game.bolts.push(new Bolt(game.player.x + Math.cos(a) * 190, game.player.y + Math.sin(a) * 190, Math.cos(a) * 500, Math.sin(a) * 500, { friendly: true }));
    burst(ARENA.cx + 150, ARENA.cy - 70, { count: 12, color: '#ffe9a8', speed: 120, size: 2.6, life: 0.6 });
    game.shards.push(new RadiantShard(ARENA.cx - 65, ARENA.cy + 35, shotRng));
    game.shards.push(new RadiantShard(ARENA.cx + 85, ARENA.cy + 80, shotRng));
    if (kind === 'daybreak') {
      // Freeze the moment the dawn breaks: ring mid-flight, gauge spent.
      game.gauge = 14;
      game.flame = Math.min(game.maxFlame, game.flame + DAYBREAK.flameGift);
      game.daybreakFx = { t: 0.58, dur: 1.15 };
      game.arenaFlash = 0.32;
      for (const shade of game.shades) shade.knock(LANTERN.x, LANTERN.y, DAYBREAK.knockback * 0.4);
      burst(LANTERN.x, LANTERN.y, { count: 80, color: '#ffe98a', speed: 430, size: 4, life: 1.1 });
      addText(LANTERN.x, LANTERN.y - 92, 'DAYBREAK', '#fff6cf');
    }
  } else if (kind === 'end') {
    game.state = 'victory';
    game.wave = WAVES;
    game.score = 9840;
    game.best = 9840;
    game.kills = 87;
    game.shades = [];
    game.spawnQueue = [];
    game.bolts = [];
    burst(LANTERN.x, LANTERN.y, { count: 70, color: '#fff3b8', speed: 300, size: 3.6, life: 1.2 });
  } else if (kind === 'start') {
    game.state = 'title';
    game.shades = [];
    game.spawnQueue = [];
    game.bolts = [];
  }
}

const shotParams = new URLSearchParams(window.location.search);
const shot = shotParams.get('shot');
if (shot) {
  const seed = Number(shotParams.get('seed')) || 7;
  applyShot(shot, seed);
}

canvas.addEventListener('mousedown', (e) => {
  if (e.button !== 0) return;
  if (game.state === 'title') {
    audio.uiClick();
    resetRun();
    input.mouse.down = false;
  } else if (game.state === 'gameover' || game.state === 'victory') {
    if (game.overTimer > 0.6) {
      audio.uiClick();
      resetRun();
      input.mouse.down = false;
    }
  } else if (game.state === 'paused') {
    audio.uiClick();
    game.state = game.prevState === 'paused' ? 'playing' : game.prevState;
    audio.setAmbientLevel(1.0);
    input.mouse.down = false;
  } else if (game.state === 'bestiary') {
    audio.uiClick();
    game.state = game.prevState;
    audio.setAmbientLevel(game.state === 'playing' || game.state === 'calm' ? 1.0 : 0.4);
    input.mouse.down = false;
  }
});

let last = performance.now();
const frozen = Boolean(shot); // screenshot mode: render the composed scene, don't simulate
function frame(now) {
  let dt = (now - last) / 1000;
  last = now;
  dt = Math.min(dt, 1 / 30);
  if (!frozen) {
    handleGlobalKeys();
    update(dt);
  }
  render();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
