#!/usr/bin/env python3
"""Write research/claims.csv: one row per consequential claim in the Video 02 script.

Columns: claim_id, exact_proposed_assertion, source_url, locator, date_version, setup_conditions, evidence_status,
access_method, verification, script_lines, scene.

evidence_status: experimentally_supported | reported_by_authors | independently_demonstrated | illustrative |
                 inference | proposed_application | unresolved
access_method:   direct (primary text/file read here) | code_or_data (released code/data inspected or run here) |
                 search_summary (web-search report of the named page; nature.com, arxiv.org, media.mit.edu and PMC are
                 blocked from this container) | derivation (computed here)
The script lines that use each claim are read from script/narration_segments.json, so the ledger and script agree.
"""
import csv
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NAT = "https://www.nature.com/articles/s41586-026-10502-x"
ARX = "https://arxiv.org/html/2605.17865v1"
GH = "https://github.com/sidsoma/consumer-nlos"
GHC = "commit 15314de422a765a2d1b72ea7037dfafb2f908d7c"
PROJ = "https://cornar.media.mit.edu/"
V12 = "https://www.nature.com/articles/ncomms1747"
O18 = "https://www.nature.com/articles/nature25489"
N21 = "https://pmc.ncbi.nlm.nih.gov/articles/PMC8586255/"
SPEC = "https://spectrum.ieee.org/smartphone-grade-lidar"

