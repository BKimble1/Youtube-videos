# Restore the V2 upload master

Git LFS is unavailable for this episode, so the 1080p V2 upload master is stored as 20 MB split parts.

    cat FGW_RobotsDestroy_v2_UPLOAD_1080p.mp4.part_* > FGW_RobotsDestroy_v2_UPLOAD_1080p.mp4
    sha256sum -c SHA256SUMS          # checks the parts
    sha256sum -c JOINED_SHA256SUMS   # checks the joined file (run in the folder that holds it)

The share copy (`FGW_RobotsDestroy_v2_1080p_SHARE.mp4`, compressed, not for upload) is regenerated from the master
with `bash tools/v2/share_and_backup_v2.sh` (two-pass x264 at about 0.9 Mb/s, AAC 128 kb/s, 1080p, 30 fps).
