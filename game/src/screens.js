// Shardlight — the screens around the fight: the title vigil, the pause, the
// bestiary the wardens keep, and the two endings. All drawn, all clickable or
// key-driven; see main.js for which key does what.

import { VIEW, WAVES } from './config.js';
import { BESTIARY } from './bestiary.js';
import { drawShade } from './render.js';

function dim(ctx, alpha = 0.66) {
  ctx.fillStyle = `rgba(4,5,14,${alpha})`;
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);
}

function panel(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(10,11,26,0.92)';
  ctx.strokeStyle = 'rgba(245,200,110,0.4)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 10);
  ctx.fill();
  ctx.stroke();
}

export function drawTitle(ctx, time, best) {
  dim(ctx, 0.45);
  ctx.save();
  ctx.textAlign = 'center';

  // Cresting light behind the name.
  const glow = ctx.createRadialGradient(VIEW.w / 2, 218, 10, VIEW.w / 2, 218, 330);
  glow.addColorStop(0, 'rgba(255,228,150,0.4)');
  glow.addColorStop(1, 'rgba(255,228,150,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);

  ctx.font = 'bold 84px Georgia, serif';
  ctx.fillStyle = '#f7e9bd';
  ctx.shadowColor = '#f5b93c';
  ctx.shadowBlur = 34;
  ctx.fillText('SHARDLIGHT', VIEW.w / 2, 232);
  ctx.shadowBlur = 0;
  ctx.font = 'italic 17px Georgia, serif';
  ctx.fillStyle = '#cbbfe8';
  ctx.fillText('the last lantern on the moon is still lit — keep it that way', VIEW.w / 2, 268);

  // Controls.
  ctx.font = '15px Georgia, serif';
  ctx.fillStyle = '#e8e2d0';
  const lines = [
    'WASD or ARROW KEYS — walk the crater',
    'MOUSE — aim      ·      LEFT CLICK — radiant bolt',
    'SPACE — DAYBREAK when the gauge is full',
    'P — pause      ·      B — bestiary      ·      M — mute',
  ];
  lines.forEach((line, i) => ctx.fillText(line, VIEW.w / 2, 348 + i * 27));

  // The call to begin.
  const pulse = 0.7 + 0.3 * Math.sin(time * 3.4);
  ctx.globalAlpha = pulse;
  ctx.font = 'bold 22px Georgia, serif';
  ctx.fillStyle = '#ffe98a';
  ctx.fillText('— CLICK OR PRESS ENTER TO BEGIN THE VIGIL —', VIEW.w / 2, 512);
  ctx.globalAlpha = 1;

  ctx.font = '13px Georgia, serif';
  ctx.fillStyle = 'rgba(232,226,208,0.66)';
  ctx.fillText(`Survive ${WAVES} waves. If the flame dies, the moon goes dark.`, VIEW.w / 2, 556);
  if (best > 0) {
    ctx.fillStyle = 'rgba(255,233,168,0.8)';
    ctx.fillText(`greatest vigil yet: ${best} points`, VIEW.w / 2, 580);
  }
  ctx.restore();
}

export function drawPause(ctx) {
  dim(ctx, 0.55);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = 'bold 44px Georgia, serif';
  ctx.fillStyle = '#f5f0dd';
  ctx.fillText('THE VIGIL HOLDS', VIEW.w / 2, 340);
  ctx.font = '17px Georgia, serif';
  ctx.fillStyle = '#cbbfe8';
  ctx.fillText('paused — press P to return to the light', VIEW.w / 2, 386);
  ctx.fillText('or R to abandon the vigil and start anew', VIEW.w / 2, 414);
  ctx.restore();
}

export function drawBestiary(ctx, time, page = 0) {
  dim(ctx, 0.78);
  const x = 110, y = 64, w = VIEW.w - 220, h = VIEW.h - 128;
  panel(ctx, x, y, w, h);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = 'bold 30px Georgia, serif';
  ctx.fillStyle = '#f7e9bd';
  ctx.fillText('THE WARDEN’S BESTIARY', VIEW.w / 2, y + 44);
  ctx.font = 'italic 13px Georgia, serif';
  ctx.fillStyle = 'rgba(203,191,232,0.85)';
  ctx.fillText('every shade that walks against the light', VIEW.w / 2, y + 66);
  ctx.restore();

  const cardW = (w - 120) / 4;
  const cardH = 218;
  const startX = x + 34;
  const startY = y + 86;
  BESTIARY.forEach((def, i) => {
    const col = i % 4;
    const row = Math.floor(i / 4);
    const cx = startX + col * (cardW + 16);
    const cy = startY + row * (cardH + 14);
    ctx.fillStyle = 'rgba(18,19,38,0.9)';
    ctx.strokeStyle = 'rgba(140,123,216,0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(cx, cy, cardW, cardH, 8);
    ctx.fill();
    ctx.stroke();

    // A living portrait of the shade.
    const fake = {
      x: cx + cardW / 2, y: cy + 66, radius: def.radius,
      hp: def.hp, maxHp: def.hp, def, flash: 0,
      weave: i * 1.7 + time * 0.6,
    };
    ctx.save();
    ctx.beginPath();
    ctx.rect(cx, cy, cardW, 120);
    ctx.clip();
    drawShade(ctx, fake, time);
    ctx.restore();

    ctx.textAlign = 'center';
    ctx.font = 'bold 15px Georgia, serif';
    ctx.fillStyle = '#f5f0dd';
    ctx.fillText(def.name, cx + cardW / 2, cy + 132);
    ctx.font = 'italic 11px Georgia, serif';
    ctx.fillStyle = def.hue;
    ctx.fillText(def.title, cx + cardW / 2, cy + 149);
    ctx.font = '10px Georgia, serif';
    ctx.fillStyle = 'rgba(232,226,208,0.72)';
    wrapText(ctx, def.lore, cx + cardW / 2, cy + 166, cardW - 18, 12);
  });

  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = '13px Georgia, serif';
  ctx.fillStyle = 'rgba(255,233,138,0.9)';
  ctx.fillText('press B to close the book', VIEW.w / 2, y + h - 16);
  ctx.restore();
}

function wrapText(ctx, text, cx, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let yy = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, cx, yy);
      line = word;
      yy += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, cx, yy);
}

