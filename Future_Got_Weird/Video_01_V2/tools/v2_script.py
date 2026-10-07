#!/usr/bin/env python3
"""Write the V2 narration script and its directed generation sections.

V2 keeps the V1 story, lines and jokes. Two lines take the wording the V2 brief quotes:
  s03  "Three different answers. None of them are right. Not one even had the right year."
  s29  "The unglamorous move: check."

Each segment has
  text   display / subtitle text (correct spellings)
  tts    the Eleven v4 prompt: same words as `text` (IPA between slashes where the voice would misread a name),
         plus delivery tags in square brackets and pause punctuation. Tags are not words: tools/v2_assemble.py
         strips them before mapping the forced alignment onto the display words.
  pause_after_ms  target gap after the segment (the voice's own pause counts towards it)
  direction       what the line has to do, for take selection

Sections are what gets generated in one go (2-3 segments, so delivery flows inside a section and every line can still
be picked from a different take of the same section).

Writes script/narration_segments.json and script/narration_sections.json.
"""
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
K, KS = "/kəˈlaɪ/", "/kəˈlaɪz/"

SEGS = [
    # id, scene, display text, tts prompt, pause after (ms), direction
    ("s01", "S1", "Three popular AI models were asked one question: what was the title of Adam Kalai's dissertation?",
     f"[curious] Three popular AI models were asked one question: what was the title of Adam {KS} dissertation?",
     350, "cold open: curious, quick, a question you want answered"),
    ("s02", "S1", "ChatGPT handed over a full title, a university, and a year. DeepSeek gave a different title. Llama gave a third.",
     "[lightly amused] ChatGPT handed over a full title, a university, and a year. DeepSeek gave a different title. Llama gave a third.",
     450, "escalating: each answer arrives sure of itself; slight comic lift on 'a third'"),
    ("s03", "S1", "Three different answers. None of them are right. Not one even had the right year.",
     "Three different answers… [firmly] None of them are right. Not one even had the right year.",
     500, "small pause after 'answers'; 'None of them are right' lands, lower and firm"),
    ("s04", "S1", "And Adam Kalai? He's the lead author of the paper that reported this test.",
     f"[curious] And Adam {K}? He's the lead author of the paper that reported this test.",
     450, "a little reveal, conversational"),
    ("s05", "S1", "Very professional. Very fictional.",
     "[dryly] Very professional… Very fictional.",
     900, "joke 1: dry, a beat between the two halves"),
    ("s06", "S2", "So how can a wrong answer sound that sure? Here's the short version.",
     "[curious] So how can a wrong answer sound that sure? [warmly] Here's the short version.",
     350, "the title question, genuinely curious; then friendly"),
    ("s07", "S2", "A chatbot is built to write what's likely to come next. Checking whether it's true is a different job. And some of the tests used to grade these systems quietly reward guessing.",
     "[confidently] A chatbot is built to write what's likely to come next. Checking whether it's true is a different job. And some of the tests used to grade these systems [mischievously] quietly reward guessing.",
     2200, "three clean claims, confident; a knowing smile on 'quietly reward guessing'"),
    ("s08", "S3", "Let's take ChatGPT's answer apart.",
     "[energetic] Let's take ChatGPT's answer apart.",
     350, "energy up: we're going inside"),
    ("s09", "S3", "A language model builds text out of tokens: chunks that are sometimes whole words, sometimes fragments. In GPT-4o's tokenizer, “Kalai” comes out as “Kal” and “ai.”",
     f"A language model builds text out of tokens: chunks that are sometimes whole words, sometimes fragments. In /ˌdʒiːpiːˈtiːfɔːrˈoʊz/ tokenizer, “{K}” comes out as “/kæl/” and “/aɪ/.”",
     400, "explanation moving confidently; playful on 'Kal' and 'ai'"),
    ("s10", "S3", "At every step, the model scores all the possible next chunks and picks one. Then it goes again. Token after token, an answer rolls out.",
     "At every step, the model scores all the possible next chunks and picks one. Then it goes again. Token after token, an answer rolls out.",
     400, "rhythmic, mechanical cadence without sounding robotic"),
    ("s11", "S3", "Here, it's choosing the last digit of the year. Those scores say which chunk is likely. They do not say which one is true.",
     "Here, it's choosing the last digit of the year. Those scores say which chunk is likely. [short pause] They do NOT say which one is true.",
     600, "the key distinction: slight pause, emphasis on 'not'"),
    ("s12", "S3", "Modern chatbots add more on top: instruction training, step-by-step reasoning, sometimes web search. But the words still come out this way, one piece at a time.",
     "Modern chatbots add more on top: instruction training, step-by-step reasoning, sometimes web search. But the words still come out this way… one piece at a time.",
     700, "list moves briskly; settle on 'one piece at a time'"),
    ("s13", "S4", "So why would the likely answer be wrong? Think about what the model learned from.",
     "[curious] So why would the likely answer be wrong? Think about what the model learned from.",
     350, "curious turn"),
    ("s14", "S4", "The sound of a dissertation title is everywhere. “Methods.” “Algorithms.” “Machine Learning.” Shelf after shelf, the same shape.",
     "The sound of a dissertation title is everywhere. “Methods.” “Algorithms.” “Machine Learning.” [lightly amused] Shelf after shelf, the same shape.",
     400, "the three words read like spines being tapped; amused at 'the same shape'"),
    ("s15", "S4", "But one specific researcher's title? That might show up rarely, or not at all. And like a birthday, there's no pattern to work it out from.",
     "But one specific researcher's title? That might show up rarely… or not at all. And like a birthday, there's no pattern to work it out from.",
     450, "quieter, thoughtful"),
    ("s16", "S4", "So the model does what it was built to do. It fills the gap with a title-shaped answer. And the confidence comes with it, because that's part of the pattern too. “Is entitled.” No “I think.” No “maybe.”",
     "So the model does what it was built to do. It fills the gap with a title-shaped answer. And the confidence comes with it, because that's part of the pattern too. [amused] “Is entitled.” No “I think.” No “maybe.”",
     700, "builds; the three quotes are crisp and a little amused"),
    ("s17", "S5", "Here's the actual record. Kalai's thesis: “Probabilistic and On-line Methods in Machine Learning.” Carnegie Mellon, May 2001.",
     f"[clearly] Here's the actual record. {KS} thesis: “Probabilistic and On-line Methods in Machine Learning.” Carnegie Mellon, May 2001.",
     500, "evidence: clear, unhurried, a touch quieter"),
    ("s18", "S5", "ChatGPT got the university right. The year was off by one. The title was invented. And every detail came out looking exactly as solid as the true one.",
     "ChatGPT got the university right. The year was off by one. The title was invented. And every detail came out looking exactly as solid as the true one.",
     900, "three verdicts, each a beat; the last sentence lands"),
    ("s19", "S5", "A confident font is still just a font.",
     "[dryly] A confident font… is still just a font.",
     1000, "joke 2: give it room; dry, unhurried"),
    ("s20", "S6", "Now, why guess at all? Why not just say “I don't know”? The researchers argue that part of the answer is how models get graded.",
     "[curious] Now, why guess at all? Why not just say “I don't know”? The researchers argue that part of the answer is how models get graded.",
     400, "playful curiosity; game-show energy starts"),
    ("s21", "S6", "Picture a ten-question quiz. Right answer: one point. Wrong answer: zero. “I don't know”: also zero.",
     "[playfully] Picture a ten-question quiz. Right answer: one point. Wrong answer: zero. “I don't know”: also zero.",
     350, "rules, briskly, like a host"),
    ("s22", "S6", "Two contestants. Both know six answers. The honest one leaves the other four blank. Six points.",
     "Two contestants. Both know six answers. The honest one leaves the other four blank. Six points.",
     350, "clean, a little deadpan on 'six points'"),
    ("s23", "S6", "The guesser takes a shot at all four. Four options each, so on average, one lands. Seven points.",
     "The guesser takes a shot at all four. Four options each, so on average, one lands. [lightly amused] Seven points.",
     500, "'Seven points' slightly amused"),
    ("s24", "S6", "One lucky guess. Three wrong answers. Somehow, a trophy.",
     "One lucky guess. Three wrong answers… [dryly amused] Somehow, a trophy.",
     900, "joke 3: the best comic beat; dry and slightly amused on 'Somehow, a trophy'"),
    ("s25", "S6", "Now change one rule. A wrong answer costs a point. The honest one: still six. The guesser: six, plus one, minus three. Four. The trophy walks back.",
     "Now change one rule. A wrong answer costs a point. The honest one: still six. The guesser: six, plus one, minus three… Four. [amused] The trophy walks back.",
     800, "arithmetic with momentum; small beat before 'Four'; amused on the trophy"),
    ("s26", "S7", "The researchers checked ten widely used benchmarks in mid-2025. Nine graded strictly right or wrong, with no credit at all for “I don't know.”",
     "[clearly] The researchers checked ten widely used benchmarks in mid-2025. Nine graded strictly right or wrong, with no credit at all for “I don't know.”",
     400, "evidence: pull back, clear"),
    ("s27", "S7", "Train and rank models on tests like that, and guessing pays. It's one explanation, not the whole story. But it is a simple one.",
     "Train and rank models on tests like that, and guessing pays. It's one explanation, not the whole story. But it is a simple one.",
     800, "honest caveat, conversational"),
    ("s28", "S8", "So what helps? Search and retrieval, when they bring the real record into the room. Reasoning, sometimes. Turning down the randomness makes answers more consistent, not necessarily more correct. None of it is a guarantee.",
     "[curious] So what helps? Search and retrieval, when they bring the real record into the room. Reasoning, sometimes. Turning down the randomness makes answers more consistent, not necessarily more correct. None of it is a guarantee.",
     600, "brisk list; 'None of it is a guarantee' plain"),
    ("s29", "S9", "The unglamorous move: check.",
     "[confidently] The unglamorous move: check.",
     450, "simple and confident"),
    ("s30", "S9", "Two questions. Does the source exist? And does it actually say this?",
     "Two questions. Does the source exist? And does it ACTUALLY say this?",
     450, "two clean questions"),
    ("s31", "S9", "Take the ChatGPT slip. Is there a thesis by Adam Kalai at Carnegie Mellon? Yes. Does it say “Boosting, Online Algorithms,” 2002? No. It says “Probabilistic and On-line Methods,” 2001.",
     f"Take the ChatGPT slip. Is there a thesis by Adam {K} at Carnegie Mellon? Yes. Does it say “Boosting, Online Algorithms,” 2002? No. It says “Probabilistic and On-line Methods,” 2001.",
     450, "demonstration with momentum; crisp yes / no"),
    ("s32", "S9", "Source exists. Claim fails. Stamp it.",
     "Source exists. Claim fails. [satisfied] Stamp it.",
     900, "three beats; small satisfaction on 'Stamp it'"),
    ("s33", "S10", "So why is AI so confidently wrong? Because sounding right comes from patterns in language, and being right takes evidence the model doesn't always have.",
     "[thoughtfully] So why is AI so confidently wrong? Because sounding right comes from patterns in language… and being right takes evidence the model doesn't always have.",
     700, "conclusion: slows slightly, conclusive"),
    ("s34", "S10", "So when an answer matters, don't ask whether it sounds right. Ask what the evidence is, and whether it actually says this.",
     "So when an answer matters, don't ask whether it sounds right. Ask what the evidence is… and whether it actually says this.",
     700, "conclusive, warm, not preachy"),
    ("s35", "S10", "Works on chatbots. Works pretty well on people, too.",
     "[lightly amused] Works on chatbots. Works pretty well on people, too.",
     900, "joke 4: light"),
    ("s36", "S10", "This is Future Got Weird. AI moves fast; we make it make sense. New episodes twice a week, if you'd like to subscribe.",
     "[warmly] This is Future Got Weird. AI moves fast; we make it make sense. New episodes twice a week, if you'd like to subscribe.",
     0, "friendly sign-off, clean"),
]

