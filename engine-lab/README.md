# Last Piston / Engine Lab 12

A cutaway engine sandbox with manual ignition, analogue gas/brake, finite fluids and internal wreckage. The last working piston survives.

## Run

```sh
npm test
npm run build
```

Open `dist/last-piston.html`. The engine, graphics, controls and persistence work offline. **Recorded audio requires network access in this distribution.** Audio sources, credits and exact limitations are in `SOURCES.md` and in the app's sound section.

To embed recordings for an offline build on a connected machine:

```sh
npm run audio:fetch
npm run build
```

No account, API key or runtime package is required. The download script does not overwrite an existing soundbank unless all source files succeed.

## Controls

Click **ЗАПУСК**. Hold either pedal; a higher pointer position applies more travel. Two fingers can independently operate gas and brake. W / Arrow Up / Space applies gas; S / Arrow Down / B applies brake. Release is momentary. M toggles sound. R twice confirms a new engine. Manual key-off preserves wear and internal fragments.

Click a cylinder card for zoom. Inspection pause and section/oil/thermal/wear layers remain available. Settings contain graphics quality, reduced motion, volume, normal/stress mode and battery support. The brake loads a stationary test stand, not a fictional vehicle.

## Version 0.12

- Recorded engine/mechanical sample PLAYER with six credited CC0 source files, no synthetic fallback.
- Transported oil/coolant, visible hose flow, thermostat bypass, bubbles and contamination-sensitive oil filter.
- 64 bounded internal fragment bodies, moving-surface contacts, pinching, friction, shearing and secondary damage.
- Sectioned exhaust silencer, upstream leaks and separated finite-inventory smoke sources.
- Version-7 persistence and new diagnostics. Existing electrical, pedal and last-piston rules retained.

This is a simplified 2D contact/finite-volume game model, not a production-engine digital twin or CFD simulation. Generic engine recordings are not a factory soundtrack of the depicted I4. See `RELEASE-12.md` for test scope and assumptions.

## Main additions

`src/internals.js`: model-owned contact physics, fluid circuits and save migration.
`src/realism-view.js`: pipes, exhaust and internal fragments.
`src/sample-bank.js`, `src/sample-audio.js`: source credits and recorded-buffer audio.
`assets/soundbank.js`: optional offline payload, empty in the online-audio distribution.
`tools/fetch-audio.cjs`: verified-format downloader and embedding.
`tests/internals.test.cjs`, `tools/check_realism.py`: regression coverage.

## Repository boundary

Only `engine-lab/` on branch `engine-lab` of `antropos17/build_demo1`. Do not modify or merge the parent application without a separate request. No game-over, automatic restart or zero-active-cylinder terminal state. Only manual key-off stops the survivor.
