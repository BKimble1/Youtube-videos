#!/usr/bin/env python3
"""Write the Video 02 narration script ("How Cameras See Around Corners") and its directed generation sections.

Each segment has
  text   display / subtitle text (correct spellings)
  tts    the Eleven v4 prompt: same words as `text` (IPA between slashes where the voice could misread a word),
         plus delivery tags in square brackets and pause punctuation. Tags are not words; the assembler strips them
         before mapping the forced alignment onto the display words.
  pause_after_ms  target gap after the segment (the voice's own pause counts towards it)
  claims          claim IDs in research/claims.csv that the line depends on
  direction       what the line has to do, for take selection

Sections are what gets generated in one go (2-3 segments, so delivery flows inside a section and every line can still
be picked from a different take of the same section).

Writes script/narration_segments.json, script/narration_sections.json and script/SCRIPT.md.
"""
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LIDAR = "/ˈlaɪdɑːr/"

SEGS = [
    # id, scene, display text, tts prompt, pause after (ms), claim ids, direction
    # ---------------------------------------------------------------- act 1: the impossible view (S1)
    ("s01", "S1", "Our friend here is hiding. There's a partition between him and that sensor, and he is very pleased about it.",
     "[lightly amused] Our friend here is hiding. There's a partition between him and that sensor, and he is VERY pleased about it.",
     350, [], "cold open: warm, amused, quick; the joke is the character's smugness, not the narrator's"),
    ("s02", "S1", "The sensor can't see him. It's pointed at a plain, blank wall.",
     "[curious] The sensor can't see him. It's pointed at a plain, blank wall.",
     300, ["C01"], "matter-of-fact setup"),
    ("s03", "S1", "And yet this is real data from a 2026 experiment: a small sensor, aimed at a wall, following someone it never saw directly.",
     "And yet… this is real data from a 2026 experiment: a small sensor, aimed at a wall, following someone it never saw directly.",
     700, ["C02", "C03"], "the reveal: small pause after 'And yet', then clear and confident; let 'never saw directly' land"),
    ("s04", "S1", "Here's the trick. The light doesn't go through the partition. It goes around it, by way of the wall.",
     "[warmly] Here's the trick. The light doesn't go THROUGH the partition. It goes around it, by way of the wall.",
     350, ["C04"], "friendly explainer; light stress on 'through' and 'around'"),
    ("s05", "S1", "The sensor sends out a short flash. Some of it hits the wall and scatters. A little of that reaches the hidden person, and a tiny bit comes back the same way: wall, then sensor.",
     "The sensor sends out a short flash. Some of it hits the wall and scatters. A little of that reaches the hidden person… and a tiny bit comes back the same way: wall, then sensor.",
     350, ["C04", "C05"], "follow the light like a story; slightly slower on 'a tiny bit'"),
    ("s06", "S1", "That roundabout trip is longer, so the light arrives a little later. A few billionths of a second later.",
     "That roundabout trip is longer, so the light arrives a little later. [dryly] A few billionths of a second later.",
     300, ["C06"], "set up, then a dry undercut on the size of 'a little'"),
    ("s07", "S1", f"Your webcam can't time that. This takes a time-of-flight sensor, a small LiDAR, the kind of part some phones and robots use to measure distance.",
     f"Your webcam can't time that. This takes a time-of-flight sensor… a small {LIDAR}, the kind of part some phones and robots use to measure distance.",
     300, ["C07"], "define the sensor plainly, beside the object; not a list"),
    ("s08", "S1", "Light covers about thirty centimetres in a nanosecond. So timing is distance, and the extra delay is a clue about where the hidden person is.",
     "Light covers about thirty centimetres in a nanosecond. So timing is distance… and the extra delay is a clue about where the hidden person is.",
     900, ["C06"], "the opening's takeaway; confident, end with a settled cadence before act 2"),
    # ---------------------------------------------------------------- act 2: the wall relays information (S2, S3)
    ("s09", "S2", "Why does a plain wall work at all? Start with a mirror.",
     "[curious] Why does a plain wall work at all? Start with a mirror.",
     300, [], "new chapter: curious question"),
    ("s10", "S2", "A mirror is orderly. Light leaves at the same angle it arrived, so the picture stays in one piece. Put a mirror here, and our friend is simply visible.",
     "A mirror is orderly. Light leaves at the same angle it arrived, so the picture stays in one piece. Put a mirror here… and our friend is simply [dryly] visible.",
     800, ["C08"], "clear; joke 2 lands on 'visible' after a beat (he ducks)"),
    ("s11", "S2", "A painted wall is rough at a tiny scale. It throws light out in every direction at once, so each spot on it behaves like a weak, scrambled mirror.",
     "A painted wall is rough at a tiny scale. It throws light out in EVERY direction at once, so each spot on it behaves like a weak, scrambled mirror.",
     400, ["C09"], "explainer; stress 'every'"),
    ("s12", "S2", "You might picture a postcard shredded into confetti, waiting to be sorted back together. It's worse than that. There's no photo hiding in the wall. Every return is already a mix of many paths. What survives is timing.",
     "You might picture a postcard shredded into confetti, waiting to be sorted back together. [lightly amused] It's worse than that. There's no photo hiding in the wall. Every return is already a mix of many paths… What survives is timing.",
     800, ["C10"], "the metaphor and its limit; 'What survives is timing' is the act's thesis, give it room"),
    ("s13", "S3", "Follow one useful path: sensor, wall, person, wall, sensor. At every bounce, the light spreads out, and most of it is lost.",
     "Follow one useful path: sensor… wall… person… wall… sensor. At every bounce, the light spreads out, and most of it is lost.",
     350, ["C05", "C11"], "the five stops are a rhythm, unhurried"),
    ("s14", "S3", "So most of what comes back is the wall's own reflection. The echo from the hidden person is tiny.",
     "So most of what comes back is the wall's own reflection. The echo from the hidden person is tiny.",
     350, ["C11"], "plain; 'tiny' small"),
    ("s15", "S3", "These are real measurements from one of the researchers' sensors: the wall's flash, and then, a few nanoseconds later, a small bump. Here, hundreds of times weaker.",
     "These are real measurements from one of the researchers' sensors: the wall's flash… and then, a few nanoseconds later, a small bump. [softly] Here, hundreds of times weaker.",
     400, ["C12"], "evidence voice: careful and specific"),
    ("s16", "S3", "That bump is the clue. Its timing says how much farther the light travelled.",
     "That bump is the clue. Its timing says how much farther the light travelled.",
     900, ["C06"], "short, confident; end of act 2"),
    # ---------------------------------------------------------------- act 3: timing becomes geometry (S4)
    ("s17", "S4", "So let's turn timing into geometry. Here's the room from above, with one simplification: the sensor sends and listens at a single spot on the wall.",
     "[energetic] So let's turn timing into geometry. Here's the room from above, with one simplification: the sensor sends and listens at a single spot on the wall.",
     300, ["C13"], "energy up for the central sequence; the simplification is said openly, not hidden"),
    ("s18", "S4", "Measure the extra delay, and you know how far the person is from that spot. Not which direction. Just how far.",
     "Measure the extra delay, and you know how far the person is from that spot. Not which direction… Just how far.",
     300, ["C14"], "precise; small beat before 'Just how far'"),
    ("s19", "S4", "So he could be anywhere on this arc.",
     "So he could be anywhere on this arc.",
     900, ["C14"], "joke 3 setup: he relaxes; leave space"),
    ("s20", "S4", "Now listen at a second spot. Another delay, another arc. In front of the wall, they cross in just one place.",
     "Now listen at a second spot. Another delay, another arc. In front of the wall, they cross in just [slowly] one place.",
     800, ["C15"], "joke 3 payoff: his smile fades on 'one place'"),
    ("s21", "S4", "Real measurements are noisy, so each arc is really a band, and the bands overlap in a region, not a perfect point.",
     "Real measurements are noisy, so each arc is really a band… and the bands overlap in a region, not a perfect point.",
     300, ["C16"], "honest uncertainty, said as useful understanding"),
    ("s22", "S4", "Spread the listening spots out, and the region narrows. Keep them bunched together, and it stays long and blurry.",
     "Spread the listening spots out, and the region narrows. Keep them bunched together, and it stays long and blurry.",
     350, ["C17"], "a rule of thumb with a contrast"),
    ("s23", "S4", "A real system doesn't draw arcs. It searches for the hidden position that best explains every faint timing at once, using a model of how light travels, plus assumptions, like what kind of object it's looking for.",
     "A real system doesn't draw arcs. It searches for the hidden position that best explains every faint timing at once, using a model of how light travels… plus assumptions, like what kind of object it's looking for.",
     300, ["C18"], "the reconstruction model in one sentence; clear, unhurried"),
    ("s24", "S4", "That's why the answer is a likely location, or a rough shape. Not a photograph.",
     "That's why the answer is a likely location, or a rough shape. Not a photograph.",
     1000, ["C19"], "settle; end of act 3"),
    # ---------------------------------------------------------------- act 4: what became more accessible (S5, S6)
    ("s25", "S5", "None of this is brand new. In 2012, a team at MIT recovered the 3D shape of a small mannequin hidden around a corner.",
     "None of this is brand new. In 2012, a team at MIT recovered the 3D shape of a small mannequin hidden around a corner.",
     300, ["C20"], "storyteller; history in brisk steps"),
    ("s26", "S5", "It took an ultrafast laser and a streak camera: lab equipment that filled a table.",
     "It took an ultrafast laser and a streak camera: lab equipment that filled a table.",
     350, ["C21"], "light emphasis on 'filled a table'"),
    ("s27", "S5", "In 2018, a Stanford team pointed the laser and the detector at almost the same spot on the wall and scanned it. That made the math so simple, a reconstruction took about a second on a laptop. Collecting the measurements still took minutes.",
     "In 2018, a Stanford team pointed the laser and the detector at almost the same spot on the wall, and scanned it. That made the math so simple, a reconstruction took about a second on a laptop. [dryly] Collecting the measurements still took minutes.",
     350, ["C22", "C23"], "the 2018 step; dry on 'still took minutes'"),
    ("s28", "S5", "By 2021, researchers in Wisconsin and Milan were making live video of ordinary objects around a corner, five frames a second, with detectors built for the job.",
     "By 2021, researchers in Wisconsin and Milan were making live video of ordinary objects around a corner… five frames a second, with detectors built for the job.",
     300, ["C24"], "momentum"),
    ("s29", "S5", "Impressive. But all of it ran on research equipment.",
     "Impressive. [short pause] But all of it ran on research equipment.",
     800, ["C25"], "turn: sets up the 2026 question"),
    ("s30", "S6", "Then, in 2026, a team from MIT and Dartmouth tried the kind of small time-of-flight sensor that already ships in consumer gadgets.",
     "Then, in 2026, a team from MIT and Dartmouth tried the kind of small time-of-flight sensor that already ships in consumer gadgets.",
     300, ["C26", "C27"], "the episode's news beat; confident, not breathless"),
    ("s31", "S6", "Those are tough customers. Weak lasers. Very few pixels: about a hundred on their smartphone-grade sensor. And if you hold one in your hand, it jiggles.",
     "Those are tough customers. Weak lasers. Very few pixels: about a hundred on their smartphone-grade sensor. [lightly amused] And if you hold one in your hand, it jiggles.",
     400, ["C28"], "three problems as a quick rhythm; small smile on 'jiggles'"),
    ("s32", "S6", "Their fix borrows an idea from phone cameras: combine many quick, weak measurements into one better estimate.",
     "Their fix borrows an idea from phone cameras: combine many quick, weak measurements into one better estimate.",
     300, ["C29"], "clear"),
    ("s33", "S6", "The catch is that things move between frames. The sensor wobbles, so it listens at slightly different spots on the wall. The person moves too. Just averaging the frames would smear everything together.",
     "The catch is that things move between frames. The sensor wobbles, so it listens at slightly different spots on the wall. The person moves too. Just averaging the frames would smear everything together.",
     300, ["C30"], "the problem, plainly"),
    ("s34", "S6", "So their model keeps track of the motion, and puts it to work. A wobble becomes a new listening spot. A step becomes a new position to follow.",
     "So their model keeps track of the motion, and puts it to work. A wobble becomes a new listening spot. A step becomes a new position to follow.",
     500, ["C30", "C31"], "the idea that makes 2026 different; satisfying parallel"),
    ("s35", "S6", "Here's their released data, run through their published code: a sensor from an off-the-shelf kit that costs well under a hundred dollars, following a person behind a partition.",
     "Here's their released data, run through their published code: a sensor from an off-the-shelf kit that costs well under a hundred dollars, following a person behind a partition.",
     350, ["C02", "C03", "C32"], "evidence voice, specific"),
    ("s36", "S6", "With a sensor stepped through known positions, a different sensor rebuilt the outline of a hidden U-shaped object.",
     "With a sensor stepped through known positions, a different sensor rebuilt the outline of a hidden U-shaped object.",
     400, ["C33"], "second result, with its condition in the sentence"),
    ("s37", "S6", "The fine print matters. Many of their tests used reflective material on the target, which sends far more light back. Reconstructions used known sensor positions. And the open kit needs a flat wall to calibrate against, and a few seconds of the empty room first.",
     "The fine print matters. Many of their tests used reflective material on the target, which sends far more light back. Reconstructions used known sensor positions. And the open kit needs a flat wall to calibrate against… and a few seconds of the empty room first.",
     300, ["C34", "C35", "C36"], "conditions as useful understanding, not a disclaimer"),
    ("s38", "S6", "The authors also report tracking a person in ordinary clothes at thirty frames per second. Their code is public, though we found no independent team reporting a reproduction yet.",
     "The authors also report tracking a person in ordinary clothes at thirty frames per second. Their code is public… though we found no independent team reporting a reproduction yet.",
     900, ["C37", "C38"], "fair and plain; end of act 4"),
    # ---------------------------------------------------------------- act 5: usefulness, limits, payoff (S7, S8)
    ("s39", "S7", "So what could it be good for? Picture a delivery robot rolling toward a blind corner in a warehouse.",
     "[curious] So what could it be good for? Picture a delivery robot rolling toward a blind corner in a warehouse.",
     300, ["C39"], "new chapter, curious"),
    ("s40", "S7", "With a suitable wall at the junction, a sensor like this might give it an early hint that something is moving around the bend.",
     "With a suitable wall at the junction, a sensor like this MIGHT give it an early hint that something is moving around the bend.",
     300, ["C39"], "'might' carries the hedge without sounding legal"),
    ("s41", "S7", "That hint would be a fuzzy blob, not a picture. Enough to say slow down, not enough to say who is there.",
     "That hint would be a fuzzy blob, not a picture. Enough to say [slowly] slow down… not enough to say who is there.",
     350, ["C19", "C39"], "concrete benefit and its limit"),
    ("s42", "S7", "And the hard parts are real: short range, dark or shiny surfaces, bright sunlight, and fast computing on small hardware. The researchers call it an early-stage prototype.",
     "And the hard parts are real: short range, dark or shiny surfaces, bright sunlight, and fast computing on small hardware. The researchers call it an early-stage prototype.",
     300, ["C40"], "a quick list of four, then a plain attribution"),
    ("s43", "S7", "No one has shown that it prevents collisions. For now, it's a promising clue, not a safety system.",
     "No one has shown that it prevents collisions. For now, it's a promising clue, not a safety system.",
     900, ["C41"], "settled, honest"),
    ("s44", "S8", "Which brings us back to our friend.",
     "[lightly amused] Which brings us back to our friend.",
     500, [], "callback, warm"),
    ("s45", "S8", "Being out of sight is not the same as sending no information. The light found a way around.",
     "Being out of sight is not the same as sending no information. The light found a way around.",
     600, ["C04"], "the episode's thesis; clear and calm"),
    ("s46", "S8", "To really hide, you'd have to block the bounces too.",
     "To really hide, you'd have to block the bounces too.",
     1200, ["C04"], "joke 4: he takes the hint (closes the gap); leave a long beat for the visual"),
    ("s47", "S8", "Future Got Weird explains the strange future, twice a week. We'll see you around the corner.",
     "[warmly] Future Got Weird explains the strange future, twice a week. We'll see you around the corner.",
     0, [], "one brief invitation; warm, a small smile on the last line"),
]

