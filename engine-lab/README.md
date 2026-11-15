# Last Piston / Engine Lab 11

A browser cutaway engine with a lower instrument cluster, analogue accelerator and brake. The last piston keeps going.

## Run

```sh
cd engine-lab
npm test
npm run build
```

Open `dist/last-piston.html` directly in a browser. It is fully self-contained. No runtime packages, API keys, remote assets, backend or trackers are required. The modular `index.html` can also be served by any static server.

## Start and stop

Click **ЗАПУСК** before pressing the pedals. The starter cranks, the engine catches, and the alternator takes over. **ЗАГЛУШИТЬ** manually cuts ignition without repairing anything. A weak battery can be charged using **Пусковое питание АКБ** in settings; this is not an engine reset.

## Controls

| Input | Gas | Brake |
| --- | --- | --- |
| Touch or mouse | Hold the right pedal; drag higher for more travel | Hold the left pedal; drag higher for more travel |
| Keyboard | W, Arrow Up, or Space | S, Arrow Down, or B |
| Focused pedal | Enter or Space | Enter or Space |

Two fingers work at once. Each pedal is momentary and returns on release. Keyboard travel is progressive. M toggles sound. R twice within four seconds resets the engine. Graphical settings, normal/stress mode, volume and reduced shake remain available. Hidden tabs pause audio and simulation.

## What's new in 0.11

Manual ignition, battery state/current/voltage, starter engagement and heat, speed-dependent alternator output with mechanical load, and fan after-run. Added actual stand brake, flywheel ring gear, starter/pinion and battery artwork. Sound distinguishes cranking, combustion, key-off coast and stopped silence. Version-6 save migration keeps damage and never resumes a held starter. See `RELEASE-11.md` for assumptions and checks.

## Previous 0.10 foundation

A bottom dashboard with a tachometer, warning lamps, oil pressure, coolant, brake heat, supply voltage, absorbed torque/power/energy and a rotor preview. Engine RPM comes from a torque/inertia balance, not a pedal-to-RPM animation. The brake adds shaft load and produces heat, fade and wear. Limiter and overrun fuel cut are heard in the existing continuous audio engine.

This is a stationary test stand, not a driving simulator. There is no invented km/h display. Explicit low-speed assistance protects the last cylinder; mechanical aging and stress-test heating are intentionally accelerated. All non-rated physical constants are illustrative model assumptions.

Version-5 saves migrate old damage, never held inputs. Previous journal, smoke, oil, cooling relay, cylinder zoom, four inspection layers, finite fluids and bounded cached rendering are retained.

## Project structure

- `src/simulation.js`, `dynamics.js`, `mechanics.js`, `powertrain.js`: base model and thermal/electrical subsystems.
- `src/ignition.js`, `bench.js`, `ignition-panel.js`, `ignition.css`: start/stop, electrical state and hardware/instruments.
- `src/dyno.js`: analogue commands, shaft inertia, limiter, brake absorption, heat/fade and v5 persistence.
- `src/pedals.js`: independent pointer/key ownership and safe input release.
- `src/dashboard.js`, `dashboard.css`: retained SVG instruments and pedal materials.
- `src/renderer.js`, `workshop.js`, `cutaway.js`, `effects.js`: cutaway and cached visual effects.
- `src/audio.js`: one continuous worklet/buffered DSP.
- `src/app.js`: lifecycle, fixed-step loop, settings and telemetry.

## Verification

75 Node tests and 53 Chromium checks passed in this iteration. Run `npm test`, `npm run build`, then optionally `python tools/check_ignition.py` with Playwright and Chromium installed. See `RELEASE-11.md` for exact scope and limitations. The environment used inline HTML and buffered audio, not physical mobile hardware or the AudioWorklet browser host.

## Repository boundary

Work only in `engine-lab/` on branch `engine-lab` of `antropos17/build_demo1`. Do not modify or merge the parent application without a separate request. Build output is ignored; generate the portable HTML locally.
