# Development contract

When working in the parent repository, work only inside `engine-lab/` on branch `engine-lab`. The extracted standalone folder is also supported. Do not merge this standalone prototype into the parent application's main branch or modify the parent application without a separate request.

The defining rule is last-piston survival. Never add terminal engine failure, a game-over screen, automatic restart, or a zero-active-cylinder state. Three cylinders may fail individually; the last continues with reduced output. Do not hide this deliberate arcade rule behind claims of physical accuracy.

Keep two independent momentary controls: analogue gas and brake. Brake loads the test-stand shaft, not a fictional vehicle. Never persist held pedal inputs. Keep mobile touch release/cancel, keyboard, reduced-motion, tab suspension and local-save validation working. No remote services or runtime dependencies are necessary.

Engine model, renderer, audio and application lifecycle remain separated. Run `npm test` and `npm run build` after edits. Test extended one-cylinder operation, cooling without resurrection, bounded particle memory, and the portable build. Do not claim AudioWorklet/mobile hardware verification without actually running it.

Version 0.9 entry points: `src/powertrain.js` extends the thermal/relay model, `src/effects.js` adds cached rendering, and `src/audio.js` owns one continuous DSP. Keep source ordering in index.html. Keep real-time thermal timing separate from accelerated stress and preserve units. Do not claim a newly created repository without a successful creation result.

Version 0.10: dyno.js replaces target-RPM interpolation with torque/inertia integration. pedals.js owns independent pointer/key sources; dashboard.js updates retained SVG instruments. Brake absorbed power uses Nm × rpm × 2π / 60000. Keep the arcade anti-stall coupling explicit.

Version 0.11: ignition.js owns manual off/cranking/running states and electrical loads. Manual key-off is allowed, but never infer automatic terminal failure. Last-cylinder assistance remains active once running. Never persist cranking, held gas, brake or energized starter. PoweredRelay consumes electrical voltage; do not add a second bus-voltage model. bench.js mounts the absorber and battery to the stand, not the shaking engine block. Run the new tools/check_ignition.py regressions.

Version 0.12: internals.js owns all internal fragments and finite fluid transport. Never move/contact particles during render. Keep the body pool capped at 64 and external effects bounded. Preserve single-cylinder assistance and v7 safe migration. realism-view.js intercepts old external piston/rod fireworks. sample-audio.js overrides active MotorAudio with recordings, never a secret synthetic fallback. This distribution has EMPTY assets/soundbank.js and requires network for audio. Do not claim downloaded/verified real audio based on test fixtures. Run npm run audio:fetch on a connected machine before claiming offline sound. Credits and provenance are in SOURCES.md.
