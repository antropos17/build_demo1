# 0.12.0: internal debris, fluid circuits and recorded-sound player

## Implemented

- A new recorded-sound player replaces the active synthetic engine. Six credited CC0 sources supply idle/load, starter, impact, rattle and clicks. Stable loop nodes crossfade with RPM and load; impacts and jams trigger bounded one-shots. Mute, volume, page suspension and input activation remain. Errors are visible; there is no oscillator fallback. The old DSP module remains only for backwards-compatible standalone tests.
- Finite oil and coolant inventories are transported through six cells per circuit. Flow responds to shaft speed, wet inventory, thermostat routing, vapour and metal contamination. Transparent inspection hose sections show actual transport phase, fill and bubbles; filter, oil galleries, jets, sump and expansion tank are visible. Stopping the shaft stops circulation after its transient. Fluid totals follow the parent reservoirs, not an infinite decorative emitter.
- Internal fragments are model state. They collide with bore walls, piston crowns, crank pins, counterweights, bearing bulkheads, pan walls and each other. Moving surfaces transfer velocity; restitution and friction dissipate contacts. Pinched fragments remain, add drag/heat, score liners and contaminate oil. Repeated work can free or shear a chip. A failed cylinder creates debris inside its chamber/crankcase rather than a renderer-generated external piston explosion.
- The finite pool has 64 bodies. A sorted broad phase reduces pair checks, crank collider geometry is calculated once per substep, and fluid working arrays are reused. Contacts use 240 Hz substeps within the fixed model update. The last working cylinder retains explicit low-speed/drag assistance; no new terminal failure is introduced.
- The exhaust has four primary runners, collector, welded joints and a sectioned silencer with baffles. Pressure packets, heat lag and upstream leaks affect smoke sources. Steam, burning oil and soot use separate source conditions and finite inventories. Smoke expands and rises, with existing bounded half-resolution rendering.
- Added circuit rates, contamination, vapour, internal piece/jam counts, collision count and fragment drag telemetry. Existing ignition, electricity, analogue gas/brake, mobile multi-touch, inspection pause, zoom, four layers and save migration remain.
- Save version 7 validates fluid cells and internal wreckage, preserving locations and jamming. Held pedal/starter inputs never persist. Previous saves migrate without fabricating historical fragments.

## Scope and limits

This is an original 2D contact/transport extension to Last Piston, not CFD, deformable-body mechanics or a certified engine simulator. Conservative disc/box colliders approximate fragment shapes. Thermal and flow parameters are illustrative; stress mode accelerates aging. The last cylinder's continued operation is intentionally arcade behaviour. Only the user's key-off stops it.

Audio binaries could not be downloaded in this environment. The delivered build loads recordings over the network. `npm run audio:fetch && npm run build` creates the embedded offline soundbank on a connected machine. See SOURCES.md. Real source audio has not been auditioned; a browser test fixture validates the PLAYER, not the recordings' timbre or successful external delivery. The test fixture is absent from delivered artifacts.

## Reproduce checks

`npm test` runs model, DSP legacy, inventory, contact, jam, migration, finite-state, build and hour-long survivor regressions.

`npm run build` packs all local scripts/styles into `dist/last-piston.html`.

`python tools/check_realism.py` needs Playwright and Chromium. It uses inline HTML, verifies controls/layers/contacts/persistence and source-failure handling, and injects an in-memory WAV fixture solely for recorded-buffer playback tests. It writes screenshots and a JSON report under `dist/verification-12`. Physical mobile hardware and hosted-origin persistence are not verified by this script. Its raster timings are local headless measurements, not a promised FPS.
