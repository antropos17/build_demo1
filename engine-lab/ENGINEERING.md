# Mechanical reference and limits

## Cycle

The model follows a four-stroke 720-degree cycle, with one 180-degree interval each for power, exhaust, intake and compression. The firing origin is power TDC. Firing offsets [0, 540, 180, 360] degrees produce order 1-3-4-2. The camshaft angle is half crankshaft angle. Ideal valve events have no overlap or advance, deliberately avoiding an unsupported claim about a production cam profile.

Reference: University of Washington / University of Windsor, Four Stroke Cycle Engines:
https://courses.washington.edu/engr100/All_Sections/Engine/UofWindsorManual/Four%20Stroke%20Cycle%20Engines.htm

## Contact damage

Longitudinal scoring, skirt contact patches, loss of lubricant film and local material transfer guide the artwork. They are attached to the cylinder or piston with deterministic seeds. Oil starvation and temperature increase local wear; cooling never erases accumulated damage.

Reference: Motorservice / Kolbenschmidt, Seizures due to lack of lubrication:
https://www.ms-motorservice.com/int/en/technipedia/seizures-due-to-lack-of-lubrication-955/

Reference: Motorservice / BF Engine Parts, Damage from overheating:
https://www.ms-motorservice.com/trbfep/en/technipedia/damage-from-overheating-973

## Not a calibrated digital twin

Geometry is a schematic longitudinal projection. Two cam rows and valve pairs are unfolded for visibility. Bore 86 mm, stroke 86 mm and rod 142 mm are illustrative parameters, not a manufacturer-specific identification. The 10.5 compression ratio is used in the pressure approximation.

Thermal masses, film thickness, pressure traces, friction torque and material-crack progression are simplified qualitative gameplay models. Pressure-derived indicated torque is diagnostic only; the existing assisted RPM model controls shaft speed. Do not interpret diagnostic values as measured or engineering-validated data.

Visible crank motion is deliberately slower than audible RPM. Degradation is accelerated and the last-cylinder torque/compression floors are explicit arcade rules. A real engine is not expected to keep running with this damage or without lubrication.