export function drawWaveBanner(ctx, game) {
  // "WAVE N" rising over a freshly-cleared or newly-risen field.
  const remaining = game.bannerTime;
  if (remaining <= 0) return;
  const alpha = Math.min(1, remaining / 0.6) * Math.min(1, (game.bannerDuration - remaining) / 0.35 + 0.25);
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
  ctx.textAlign = 'center';
  ctx.font = 'bold 46px Georgia, serif';
  ctx.fillStyle = '#ffe9a8';
  ctx.shadowColor = '#f5b93c';
  ctx.shadowBlur = 26;
  ctx.fillText(game.bannerText, VIEW.w / 2, 268);
  ctx.restore();
}

export function drawEnd(ctx, game, time) {
  const victory = game.state === 'victory';
  dim(ctx, 0.62);
  ctx.save();
  ctx.textAlign = 'center';

  if (victory) {
    const glow = ctx.createRadialGradient(VIEW.w / 2, 220, 10, VIEW.w / 2, 220, 380);
    glow.addColorStop(0, 'rgba(255,236,170,0.55)');
    glow.addColorStop(1, 'rgba(255,236,170,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, VIEW.w, VIEW.h);
    ctx.font = 'bold 66px Georgia, serif';
    ctx.fillStyle = '#ffefc0';
    ctx.shadowColor = '#ffca44';
    ctx.shadowBlur = 40;
    ctx.fillText('DAWN BREAKS', VIEW.w / 2, 236);
    ctx.shadowBlur = 0;
    ctx.font = 'italic 18px Georgia, serif';
    ctx.fillStyle = '#cbbfe8';
    ctx.fillText('the shades scatter before the sun; the lantern bows, its vigil kept', VIEW.w / 2, 274);
  } else {
    ctx.font = 'bold 62px Georgia, serif';
    ctx.fillStyle = '#8d7bd8';
    ctx.shadowColor = '#241a4a';
    ctx.shadowBlur = 34;
    ctx.fillText('THE LIGHT FALLS', VIEW.w / 2, 236);
    ctx.shadowBlur = 0;
    ctx.font = 'italic 18px Georgia, serif';
    ctx.fillStyle = '#a89cc9';
    ctx.fillText('ash settles on the crater; somewhere, a new spark is struck', VIEW.w / 2, 274);
  }

  // The ledger of the vigil.
  const stats = [
    ['waves weathered', victory ? `${WAVES} / ${WAVES}` : `${Math.max(0, game.wave - 1)} / ${WAVES}`],
    ['shades cleansed', `${game.kills}`],
    ['final score', `${game.score}`],
  ];
  if (game.score >= game.best && game.score > 0) stats.push(['', '— a new greatest vigil —']);
  ctx.font = '19px Georgia, serif';
  stats.forEach(([label, value], i) => {
    const yy = 352 + i * 36;
    ctx.fillStyle = 'rgba(232,226,208,0.75)';
    ctx.textAlign = 'right';
    ctx.fillText(label, VIEW.w / 2 - 18, yy);
    ctx.fillStyle = '#ffe9a8';
    ctx.textAlign = 'left';
    ctx.fillText(value, VIEW.w / 2 + 18, yy);
  });

  const pulse = 0.72 + 0.28 * Math.sin(time * 3.2);
  ctx.globalAlpha = pulse;
  ctx.textAlign = 'center';
  ctx.font = 'bold 21px Georgia, serif';
  ctx.fillStyle = '#ffe98a';
  ctx.fillText('PRESS R TO KINDLE THE FLAME ANEW', VIEW.w / 2, 540);
  ctx.globalAlpha = 1;
  ctx.font = '13px Georgia, serif';
  ctx.fillStyle = 'rgba(232,226,208,0.6)';
  ctx.fillText('or ENTER for the same', VIEW.w / 2, 566);
  ctx.restore();
}
