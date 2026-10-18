#!/usr/bin/env bash
# R4 WIP checkpoint: commit and push everything in the shared working tree (many agents edit it; a container restart
# loses uncommitted work). Never touches music/renders (Git-ignored). Retries on index.lock; pushes with backoff.
cd "$(dirname "$0")/../.." || exit 1
ROOT=$(git rev-parse --show-toplevel)
cd "$ROOT" || exit 1
for i in 1 2 3 4 5 6; do
  [ -f .git/index.lock ] && { sleep 5; continue; }
  git add -A Future_Got_Weird/the-last-choice 2>/dev/null
  if git diff --cached --quiet; then exit 0; fi
  git commit -q -m "The Last Choice R4 WIP checkpoint $(date -u +%H:%M)

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_019a8XshjFgWRBShXtMZ8MbH" && break
  sleep 5
done
for d in 2 4 8 16; do git push -q -u origin claude/new-session-1waugd 2>/dev/null && exit 0; sleep $d; done
exit 0
