# 0.10.0: two-pedal test stand

## Applied changes

The lower cockpit has a retained-SVG tachometer, six status lamps, coolant and oil-pressure instruments, brake temperature, board voltage, brake torque, absorbed power, efficiency and absorbed energy. The old engineering readings remain in the expandable diagnostics section. A small brake rotor indicates mechanical activity without a second full-resolution canvas.

Gas and brake are independent analogue momentary controls. Pointer position maps to 0–100%: touching or dragging higher on a pedal increases travel. This does not claim pressure-sensitive touchscreen support. Two fingers can operate both pedals. Keyboard W / Arrow Up / Space progressively applies gas; S / Arrow Down / B progressively applies brake. Enter/Space operates the focused pedal. Releasing one source cannot cancel another held source. Blur, cancelled capture, hidden tabs, navigation and reset clear both inputs.

`src/dyno.js` integrates crank acceleration from net torque / inertia. Pedal position no longer directly picks an RPM target. Flywheel overrun, closed-throttle fuel cut and a hysteretic 6500 rpm limiter affect the shaft and continuous audio DSP. Brake loading changes actual RPM and absorbs power according to `P[kW] = T[Nm] * rpm * 2π / 60000`. Brake heat, fading above 380°C, cooling and wear are calculated separately. These brake thresholds, inertia and absorber capacity are explicit illustrative parameters, not specifications of a production vehicle or dynamometer.

This is still a stationary engine test stand, not a car. No invented road speed or gearbox is displayed. The brake is an illustrative friction absorber attached to the shaft. The low-speed safety coupling and torque assistance deliberately keep the last cylinder alive. This arcade rule is visible as the АНТИСТОП lamp. It is not a claim that an actual damaged engine can survive this treatment.

Save version 5 migrates versions 1–4, preserves brake temperature/energy and engine damage, and never restores pedal commands. No automatic restart, repair or game-over was added.

## Verification

- `npm test`: 59 tests passed, including new analogue-control, inertia, braking, heat/fade, save migration and one-hour survivor regressions.
- `python tools/check_dashboard.py`: 46 Chromium checks passed; no runtime exceptions. Tests include independent sources, trusted two-finger input via Chromium's touch input protocol, cancellation, mobile widths 320/360/390/768, actual nonzero bounded browser audio, inspection modes, bounded effects and manual reset.
- Portable HTML includes every runtime source/style with no network assets.
- Browser URL navigation is blocked in this environment: tests used the inline portable HTML. Audio ran through the buffered-DSP fallback. Physical mobile hardware, native saved state across navigation and the browser AudioWorklet host were not verified.
- Instrument markings are static SVG. Only changed text and needles update at the existing 10 Hz telemetry cadence. The hidden diagnostics graph is not redrawn. Existing cached engine materials, adaptive graphics and limited particle pools remain intact. Measurements in the attached JSON are local headless-render costs, not a device FPS guarantee.

## Technical references

Pointer ownership and capture follow MDN Pointer Events:
https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events

Absorbed-power/torque relationship and dynamometer concept:
https://www.magtrol.com/product/dial-weight-dynamometers/

This implementation does not reproduce Magtrol hardware or a certified engine model. It is an original extension of Last Piston's code.
