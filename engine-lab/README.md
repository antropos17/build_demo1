# Last Piston / Engine Lab 10

A browser cutaway engine with a lower instrument cluster, analogue accelerator and brake. The last piston keeps going.

## Run

```sh
cd engine-lab
npm test
npm run build
```

Open `dist/last-piston.html` directly in a browser. It is fully self-contained. No runtime packages, API keys, remote assets, backend or trackers are required. The modular `index.html` can also be served by any static server.

## Controls

| Input | Gas | Brake |
| --- | --- | --- |
| Touch or mouse | Hold the right pedal; drag higher for more travel | Hold the left pedal; drag higher for more travel |
| Keyboard | W, Arrow Up, or Space | S, Arrow Down, or B |
| Focused pedal | Enter or Space | Enter or Space |

Two fingers work at once. Each pedal is momentary and returns on release. Keyboard travel is progressive. M toggles sound. R twice within four seconds resets the engine. Graphical settings, normal/stress mode, volume and reduced shake remain available. Hidden tabs pause audio and simulation.

## What's new in 0.10

A bottom dashboard with a tachometer, warning lamps, oil pressure, coolant, brake heat, supply voltage, absorbed torque/power/energy and a rotor preview. Engine RPM comes from a torque/inertia balance, not a pedal-to-RPM animation. The brake adds shaft load and produces heat, fade and wear. Limiter and overrun fuel cut are heard in the existing continuous audio engine.

This is a stationary test stand, not a driving simulator. There is no invented km/h display. Explicit low-speed assistance protects the last cylinder; mechanical aging and stress-test heating are intentionally accelerated. All non-rated physical constants are illustrative model assumptions.

Version-5 saves migrate old damage, never held inputs. Previous journal, smoke, oil, cooling relay, cylinder zoom, four inspection layers, finite fluids and bounded cached rendering are retained.

## Project structure

- `src/simulation.js`, `dynamics.js`, `mechanics.js`, `powertrain.js`: base model and thermal/electrical subsystems.
- `src/dyno.js`: analogue commands, shaft inertia, limiter, brake absorption, heat/fade and v5 persistence.
- `src/pedals.js`: independent pointer/key ownership and safe input release.
- `src/dashboard.js`, `dashboard.css`: retained SVG instruments and pedal materials.
- `src/renderer.js`, `workshop.js`, `cutaway.js`, `effects.js`: cutaway and cached visual effects.
- `src/audio.js`: one continuous worklet/buffered DSP.
- `src/app.js`: lifecycle, fixed-step loop, settings and telemetry.

## Verification

59 Node tests and 46 Chromium checks passed in this iteration. Run `npm test`, `npm run build`, then optionally `python tools/check_dashboard.py` with Playwright and Chromium installed. See `RELEASE-10.md` for exact scope and limitations. The environment used inline HTML and buffered audio, not physical mobile hardware or the AudioWorklet browser host.

## Repository boundary

Work only in `engine-lab/` on branch `engine-lab` of `antropos17/build_demo1`. Do not modify or merge the parent application without a separate request. Build output is ignored; generate the portable HTML locally.
