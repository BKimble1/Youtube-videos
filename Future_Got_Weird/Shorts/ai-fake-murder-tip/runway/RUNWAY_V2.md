# Runway checker insert — decision record (V2)

**Outcome: not generated; 0 credits spent. The checker in V2 is the native Remotion rig, now a large medium close-up (`source/src/v2/inspect.tsx`, `checker5` in `flow.tsx`).**

Checked on 11 Oct 2026, before any spend:
- Connection: authenticated, workspace *Blake Kimble* (personal). Credits 2,198 (1,898 plan + 300 purchased). Ceiling for this Short = min(100, 25 % × 2,198 ≈ 549) = **100 credits**, all attempts included, no purchases.
- Existing jobs (`list_recent`, 20 newest): audio beds and effects from other FGW work and one unrelated Seedance clip. **No accepted checker character clip exists to reuse.**
- Result retrieval is still blocked: Runway output hosts `dnznrvs05pmza.cloudfront.net` and `dnf8butk8bbsy.cloudfront.net` are denied by the environment's egress policy (`curl` → `CONNECT tunnel failed, 403`). A paid clip could not be downloaded or inspected for face, glasses, pencil, edges or temporal stability, so it could not be used. Generating anyway would only spend credits.

Ready for a later pass:
- Start plate: `runway/start_plate_checker_portrait_1080x1920.png` (text-free portrait plate from V1's rig; V2's close-up uses the same rig at larger scale).
- Prompt to adapt (from the V2 brief): *"Locked medium close-up. The illustrated woman glances down at the paper, lifts one eyebrow, then settles into restrained disbelief. Small natural head movement and one blink. Clean flat editorial animation. The camera remains still."* Composite all lettering and the comparison in Remotion; use only the best 1–1.5 s; reject on any warp of face, glasses or pencil.
- To enable: allow `dnznrvs05pmza.cloudfront.net` in the environment's network policy. One controlled attempt plus one targeted retry, ≤ 100 credits.
