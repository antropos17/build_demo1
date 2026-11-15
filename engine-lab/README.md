# Last Piston / ENGINE LAB 07

One throttle. Four cylinders. The last piston never stops.

A procedural engine cutaway with persistent mechanical wear, finite fluids, layered smoke and combustion-pulse audio. It continues running on a single cylinder. There is no game-over screen, forced restart or repair on cooling.

## Run

Open `index.html`, or create a portable file:

```sh
cd engine-lab
npm test
npm run build
```

Open `dist/last-piston.html`. No runtime packages, external assets, backend, analytics or API keys are required. Sound starts with the first throttle press. Local progress stays on the device.

Hold **ГАЗ**, Space or Arrow Up. Release to reduce load. M toggles sound. R twice within four seconds starts a new engine. On mobile, sound, reduced shake and confirmed reset are under **Настройки стенда**. Hidden tabs pause audio and simulation; navigation never preserves a held throttle.

## Version 0.7

- A visual flywheel with compression resistance and combustion kicks. The last cylinder visibly hesitates between power strokes rather than spinning smoothly.
- Successful and missed ignition cycles change the actual combustion flashes. The last piston cannot miss forever.
- Independent left/right mount, cover and exhaust-joint fatigue. Torn mounts retain safety straps; the loose cover rattles and the exhaust hangs on a support.
- Pressure pops on throttle lift or accumulated unburnt mixture. Short smoke rings and a pressure jet, not a glowing engine block.
- A filtered friction bed, resonant metal impacts and low-frequency exhaust pops, routed through the existing audio limiter.
- Steam from failed coolant seals stops after coolant depletion. Oil-smoke emissions consume a finite surface film. Oil droplets stop when the sump is dry.
- A crank-motion trace, per-cylinder compression/temperature, peak readings and a persistent 12-entry damage journal.
- Version-1 saves migrate without restoring broken cylinders. On reload, major floor debris is reconstructed without replaying explosions.
- Mobile rendering preserves mechanical proportions. Throttle remains the only primary game control. Reduced motion and sound have accessible secondary controls.
- Independent key/pointer tracking prevents one released input from cancelling another held input. Reset requires confirmation and clears the journal and effects.

## Source map

| File | Responsibility |
| --- | --- |
| `src/simulation.js` | Baseline deterministic thermal, oil and wear model |
| `src/dynamics.js` | Endurance extension, flywheel impulses, component fatigue and validated v2 saves |
| `src/renderer.js` | Procedural cutaway, smoke sprites, bounded effects pools |
| `src/workshop.js` | Attached damage, finite-fluid emissions, non-distorted framing and wreckage restoration |
| `src/audio.js` | AudioWorklet combustion synthesis and scheduled-buffer fallback |
| `src/mechanical-audio.js` | Friction, ringing impacts and exhaust-pop layers |
| `src/app.js` | Input, lifecycle, telemetry, journal, settings and persistence |
| `workshop.css` | Additional telemetry, secondary controls and mobile layout |
| `tests/*.test.cjs` | Model, migration, audio-DSP and portable-build regressions |
| `tools/build.cjs` | Single-file HTML packager |
| `tools/browser_check.py` | Optional Chromium interaction, screenshot and audio checks |

## Verification

`npm test`: 22 tests passed, including an hour of virtual one-cylinder operation, deterministic evolution, finite fluids, irreversible component damage, save migration, malformed saves, AudioWorklet DSP output and the standalone packager.

The optional browser check requires Python, Playwright, Pillow and Chromium. Run `npm run build`, then `python tools/browser_check.py`. Set `CHROMIUM_PATH` when Chromium is not on PATH. Evidence is written to `dist/verification/`.

For this iteration, 24 checks passed in headless Chromium using inline document injection at 1280 px and a 390 px touch viewport. Screenshots were inspected. Touch cancellation, overlapping keyboard inputs, reset confirmation, bounded particles, journal restoration, rendered canvas pixels after resize and nonzero scheduled-buffer audio were exercised. No JavaScript runtime errors were observed.

The environment blocks URL navigation. A hosted origin, actual mobile hardware, native localStorage across real navigation, and the browser AudioWorklet host were not exercised here. AudioWorklet sample processing was tested separately in Node, not claimed as a browser integration test.

## Gameplay rules

This is a toy simulation, not an engineering model. Aging is accelerated. Visual crank motion is deliberately slower than audible RPM. A torque/health floor keeps the last cylinder running without oil. Failed rods do not regain drive, and cooling does not repair damage.

The smoke window remains partly transparent so that the surviving mechanism is visible. Major debris and event histories are bounded, and effects never accumulate without limits.

## Repository boundary

Project: `engine-lab/` on branch `engine-lab` of `antropos17/build_demo1`. Do not merge into or modify the parent application's main branch without a separate request. Build output is intentionally ignored; generate the portable HTML with `npm run build`.
