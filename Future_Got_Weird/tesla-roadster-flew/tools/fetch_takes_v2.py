"""Download completed ElevenLabs takes from a saved creative_get_flow_run_status JSON.
usage: fetch_takes_v2.py <status.json> <out_dir> <block>=<sess1,sess2,...> ...
Files are named <block>_t<n>_<gen4>.mp3 (n = order of the session ids given)."""
import json, os, re, subprocess, sys

status = json.load(open(sys.argv[1]))
out = sys.argv[2]
blocks = {}
for spec in sys.argv[3:]:
    b, ss = spec.split('=')
    for i, s in enumerate(ss.split(',')):
        blocks[s] = (b, i + 1)
for g in status['generations']:
    url = g.get('content_url')
    if g.get('status') != 'completed' or not url:
        continue
    m = re.search(r'content_generation/([^/]+)/([^/]+)/content', url)
    sess, gen = m.group(1), m.group(2)
    if sess not in blocks:
        continue
    b, n = blocks[sess]
    path = os.path.join(out, f'{b}_t{n}_{gen[:4]}.mp3')
    if os.path.exists(path):
        continue
    subprocess.run(['curl', '-sS', '-o', path, url], check=True)
    print('saved', path, g.get('duration_secs'))
