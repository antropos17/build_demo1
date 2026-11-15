# Development contract

When working in the parent repository, work only inside `engine-lab/` on branch `engine-lab`. The extracted standalone folder is also supported. Do not merge this standalone prototype into the parent application's main branch or modify the parent application without a separate request.

The defining rule is last-piston survival. Never add terminal engine failure, a game-over screen, automatic restart, or a zero-active-cylinder state. Three cylinders may fail individually; the last continues with reduced output. Do not hide this deliberate arcade rule behind claims of physical accuracy.

Keep one primary visible control: hold throttle. Keep mobile touch release/cancel, keyboard, reduced-motion, tab suspension and local-save validation working. No remote services or runtime dependencies are necessary.

Engine model, renderer, audio and application lifecycle remain separated. Run `npm test` and `npm run build` after edits. Test extended one-cylinder operation, cooling without resurrection, bounded particle memory, and the portable build. Do not claim AudioWorklet/mobile hardware verification without actually running it.

Version 0.9 entry points: `src/powertrain.js` extends the thermal/relay model, `src/effects.js` adds cached rendering, and `src/audio.js` owns one continuous DSP. Keep source ordering in index.html. Keep real-time thermal timing separate from accelerated stress and preserve units. Do not claim a newly created repository without a successful creation result.
