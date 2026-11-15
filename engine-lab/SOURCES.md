# Audio and SVG provenance / 0.13

This release includes six downloaded CC0 WAV source files in `assets/audio/` and embeds the same bytes in `assets/soundbank.js`. Source SHA-256, duration and original PCM properties are recorded in `assets/audio-manifest.json`. `npm run assets:verify` checks originals against the embedded bank and recorded hashes.

## Sources

| Layer | Creator | File / source | Declared license |
| --- | --- | --- | --- |
| Idle loop | domasx2 | https://opengameart.org/content/racing-car-engine-sound-loops (`loop_0.wav`) | CC0 |
| Loaded engine | MarlonHJ | https://freesound.org/people/MarlonHJ/sounds/242740/ (`ENGINE.WAV`) | CC0, as credited by the pinned mirror below |
| Starter | looneybits | https://opengameart.org/content/car-engine-start-01 | CC0 |
| Metallic impact | Brian MacIntosh / BMacZero | https://opengameart.org/content/mechanical-sounds (`clank1.wav`) | CC0 |
| Mechanical rattle | Brian MacIntosh / BMacZero | https://opengameart.org/content/mechanical-sounds (`rattle1.wav`) | CC0 |
| Short metal click | Brian MacIntosh / BMacZero | https://opengameart.org/content/metal-impact-sounds (`clink1_0.wav`) | CC0 |

The MarlonHJ file is mirrored at a pinned Bugged Racing revision. Its README specifically attributes this sound and identifies it as CC0, separate from the repository's other assets:
https://github.com/esensar/bugged-racing/blob/de0f97c7e0148968bbe65eda513c1dfc7060292e/README.md

CC0 terms: https://creativecommons.org/publicdomain/zero/1.0/

These are generic engine and mechanical recordings, NOT a factory-recorded acoustic model of the illustrated 2.0 I4. Layer labels and nominal playback RPMs are mixing assumptions. This project is not an acoustic clone of a production engine. No third-party game code is copied.

## Offline packaging

The delivered HTML includes all six recordings and all eight SVG components. No audio download is required at runtime. `npm run audio:fetch` reuses hash-verified local originals and downloads only missing or damaged files. A changed upstream hash requires manual provenance review; any failure leaves the existing bank untouched. `npm run build` creates the portable HTML.

The files were retrieved in a dedicated GitHub Actions helper branch, `engine-lab-audio13-assets`, with hashes checked before being copied into the main project source. The workflow is not merged into the parent application's main branch.

Runtime processing: mono downmix, DC removal, peak-limited gain normalization, a loop-boundary overlap of up to 35 ms, filtered equal-power RPM crossfades and at most 12 simultaneous one-shots. The originals remain unchanged. Source recordings are generic, not an acoustically calibrated production I4. Browser tests decode the ACTUAL embedded recordings with HTTP blocked and measure nonzero bounded playback. No synthetic fixture replaces a source in the shipped files. There was no subjective listening evaluation in this environment.

## Original SVG work

`assets/svg/` contains radiator-core, fan-rotor, filter-cutaway, pump-cutaway, pump-impeller, thermostat-cutaway, muffler-cutaway and flange. These vector assets were authored for Last Piston, not copied from third-party packs. `tools/make-svg-assets.py` reproducibly creates their source, manifest and embedded atlas. All SVGs have titles and contain only local vector primitives. No font files, remote images or scripts are embedded. Source hashes are in `assets/svg-manifest.json`.

Static SVG surfaces are decoded once into a bounded atlas; moving rotors, valves, liquid windows, contamination and exhaust pulses follow the existing simulation rather than playing a detached animation.
