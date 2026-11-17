// Shardlight — everything that is seen in the arena: the moonscape, the Great
// Lantern and its flame, the shades, the bolts, the dust and the HUD. Screens
// (title, pause, bestiary, the endings) live in screens.js.

import { VIEW, ARENA, LANTERN, DAYBREAK, PLAYER, DASH, SHARD_DROP, COMBO } from './config.js';
import { makeRng } from './random.js';

// A fixed starfield, generated once so it never twinkles between frames.
const starRng = makeRng(20261116);
const STARS = Array.from({ length: 170 }, () => ({
  x: starRng.range(0, VIEW.w),
  y: starRng.range(0, VIEW.h * 0.52),
  r: starRng.range(0.4, 1.7),
  a: starRng.range(0.35, 1),
}));
const MOTE_SEED = makeRng(97531);
const CRATERS = Array.from({ length: 9 }, () => {
  const angle = MOTE_SEED.range(0, Math.PI * 2);
  const dist = MOTE_SEED.range(ARENA.floor + 40, ARENA.rim + 120);
  return {
    x: ARENA.cx + Math.cos(angle) * dist,
    y: ARENA.cy + Math.sin(angle) * dist * 0.92,
    r: MOTE_SEED.range(8, 34),
  };
});

function circle(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
}

export function drawBackdrop(ctx, time) {
  // Deep space.
  const sky = ctx.createLinearGradient(0, 0, 0, VIEW.h);
  sky.addColorStop(0, '#070818');
  sky.addColorStop(0.55, '#0b0d22');
  sky.addColorStop(1, '#05060f');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);

  for (const star of STARS) {
    const twinkle = 0.72 + 0.28 * Math.sin(time * 1.7 + star.x * 0.13);
    ctx.globalAlpha = star.a * twinkle;
    ctx.fillStyle = '#dfe6ff';
    circle(ctx, star.x, star.y, star.r);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Earth, small and blue, hanging in the black.
  const earthGlow = ctx.createRadialGradient(1120, 108, 4, 1120, 108, 46);
  earthGlow.addColorStop(0, 'rgba(120,170,255,0.5)');
  earthGlow.addColorStop(1, 'rgba(120,170,255,0)');
  ctx.fillStyle = earthGlow;
  ctx.fillRect(1060, 48, 130, 130);
  const earth = ctx.createRadialGradient(1112, 100, 2, 1120, 108, 16);
  earth.addColorStop(0, '#9fd0ff');
  earth.addColorStop(0.55, '#3f6fd6');
  earth.addColorStop(1, '#16294f');
  ctx.fillStyle = earth;
  circle(ctx, 1120, 108, 15);
  ctx.fill();

  // The crater floor: a great grey disc with soft relief.
  const floor = ctx.createRadialGradient(ARENA.cx, ARENA.cy - 40, 60, ARENA.cx, ARENA.cy, ARENA.rim + 150);
  floor.addColorStop(0, '#3a3a46');
  floor.addColorStop(0.45, '#2c2c38');
  floor.addColorStop(0.8, '#20202c');
  floor.addColorStop(1, '#14141e');
  ctx.fillStyle = floor;
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);
  circle(ctx, ARENA.cx, ARENA.cy, ARENA.rim + 60);
  ctx.fill();

  // Crater rim ring.
  ctx.strokeStyle = 'rgba(190,190,215,0.20)';
  ctx.lineWidth = 26;
  circle(ctx, ARENA.cx, ARENA.cy, ARENA.rim + 8);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(0,0,0,0.45)';
  ctx.lineWidth = 3;
  circle(ctx, ARENA.cx, ARENA.cy, ARENA.rim - 4);
  ctx.stroke();

  // Craters.
  for (const crater of CRATERS) {
    ctx.fillStyle = 'rgba(0,0,0,0.32)';
    circle(ctx, crater.x, crater.y, crater.r);
    ctx.fill();
    ctx.strokeStyle = 'rgba(200,200,225,0.13)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(crater.x, crater.y, crater.r, Math.PI * 1.05, Math.PI * 1.85);
    ctx.stroke();
  }

  // The stone ring the lantern stands within.
  ctx.strokeStyle = 'rgba(230,225,205,0.14)';
  ctx.lineWidth = 2;
  circle(ctx, ARENA.cx, ARENA.cy, ARENA.floor);
  ctx.stroke();
  ctx.setLineDash([10, 14]);
  ctx.strokeStyle = 'rgba(245,200,110,0.28)';
  circle(ctx, ARENA.cx, ARENA.cy, ARENA.floor - 8);
  ctx.stroke();
  ctx.setLineDash([]);
}

