# Changelog

## 0.13.0 / 2026-11-15

- Embedded six downloaded and hash-verified CC0 WAVs; audio works offline.
- Fixed loop seams, starter cancellation, repeated-start node duplication and audio teardown.
- Added independent engine/mechanical volume controls and actual-recording browser checks.
- Authored eight SVG mechanical assets; cached atlas, five live part-inspection views.
- Detailed radiator, fan, filter bypass, pump, thermostat, fluid windows and muffler packing.
- Reused contact geometry workspaces; stopped trapped debris no longer releases on wall-clock age.
- Verified with 101 Node tests and 48 Chromium checks. See RELEASE-13.md.

## 0.12.0 / 2026-11-15

- Recorded-sound player with six credited CC0 sources, visible network failure and optional offline embed tool. Source binaries were not downloadable here.
- Finite oil/coolant cells, visible hose flow, thermostat bypass, vapour and contamination.
- Internal contact bodies, jamming, shearing, drag and secondary wear; persistent v7 saves.
- Sectioned silencer, collector leaks and bounded separated smoke sources.
- New regression checks; see RELEASE-12.md for evidence and limitations.

## 0.11.0 / 2026-11-15

- Manual ignition with physical cranking, safe starter interlock and non-destructive key-off.
- Battery charge/current/voltage, generator output/load, starter heat and fan after-run.
- Visible battery, starter/pinion, ring gear, generator rotor, shaft-coupled disc and caliper.
- Electrical dashboard, cranking audio, no fresh exhaust or pump-fed droplets when stopped.
- v6 migration; no persisted pedal or starter commands; corrected shared dashboard text ownership.
- 75 Node tests and 53 Chromium checks passed. See RELEASE-11.md.

## 0.10.0 / 2026-11-15

- Added lower instrument cluster and independent analogue gas/brake pedals.
- Replaced target-RPM animation with torque/inertia integration in the new dyno engine.
- Added absorbed power, brake heating, cooling, fade, wear and explicit anti-stall unloading.
- Added overrun/limiter fuel cut and brake-friction audio.
- Added v5 migration, two-finger source ownership and safe input release.
- Retained old telemetry in expandable diagnostics; no hidden graph redraws.
- Verified with 59 Node tests and 46 Chromium checks; see RELEASE-10.md.


## 0.9.0 / 2026-11-15

Continuous combustion DSP; bounded buffered fallback; fan-relay I²R heating and cooling feedback; rated-value telemetry; separate normal/stress profiles; cached mechanical surfaces; half-resolution smoke; adaptive quality; updated exhaust and electrical artwork; volume controls. See RELEASE-09.md for measured verification and limitations.

## 0.8.0 / 2026-11-15

- Rebuilt neutral-metal cutaway, lined/cross-honed bores, ring packs, crank counterweights, I-beam rods, five bearing caps, cam rows, valves, water jackets and oil jets.
- Added 720-degree stroke state, half-speed cams, analytic pressure diagnostics and per-node contact wear with compression and thermal feedback.
- Added deterministic scoring, material-transfer patches, progressive branched cracks and persistent damaged-rod geometry.
- Added section/oil/thermal/wear display layers, cylinder zoom, inspection pause and keyboard-accessible cylinder cards.
- Added validated v3 save migration without cylinder resurrection.
- 32 automated tests and 35 Chromium checks passed. Actual browser checks used inline HTML because this environment blocks URL navigation; no claim of hosted-origin or physical-phone verification.
- Retained indefinite last-piston survival and bounded effects.

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
