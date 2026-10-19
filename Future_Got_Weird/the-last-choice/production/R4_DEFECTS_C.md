# R4 defect list, section C (film 35.80 → 59.95, C1 … C6d)

Owner: SEC-C. Source: `source/src/r2/shots/C/*`. Before-evidence: the R3 review film (`exports/FGW_TheLastChoice_R3_REVIEW_1080p.mp4`,
frames every 1–2 at the times below; scratch sheets are not kept in the repo). "Observed" is what the frames show; "cause" is what
the source shows (probed with esbuild scripts that call `pilotC` / `figureRig` / `makeView`, as `qa/r4/legs`). Status is updated as
each fix is verified.

| # | Time (s) | Observed (R3 frames) | Cause (source) | Fix | Verification | Status |
|---|---|---|---|---|---|---|
| C-1 | 47.00 – 47.80 (C4b) | The drone pilot raises the drone with her left arm: from 46.97 to 47.20 the drone body and rotor arms cross her glasses and face (10 frames), her raised hand sits at her eyes, the drone on her forehead; from 47.2 to 47.8 the flare carrier's body / satchel and the decoy maker's legs touch her head outline | `crew.ts` `droneHandLoc`: the left hand went up the near side of her body to `HOLD_UP` r −130 u 420 (head-top height, only 0.52 m off her axis) and the C4b lens sat on her left side, so her left arm, the drone (0.64 m span) and her face lined up on screen; the probe shows the solved hand is within 0.01 m of the palm target (it was reachable: the drone did not float off the palm), the overlap is purely the projection of hold + lens. The climbers pass 1.4 m behind her, which on that lens is directly above/behind her head | see below | | open |

(Rows are added as each defect is established; the full list is completed before the report.)
