# Last Piston 0.9

## Play

Open `index.html`, or run `npm run build` and open `dist/last-piston.html`. No dependencies, API keys, downloaded audio or backend. Hold the throttle, Space or Arrow Up. The last cylinder never stops; this remains an explicit arcade rule.

## Changes

- Continuous four-stroke combustion DSP, cylinder-specific pulses and misfires, delay-line exhaust resonance, intake noise, bearing rattle, fan and relay clicks. AudioWorklet where available; the same DSP produces short buffered chunks elsewhere. One signal chain with a limiter, volume and mute.
- Cached casting, bore damage, piston surfaces, connecting rods and pulley faces. Smoke composites at half resolution. Bounded particles, adaptive 60/30 fps target, canvas-resolution budget, reduced update rates for telemetry and storage. No unbounded catch-up after a long frame.
- Separate fan-relay coil and contacts. Copper coil resistance changes with temperature; contact heat is I²R. Starting current, contact wear, voltage drop, thermal protection and thermostat hysteresis affect fan speed and cooling. A detached cabinet and radiator show the electrical mechanism.
- Redrawn exhaust collector, silencer, welds, rolled tailpipe and soot. Pulse-driven exhaust, finite-source oil smoke and steam, dull heat staining instead of a glowing engine block. Stationary relay is no longer covered by the timing belt.
- Unitful output: kW, N·m, exhaust °C, intake bar absolute, fuel L/h, fan current A and supply V. Gauge smoothing does not change simulation state. A dry oil or coolant system is identified rather than displaying a fictitious liquid temperature.
- Ordinary-operation and accelerated-stress profiles. Normal thermal timing no longer inherits the old seconds-to-failure rate. Stress multiplies thermal evolution by 8; wear remains a separately accelerated gameplay approximation, not an exact lifetime factor. Last-piston survival is retained in both.

## Rating reference and assumptions

Toyota's 2000 UK 1AZ-FE specification supplies a rating envelope: 1,998 cm³, 86 × 86 mm, 9.8:1, 110 kW at 6,000 rpm, 192 N·m at 4,000 rpm. This is not an OEM-calibrated digital twin. The cutaway geometry is generic, including its timing-drive projection. Idle speed, limiter, interpolated torque curve, heat capacities, radiator conductance, relay coefficients, exhaust temperature and fuel consumption are stated design assumptions. Displayed torque/output include modelled loss and need not exactly equal catalog peak ratings.

References:
- https://media.toyota.co.uk/new-toyota-rav4-replaces-style-icon/
- https://www.te.com/en/products/relays-and-contactors/electromechanical-relays/intersection/coil-drive-relay-contactor-performance.html
- https://www.te.com/en/products/relays-and-contactors/electromechanical-relays/intersection/coil-voltage-temperature-compensation.html
- https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas
- https://developer.mozilla.org/en-US/docs/Web/API/AudioWorklet

## Verification

`npm test`: 47 passing tests, including hour-long one-cylinder operation, normal-mode thermal equilibrium, relay hysteresis and I²R, finite fluids, version-4 save migration, audio at 44.1/48/96 kHz and standalone packaging.

`python tools/check_release.py`: browser interaction, screenshots, actual nonzero audio signal, layers, zoom, profile/quality/volume controls and 390/320 px layouts. Python Playwright and Chromium are optional development dependencies. The current environment blocks URL navigation; tests use inline portable HTML. Real hosted AudioWorklet loading, physical mobile hardware and native storage across navigation are not verified. AudioWorklet processor execution is separately tested in Node; browser audio uses the buffered-DSP path.

An equal-scene comparison uses the same saved one-cylinder engine, 225 smoke particles, debris, 1158 × 656 canvas and 1280 px viewport. With 30 warm-up renders and 120 samples, forced-raster median fell from 36.8 ms to 20.4 ms (44.6%). The GPU readback forces completion. This is a renderer benchmark, not a guarantee of device frame rate. JSON evidence accompanies the downloadable release.

## Standalone repository

The connected GitHub tool can update the existing `antropos17/build_demo1` / `engine-lab` branch but does not expose repository creation. This folder is independently runnable. After installing/authenticating GitHub CLI, `bash tools/publish-github.sh last-piston` creates a **private** standalone repository and pushes this folder. It refuses to run inside an existing Git working tree, preventing an accidental push of the parent app. Pass `--public` explicitly to create a public repository instead.
