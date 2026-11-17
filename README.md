# Shardlight

The last lantern on the moon is still lit — keep it that way.

Shardlight is a complete 2D browser game: you are the Warden of the Great
Lantern, standing watch in a crater on the near side of the moon. Shades come
in waves, drawn to the flame. Hold the light.

- **Genre:** survival arena defense, one screen, one lantern
- **Players:** 1 — keyboard + mouse
- **Runs:** entirely offline from static files in `game/` — no build, no network
- **Sound:** synthesised live with WebAudio (mute with `M`)

## Play it

```sh
node serve.ts          # serves game/ at http://localhost:8080
```

Or open `game/index.html` in any current desktop browser.

## Controls

| Input | Action |
| --- | --- |
| WASD / Arrow keys | Walk the crater |
| Mouse | Aim the spark-staff |
| Left click | Radiant bolt |
| Shift / Right click | **Dash / Dodge** — quick burst of invulnerability with radiant afterimages |
| Space | **Daybreak** — when the gauge is full, a dawn-nova that sears every shade in the bowl and rekindles the flame |
| P / Esc / Click | Pause / Unpause |
| B / Esc / Click | Bestiary — the seven shades, drawn and named |
| M | Mute |
| R / Enter / Click | Rekindle (from the end screens) |

## The vigil

Survive **10 waves**. Shades that reach the Great Lantern gnaw the flame; if
the flame dies, the moon goes dark.

- **Radiant Shards**: Defeated elite shades drop glowing star shards. Draw them close magnetically to recover lantern flame, restore warden HP, and boost Daybreak gauge.
- **Combo Streak**: String together rapid cleanses to build a combo multiplier up to 5x.
- **Spark-Staff & Dash**: Time your dashes to dodge lunging hounds and mourning dive attacks.
- **Daybreak Nova**: Fills as you land hits and gather shards; release when surrounded to cleanse the crater bowl.

### The bestiary

| Shade | Threat |
| --- | --- |
| Gloomling | the lesser shade; comes in packs |
| Skittershade | fast, weaving, hard to hit |
| Umbra Bulwark | a walking wall of hate; slow, huge, gnaws deep |
| Mire Wispmother | keeps its distance; lobs dark bile at warden and lantern |
| Mournwing | dives out of the dark singing |
| Shadehound | patient at the rim, then one terrible lunge |
| Hollow Knight | a warden who let his lantern die — the last thing between you and the end |

## Screenshots

`screenshots/` holds the title vigil, play in progress with its HUD, a
Daybreak unleashed, and the dawn that comes after the last wave — the full
loop, start to restart.

## Development

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts   # writes out/game, out/screenshots, out/dossier.json
```

`main.ts` (Node 22+, standard library only) hands the game in; `vendor/makefun-game.ts`
is the make.fun dossier library this competition's kit ships. `game/` is plain
ES modules, one clear job per file: `main.js` conducts, `entities.js` moves,
`render.js` paints the arena, `screens.js` draws the menus, `bestiary.js` and
`waves.js` hold the data the night is made of, `audio.js` sings, `input.js`
listens, `config.js` tunes, `random.js` seeds.

## License

MIT — see [LICENSE](LICENSE).
