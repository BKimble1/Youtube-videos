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
    ("s01", "S1", "Our friend here is hiding behind a partition, and he is very pleased about it.",
     "[lightly amused] Our friend here is hiding behind a partition, and he is very pleased about it.",
     650, [], "J1: warm, amused, quick; the joke is his smugness, leave a beat"),
    ("s02", "S1", "That sensor can't see him. It's pointed at a plain, blank wall.",
     "That sensor can't see him. It's pointed at a plain, blank wall.",
     300, ["C01"], "matter-of-fact setup"),
    ("s03", "S1", "And yet this is real data, from a study published in 2026: seen from above, a small sensor aimed at a wall, tracking someone it never saw directly.",
     "And yet… this is real data, from a study published in 2026: seen from above, a small sensor aimed at a wall, tracking someone it never saw directly.",
     1100, ["C02", "C03"], "the reveal: beat after 'And yet', then clear and confident; let 'never saw directly' land"),
    ("s04", "S1", "Here's the trick for seeing around corners. The light doesn't go through the partition. It goes around the end, by way of the wall.",
     "[warmly] Here's the trick for seeing around corners. The light doesn't go through the partition. It goes around the end, by way of the wall.",
     350, ["C04"], "friendly explainer; light stress on 'through' and 'around the end'"),
    ("s05", "S1", "The sensor fires a short, invisible flash. The wall scatters it, part reaches the hidden person, and a tiny bit bounces back: wall, then sensor.",
     "The sensor fires a short, invisible flash. The wall scatters it, part reaches the hidden person, and a tiny bit bounces back: wall, then sensor.",
     350, ["C04", "C05", "C43"], "follow the light like a story"),
    ("s06", "S1", "That trip is longer than a quick bounce off the wall, so it arrives a little later. A few billionths of a second later.",
     "That trip is longer than a quick bounce off the wall, so it arrives a little later. [dryly] A few billionths of a second later.",
     300, ["C06"], "set up, then a dry undercut on the size of 'a little'"),
    ("s07", "S1", "Your webcam can't time that. This takes a time-of-flight sensor, a camera that clocks its own light's round trip.",
     "Your webcam can't time that. This takes a time-of-flight sensor, a camera that clocks its own light's round trip.",
     300, ["C07"], "define the sensor plainly, beside the object"),
    ("s08", "S1", "Light travels about thirty centimetres in a nanosecond, one billionth of a second. So timing is distance, and the extra delay is a clue to where he is.",
     "Light travels about thirty centimetres in a nanosecond, one billionth of a second. So timing is distance, and the extra delay is a clue to where he is.",
     900, ["C06"], "the opening's takeaway; settled cadence before act 2"),
    # ---------------------------------------------------------------- act 2: the wall relays information (S2, S3)
    ("s09", "S2", "Why does a plain wall work at all? Start with a mirror.",
     "[curious] Why does a plain wall work at all? Start with a mirror.",
     300, [], "new chapter: curious question"),
    ("s10", "S2", "Light leaves a mirror at the same angle it arrived, so the picture stays whole. Put a mirror here, and our friend is simply visible.",
     "Light leaves a mirror at the same angle it arrived, so the picture stays whole. [dryly] Put a mirror here… and our friend is simply visible.",
     800, ["C08"], "J2 lands on 'visible' (he ducks)"),
    ("s11", "S2", "A painted wall is rough up close. It throws light every which way, so each spot acts less like a mirror, more like a tiny lamp.",
     "A painted wall is rough up close. It throws light every which way, so each spot acts less like a mirror, more like a tiny lamp.",
     400, ["C09"], "explainer"),
    ("s12", "S2", "You might picture his image as a postcard shredded into confetti, waiting to be sorted. It's worse than that. Confetti still holds bits of picture. Everything coming back is a blend of many paths. What survives is timing.",
     "You might picture his image as a postcard shredded into confetti, waiting to be sorted. It's worse than that. Confetti still holds bits of picture. Everything coming back is a blend of many paths… What survives is timing.",
     800, ["C10"], "the metaphor and its limit; 'What survives is timing' is the act's thesis"),
    ("s13", "S3", "Follow the path that matters: sensor, wall, person, wall, sensor. Each bounce spreads the light, and most of it is lost.",
     "Follow the path that matters: sensor. Wall. Person. Wall. Sensor. Each bounce spreads the light, and most of it is lost.",
     350, ["C05", "C11"], "the five stops are a rhythm, unhurried"),
    ("s14", "S3", "Nearly everything coming back bounced once, off the wall. Our friend's echo bounced three times, so it's tiny.",
     "Nearly everything coming back bounced once, off the wall. Our friend's echo bounced three times, so it's tiny.",
     350, ["C11"], "plain; 'tiny' small"),
    ("s15", "S3", "This is real data from the same team, with a different sensor and hidden object: the wall's big echo, then, a few nanoseconds later, a bump you have to zoom in to see. In this capture, hundreds of times weaker.",
     "This is real data from the same team, with a different sensor and hidden object: the wall's big echo, then, a few nanoseconds later, a bump you have to zoom in to see. [softly] In this capture, hundreds of times weaker.",
     400, ["C12"], "evidence voice: careful and specific"),
    ("s16", "S3", "That bump is the clue. Its timing says how much farther the light travelled.",
     "That bump is the clue. Its timing says how much farther the light travelled.",
     900, ["C06"], "short, confident; end of act 2"),
    # ---------------------------------------------------------------- act 3: timing becomes geometry (S4)
    ("s17", "S4", "Let's turn timing into a map: the room from above, flattened, with one more simplification. The sensor flashes and listens at one spot on the wall.",
     "Let's turn timing into a map: the room from above, flattened, with one more simplification. The sensor flashes and listens at one spot on the wall.",
     300, ["C13"], "central sequence starts; the simplification said openly"),
    ("s18", "S4", "Measure the extra delay, and you know how far he is from that spot. Not which direction. Just how far.",
     "Measure the extra delay, and you know how far he is from that spot. Not which direction… Just how far.",
     300, ["C14"], "precise; small beat before 'Just how far'"),
    ("s19", "S4", "He could be anywhere on this arc, all the same distance from that spot.",
     "He could be anywhere on this arc, all the same distance from that spot.",
     900, ["C14"], "J3 setup: he relaxes; leave space"),
    ("s20", "S4", "Now listen at a second spot. Another delay, another arc. On this side of the wall, they cross in just one place.",
     "Now listen at a second spot. Another delay, another arc. On this side of the wall, they cross in just… one place.",
     1000, ["C15"], "J3 payoff: his smile fades on 'one place'"),
    ("s21", "S4", "Measured timings are a bit fuzzy, so each arc is really a band, and the bands overlap in a small patch.",
     "Measured timings are a bit fuzzy, so each arc is really a band, and the bands overlap in a small patch.",
     300, ["C16"], "honest uncertainty, said as useful understanding"),
    ("s22", "S4", "These two spots are close, so the patch is long and blurry. Spread them out, and it shrinks.",
     "These two spots are close, so the patch is long and blurry. Spread them out, and it shrinks.",
     350, ["C17"], "rule of thumb; ends on the tight patch"),
    ("s23", "S4", "In practice, a computer weighs many spots at once, trying positions and keeping those whose predicted echoes match. It also leans on assumptions, like what kind of object it's after.",
     "In practice, a computer weighs many spots at once, trying positions and keeping those whose predicted echoes match. It also leans on assumptions, like what kind of object it's after.",
     300, ["C18"], "the reconstruction model; clear, unhurried"),
    ("s24", "S4", "That's why the answer is a likely location, or a rough shape. Not a photograph.",
     "That's why the answer is a likely location, or a rough shape. Not a photograph.",
     1000, ["C19"], "settle; end of act 3"),
    # ---------------------------------------------------------------- act 4: what became more accessible (S5, S6)
    ("s25", "S5", "None of this is brand new. In 2012, an MIT team reported recovering the 3D shape of a small mannequin around a corner.",
     "None of this is brand new. In 2012, an MIT team reported recovering the 3D shape of a small mannequin around a corner.",
     300, ["C20"], "storyteller; history in brisk steps"),
    ("s26", "S5", "It took an ultrafast laser and a high-speed camera: lab equipment that filled a table.",
     "It took an ultrafast laser and a high-speed camera: lab equipment that filled a table.",
     350, ["C21"], "light emphasis on 'filled a table'"),
    ("s27", "S5", "In a 2018 study, Stanford researchers swept one spot across the wall, like our simplified picture. The math got simpler: for a reflective exit sign, rebuilding the scene took about a second on a laptop. Measuring still took almost seven minutes.",
     "In a 2018 study, Stanford researchers swept one spot across the wall, like our simplified picture. The math got simpler: for a reflective exit sign, rebuilding the scene took about a second on a laptop. [dryly] Measuring still took almost seven minutes.",
     350, ["C22", "C23"], "the 2018 step; dry on the last sentence"),
    ("s28", "S5", "By 2021, researchers in Wisconsin and Milan had sped up measuring too: live video of ordinary objects, five frames a second, with a powerful laser and custom detectors.",
     "By 2021, researchers in Wisconsin and Milan had sped up measuring too: live video of ordinary objects, five frames a second, with a powerful laser and custom detectors.",
     300, ["C24"], "momentum"),
    ("s29", "S5", "Impressive. But all of it ran on research equipment.",
     "Impressive. But all of it ran on research equipment.",
     800, ["C25"], "the turn that sets up 2026"),
    ("s30", "S6", "Then, in a study published in 2026, a team from MIT and Dartmouth tried the small time-of-flight sensors, often called LiDAR, found in phones and gadgets.",
     f"Then, in a study published in 2026, a team from MIT and Dartmouth tried the small time-of-flight sensors, often called {LIDAR}, found in phones and gadgets.",
     300, ["C26", "C27"], "the news beat; confident, not breathless"),
    ("s31", "S6", "Don't expect your phone to do this yet: phone makers often keep the raw data private.",
     "Don't expect your phone to do this yet: phone makers often keep the raw data private.",
     350, ["C42"], "a friendly caveat, not a warning"),
    ("s32", "S6", "These sensors are tough customers. Weak lasers mean fainter echoes. The team's smartphone-grade device had about a hundred pixels: a hundred listening spots. And if you hold one in your hand, it jiggles.",
     "These sensors are tough customers. Weak lasers mean fainter echoes. The team's smartphone-grade device had about a hundred pixels: a hundred listening spots. [lightly amused] And if you hold one in your hand, it jiggles.",
     400, ["C28"], "problems as a quick rhythm; small smile on 'jiggles'"),
    ("s33", "S6", "Their fix borrows night mode's trick from phone cameras: stack many quick, dim frames into one better estimate.",
     "Their fix borrows night mode's trick from phone cameras: stack many quick, dim frames into one better estimate.",
     300, ["C29", "C44"], "clear"),
    ("s34", "S6", "The catch: between frames, the sensor jiggles and the person moves. Plain averaging would smear everything, like a long exposure of someone walking.",
     "The catch: between frames, the sensor jiggles and the person moves. Plain averaging would smear everything, like a long exposure of someone walking.",
     300, ["C30"], "the problem, plainly"),
    ("s35", "S6", "Their method puts the motion to work, one unknown at a time. Move the sensor through known positions, and the listening spots spread out. Keep the sensor still, and each step becomes a new position to follow.",
     "Their method puts the motion to work, one unknown at a time. Move the sensor through known positions, and the listening spots spread out. Keep the sensor still, and each step becomes a new position to follow.",
     500, ["C30", "C31", "C35"], "the idea that makes 2026 different; satisfying parallel"),
    ("s36", "S7", "Our opening clip came from a different sensor: an off-the-shelf kit the authors put at under a hundred dollars, with sixteen listening spots, held still while a person walked behind a partition. We ran it through their own code.",
     "Our opening clip came from a different sensor: an off-the-shelf kit the authors put at under a hundred dollars, with sixteen listening spots, held still while a person walked behind a partition. We ran it through their own code.",
     350, ["C02", "C32"], "evidence voice, specific; callback to the opening"),
    ("s37", "S7", "Moved through known positions, the sensor behind that faint bump rebuilt the rough outline of a hidden U.",
     "Moved through known positions, the sensor behind that faint bump rebuilt the rough outline of a hidden U.",
     900, ["C33", "C12"], "second result; hold on the finished U"),
    ("s38", "S7", "Many of these tests had help: safety-vest style reflective material on the target, which sends far more light straight back. Our clip's files don't say if the walker wore any. And the kit needs a flat wall and a few seconds of empty room first.",
     "Many of these tests had help: safety-vest style reflective material on the target, which sends far more light straight back. Our clip's files don't say if the walker wore any. And the kit needs a flat wall, and a few seconds of empty room first.",
     300, ["C34", "C36", "C02"], "conditions as useful understanding, not a disclaimer"),
    ("s39", "S7", "But the authors do report tracking a person in ordinary clothes, with the sensor capturing thirty frames a second. The code is public, though we've found no other team reporting results on its own hardware yet.",
     "But the authors do report tracking a person in ordinary clothes, with the sensor capturing thirty frames a second. The code is public, though we've found no other team reporting results on its own hardware yet.",
     900, ["C37", "C38"], "fair and plain; end of act 4"),
    # ---------------------------------------------------------------- act 5: usefulness, limits, payoff (S7, S8)
    ("s40", "S8", "What might this be good for? Picture a delivery robot nearing a blind warehouse corner.",
     "[curious] What might this be good for? Picture a delivery robot nearing a blind warehouse corner.",
     300, ["C39"], "new chapter, curious"),
    ("s41", "S8", "With a suitable wall at the junction, a sensor like this might give it an early hint of movement out of sight.",
     "With a suitable wall at the junction, a sensor like this might give it an early hint of movement out of sight.",
     300, ["C39"], "'might' carries the hedge without sounding legal"),
    ("s42", "S8", "Just a fuzzy blob: enough to say slow down, not enough to say who's there.",
     "Just a fuzzy blob: enough to say slow down, not enough to say who's there.",
     350, ["C19", "C39"], "concrete benefit and its limit"),
    ("s43", "S8", "And plenty is still hard: short range, dark or shiny walls, bright sunlight, and fast math on small hardware. The researchers call it an early-stage prototype.",
     "And plenty is still hard: short range. Dark or shiny walls. Bright sunlight. And fast math on small hardware. The researchers call it an early-stage prototype.",
     300, ["C40"], "four short beats, then a plain attribution"),
    ("s44", "S8", "No one has shown that it prevents collisions. For now, it's a promising clue, not a safety system.",
     "No one has shown that it prevents collisions. For now, it's a promising clue, not a safety system.",
     900, ["C41"], "settled, honest"),
    ("s45", "S9", "Which brings us back to our friend.",
     "[lightly amused] Which brings us back to our friend.",
     500, [], "callback, warm"),
    ("s46", "S9", "Being out of sight isn't the same as giving nothing away. The light found a way around, and careful timing and math can read some of its clues.",
     "Being out of sight isn't the same as giving nothing away. The light found a way around, and careful timing and math can read some of its clues.",
     600, ["C04", "C19"], "the episode's takeaway; clear and calm"),
    ("s47", "S9", "To really hide, he'd have to block the bounces too.",
     "To really hide, he'd have to block the bounces too.",
     4500, ["C04"], "J4: he takes the hint; a long silent beat for the visual"),
    ("s48", "S9", "This is Future Got Weird: the strange future, explained. Subscribe for more, and we'll see you around the corner.",
     "[warmly] This is Future Got Weird: the strange future, explained. Subscribe for more, and we'll see you around the corner.",
     0, [], "one brief invitation; warm, a small smile on the last line"),
]

# Generation sections: 1-3 consecutive segments generated together for natural flow.
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
    ("x13", ["s30", "s31", "s32"]),
    ("x14", ["s33", "s34"]),
    ("x15", ["s35", "s36"]),
    ("x16", ["s37", "s38"]),
    ("x17", ["s39"]),
    ("x18", ["s40", "s41", "s42"]),
    ("x19", ["s43", "s44"]),
    ("x20", ["s45", "s46", "s47"]),
    ("x21", ["s48"]),
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
    meta = dict(title="How Cameras See Around Corners", channel="Future Got Weird", version="v2 (2026-10-08, after four-lens review)",
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
