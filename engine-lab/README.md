# Last Piston / ENGINE LAB 08

A single-throttle, procedural four-cylinder engine cutaway. It wears out cylinder by cylinder but the last piston continues to run.

## Run

Open `index.html`, or build the portable HTML:

```sh
npm test
npm run build
```

Open `dist/last-piston.html`. No runtime packages, remote assets, services or API keys are needed. Sound starts after a user gesture.

## Version 0.8

- Rebuilt longitudinal cutaway: machined flanges, cast surfaces, cross-honed liners, cooling jackets, piston crowns, two compression rings, an oil-control ring, wrist pins, I-section rods, bearing caps between crank throws, counterweights and two camshaft projections.
- Four strokes each occupy 180 crank degrees. Firing order is 1-3-4-2; the camshaft rotates at half crank speed. Valve heads open into the cylinder, not away from it. Valve timing continues after a disconnected rod.
- Per-cylinder liner, skirt, ring, bearing, crown and crack wear. Damage is persistent; surface scoring is attached to the component, not randomized every render. Contact wear reduces compression and adds frictional heat.
- Growing branched fractures, broken rod remnants, displaced material, worn skirt patches and ring grooves. The intact last cylinder keeps driving the shaft.
- Oil pickup, gallery, crank bearings, piston cooling jets and coolant passages. Oil and steam emissions retain finite inventories from v0.7.
- Four inspection layers: section, lubrication, temperatures and wear. Click a cylinder card for 1.8x inspection. Pause holds both the mechanism and effects; pressing gas resumes immediately.
- Validated v1/v2 save migration, v3 contact-wear persistence, keyboard/touch controls, reduced motion, mute, confirmed manual reset and bounded effect pools.

## Controls

Hold **ГАЗ**, Space or Arrow Up. Release to reduce load. M toggles sound. R twice confirms a fresh engine. Inspection, zoom and display layers do not repair the motor.

## What is physically represented

The slider-crank length constraint and 720-degree cycle are mathematical kinematics. The illustrative I4 uses an 86 mm bore, 86 mm stroke, 142 mm rod and 10.5:1 nominal compression ratio. Valves use ideal zero-overlap sinusoidal lift events. The two camshaft/valve rows are unfolded for legibility; this is not a literal single-plane CAD section of a named production engine.

Cylinder pressure is an analytic polytropic teaching approximation. Per-node friction torques, contact-film thickness and temperature zones are gameplay estimates, not measured calibration. The RPM model remains the endurance model rather than a complete torque-balanced thermodynamic solver. Aging is accelerated; thermal values are bounded. Low-speed assist and a compression floor intentionally keep the last cylinder alive even with a dry sump. This is not an engine design, diagnostic or safety tool.

## Verification for 0.8

32 Node tests passed, including an hour of virtual one-cylinder operation, geometric invariants, firing order, valves, migration, contact wear, malformed saves, audio DSP and the portable build.

35 Chromium checks passed using the actual standalone build injected into a browser page. They include the four layers, cylinder zoom, keyboard/touch cancellation, inspection pause, rendering without state mutation, bounded effects, sound output, reset and 390/320 px layout. Screenshots were inspected. No JavaScript runtime errors were observed. The browser produced finite nonzero scheduled-buffer audio.

This environment blocks URL navigation. Consequently hosted-origin behavior, native localStorage across navigation and browser AudioWorklet hosting were not verified. Mobile checks used emulation, not a physical phone. The optional script `python tools/check_cutaway.py` attempts a loopback origin and records an explicit inline fallback when environment policy blocks it. Evidence is written to `dist/verification-08/`.

## Source layout

- `simulation.js`, `dynamics.js`: deterministic baseline and endurance dynamics.
- `mechanics.js`: correct stroke/valve state, pressure approximation, contact wear and v3 migration.
- `renderer.js`, `workshop.js`: bounded visual effects and component fatigue infrastructure.
- `cutaway.js`: the v0.8 cutaway and inspection layers.
- `audio.js`, `mechanical-audio.js`: combustion synthesis, fallback audio and friction/impact layers.
- `app.js`: input, inspection, telemetry, persistence and lifecycle.
- `tests/`: reproducible Node regression suite; `tools/`: build and browser checks.

Technical references and modeling boundaries are recorded in `ENGINEERING.md`.

Work only in `engine-lab/` on branch `engine-lab` of `antropos17/build_demo1`. Do not touch the parent application's main branch. There is no terminal failure, automatic restart or zero-cylinder state.
