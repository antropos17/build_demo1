# Sound sources and redistribution

Six explicitly credited audio files. This release provides the sample player and source manifest; it does NOT contain downloaded originals. Audio is requested on the first user gesture. Simulation and graphics work offline. If network/CORS/media access fails, an error is shown instead of switching back to the synthetic engine.

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

Run `npm run audio:fetch` on a machine with internet access, then `npm run build`. The downloader checks WAV headers and size, writes base64 to `assets/soundbank.js`, and records source URLs, credits and SHA-256 hashes in `assets/audio-manifest.json`. Files are embedded only after every download succeeds. Failure leaves the existing soundbank unchanged. Keep this file with redistributed builds.

Playback processing: mono downmix, bounded gain normalization, 35 ms loop overlap, restrained playback-rate variation, filtered equal-power RPM crossfades and limited simultaneous one-shots. No synthetic engine is used as an error fallback.

## Verification limitation

The build environment could read source/license pages but could not download audio binaries. Therefore the actual recordings were not auditioned, and their end-to-end loading cannot be claimed as tested. Browser audio tests inject a generated WAV fixture in memory to test decoding, looping, mixing and lifecycle only. That fixture is never written to the delivered HTML or archive.
