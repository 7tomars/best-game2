// Shardlight — the things that move: the Warden, the shades, the two kinds of
// bolt and the light-dust that lingers after something burns. No drawing here;
// render.js reads these objects and paints them.

import { ARENA, LANTERN, PLAYER, DAYBREAK, DASH, SHARD_DROP } from './config.js';
import { BESTIARY_BY_ID } from './bestiary.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = PLAYER.radius;
    this.hp = PLAYER.maxHp;
    this.fireCooldown = 0;
    this.hurtTimer = 0;
    this.dashTimer = 0;
    this.dashCooldown = 0;
    this.dashing = false;
    this.dashVx = 0;
    this.dashVy = 0;
    this.afterimages = [];
    this.kx = 0; // knockback velocity
    this.ky = 0;
    this.walkPhase = 0;
    this.moving = false;
    this.aim = { x: 1, y: 0 };
  }

  update(dt, input) {
    this.dashCooldown = Math.max(0, this.dashCooldown - dt);
    // Afterimages decay
    for (const a of this.afterimages) a.life -= dt;
    this.afterimages = this.afterimages.filter((a) => a.life > 0);

    if (this.dashTimer > 0) {
      this.dashTimer -= dt;
      this.x += this.dashVx * dt;
      this.y += this.dashVy * dt;
      this.walkPhase += dt * 18;
      this.afterimages.push({ x: this.x, y: this.y, life: 0.18, maxLife: 0.18, aim: { ...this.aim } });
      if (this.dashTimer <= 0) this.dashing = false;
    } else {
      const move = input.moveVector();
      this.moving = move.x !== 0 || move.y !== 0;
      if (this.moving) this.walkPhase += dt * 11;
      const len = Math.hypot(move.x, move.y) || 1;
      this.x += (move.x / len) * PLAYER.speed * dt + this.kx * dt;
      this.y += (move.y / len) * PLAYER.speed * dt + this.ky * dt;
    }
    this.kx *= Math.pow(0.0009, dt);
    this.ky *= Math.pow(0.0009, dt);
    // Stay inside the crater rim.
    const dx = this.x - ARENA.cx;
    const dy = this.y - ARENA.cy;
    const dist = Math.hypot(dx, dy);
    const max = ARENA.rim - this.radius;
    if (dist > max) {
      this.x = ARENA.cx + (dx / dist) * max;
      this.y = ARENA.cy + (dy / dist) * max;
    }
    this.fireCooldown = Math.max(0, this.fireCooldown - dt);
    this.hurtTimer = Math.max(0, this.hurtTimer - dt);
    const ax = input.mouse.x - this.x;
    const ay = input.mouse.y - this.y;
    const aimLen = Math.hypot(ax, ay);
    if (aimLen > 1) this.aim = { x: ax / aimLen, y: ay / aimLen };
  }

  canDash() {
    return this.dashCooldown <= 0;
  }

  dash(moveVector) {
    if (!this.canDash()) return false;
    let dx = moveVector.x;
    let dy = moveVector.y;
    if (dx === 0 && dy === 0) {
      dx = this.aim.x;
      dy = this.aim.y;
    }
    const len = Math.hypot(dx, dy) || 1;
    this.dashVx = (dx / len) * DASH.speed;
    this.dashVy = (dy / len) * DASH.speed;
    this.dashTimer = DASH.duration;
    this.dashCooldown = DASH.cooldown;
    this.hurtTimer = Math.max(this.hurtTimer, DASH.invuln);
    this.dashing = true;
    return true;
  }

  canFire() {
    return this.fireCooldown <= 0 && !this.dashing;
  }

  fire() {
    this.fireCooldown = PLAYER.boltCooldown;
  }

  hurt(amount, fromX, fromY) {
    if (this.hurtTimer > 0) return false;
    this.hp = Math.max(0, this.hp - amount);
    this.hurtTimer = PLAYER.hurtCooldown;
    const dx = this.x - fromX;
    const dy = this.y - fromY;
    const len = Math.hypot(dx, dy) || 1;
    this.kx = (dx / len) * PLAYER.knockback;
    this.ky = (dy / len) * PLAYER.knockback;
    return true;
  }
}

export class Shade {
  constructor(id, x, y, rng) {
    const def = BESTIARY_BY_ID[id];
    this.id = id;
    this.def = def;
    this.x = x;
    this.y = y;
    this.radius = def.radius;
    this.hp = def.hp;
    this.maxHp = def.hp;
    this.kx = 0;
    this.ky = 0;
    this.gnawTick = 0;      // accumulates fractional gnaw damage for the lantern
    this.weave = rng.range(0, Math.PI * 2);
    this.weaveSpeed = rng.range(1.6, 2.6);
    this.lungeCooldown = rng.range(0.4, 1.6);
    this.lobCooldown = rng.range(1.0, 2.2);
    this.flash = 0;         // white hit-flash timer
    this.gnawing = false;
    this.dead = false;
  }

  targetPoint(player) {
    // Mournwings and hounds hunt the warden; the rest crave the lantern.
    if (this.def.behavior === 'sine' || this.def.behavior === 'lunge') return { x: player.x, y: player.y };
    return { x: LANTERN.x, y: LANTERN.y };
  }