# Generation sections: 2-3 consecutive segments generated together for natural flow.
SECTIONS = [
    ("x01", ["s01", "s02", "s03"]),
    ("x02", ["s04", "s05"]),
    ("x03", ["s06", "s07", "s08"]),
    ("x04", ["s09", "s10"]),
    ("x05", ["s11", "s12"]),
    ("x06", ["s13", "s14"]),
    ("x07", ["s15", "s16"]),
    ("x08", ["s17", "s18", "s19"]),
    ("x09", ["s20", "s21", "s22"]),
    ("x10", ["s23", "s24"]),
    ("x11", ["s25", "s26"]),
    ("x12", ["s27", "s28", "s29"]),
    ("x13", ["s30", "s31"]),
    ("x14", ["s32", "s33"]),
    ("x15", ["s34", "s35"]),
    ("x16", ["s36", "s37"]),
    ("x17", ["s38"]),
    ("x18", ["s39", "s40", "s41"]),
    ("x19", ["s42", "s43"]),
    ("x20", ["s44", "s45", "s46", "s47"]),
]

TAG = re.compile(r"\[[^\]]*\]")
IPA = {LIDAR: "LiDAR"}


def words(s):
    return [w for w in re.findall(r"[A-Za-z0-9'’\-/ˈɑːɪɛəʊæʃʒθðŋɔʌ]+", s) if re.search(r"[A-Za-z0-9ɑɪɛəʊæʃʒθðŋɔʌ]", w)]


