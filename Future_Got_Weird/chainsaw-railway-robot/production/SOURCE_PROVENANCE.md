# Source provenance and footage-rights ledger (V1, 2026-10-30)

**Bottom line.** No real footage is in V1. None of the source pages could be opened from this production environment,
and no reuse grant or licence exists in the repository. Every shot that should carry authentic footage is an original
FGW illustration in a labelled **source-footage slot** (orange `PREVIS` tag and viewfinder corners on screen). V1 is
therefore a **previsualization review**, not a publish-ready documentary.

## 1. What was attempted (and why it failed)

Each link in `FOOTAGE_SOURCES.md` was requested from this cloud session on 2026-10-30, by `curl` through the
session's proxy and with the WebFetch tool.

| ID | URL | Result |
|---|---|---|
| JR-EAST-ANN | youtube.com/watch?v=atRiAWBOe5U | proxy `CONNECT 403` (host not allowed by the environment's network policy) |
| JR-EAST-KAB | kab.co.jp/news/article/16973124 | proxy 403; WebFetch: host not resolvable from this session |
| JR-EAST-FNN | fnn.jp/articles/-/1137343 | proxy 403 |
| JR-WEST-OFFICIAL | westjr.co.jp/company/ir/movie/ | proxy 403 |
| JR-WEST-MAINICHI | video.mainichi.jp/detail/video/6407004278112 | proxy 403 |
| JR-WEST-PRESS | prtimes.jp/main/html/rd/p/000002408.000095753.html | proxy 403; WebFetch: host not resolvable |
| CONTROLS-REFERENCE | itmedia.co.jp/aiplus/article/2407/10/1240710186/ | proxy 403; WebFetch: host not resolvable |

So no source was **watched**. The in/out times, visual contents and machine geometry that the brief asks to record
"after actually watching" are **not recorded**, and none are invented here. Only web-search snippets (text) were
available. They are listed in `CLAIM_LEDGER.md` as secondary corroboration.

**To unblock screening:** allow these hosts in the environment's network settings (cloud environment menu → Edit →
Network access → Allowed domains): `www.youtube.com`, `www.kab.co.jp`, `www.fnn.jp`, `www.westjr.co.jp`,
`video.mainichi.jp`, `prtimes.jp`, `www.itmedia.co.jp`. Screening would still not be **clearance**.

## 2. Rights status (unchanged from the brief: nothing is cleared)

| Slot | On screen in V1 | Intended source | What is needed before real footage replaces the illustration |
|---|---|---|---|
| **FS-1** 0:00.00–0:19.70 | original illustration of the claw holding and the saw cutting, the cut breaking through, the held piece | JR-EAST-ANN (ANN News, 17 Oct 2026): the JR East machine cutting near Nobeyama, Koumi Line | written licence or permission from TV Asahi / ANN (or KAB) for this excerpt, territory worldwide, YouTube, duration of the excerpt, credit wording; or the creator's own documented fair-use assessment of this specific use |
| **FS-2** 0:19.70–0:32.72 | camera travel: torso → no legs → boom → rail-capable vehicle → cabin window | JR-EAST-ANN / KAB wider shots of the same machine | as FS-1 |
| **FS-3** 0:38.64–1:07.00 | wide machine, then both arms on a second branch: grip, saw angle, cut, hold, lift | JR-EAST-ANN / FNN, or JR West's official demo (JR-WEST-OFFICIAL), **labelled as JR West** if used | as FS-1; for JR West material, permission from JR West (public viewing on a corporate site is not permission) |
| **FS-4** 2:19.58–2:25.17 and 2:29.33–end | the saw stops; the ending grip and cut; pull back to the whole machine | JR-EAST-ANN | as FS-1 |

Cabin interiors (0:32.72–0:38.64 and 2:25.17–2:29.33) are labelled "Illustrative reconstruction of the cabin". No
cabin footage was screened, so the controller design, the monitors and the operator's position are **not** claimed
to match the real machine.

## 3. Dropping cleared footage into the project

When a clip is cleared:

1. Store it **locally** (not in the public repository; `raw/*.mp4` is Git-ignored), e.g. `raw/jr_east_2026_authorized_cutting_excerpt.mp4`.
2. Record the grant in `raw/LICENSES_AND_PROVENANCE.json`: owner, URL, title, publication date, licence or
   assessment, permitted channels/territory/term, credit wording, expiry, SHA-256, local path, in/out.
3. Copy or link it to `source/public/footage/<name>.mp4`, and fill its slot in `source/src/data/footage.json`:
   `file`, `in` (source seconds), `credit`, and set `cleared: true`.
   The film then plays the clip in that slot (`OffthreadVideo`) instead of the illustration, with the credit, and
   drops the `PREVIS` tag for that slot. The illustration remains the fallback for any slot without a cleared file.
4. Re-time if the real action runs at a different pace from the illustration; the narration timing does not move.

Do not obscure news watermarks or lower thirds. Do not present JR West footage as the JR East machine.

## 4. Original material in V1

- All picture: original Remotion/SVG vector art made for this episode (`source/src/`). The Weird Crew figure rig
  (`source/src/dc/`) is copied unchanged from `robot-faces` (channel-owned).
- Machines are **generic reconstructions from text descriptions** (a humanoid upper body with a camera head and two
  arms, on a boom from a rail-capable vehicle, a cabin on the vehicle). Proportions, colours, the claw's four fingers
  and the controllers are **not verified against reference media**. JR West's machines are drawn in a separate blue
  scheme so they cannot be mistaken for the JR East machine.
- Narration: ElevenLabs Test Voice (`audio/narration/voice_provenance.json`).
- Effects: ElevenLabs sound effects generated for this episode, plus synthesis (`audio/sfx/SFX_PROVENANCE.json`).
- Runway: used for seven sound effects. None reached the mix because the download host is blocked (see SFX
  provenance). No Runway picture was used. Generated video could not preserve the reconstructed geometry, and a
  generated "real-looking" machine would risk being read as footage.
