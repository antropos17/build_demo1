# Changelog

## 0.7.0 / 2026-11-15

### Added
- Compression-braked visual crank motion, combustion kicks and bounded last-cylinder misfires.
- Independent mount, cover and exhaust wear, with attached structural failure.
- Throttle-lift backfire, smoke rings, friction noise and resonant impact audio.
- Persistent damage journal, crank-motion trace, peak telemetry and cylinder readouts.
- Mobile sound/motion controls and two-step manual reset.
- Version-2 saves with version-1 migration and reconstructed floor wreckage.
- 13 additional automated tests and a reproducible optional Chromium verification script.

### Fixed
- Coolant steam and burning-oil smoke no longer have infinite source inventories.
- A missed combustion cycle no longer produces a successful ignition flash.
- Holding two inputs and releasing only one does not incorrectly release throttle.
- Small-screen canvases no longer stretch the mechanism vertically.
- Resizing redraws the canvas immediately, including when the test clock is paused.
- Reset clears journal entries and all effect accumulators.
- Muting status stays consistent when the throttle is pressed again.
- Permanent floor debris is kept within a bounded pool instead of expiring on a timer.

### Unchanged
- No terminal engine failure or automatic restart.
- Last-piston survival remains an explicit arcade rule.
- No external runtime dependencies or backend.
