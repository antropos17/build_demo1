# 0.11.0: manual ignition and electrical test stand

Applied to the existing Last Piston project. The two independent analogue pedals, cutaway, inspection layers, finite fluids and last-cylinder survival remain.

## What changed

- Fresh engines start with ignition off. One key button starts, cancels cranking or switches ignition off. Switching off does not reset damage, heat, fluid inventory or session history. The shaft coasts and the brake can bring it to rest.
- Cranking uses battery current, internal resistance, motor back-EMF and starter torque. A short spin-up precedes ignition. The starter disengages after the engine catches and is interlocked against an already spinning engine. Low charge and an applied brake can prevent a start. External battery power is a separate manual action in settings, available only with ignition off; it never repairs the engine.
- The alternator supplies electrical loads and charges the battery when output permits. Its output is speed-dependent and creates shaft load. Battery current has a sign: positive is charging. The fan relay now receives the modelled bus voltage rather than an unrelated RPM-only number. Hot fan after-run consumes battery power after manual key-off.
- Battery, generator rotor, starter/pinion, flywheel ring gear and the actual stand brake are visible. The rotating brake disc connects to the crankshaft through a coupling; the caliper remains stationary. Brake pad smoke follows brake heat and demand. Added hardware uses bounded caches.
- The key and electrical instruments show battery state of charge, current, alternator output, starter current and starter temperature. Corrected stale dashboard status across off/crank/running transitions and duplicate temperature units.
- Sound gains an electrical cranking layer and key/solenoid clicks. Combustion stops with ignition off; residual fan and mechanical spin remain audible. No fixed engine recording or external samples are used.
- Version 6 saves preserve electrical temperatures, battery charge and manual running/off state. A save during cranking restores off; pedal inputs and an energized starter never persist. Old v1–v5 saves retain damage and migrate into running state.

## Deliberate approximations

The 60 Ah battery, 90 A alternator, 14.2 V regulator, starter torque and thermal constants are illustrative assumptions, not the factory specification of a particular production engine. The diagram unfolds accessory positions for readability. The starter and alternator principles were checked against DENSO's technical pages:

- https://www.denso-am.eu/news/starter-troubleshooting
- https://www.denso-am.eu/news/alternator-troubleshooting
- https://www.denso-am.eu/products/rotating-electrics/alternator

There is no automatic terminal failure. Once running, the last cylinder remains assisted even with exhausted fluids or very low battery. Only the user's key-off stops it. Electrical integration is not a certified diagnostic or battery-chemistry model.

## Verification

`npm test`: 75 Node tests passed, including start/sag/catch, charging load, key-off coast, damaged restart, weak battery, starter interlock, fan after-run, safe persistence, silent-off DSP and an hour of virtual survivor operation with both pedals.

`python tools/check_ignition.py`: 53 Chromium checks passed with no runtime exceptions. They exercise real UI actions, analogue and two-finger controls, ignition transitions, audio output, diagnostic modes, mobile widths, resets, finite effects and render-state purity. Screenshots were inspected.

Browser URL navigation was blocked by this environment. Tests used inline standalone HTML and the buffered-DSP audio fallback. Physical phone hardware, browser-hosted AudioWorklet and native persistence across real navigation were not verified. The AudioWorklet processing module is tested separately in Node. Local headless render timings in the report are not a device-FPS guarantee.

Run `npm test`, `npm run build`, then optionally `python tools/check_ignition.py` with Playwright and Chromium installed. The new standalone file remains dependency-free at runtime.
