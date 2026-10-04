# Restrained motion

MOTION-001 SHOULD use movement to clarify state and continuity. CSS handles simple interaction/entrance effects. Reuse an existing library, or select Motion when sequencing, gestures or layout transitions justify it. Do not introduce React to animate a static page or install two runtimes for one need. Keep content and actions available immediately.

The intended feel is quiet, responsive and continuous, inspired by a specific quality of Apple's interfaces. These proposed starting ranges are VINASIG tuning aids, not Apple specifications: press/hover 120-180 ms, overlays 180-280 ms, reveals 350-550 ms and 8-16 px movement. A product such as Favicon Forge may sensibly use less movement. Tune tokens against the adopted design system and real content rather than applying these values everywhere.

MOTION-002 MUST respect reduced motion, maintain usable final states, handle rapid interruption/reversal and clean up listeners/animations on unmount. Prefer transform/opacity where suitable, avoid layout-heavy loops, scroll-jacking, strong bounce, large blur/parallax and unnecessary infinite decoration. Never defer the primary content for a reveal.

Capture video or frames for timing/continuity, interact on mobile and run performance traces where necessary. Screenshots or screen recording alone do not measure compositor FPS. Explain repeated style/layout work, long tasks and asset load stalls before selecting fixes.

Motion AI Kit is optional. Official documentation distinguishes free docs/example metadata access from Motion+ capabilities, and its pages differed about free spring generation on the verification date. The current install page places spring generation, MotionScore and premium source behind Motion+. Verify access in the user's account. Never promise MotionScore availability or run its installer globally by default. Chrome DevTools tracing remains the local diagnostic fallback.
