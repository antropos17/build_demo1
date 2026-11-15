# 0.13.0 / recorded audio and mechanical assets

Applied to the existing 0.12 project, preserving its controls, v7 saves and last-piston rule.

## Delivered audio

Six original WAVs (idle, loaded engine, starter, impact, rattle and click) were downloaded and checked for WAV structure, size and SHA-256. Their original durations range from 0.313 to 2.367 seconds. They are included as files and embedded into the portable HTML. Original authors and source pages are in SOURCES.md; no third-party code was copied.

Playback now removes DC and averages channels before bounded normalization. Tail/head overlaps join the actual retained loop boundary. Persistent idle/load/rattle loops crossfade by engine state. One-shots are capped at 12, collisions are panned, and startup samples fade out when the engine catches or ignition is cancelled. Independent engine/mechanical mix controls persist on the device. Pending requests are aborted and nodes disconnected on destruction; repeated start gestures retain only three loop sources.

No synthetic engine is used as an error fallback. These recordings are not a calibrated sound model of the illustrated I4. The recordings were decoded and measured in the browser, not subjectively auditioned.

## Vector detail

Eight original SVGs add radiator fins and louvers, formed fan blades, pleated filter media, pump internals, thermostat spring, perforated muffler tubes, packing, welds and flange hardware. The atlas is self-contained, titled and script-free. Seven component assets are integrated in the live drawing; the flange is also provided as a reusable source asset. SVG surfaces are rasterized once into approximately 1.21 MB of cached pixel surfaces rather than reconstructed each frame.

Five additional part-inspection targets zoom to radiator, pump, filter, exhaust and crankcase. The inspection continues to display the model's fluid speed, vapor fraction, filter contamination/bypass and exhaust pulses. Existing cylinder inspection and four diagnostic layers remain. No external image or font dependencies were added.

## Physics and performance

Internal-contact calculations reuse geometry objects for current, previous and frozen piston positions. This reduces per-substep garbage rather than reducing physics resolution. Jam age advances only while the shaft rotates; stationary trapped pieces cannot free themselves just because time passes. Existing finite fluids and bounded effects are retained.

This is 2D contact mechanics and a reduced flow network, not full CFD or deformable 3D simulation. The last cylinder still receives explicit arcade assistance. No automated terminal stop or repair was added.

## Verification

- 101 Node tests passed, 0 failures, including source/embedded hash matching, PCM preparation, loop seams, geometry equivalence, stable workspace ownership and stopped jam persistence.
- 48 Chromium checks passed with no JavaScript runtime exceptions. Actual embedded CC0 recordings decoded with HTTP blocked and produced nonzero bounded audio. No audio fixture was injected.
- Recorded audio signal in one running scenario: RMS 0.0480, peak 0.0790 at the measured bus. This is a functional signal test, not a listening-quality rating.
- Destruction stress test retained the last cylinder and bounded pools: 258 smoke particles, 40 internal bodies, 23 external fragments and 24 raster-cache entries in the sampled scene.
- Forced audio stress remained within 12 one-shots; destruction left zero loop/one-shot nodes and a closed AudioContext.
- Five part inspections, four layers, persistent damage, key-off, independent pedals, trusted two-finger input, volume/mute, confirmed reset and 320/360/390/768px widths were exercised. Screenshots were inspected.
- A local headless eco-render sample recorded a 14.2 ms median and 15.2 ms p95 across 30 samples. This is not a device FPS guarantee or a comparable speedup benchmark against a previous release.

The main automated browser suite used inline portable HTML with all network blocked. No physical Android/iOS device or subjective listening session was tested. Original factory specifications and certified fluid/thermal calculations are outside this toy model's scope.

Reproduce with `npm run assets:verify`, `npm test`, `npm run build`, and `python tools/check_assets.py` (requires Playwright and Chromium).