SECTIONS = [
    ("x01", ["s01", "s02"]),          # the question, three confident answers
    ("x02", ["s03", "s04", "s05"]),   # the verdict, the lead author, joke 1
    ("x03", ["s06", "s07"]),          # title question + short version
    ("x04", ["s08", "s09"]),          # tokens
    ("x05", ["s10", "s11"]),          # scoring cycle, likely vs true
    ("x06", ["s12", "s13"]),          # add-ons, turn to the library
    ("x07", ["s14", "s15"]),          # the shelves, the gap
    ("x08", ["s16"]),                 # fills the gap
    ("x09", ["s17", "s18", "s19"]),   # the record, joke 2
    ("x10", ["s20", "s21"]),          # why guess, quiz rules
    ("x11", ["s22", "s23", "s24"]),   # contestants, joke 3
    ("x12", ["s25"]),                 # rule change
    ("x13", ["s26", "s27"]),          # benchmarks
    ("x14", ["s28", "s29", "s30"]),   # what helps, check, two questions
    ("x15", ["s31", "s32"]),          # the demonstration
    ("x16", ["s33", "s34"]),          # conclusion
    ("x17", ["s35", "s36"]),          # joke 4, sign-off
]

TAG = re.compile(r"\[[^\]]*\]")


def words_of(tts):
    """Spoken words of a prompt: tags removed, pure punctuation tokens dropped."""
    return [w for w in TAG.sub(" ", tts).split() if re.search(r"[\wʊəɪæʃʒθðŋɑɔɛʌ]", w)]