ROWS = [
    ("C01", "A sensor pointed at a blank relay wall cannot see a person hidden behind a partition directly.",
     f"{GH} (README 'Tips for setting up your hardware'); research/geometry/layout.json",
     "README; geometry_check.py visibility checks", f"{GHC}; layout v1",
     "Illustrative room: partition blocks every straight sensor-to-person line (71 checks pass)",
     "illustrative", "direct; derivation", "geometry checks pass", "S1"),
    ("C02", "The opening/act-4 plot shows the authors' own released measurements from a 2026 experiment: a sensor aimed at a wall while a hidden person moved, processed with the authors' published tracking code.",
     f"{GH} paper/captured_data/st_spad_person_tracking; paper/tracking.py",
     "475 frames, 4x4 zones x 128 bins, 250 ps; tracking.py run by us (seeds 0-2); stored particle means in the files",
     f"{GHC}; data first committed 2025-10-20 (capture date unresolved); paper published 20 May 2026",
     "ST VL53L8 family evaluation kit, sensor fixed (wall points identical in all frames); data released already background-subtracted and wall-masked; config isDiffuse:False (retroreflective falloff model); clothing of the person undocumented; occluder position from the authors' plot code",
     "experimentally_supported", "code_or_data",
     "our run vs stored means: median top-down gap 8.1 cm, r=0.97 (x), 0.99 (z); not ground truth (none released)", "S1, S6"),
    ("C03", "The experiment is from 2026 (publication 20 May 2026, Nature 653, 693-699).",
     NAT, "article record; PubMed 42162390", "published online 20 May 2026; issue 21 May 2026",
     "publication date, not the capture date", "reported_by_authors", "search_summary (many agreeing searches)", "high", "S1, S6"),
    ("C04", "The light does not pass through the partition; it reaches the hidden person by bouncing off the relay wall and returns by the same kind of indirect route.",
     f"{V12}; {O18}; {NAT}", "mechanism common to all three papers; Nature 2026 Fig. 1a caption ('turning nearby diffuse surfaces into virtual mirrors')",
     "2012, 2018, 2026", "requires an indirect path via a surface visible to both sensor and hidden object",
     "independently_demonstrated", "search_summary; direct (2018 PDF via mirror)", "supported", "S1, S8"),
    ("C05", "Only a tiny fraction of the emitted light returns from the hidden person via the wall.",
     "research/geometry/NOTES.md section 6", "radiometric estimate", "estimate 2026-10-08",
     "best-case Lambertian estimate (albedos assumed); order 1/380 to 1/6,000 of the first bounce",
     "inference", "derivation", "consistent in order with ams data (C12)", "S1, S3"),
    ("C06", "Light travels about 30 cm per nanosecond, so a longer path arrives later and the extra delay encodes extra distance; delays here are a few nanoseconds.",
     "physical constant; research/geometry/layout.json", "c = 29.98 cm/ns; illustrative room delays 6.4-8.9 ns after the wall return",
     "n/a", "illustrative room numbers", "illustrative", "derivation", "computed", "S1, S3"),
    ("C07", "This needs a time-of-flight sensor (a small LiDAR) of the kind used in some phones and robots to measure distance; an ordinary webcam cannot time light at this scale.",
     f"{PROJ}; {NAT}", "project FAQ ('the same consumer LiDAR sensors found in smartphones, AR/VR headsets, and autonomous vehicles'); abstract ('picosecond resolution')",
     "2026", "describes sensor class, not a stock phone feature", "reported_by_authors", "search_summary", "consistent across searches", "S1"),
    ("C08", "A mirror reflects light at the same angle it arrived, keeping an image intact.",
     "law of reflection", "textbook optics", "n/a", "specular surface", "independently_demonstrated", "derivation", "standard physics", "S2"),
    ("C09", "A matte painted wall scatters light in many directions; each spot acts like a weak, scrambled mirror.",
     f"{NAT}; research/geometry/NOTES.md", "Fig. 1a caption ('virtual mirrors'); Lambertian scattering", "2026",
     "diffuse (near-Lambertian) relay wall; analogy labelled", "independently_demonstrated", "search_summary; derivation", "supported", "S2"),
    ("C10", "The returning light is not a scrambled photograph that can be reassembled; each return mixes many paths and what survives is arrival timing.",
     "research/geometry/NOTES.md section 5.2; project FAQ ('not photographs')", "zone histogram = sum over paths", "2026",
     "metaphor limit", "inference", "derivation; search_summary", "supported by the measurement model", "S2"),
    ("C11", "At each diffuse bounce the light spreads out and most of it is lost, so the wall's own reflection dominates and the hidden echo is tiny.",
     "research/geometry/NOTES.md section 6; O'Toole 2018 SI Supp. Fig. 1 (1/r^4 diffuse)", "radiometry", "2018; estimate 2026-10-08",
     "diffuse target; retroreflective targets return far more", "independently_demonstrated", "derivation; direct (2018 SI via mirror)", "supported", "S3"),
    ("C12", "In the authors' raw data from one of their sensors, the hidden-object bump arrives a few nanoseconds after the wall flash and is hundreds of times weaker.",
     f"{GH} paper/captured_data/ams_U_reconstruction (iter_22)", "research/code_reproduction/out/fig1_ams_wall_peak_vs_late_return.json",
     f"{GHC}; data first committed 2025-12-04",
     "ams 3x3-zone sensor (model not named), 88 ps bins, sensor ~0.23 m from wall, U-shaped target on a controlled raster; ratio 256-576x is our peak-height measure; NOT the ST kit",
     "experimentally_supported", "code_or_data", "our measurement of released data", "S3"),
    ("C13", "Simplified picture: treat the sensor as sending and listening at a single spot on the wall (confocal), as the authors' code models each zone.",
     f"{GH} paper/train/canon.py:83-84; {O18}", "code models c*t = 2|w_i - p| per zone", f"{GHC}; 2018",
     "labelled 'simplified picture (2D)'; real ST kit floods its whole field and detects 16 zones", "illustrative", "code_or_data", "supported", "S4"),
    ("C14", "One arrival time fixes the distance from the wall spot to the hidden point but not the direction: every point on a circle (arc in front of the wall) fits.",
     "research/geometry/NOTES.md section 3", "r = (c t - 2|SW|)/2", "n/a", "2D confocal simplification", "illustrative", "derivation", "71 checks pass", "S4"),
    ("C15", "A second wall spot gives a second circle; in front of the wall the two cross in only one place (the other crossing is behind the wall).",
     "research/geometry/NOTES.md sections 3 and 7", "mirror ambiguity", "n/a", "2D, noise-free", "illustrative", "derivation", "computed", "S4"),
    ("C16", "Noise turns each arc into a band and the bands overlap in a region rather than a point.",
     "research/geometry/NOTES.md section 7", "regions table (+/-3.75 cm illustrative band)", "n/a",
     "band width illustrative (one 250 ps bin), not a measured precision", "illustrative", "derivation", "computed", "S4"),
    ("C17", "Spreading the listening spots farther apart narrows the region; bunched spots leave it long and blurry.",
     "research/geometry/NOTES.md section 7 (outer pair = all four; long diagonal 2*delta*sqrt(w^2+z^2)/w)", "derivation", "n/a",
     "geometric intersection picture; real estimators also average noise", "illustrative", "derivation",
     "matches authors' reported error growth away from the virtual aperture (search_summary)", "S4"),
    ("C18", "A real system searches for the hidden position that best explains all the timings at once using a light-transport model plus assumptions such as the object's shape.",
     f"{GH} paper/train/model.py, score.py, optim.py, motion.py; {NAT}", "particle filter: render, score, resample; point canonical model",
     f"{GHC}; Extended Data Fig. 1 (final)", "tracking assumes known shape (point canonical in released code)", "experimentally_supported", "code_or_data; search_summary", "supported", "S4"),
    ("C19", "The output is a likely location or a rough shape, not a photograph.",
     f"{PROJ}; {SPEC}", "FAQ ('not photographs'; 'sparse geometric and motion information'); lead author in IEEE Spectrum", "2026",
     "authors' own characterisation", "reported_by_authors", "search_summary", "consistent", "S4, S7"),
    ("C20", "In 2012 an MIT team recovered the 3D shape of a small (about 20 cm) diffuse wooden mannequin hidden around a corner.",
     V12, "Velten et al., Nat. Commun. 3:745, Fig. 1", "published 20 March 2012",
     "diffuse mannequin; femtosecond laser + streak camera; acquisition time unresolved", "experimentally_supported",
     "search_summary; direct (figure copy via third-party mirror)", "medium-high", "S5"),
    ("C21", "The 2012 setup used an ultrafast (femtosecond) laser and a streak camera on a lab bench.",
     V12, "Methods (Ti:Sapphire ~50 fs, Hamamatsu C5680 streak camera)", "2012", "lab equipment", "experimentally_supported", "search_summary", "two searches agree", "S5"),
    ("C22", "In 2018 a Stanford team pointed the laser and detector at (almost) the same wall spot and scanned it (confocal NLOS).",
     O18, "main text p. 338; SI 'Equipment details' (two slightly different points to reduce direct light)", "published online 5 March 2018",
     "single SPAD, 670 nm laser, galvanometer scan", "experimentally_supported", "direct (PDF via third-party mirror, metadata matches publisher)", "high", "S5"),
    ("C23", "That made reconstruction a closed-form step taking about a second on a laptop, while collecting the measurements still took minutes.",
     O18, "Exit Sign: LCT 1 s on MacBook Pro for 64x64x512; capture 6.8 min (main text, SI Table 1)", "2018",
     "retroreflective exit sign; diffuse S took 68 min", "experimentally_supported", "direct (PDF via mirror)", "high", "S5"),
    ("C24", "By 2021 researchers in Wisconsin and Milan made live non-line-of-sight video of ordinary (non-retroreflective) objects at 5 frames per second with purpose-built SPAD detectors.",
     N21, "Nam et al., Nat. Commun. 12:6526, abstract and Methods", "published 11 November 2021",
     "two 16x1 fast-gated SPAD arrays (PoliMi), 532 nm laser, 0.2 s exposure, ~1 s latency, room lights on", "experimentally_supported",
     "search_summary; direct (author site)", "medium-high", "S5"),
    ("C25", "All three earlier demonstrations used research-grade equipment.",
     f"{V12}; {O18}; {N21}; {NAT} abstract ('research-grade LiDAR devices')", "hardware descriptions", "2012-2021", "summary", "reported_by_authors", "search_summary; direct", "supported", "S5"),
    ("C26", "In 2026 a team from MIT and Dartmouth demonstrated NLOS imaging on consumer-grade time-of-flight (LiDAR) sensors.",
     NAT, "author affiliations; abstract", "published 20 May 2026", "smartphone-grade proprietary device plus open ST kit", "reported_by_authors", "search_summary", "high", "S6"),
    ("C27", "These are the kind of small time-of-flight sensors that ship in consumer devices.",
     f"{PROJ}; {NAT}", "FAQ opener; abstract", "2026", "sensor class; no stock-phone app exists (lead author quotes)", "reported_by_authors", "search_summary", "consistent", "S6"),
    ("C28", "Consumer sensors are hard to use for this: low laser power, low spatial resolution (about 100 pixels on the smartphone-grade device) and camera/object motion.",
     f"{NAT}; {SPEC}", "abstract (low laser power, low spatial resolution, object and camera motion); IEEE Spectrum ('about 100 pixels')", "2026",
     "~100 pixels = proprietary smartphone-grade unit; the open ST kit used 4x4 zones", "reported_by_authors", "search_summary", "medium-high", "S6"),
    ("C29", "Their approach fuses many frames, inspired by burst photography (and synthetic aperture radar).",
     NAT, "abstract", "2026", "", "reported_by_authors", "search_summary", "two searches", "S6"),
    ("C30", "Between frames the sensor and the person move; plain averaging would smear them, so the model accounts for motion (motion-induced aperture sampling: object shape, object motion and camera motion in one model).",
     f"{NAT}; {GH} paper/train/motion.py, canon.py", "abstract; Fig. 2; random-walk predict + resample", f"2026; {GHC}",
     "illustrated in our room: naive intersection empties, motion-compensated keeps the person (illustrative)", "reported_by_authors", "search_summary; code_or_data; derivation", "supported", "S6"),
    ("C31", "Sensor motion samples new wall spots (a new listening spot); object motion is followed as a changing position.",
     f"{GH} paper/captured_data/st_spad_cam_localization; canon.py:137-142", "released cam-loc data: sampled pattern drifts up to 0.30 m",
     GHC, "the drift data are camera localization with a retroreflective patch; benefit size in our room illustrative", "experimentally_supported", "code_or_data", "supported", "S6"),
    ("C32", "The open demo uses an off-the-shelf ST evaluation kit; the authors describe off-the-shelf hardware for less than US$100 (project page: ST sensor about $50).",
     f"{NAT}; {PROJ}; {GH} README", "abstract; 'Try it yourself'; README section 1 (P-NUCLEO-53L8A1)", "2026",
     "needs firmware flashing, wall calibration and an empty-room background capture", "reported_by_authors", "search_summary; direct", "abstract wording high; ~$50 majority of searches", "S6"),
    ("C33", "With the sensor stepped through known positions, a different sensor (ams, 3x3 zones) recovered a hidden U-shaped object.",
     f"{GH} paper/reconstruction.py; captured_data/ams_U_reconstruction", "36 hard-coded positions (serpentine raster) in reconstruction.py:69-88; run by us",
     f"{GHC}; data first committed 2025-12-04", "controlled known motion, static object; backprojection", "experimentally_supported", "code_or_data", "clear U in our run of the authors' code", "S6"),
    ("C34", "Many of the authors' tests used retroreflective material on the target (cloth, gloves, patch), which returns far more light.",
     f"{ARX}; {NAT}", "manuscript methods ('retroreflective cloth ... to preserve the confocal image formation model'); SV2 gloves; SV3 patch", "2026",
     "retroreflectors raise returns by orders of magnitude (O'Toole 2018 SI; Nam 2021 'at least 10,000 times')", "reported_by_authors", "search_summary", "two searches", "S6"),
    ("C35", "Their 3D reconstructions used known sensor positions (gantry or programmed raster) of static objects.",
     f"{ARX}; {GH} reconstruction.py", "manuscript E1/E2 (gantry, known pose); ams raster", "2026", "not unrestricted handheld scanning", "reported_by_authors", "search_summary; code_or_data", "supported", "S6"),
    ("C36", "The open kit needs a flat wall to calibrate against and a few seconds of empty-room background first.",
     f"{GH} README sections 5-6; calibrate.py; track.py", "~2 s background (background_seconds=2.0)", GHC, "ST demo", "experimentally_supported", "direct", "high", "S6"),
    ("C37", "The authors report tracking a hidden person without special retroreflective clothing at 30 Hz capture.",
     NAT, "Supplementary Video 1 caption ('Real-time diffuse tracking ... without any special retroreflective materials at 30 Hz capture')", "2026",
     "device, distances, accuracy and processing latency unresolved; capture rate is not latency", "reported_by_authors", "search_summary (4+ searches)", "caption high; video not viewed", "S6"),
    ("C38", "The code is public; as of 8 October 2026 we found no independent group reporting a reproduction with its own hardware.",
     f"{GH}; research/context/NOTES.md section 1", "59 forks enumerated, none with new commits; 5 searches", "as of 2026-10-08",
     "code availability is not replication", "inference", "code_or_data; search_summary", "absence of evidence, dated", "S6"),
    ("C39", "Robots or vehicles getting an early hint of movement around a blind corner (e.g. warehouse robots) is a proposed application.",
     f"{PROJ}; {SPEC}", "FAQ applications; IEEE Spectrum (warehouse robots)", "2026", "potential use, not demonstrated in deployment", "proposed_application", "search_summary", "supported as proposal", "S7"),
    ("C40", "Open challenges include range, difficult surfaces (dark or glossy), direct sunlight, and real-time performance on mobile hardware; the authors call it an early-stage research prototype.",
     f"{PROJ}; {GH} README tips", "FAQ ('early-stage research prototype'; open problems); README (glossy/dark walls worse, sunlight saturates)", "2026",
     "", "reported_by_authors", "search_summary; direct", "supported", "S7"),
    ("C41", "No study has shown that NLOS sensing prevents collisions.",
     "research/context/NOTES.md section 4", "extended search", "as of 2026-10-08", "Doppler-radar NLOS (Scheiner et al. 2020) shows detection/tracking, not crash reduction",
     "inference", "search_summary", "absence of evidence, dated", "S7"),
]


def main():
    segs = json.load(open(os.path.join(ROOT, "script/narration_segments.json")))["segments"]
    used = {}
    for s in segs:
        for c in s["claims"]:
            used.setdefault(c, []).append(s["id"])
    ids = [r[0] for r in ROWS]
    missing = sorted(set(used) - set(ids))
    assert not missing, f"script cites claims missing from the ledger: {missing}"
    unused = [i for i in ids if i not in used]
    out = os.path.join(ROOT, "research/claims.csv")
    with open(out, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["claim_id", "exact_proposed_assertion", "source_url", "locator", "date_version", "setup_conditions",
                    "evidence_status", "access_method", "verification", "script_lines", "scene"])
        for r in ROWS:
            w.writerow([r[0], r[1], r[2], r[3], r[4], r[5], r[6], r[7], r[8], " ".join(used.get(r[0], [])), r[9]])
    print(f"wrote {out}: {len(ROWS)} claims; unused by script: {unused or 'none'}")


if __name__ == "__main__":
    main()
