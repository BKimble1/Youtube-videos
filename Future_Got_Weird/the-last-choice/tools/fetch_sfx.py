"""Download ElevenLabs sound-effect takes listed in a creative_get_flow_run_status JSON dump.
Names files <kind>_<take>.mp3 using audio/sfx_raw/elevenlabs_sessions.json (session → kind) and records prompts/durations.
Usage: python3 tools/fetch_sfx.py <status.json> [suffix]
"""
import json, os, sys, urllib.request

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
RAW = os.path.join(ROOT, "audio", "sfx_raw")
sess = json.load(open(os.path.join(RAW, "elevenlabs_sessions.json")))
by_session = {}
for kind, ids in sess["kinds"].items():
    for k, sid in enumerate(ids[1:]):
        by_session[sid] = (kind, k + 1)
for kind, ids in sess.get("rerun", {}).items():
    for k, sid in enumerate(ids[1:]):
        by_session[sid] = (kind, k + 1)
d = json.load(open(sys.argv[1]))
suffix = sys.argv[2] if len(sys.argv) > 2 else ""
manifest_p = os.path.join(RAW, "manifest.json")
manifest = json.load(open(manifest_p)) if os.path.exists(manifest_p) else {}
for g in d["generations"]:
    url = g.get("content_url")
    sid = g.get("session_id")
    if not sid:
        sid = url.split("/content_generation/")[1].split("/")[0]
    kind, take = by_session.get(sid, ("unknown_" + sid, 1))
    name = f"{kind}{suffix}_v{take}.mp3"
    out = os.path.join(RAW, name)
    urllib.request.urlretrieve(url, out)
    manifest[name] = {"generation_id": g["id"], "session_id": sid, "prompt": g.get("prompt"), "duration_secs": g.get("duration_secs"), "credits": g.get("price", {}).get("credits")}
    print(name, os.path.getsize(out))
json.dump(manifest, open(manifest_p, "w"), indent=1)