def main():
    segs = []
    for sid, scene, text, tts, pause, direction in SEGS:
        assert len(words_of(tts)) == len(text.split()), (sid, words_of(tts), text.split())
        segs.append({"id": sid, "scene": scene, "text": text, "tts": tts, "pause_after_ms": pause, "direction": direction})
    order = [s["id"] for s in segs]
    assert [x for _, ids in SECTIONS for x in ids] == order
    doc = {"title": "Why AI Is So Confidently Wrong", "channel": "Future Got Weird", "version": "V2 (2026-10-07)",
           "voice_name": "Test Voice", "voice_id": "kk5XaSLo2XAw0sKM98zU", "model": "eleven_v4",
           "notes": "text = display/subtitle text. tts = Eleven v4 prompt with delivery tags in [brackets] and IPA between slashes; "
                    "with tags and punctuation-only tokens removed it has the same words as text, so forced-alignment timings map 1:1.",
           "segments": segs}
    json.dump(doc, open(os.path.join(ROOT, "script/narration_segments.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    by = {s["id"]: s for s in segs}
    out = []
    for xid, ids in SECTIONS:
        prompt = "\n\n".join(by[i]["tts"] for i in ids)
        out.append({"id": xid, "segments": ids, "prompt": prompt,
                    "words_per_segment": [len(words_of(by[i]["tts"])) for i in ids], "chars": len(prompt)})
    json.dump({"model": "eleven_v4", "voice_name": "Test Voice", "voice_id": "kk5XaSLo2XAw0sKM98zU", "sections": out},
              open(os.path.join(ROOT, "script/narration_sections.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    words = sum(len(s["text"].split()) for s in segs)
    print(f"{len(segs)} segments, {words} words, {len(out)} sections, {sum(x['chars'] for x in out)} prompt chars")
    for x in out:
        print(f"{x['id']} {x['chars']:4d} chars {x['segments']}")


if __name__ == "__main__":
    main()
