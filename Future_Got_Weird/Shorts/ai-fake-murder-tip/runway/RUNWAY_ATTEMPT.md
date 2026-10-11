# Runway checker-reaction insert — decision record (V1)

**Outcome: not generated; no credits spent. The reaction in the film is the native Remotion rig** (`source/src/b3.tsx`, `CheckerWindow`/`checkerPose`).

## What was inspected first
- Connection: authenticated; workspace *Blake Kimble* (personal, Pro). Credits: **2,198** (1,898 plan + 300 purchased). Spending ceiling for this Short = min(100, 25 % × 2,198 ≈ 549) = **100 credits**, all attempts included.
- Models available include `gen-4-turbo`, `gen-4.5`, `seedance-2*`, `kling-3-*`, `veo-3.1`, `wan3*`, `hailuo-3` (from `whoami`).
- **Result retrieval is blocked.** Runway output URLs are on `dnznrvs05pmza.cloudfront.net` (and previews on `dnf8butk8bbsy.cloudfront.net`). A free test with an existing signed asset from `list_recent` returned `CONNECT tunnel failed, 403` and the proxy log shows `connect_rejected` for both hosts: the organisation's egress policy denies them. The earlier channel episode hit the same wall.
- Consequence: a paid clip could not be downloaded or inspected (identity, accessory placement, edge quality, temporal stability), so it could not be used. Generating it anyway would only spend credits.

## Ready for a later pass
- `start_plate_checker_portrait_1080x1920.png`: text-free portrait start plate rendered from the native checker rig (`ReactionPlate` composition).
- Suggested prompt (adapt to the model's current guidance): *"Locked medium close-up of this same illustrated character. The character glances from a laptop to a blank field off-camera, lifts one eyebrow, blinks once, and settles. Small natural head movement, restrained dry disbelief. Preserve the original flat illustration, face, glasses, clothing, silhouette, and pencil placement. The background stays still."* Portrait 9:16, 5 s, no audio, no lettering. Composite exact UI in Remotion; use only the best 1–2 s.
- To enable: allow `dnznrvs05pmza.cloudfront.net` (and the Runway upload host) in the environment's network policy, then run one job within the 100-credit ceiling.
