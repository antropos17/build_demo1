# Last Piston / ENGINE LAB 09

One throttle. Four cylinders. The last piston never stops.

A standalone procedural engine cutaway with combustion audio, contact wear, a thermally coupled fan relay, finite fluids and persistent damage. No external runtime dependencies, backend or downloaded assets.

## Run

Open `index.html`, or build the portable single-file version:

```sh
npm test
npm run build
```

Open `dist/last-piston.html`. Hold **ГАЗ**, Space or Arrow Up. M toggles sound. R twice resets the engine. Cylinder cards zoom the cutaway. Inspection controls switch layers or pause. **Настройки стенда** contains normal/stress profiles, graphics quality and volume. Hidden tabs pause simulation and audio.

## Version 0.9

Continuous combustion DSP with exhaust resonance, intake and bearing noise; relay current and contact heating affect radiator-fan speed; cached mechanical surfaces and half-resolution smoke; automatic rendering budgets; improved collector, silencer, soot and heat staining; unitful power, torque, exhaust-temperature and fuel-flow displays.

[Release details, sources and verification limits](RELEASE-09.md).

The model uses a 1998 cc / 110 kW / 192 N·m reference envelope, not an OEM digital twin. Thermal timing and damage are deliberately accelerated in stress mode. Last-cylinder survival remains a gameplay exception even without oil.

## Development

`src/powertrain.js` extends the thermal/electrical model; `src/mechanics.js` handles 720-degree kinematics and contact wear; `src/effects.js` adds cached rendering; `src/audio.js` contains the shared AudioWorklet/buffered DSP; `src/app.js` handles input, scheduling and UI.

47 automated tests pass. `python tools/check_release.py` is an optional Playwright/Chromium integration check. Browser verification in the current environment uses inline HTML; hosted AudioWorklet integration and physical mobile hardware were not tested.

## Repository

Current home: `antropos17/build_demo1`, branch `engine-lab`, folder `engine-lab/`. The parent app's main branch is untouched. This folder can become an independent repository: extract the project ZIP outside any Git tree, authenticate GitHub CLI, then run `bash tools/publish-github.sh last-piston`. It creates a private repository by default; `--public` is explicit. Repository creation was not available through the connected tool.
