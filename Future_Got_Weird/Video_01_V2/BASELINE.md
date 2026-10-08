# V2 baseline pointer

The Future Got Weird Video 01 **V2 baseline** is commit

    29aa09f7b409f096822254c9e00a78b5691cc199

on branch `claude/new-session-96c7w8` of this repository (local tag `fgw-video01-v2-baseline` in the production
workspace). This file was added in the commit right after it and changes nothing in the baseline itself.

```sh
git fetch origin claude/new-session-96c7w8
git worktree add ../fgw-v2-baseline 29aa09f7b409f096822254c9e00a78b5691cc199          # a separate, untouched copy of the baseline
# or, inside a checkout:  git checkout 29aa09f7b409f096822254c9e00a78b5691cc199 -- Future_Got_Weird/Video_01_V2
cd ../fgw-v2-baseline/Future_Got_Weird/Video_01_V2/backup/v2_baseline && sh reconstruct.sh && python3 restore_v2.py
```

What the baseline contains, what is unfinished, and how to rebuild it: `V2_STATUS.md` (in that commit).
The media restore is described in `backup/v2_baseline/RESTORE.md`.

**This is not the approved film.** The baseline predates the merge of the rebuilt scenes S3–S10. The film the owner
approved is commit `5bd35c1` (`APPROVED_V2.md`); the final polished film and 4K master are V3 (`V3_CHANGELOG.md`,
`DELIVERABLES.md`).