def check():
    ids = [s[0] for s in SEGS]
    assert ids == [f"s{i:02d}" for i in range(1, len(SEGS) + 1)], "segment ids must be consecutive"
    flat = [x for _, segs in SECTIONS for x in segs]
    assert flat == ids, "sections must cover every segment once, in order"
    for sid, _, text, tts, *_ in SEGS:
        assert "—" not in text and "—" not in tts, f"{sid}: no em dashes in narration"
        t = TAG.sub("", tts)
        for k, v in IPA.items():
            t = t.replace(k, v)
        a = [w.lower().strip("'’") for w in words(t.replace("…", " "))]
        b = [w.lower().strip("'’") for w in words(text)]
        assert a == b, f"{sid}: tts words differ from display text\n  {a}\n  {b}"


def main():
    check()
    segs = [dict(id=i, scene=sc, text=t, tts=p, pause_after_ms=pa, claims=c, direction=d) for i, sc, t, p, pa, c, d in SEGS]
    by = {s["id"]: s for s in segs}
    sections = []
    for xid, sids in SECTIONS:
        prompt = "\n\n".join(by[s]["tts"] for s in sids)
        sections.append(dict(id=xid, segments=sids, prompt=prompt, words_per_segment=[len(words(by[s]["text"])) for s in sids], chars=len(prompt)))
    meta = dict(title="How Cameras See Around Corners", channel="Future Got Weird", version="v1 (2026-10-08)",
                voice_name="Test Voice", voice_id="kk5XaSLo2XAw0sKM98zU", model="eleven_v4",
                notes="text = display/subtitle text. tts = Eleven v4 prompt with delivery tags in [brackets] and IPA between slashes; with tags removed and IPA mapped back it has the same words as text, so forced-alignment timings map 1:1.")
    os.makedirs(os.path.join(ROOT, "script"), exist_ok=True)
    with open(os.path.join(ROOT, "script/narration_segments.json"), "w") as f:
        json.dump({**meta, "segments": segs}, f, indent=1, ensure_ascii=False)
    with open(os.path.join(ROOT, "script/narration_sections.json"), "w") as f:
        json.dump({"model": meta["model"], "voice_name": meta["voice_name"], "voice_id": meta["voice_id"], "sections": sections}, f, indent=1, ensure_ascii=False)
    n = sum(len(words(s["text"])) for s in segs)
    chars = sum(x["chars"] for x in sections)
    lines = [f"# {meta['title']} — spoken script ({meta['version']})", "",
             f"{n} spoken words in {len(segs)} lines, {len(sections)} generation sections ({chars} prompt characters). "
             "Claim IDs refer to `research/claims.csv`.", ""]
    scene = None
    for s in segs:
        if s["scene"] != scene:
            scene = s["scene"]
            lines += ["", f"## {scene}", ""]
        c = f"  `{', '.join(s['claims'])}`" if s["claims"] else ""
        lines.append(f"**{s['id']}** {s['text']}{c}")
        lines.append("")
    with open(os.path.join(ROOT, "script/SCRIPT.md"), "w") as f:
        f.write("\n".join(lines) + "\n")
    print(f"{n} words, {len(segs)} segments, {len(sections)} sections, {chars} prompt chars")


if __name__ == "__main__":
    main()