export function drawLantern(ctx, time, flameRatio) {
  const { x, y } = LANTERN;
  const flicker = 0.9 + 0.1 * Math.sin(time * 9.1) + 0.06 * Math.sin(time * 23.7);
  const reach = (150 + 330 * flameRatio) * flicker;

  // The light itself: two nested pools of warm radiance.
  const glow = ctx.createRadialGradient(x, y - 26, 8, x, y - 26, reach);
  glow.addColorStop(0, `rgba(255, 236, 170, ${0.5 + 0.35 * flameRatio})`);
  glow.addColorStop(0.35, `rgba(255, 205, 120, ${0.28 + 0.22 * flameRatio})`);
  glow.addColorStop(1, 'rgba(255, 190, 90, 0)');
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = glow;
  ctx.fillRect(x - reach, y - 26 - reach, reach * 2, reach * 2);
  ctx.restore();

  // Stone pillar and bowl.
  ctx.fillStyle = '#23232f';
  ctx.fillRect(x - 13, y - 8, 26, 54);
  ctx.fillStyle = '#2e2e3c';
  ctx.fillRect(x - 20, y + 42, 40, 10);
  ctx.fillStyle = '#1a1a24';
  ctx.fillRect(x - 26, y - 10, 52, 8);
  ctx.beginPath();
  ctx.ellipse(x, y - 12, 27, 9, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#33333f';
  ctx.fill();

  // The flame: three layers, dancing.
  const f = (0.65 + 0.45 * flameRatio) * flicker;
  const layer = (scale, color, dy) => {
    ctx.beginPath();
    ctx.moveTo(x - 13 * scale, y - 14);
    ctx.bezierCurveTo(x - 15 * scale, y - 30 * scale - dy, x - 4 * scale, y - 34 * scale - dy, x, y - 52 * scale - dy);
    ctx.bezierCurveTo(x + 4 * scale, y - 34 * scale - dy, x + 15 * scale, y - 30 * scale - dy, x + 13 * scale, y - 14);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  };
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  layer(1.0 * f + 0.35, 'rgba(255,140,40,0.85)', 6 * Math.sin(time * 7.3));
  layer(0.72 * f + 0.25, 'rgba(255,205,80,0.9)', 4 * Math.sin(time * 8.9 + 1.3));
  layer(0.4 * f + 0.12, 'rgba(255,246,205,0.95)', 3 * Math.sin(time * 11.7 + 2.1));
  ctx.restore();
}

function drawShadeBody(ctx, shade, time) {
  const { def } = shade;
  ctx.save();
  ctx.translate(shade.x, shade.y);
  ctx.shadowColor = def.hue;
  ctx.shadowBlur = 14;
  ctx.fillStyle = '#12101f';
  ctx.strokeStyle = def.hue;
  ctx.lineWidth = 1.6;

  switch (def.behavior) {
    case 'zigzag': { // Skittershade: three skittering legs and a wedge head.
      const leg = Math.sin(time * 14 + shade.weave * 5) * 5;
      ctx.beginPath();
      ctx.ellipse(0, 0, 11, 7.5, 0, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      ctx.beginPath();
      for (let i = -1; i <= 1; i++) {
        ctx.moveTo(i * 6, 4);
        ctx.lineTo(i * 8 + leg * (i || 1), 13);
      }
      ctx.stroke();
      ctx.fillStyle = def.hue;
      circle(ctx, -3.5, -1.5, 1.6); ctx.fill();
      circle(ctx, 3.5, -1.5, 1.6); ctx.fill();
      break;
    }
    case 'sine': { // Mournwing: a weeping wing pair around a teardrop body.
      const flap = Math.sin(time * 9 + shade.weave * 3) * 0.55;
      for (const side of [-1, 1]) {
        ctx.save();
        ctx.rotate(side * (0.35 + flap));
        ctx.beginPath();
        ctx.moveTo(side * 4, 0);
        ctx.quadraticCurveTo(side * 22, -14, side * 30, 2);
        ctx.quadraticCurveTo(side * 18, 6, side * 4, 6);
        ctx.closePath();
        ctx.fill(); ctx.stroke();
        ctx.restore();
      }
      ctx.beginPath();
      ctx.ellipse(0, 2, 7, 10, 0, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = def.hue;
      circle(ctx, 0, -2, 2.2); ctx.fill();
      break;
    }
    case 'lunge': { // Shadehound: low, long, all coiled muscle.
      ctx.beginPath();
      ctx.ellipse(0, 1, 15, 7, 0, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      ctx.beginPath(); // head
      ctx.ellipse(13, -3, 6.5, 5, 0, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      ctx.beginPath(); // tail
      ctx.moveTo(-14, 0); ctx.quadraticCurveTo(-22, -6, -19, -13); ctx.stroke();
      ctx.fillStyle = def.hue;
      circle(ctx, 15.5, -4, 1.5); ctx.fill(); // eye
      break;
    }
    case 'ranged': { // Mire Wispmother: a hooded lobe of dark.
      ctx.beginPath();
      ctx.moveTo(0, -19);
      ctx.quadraticCurveTo(14, -8, 11, 12);
      ctx.quadraticCurveTo(0, 18, -11, 12);
      ctx.quadraticCurveTo(-14, -8, 0, -19);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#05040c';
      circle(ctx, 0, -6, 6); ctx.fill(); // hood void
      ctx.fillStyle = def.hue;
      circle(ctx, -2.4, -6, 1.5); ctx.fill();
      circle(ctx, 2.4, -6, 1.5); ctx.fill();
      circle(ctx, 0, 8, 3.1 + Math.sin(time * 6 + shade.weave) * 0.7); ctx.fill(); // held bile-orb
      break;
    }
    case 'elite': { // Hollow Knight: the broken vigil, still standing watch.
      ctx.beginPath(); // cape
      ctx.moveTo(-13, 16); ctx.quadraticCurveTo(0, 8 + Math.sin(time * 3) * 2, 13, 16);
      ctx.lineTo(9, -6); ctx.lineTo(-9, -6); ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.fillRect(-9, -22, 18, 17); // helm
      ctx.strokeRect(-9, -22, 18, 17);
      ctx.beginPath(); // pauldrons
      ctx.ellipse(-11, -8, 6, 4.4, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.ellipse(11, -8, 6, 4.4, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = def.hue; // the helm's hollow
      ctx.fillRect(-5.5, -17, 11, 2.4);
      break;
    }
    default: {
      if (def.id === 'bulwark') { // Umbra Bulwark: a walking wall.
        ctx.beginPath();
        ctx.moveTo(-19, 16); ctx.lineTo(-22, -6); ctx.lineTo(-11, -19);
        ctx.lineTo(9, -21); ctx.lineTo(21, -4); ctx.lineTo(18, 16); ctx.closePath();
        ctx.fill(); ctx.stroke();
        ctx.beginPath(); // cracks
        ctx.moveTo(-6, -12); ctx.lineTo(1, 0); ctx.lineTo(-5, 11);
        ctx.moveTo(9, -14); ctx.lineTo(4, -2);
        ctx.stroke();
        ctx.fillStyle = def.hue;
        circle(ctx, -5, -4, 2.1); ctx.fill();
        circle(ctx, 5, -4, 2.1); ctx.fill();
      } else { // Gloomling: a knot of living dark.
        const wob = Math.sin(time * 5 + shade.weave) * 1.6;
        ctx.beginPath();
        ctx.ellipse(0, 0, 12 + wob, 11 - wob, 0, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();
        ctx.beginPath(); // wisp tail
        ctx.moveTo(-6, 9); ctx.quadraticCurveTo(-8 + wob, 19, -3, 16);
        ctx.moveTo(6, 9); ctx.quadraticCurveTo(8 - wob, 19, 3, 16);
        ctx.stroke();
        ctx.fillStyle = def.hue;
        circle(ctx, -4.2, -2, 1.9); ctx.fill();
        circle(ctx, 4.2, -2, 1.9); ctx.fill();
      }
    }
  }

  // Hit flash.
  if (shade.flash > 0) {
    ctx.globalAlpha = Math.min(1, shade.flash / 0.09) * 0.75;
    ctx.fillStyle = '#ffffff';
    circle(ctx, 0, 0, shade.radius + 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  // Health pip for wounded, tougher shades.
  if (shade.hp < shade.maxHp && shade.maxHp >= 30) {
    const w = shade.radius * 1.7;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(-w / 2, -shade.radius - 9, w, 3.4);
    ctx.fillStyle = '#b39dff';
    ctx.fillRect(-w / 2, -shade.radius - 9, (w * shade.hp) / shade.maxHp, 3.4);
  }
  ctx.restore();
}

export function drawShade(ctx, shade, time) {
  drawShadeBody(ctx, shade, time);
}

export function drawBolt(ctx, bolt, time) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  if (bolt.friendly) {
    const pulse = 1 + 0.25 * Math.sin(time * 22);
    const glow = ctx.createRadialGradient(bolt.x, bolt.y, 0.5, bolt.x, bolt.y, 13 * pulse);
    glow.addColorStop(0, 'rgba(255,248,214,1)');
    glow.addColorStop(0.4, 'rgba(255,214,120,0.85)');
    glow.addColorStop(1, 'rgba(255,190,80,0)');
    ctx.fillStyle = glow;
    circle(ctx, bolt.x, bolt.y, 13 * pulse);
    ctx.fill();
  } else {
    const glow = ctx.createRadialGradient(bolt.x, bolt.y, 0.5, bolt.x, bolt.y, 11);
    glow.addColorStop(0, 'rgba(230,140,255,0.95)');
    glow.addColorStop(0.45, 'rgba(150,60,210,0.7)');
    glow.addColorStop(1, 'rgba(120,40,190,0)');
    ctx.fillStyle = glow;
    circle(ctx, bolt.x, bolt.y, 11);
    ctx.fill();
  }
  ctx.restore();
}

export function drawParticle(ctx, particle) {
  const life = Math.max(0, particle.life / particle.maxLife);
  ctx.save();
  if (particle.glow) ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = life;
  ctx.fillStyle = particle.color;
  circle(ctx, particle.x, particle.y, particle.size * (0.5 + life * 0.8));
  ctx.fill();
  ctx.restore();
}

export function drawFloatText(ctx, text) {
  ctx.save();
  ctx.globalAlpha = Math.min(1, text.life);
  ctx.font = 'bold 15px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = text.color;
  ctx.shadowColor = '#000';
  ctx.shadowBlur = 4;
  ctx.fillText(text.text, text.x, text.y);
  ctx.restore();
}

export function drawShard(ctx, shard, time) {
  const { x, y } = shard;
  const bobY = y + Math.sin(shard.bob) * 5;
  const pulse = 0.82 + 0.18 * Math.sin(shard.bob * 2.2);

  ctx.save();
  ctx.translate(x, bobY);

  ctx.globalCompositeOperation = 'lighter';
  const glow = ctx.createRadialGradient(0, 0, 1, 0, 0, 24 * pulse);
  glow.addColorStop(0, 'rgba(255, 246, 190, 0.95)');
  glow.addColorStop(0.4, 'rgba(255, 212, 90, 0.55)');
  glow.addColorStop(1, 'rgba(255, 180, 40, 0)');
  ctx.fillStyle = glow;
  circle(ctx, 0, 0, 24 * pulse);
  ctx.fill();

  ctx.rotate(shard.bob * 0.45);
  ctx.fillStyle = '#fffdf0';
  ctx.shadowColor = '#ffc83b';
  ctx.shadowBlur = 12;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    const r1 = 9;
    const r2 = 4.2;
    ctx.lineTo(Math.cos(a) * r1, Math.sin(a) * r1);
    ctx.lineTo(Math.cos(a + Math.PI / 6) * r2, Math.sin(a + Math.PI / 6) * r2);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function drawAimReticle(ctx, mouse, time) {
  const { x, y } = mouse;
  const pulse = 1 + 0.1 * Math.sin(time * 7);
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = 'rgba(255, 233, 168, 0.65)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(0, 0, 9 * pulse, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, -13 * pulse); ctx.lineTo(0, -5 * pulse);
  ctx.moveTo(0, 5 * pulse);   ctx.lineTo(0, 13 * pulse);
  ctx.moveTo(-13 * pulse, 0); ctx.lineTo(-5 * pulse, 0);
  ctx.moveTo(5 * pulse, 0);  ctx.lineTo(13 * pulse, 0);
  ctx.stroke();

  ctx.fillStyle = '#ffe9a8';
  circle(ctx, 0, 0, 1.8);
  ctx.fill();
  ctx.restore();
}

export function drawPlayer(ctx, player, time) {
  // Radiant afterimage trail when dashing
  if (player.afterimages && player.afterimages.length > 0) {
    for (const ghost of player.afterimages) {
      const alpha = (ghost.life / ghost.maxLife) * 0.4;
      ctx.save();
      ctx.translate(ghost.x, ghost.y);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#78e7d2';
      ctx.shadowColor = '#6ef0d8';
      ctx.shadowBlur = 14;
      circle(ctx, 0, 0, player.radius + 2);
      ctx.fill();
      ctx.restore();
    }
  }

  ctx.save();
  ctx.translate(player.x, player.y);
  const flash = player.hurtTimer > 0 && Math.floor(time * 12) % 2 === 0;
  ctx.globalAlpha = flash ? 0.45 : 1;

  // Dash aura glow
  if (player.dashing) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const dashGlow = ctx.createRadialGradient(0, 0, 2, 0, 0, 32);
    dashGlow.addColorStop(0, 'rgba(142, 245, 216, 0.7)');
    dashGlow.addColorStop(1, 'rgba(142, 245, 216, 0)');
    ctx.fillStyle = dashGlow;
    circle(ctx, 0, 0, 32);
    ctx.fill();
    ctx.restore();
  }

  // Lantern-warden cloak.
  ctx.fillStyle = '#2b3a4a';
  ctx.strokeStyle = '#8fd6d0';
  ctx.lineWidth = 1.5;
  ctx.shadowColor = '#79d6cf';
  ctx.shadowBlur = 10;
  const bob = player.moving ? Math.sin(player.walkPhase) * 1.6 : Math.sin(time * 2.1) * 1.1;
  ctx.beginPath();
  ctx.moveTo(0, -17 + bob);
  ctx.quadraticCurveTo(13, -6 + bob, 11, 13);
  ctx.quadraticCurveTo(0, 17, -11, 13);
  ctx.quadraticCurveTo(-13, -6 + bob, 0, -17 + bob);
  ctx.closePath();
  ctx.fill(); ctx.stroke();

  // Hood and face.
  ctx.fillStyle = '#1d2836';
  circle(ctx, 0, -11 + bob, 7.4);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffe9a8';
  circle(ctx, -2.2, -11 + bob, 1.15); ctx.fill();
  circle(ctx, 2.2, -11 + bob, 1.15); ctx.fill();

  // The spark-staff, angled toward the aim.
  const ang = Math.atan2(player.aim.y, player.aim.x);
  ctx.rotate(ang);
  ctx.strokeStyle = '#6b5436';
  ctx.lineWidth = 3.4;
  ctx.beginPath(); ctx.moveTo(4, 2); ctx.lineTo(24, 0); ctx.stroke();
  ctx.fillStyle = '#ffd970';
  ctx.shadowColor = '#ffce55';
  ctx.shadowBlur = 14;
  circle(ctx, 26, 0, 4.4 + Math.sin(time * 10) * 0.6);
  ctx.fill();
  ctx.restore();
}

export function drawDaybreakNova(ctx, game, time) {
  const nova = game.daybreakFx; // { t, dur } while ringing out
  if (!nova) return;
  const p = 1 - nova.t / nova.dur;
  const radius = p * Math.max(VIEW.w, VIEW.h) * 0.85;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const [scale, alpha] of [[1, 0.75], [0.72, 0.5], [0.45, 0.32]]) {
    const r = Math.max(1, radius * scale);
    const ring = ctx.createRadialGradient(LANTERN.x, LANTERN.y, r * 0.82, LANTERN.x, LANTERN.y, r);
    ring.addColorStop(0, 'rgba(255,240,190,0)');
    ring.addColorStop(0.85, `rgba(255,226,150,${alpha * (1 - p * 0.75)})`);
    ring.addColorStop(1, 'rgba(255,226,150,0)');
    ctx.fillStyle = ring;
    ctx.fillRect(0, 0, VIEW.w, VIEW.h);
  }
  ctx.restore();
}

function bar(ctx, x, y, w, h, ratio, fillTop, fillBottom, label, valueText) {
  ctx.save();
  ctx.fillStyle = 'rgba(5,6,16,0.72)';
  ctx.strokeStyle = 'rgba(232,226,208,0.28)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x - 6, y - 16, w + 12, h + 26, 6);
  ctx.fill();
  ctx.stroke();
  ctx.font = '11px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(232,226,208,0.85)';
  ctx.fillText(label, x, y - 6);
  const bg = ctx.createLinearGradient(x, y, x + w, y);
  bg.addColorStop(0, 'rgba(255,255,255,0.05)');
  bg.addColorStop(1, 'rgba(255,255,255,0.12)');
  ctx.fillStyle = bg;
  ctx.fillRect(x, y, w, h);
  if (ratio > 0) {
    const grad = ctx.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, fillTop);
    grad.addColorStop(1, fillBottom);
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w * Math.max(0, Math.min(1, ratio)), h);
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.22)';
  ctx.strokeRect(x, y, w, h);
  if (valueText) {
    ctx.textAlign = 'right';
    ctx.fillStyle = '#f5f0dd';
    ctx.fillText(valueText, x + w, y - 6);
  }
  ctx.restore();
}

export function drawHud(ctx, game) {
  const flameRatio = game.flame / game.maxFlame;
  // Flame, warden health, and dash cooldown, top-left.
  bar(ctx, 22, 34, 230, 14, flameRatio, '#ffe27a', '#e07818', 'LANTERN FLAME', `${Math.ceil(game.flame)}`);
  bar(ctx, 22, 80, 230, 10, game.player.hp / PLAYER.maxHp, '#9ff0e4', '#1f8f83', 'WARDEN', `${Math.ceil(game.player.hp)}`);

  const dashRatio = 1 - (game.player.dashCooldown / DASH.cooldown);
  bar(ctx, 22, 120, 140, 6, dashRatio, '#8ee8d8', '#2fa998', 'DASH [SHIFT/RMB]', game.player.dashCooldown <= 0 ? 'READY' : '');

  // Wave and remaining shades, top-center.
  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = 'bold 21px Georgia, serif';
  ctx.fillStyle = '#f5f0dd';
  ctx.shadowColor = '#000';
  ctx.shadowBlur = 6;
  ctx.fillText(`WAVE ${game.wave} OF ${game.totalWaves}`, VIEW.w / 2, 34);
  ctx.font = '12px Georgia, serif';
  ctx.fillStyle = 'rgba(232,226,208,0.78)';
  const remaining = game.shades.length + game.spawnQueue.length;
  ctx.fillText(remaining === 0 ? 'the rim is quiet…' : `${remaining} shade${remaining === 1 ? '' : 's'} on the field`, VIEW.w / 2, 54);
  ctx.restore();

  // Score and combos, top-right.
  ctx.save();
  ctx.textAlign = 'right';
  ctx.font = 'bold 21px Georgia, serif';
  ctx.fillStyle = '#ffe9a8';
  ctx.shadowColor = '#000';
  ctx.shadowBlur = 6;
  ctx.fillText(`${game.score}`, VIEW.w - 22, 34);
  ctx.font = '11px Georgia, serif';
  ctx.fillStyle = 'rgba(232,226,208,0.7)';
  ctx.fillText(`BEST ${game.best}`, VIEW.w - 22, 52);

  if (game.combo > 1 && game.comboTimer > 0) {
    const mult = Math.min(game.combo, COMBO.maxMultiplier);
    const pulse = 1 + 0.08 * Math.sin(game.time * 12);
    ctx.font = `bold ${Math.round(18 * pulse)}px Georgia, serif`;
    ctx.fillStyle = '#ffdf6d';
    ctx.shadowColor = '#ffb300';
    ctx.shadowBlur = 10;
    ctx.fillText(`COMBO x${mult}`, VIEW.w - 22, 78);

    // Combo timer decay line
    const cRatio = Math.max(0, game.comboTimer / COMBO.timeout);
    ctx.fillStyle = 'rgba(255, 223, 109, 0.75)';
    ctx.fillRect(VIEW.w - 22 - 76 * cRatio, 85, 76 * cRatio, 3);
  }

  if (game.shardsCount > 0) {
    ctx.font = '12px Georgia, serif';
    ctx.fillStyle = '#ffd970';
    ctx.shadowBlur = 4;
    ctx.shadowColor = '#000';
    const sy = (game.combo > 1 && game.comboTimer > 0) ? 106 : 76;
    ctx.fillText(`✦ ${game.shardsCount} SHARDS`, VIEW.w - 22, sy);
  }
  ctx.restore();

  // Daybreak gauge, bottom-center.
  const gaugeRatio = game.gauge / DAYBREAK.max;
  const ready = gaugeRatio >= 1;
  const pulse = ready ? 0.72 + 0.28 * Math.sin(game.time * 6) : 1;
  ctx.save();
  const gw = 320;
  const gx = VIEW.w / 2 - gw / 2;
  const gy = VIEW.h - 40;
  ctx.globalAlpha = pulse;
  ctx.fillStyle = 'rgba(5,6,16,0.72)';
  ctx.strokeStyle = ready ? '#ffd968' : 'rgba(232,226,208,0.3)';
  ctx.lineWidth = ready ? 2 : 1;
  ctx.beginPath();
  ctx.roundRect(gx - 8, gy - 20, gw + 16, 34, 7);
  ctx.fill();
  ctx.stroke();
  ctx.globalAlpha = 1;
  const grad = ctx.createLinearGradient(gx, gy, gx + gw, gy);
  grad.addColorStop(0, '#7a4de8');
  grad.addColorStop(0.55, '#e05a9e');
  grad.addColorStop(1, '#ffd968');
  ctx.fillStyle = grad;
  ctx.fillRect(gx, gy - 8, gw * gaugeRatio, 12);
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 1;
  ctx.strokeRect(gx, gy - 8, gw, 12);
  ctx.textAlign = 'center';
  ctx.font = ready ? 'bold 13px Georgia, serif' : '11px Georgia, serif';
  ctx.fillStyle = ready ? '#ffe98a' : 'rgba(232,226,208,0.8)';
  ctx.fillText(ready ? '☀ DAYBREAK READY — PRESS SPACE ☀' : 'DAYBREAK', VIEW.w / 2, gy + 12);
  ctx.restore();

  // Mute marker.
  if (game.audioMuted) {
    ctx.save();
    ctx.textAlign = 'left';
    ctx.font = '11px Georgia, serif';
    ctx.fillStyle = 'rgba(232,226,208,0.55)';
    ctx.fillText('muted (M)', 22, VIEW.h - 16);
    ctx.restore();
  }

  // Hurt vignette when the warden is bleeding.
  if (game.player.hurtTimer > 0.35) {
    const v = ctx.createRadialGradient(VIEW.w / 2, VIEW.h / 2, VIEW.h / 3, VIEW.w / 2, VIEW.h / 2, VIEW.h);
    v.addColorStop(0, 'rgba(160,30,30,0)');
    v.addColorStop(1, 'rgba(160,30,30,0.32)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, VIEW.w, VIEW.h);
  }
}

export function drawVignette(ctx) {
  const v = ctx.createRadialGradient(VIEW.w / 2, VIEW.h / 2, VIEW.h * 0.42, VIEW.w / 2, VIEW.h / 2, VIEW.h * 0.95);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(0,0,0,0.5)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);
}
