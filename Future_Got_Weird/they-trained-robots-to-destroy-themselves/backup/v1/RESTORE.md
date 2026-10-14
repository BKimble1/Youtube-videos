# Restore the v1 upload master

Git LFS is unavailable for this episode, so the 1080p upload master is stored as 20 MB split parts.

    cat FGW_RobotsDestroy_v1_UPLOAD_1080p.mp4.part_* > FGW_RobotsDestroy_v1_UPLOAD_1080p.mp4
    sha256sum -c SHA256SUMS          # checks the parts
    sha256sum -c JOINED_SHA256SUMS   # checks the joined file (run in the folder that holds it)

The 720p review copy (not for upload) is regenerated from the master:

    ffmpeg -i FGW_RobotsDestroy_v1_UPLOAD_1080p.mp4 -vf scale=1280:720 -c:v libx264 -crf 26 -preset medium -c:a aac -b:a 128k -movflags +faststart FGW_RobotsDestroy_v1_REVIEW_720p_not-for-upload.mp4