  update(dt, player, spawnDarkBolt) {
    const def = this.def;
    this.flash = Math.max(0, this.flash - dt);
    this.weave += dt * this.weaveSpeed;
    const target = this.targetPoint(player);
    let tx = target.x - this.x;
    let ty = target.y - this.y;
    const dist = Math.hypot(tx, ty) || 1;
    tx /= dist;
    ty /= dist;

    let speed = def.speed;
    if (def.behavior === 'zigzag') {
      // Slip side to side across the line of approach.
      const px = -ty;
      const py = tx;
      const sway = Math.sin(this.weave * 2.2) * 0.9;
      tx += px * sway;
      ty += py * sway;
      const n = Math.hypot(tx, ty) || 1;
      tx /= n;
      ty /= n;
    } else if (def.behavior === 'sine') {
      const px = -ty;
      const py = tx;
      const sway = Math.sin(this.weave * 3.1) * 0.75;
      tx += px * sway;
      ty += py * sway;
      const n = Math.hypot(tx, ty) || 1;
      tx /= n;
      ty /= n;
    } else if (def.behavior === 'lunge') {
      this.lungeCooldown -= dt;
      if (this.lungeCooldown <= 0 && dist < 260) {
        this.kx += tx * 340;
        this.ky += ty * 340;
        this.lungeCooldown = 3.1;
      }
    } else if (def.behavior === 'ranged') {
      this.lobCooldown -= dt;
      // Hold at range, then lob a dark bolt.
      if (dist < 240) {
        tx = -tx * 0.6;
        ty = -ty * 0.6;
        speed *= 0.7;
      }
      if (this.lobCooldown <= 0 && dist < 420) {
        const aimPlayer = Math.hypot(player.x - this.x, player.y - this.y) < 340;
        const aim = aimPlayer ? { x: player.x, y: player.y } : { x: LANTERN.x, y: LANTERN.y };
        spawnDarkBolt(this.x, this.y, aim.x, aim.y, aimPlayer ? 'player' : 'lantern');
        this.lobCooldown = 2.35;
      }
    } else if (def.behavior === 'elite') {
      speed *= 1 + 0.15 * Math.sin(this.weave * 0.7);
    }

    this.x += tx * speed * dt + this.kx * dt;
    this.y += ty * speed * dt + this.ky * dt;
    const damp = Math.pow(0.002, dt);
    this.kx *= damp;
    this.ky *= damp;

    // Gnaw the lantern when close enough.
    const ld = Math.hypot(this.x - LANTERN.x, this.y - LANTERN.y);
    this.gnawing = ld < LANTERN.hurtRadius;
    if (this.gnawing) this.gnawTick += def.gnaw * dt;
  }

  knock(fromX, fromY, force) {
    const dx = this.x - fromX;
    const dy = this.y - fromY;
    const len = Math.hypot(dx, dy) || 1;
    const scale = this.def.behavior === 'elite' ? 0.3 : 1;
    this.kx += (dx / len) * force * scale;
    this.ky += (dy / len) * force * scale;
  }

  damage(amount) {
    this.hp -= amount;
    this.flash = 0.09;
    return this.hp <= 0;
  }
}

export class Bolt {
  constructor(x, y, vx, vy, { friendly = true, damage = 10, radius = 5, color = '#ffe9a8', target = null } = {}) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.friendly = friendly;
    this.damage = damage;
    this.radius = radius;
    this.color = color;
    this.target = target;
    this.life = 2.4;
    this.dead = false;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;
    if (this.life <= 0) this.dead = true;
    const dx = this.x - ARENA.cx;
    const dy = this.y - ARENA.cy;
    if (Math.hypot(dx, dy) > ARENA.rim + 160) this.dead = true;
  }
}

export class Particle {
  constructor(x, y, vx, vy, { life = 0.6, size = 3, color = '#ffd98a', drag = 2.4, glow = true } = {}) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.life = life;
    this.maxLife = life;
    this.size = size;
    this.color = color;
    this.drag = drag;
    this.glow = glow;
    this.dead = false;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    const damp = Math.max(0, 1 - this.drag * dt);
    this.vx *= damp;
    this.vy *= damp;
    this.life -= dt;
    if (this.life <= 0) this.dead = true;
  }
}

export class FloatText {
  constructor(x, y, text, color = '#ffe9a8') {
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color;
    this.life = 1.1;
    this.dead = false;
  }

  update(dt) {
    this.y -= 34 * dt;
    this.life -= dt;
    if (this.life <= 0) this.dead = true;
  }
}

export class RadiantShard {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.radius = SHARD_DROP.radius;
    this.life = SHARD_DROP.life;
    this.maxLife = SHARD_DROP.life;
    this.bob = Math.random() * Math.PI * 2;
    this.dead = false;
  }

  update(dt, player) {
    this.life -= dt;
    this.bob += dt * 3.8;
    if (this.life <= 0) {
      this.dead = true;
      return;
    }
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < SHARD_DROP.magnetRadius && dist > 1) {
      const pull = (1 - dist / SHARD_DROP.magnetRadius) * SHARD_DROP.magnetSpeed;
      this.vx += (dx / dist) * pull * dt * 4;
      this.vy += (dy / dist) * pull * dt * 4;
    }
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vx *= Math.pow(0.04, dt);
    this.vy *= Math.pow(0.04, dt);

    const cdx = this.x - ARENA.cx;
    const cdy = this.y - ARENA.cy;
    const cdist = Math.hypot(cdx, cdy);
    if (cdist > ARENA.rim) {
      this.x = ARENA.cx + (cdx / cdist) * ARENA.rim;
      this.y = ARENA.cy + (cdy / cdist) * ARENA.rim;
    }
  }
}
