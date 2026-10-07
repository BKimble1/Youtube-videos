#!/usr/bin/env python3
"""Write each scene's V1 shot review (from the review workflow journal) to qa/v1_review/S<n>_analysis.md."""
import json, os, re, sys
J = sys.argv[1] if len(sys.argv) > 1 else '/root/.claude/projects/-home-user-Youtube-videos/942fed74-9746-5c11-9bde-e8a953092ef0/subagents/workflows/wf_927c6674-82b/journal.jsonl'
out = os.path.join(os.path.dirname(__file__), '..', 'qa', 'v1_review')
done = []
for ln in open(J):
    r = json.loads(ln)
    if r.get('type') != 'result' or not isinstance(r.get('result'), dict) or 'scene' not in r['result']:
        continue
    res = r['result']
    m = re.match(r'\s*(S\d+)', res['scene'])
    if not m:
        continue
    sid = m.group(1)
    L = [f"# V1 shot review — {res['scene']}", '', res.get('summary', ''), '']
    for sh in res.get('shots', []):
        L.append(f"## {sh.get('id', '')} {sh.get('t_from', '')}-{sh.get('t_to', '')} (V1 f{sh.get('frame_from', '')}-{sh.get('frame_to', '')}) | {sh.get('narration', '')}")
        for p in sh.get('problems', []):
            if isinstance(p, dict):
                L.append(f"  - [{p.get('severity', '')}/{p.get('category', '')}] {p.get('detail', p.get('description', ''))}")
            else:
                L.append(f'  - {p}')
        for k in ('viewer_should_look_at', 'what_it_should_communicate', 'what_actually_happens'):
            if sh.get(k):
                L.append(f'  {k}: {sh[k]}')
        if sh.get('v2_direction'):
            L.append('  V2 DIRECTION: ' + str(sh['v2_direction']))
    L.append('\n## SCENE PROBLEMS')
    for p in res.get('scene_problems', []):
        L.append('  - ' + (' '.join(str(x) for x in p.values()) if isinstance(p, dict) else str(p)))
    L.append('\n## TRANSITION IN\n' + str(res.get('transition_in', '')))
    L.append('\n## TRANSITION OUT\n' + str(res.get('transition_out', '')))
    L.append('\n## SOUND MOMENTS\n' + json.dumps(res.get('sound_moments', ''), indent=1, ensure_ascii=False))
    L.append('\n## PHONE-CRITICAL TEXT\n' + json.dumps(res.get('phone_critical_text', ''), indent=1, ensure_ascii=False))
    open(os.path.join(out, f'{sid}_analysis.md'), 'w').write('\n'.join(L) + '\n')
    done.append(sid)
print('wrote', sorted(done, key=lambda s: int(s[1:])))
