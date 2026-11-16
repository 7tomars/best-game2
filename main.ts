// Shardlight — best-game-01 entry program (Node 22, standard library only).
//
// The game itself lives in game/: plain static files (game/index.html plus its
// ES modules) that a desktop browser loads offline. This program hands the game
// in: it copies game/ and screenshots/ beside this file into the output folder
// (/output in the grader, MAKEFUN_OUTPUT_DIR outside it) and writes
// dossier.json, the file the judge reads, using the make.fun library vendored in
// vendor/. Nothing here touches the network.
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// Serve game/ locally with `node serve.ts` and open http://localhost:8080.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });

// Ship the playable game and its screenshots.
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The scorer's caps (reference/gate.json): text_max_bytes shapes the bytes of the
// dossier's source text; the others refuse an entry the scorer would refuse
// (more than 4 screenshots or one over 256 KiB; over 993 files or 48 MiB of
// game files; a path under game/ longer than 1000 bytes).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);

console.log(`Shardlight written to ${out}`);
