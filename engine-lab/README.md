# Last Piston / ENGINE LAB 06

A one-button, procedural 2D engine cutaway. Hold the throttle, cook the oil, lose cylinders, and keep running on the last piston. No game-over screen and no forced restart.

## Run

Open `index.html` in a modern browser. There are no runtime dependencies, external assets, analytics, backend, or API keys. Sound requires the first throttle press.

For a single portable HTML file:

```sh
cd engine-lab
npm test
npm run build
```

Open `dist/last-piston.html`. Alternatively serve this directory with any static server.

Controls: hold the **ГАЗ** button, Space, or Arrow Up. Release to reduce load. M toggles sound; R starts a fresh engine. On phones, use the throttle and system volume controls. Progress is saved locally, never uploaded. Hidden tabs pause simulation and audio.

## What changed

- Independent cylinder compression, wear, temperature and misfires.
- Firing order 1-3-4-2 over 720 degrees; slider-crank geometry with fixed-length rods.
- Separate block, coolant and oil thermal masses, thermostat, radiator and declining fluid inventory.
- Oil pressure changes with pump speed, viscosity, level and gasket damage.
- Three cylinders can lose rods or eject a piston. Disabled pistons no longer pretend to drive the crankshaft.
- The last cylinder always survives. Its compression, speed and firing regularity deteriorate, but there is no terminal stall.
- Procedural machined metal, cams, valves, belts, liner scoring, fractured block edges, bouncing bolts, broken rods and floor debris.
- Irregular layered smoke, persistent surface oil trails and finite dripping oil, rather than gold particles.
- Combustion-pulse AudioWorklet sound with per-cylinder misfires and impact transients. Scheduled-buffer fallback for restricted browsers.
- Fixed-step model, bounded particle pools, mobile layout, reduced-motion support, keyboard controls and local save validation.

## Source map

| File | Responsibility |
| --- | --- |
| `src/simulation.js` | Deterministic thermal, oil, wear and survivor model; Node-compatible |
| `src/renderer.js` | Canvas cutaway, layered smoke, oil, debris and motion |
| `src/audio.js` | Sample-accurate pulse synthesis and fallback scheduler |
| `src/app.js` | Input, lifecycle, HUD, persistence, fixed-step loop |
| `tests/simulation.test.cjs` | Nine regression tests, including a virtual one-hour run |
| `tools/build.cjs` | Dependency-free single-HTML packager |

## Deliberate gameplay rules

This is not engineering analysis software. Thermal aging is accelerated for interaction. Visual crank speed is slowed independently of the audible RPM. An explicit torque/health floor keeps one cylinder alive, even with no oil. That last rule is intentionally fictional and is the point of the game. Cooling never repairs an already detached rod or resurrects an ejected piston.

## Verification

`npm test` passes nine model tests. The bundled HTML was rendered in headless Chromium at 1280 px and a 390 px touch viewport. Input/release, one-cylinder operation, no horizontal overflow, no JavaScript runtime errors and a nonzero fallback audio signal were checked. The test environment blocked URL navigation, so this browser check used inline document injection. AudioWorklet is implemented but was not exercised by that insecure test origin. Real mobile-device performance and subjective sound quality are not claimed as tested.

## GitHub location

This standalone project lives in `engine-lab/` on the `engine-lab` branch of `antropos17/build_demo1`. The original `main` branch is unchanged. The GitHub connection available for this session supports branch/file writes but not creating repositories.
