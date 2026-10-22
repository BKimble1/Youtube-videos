#!/usr/bin/env bash
# dl <outfile> <session> <generation> <goog-date> <signature>
B='https://storage.googleapis.com/xi-backend/database/workspace/2cced76e1e2b44e39ff5235842a55cab/content_generation'
Q='X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=xi-backend-prod%40xi-labs.iam.gserviceaccount.com%2F20261022%2Fauto%2Fstorage%2Fgoog4_request'
curl -sS -o "$1" "$B/$2/$3/content.mp3?$Q&X-Goog-Date=$4&X-Goog-Expires=7200&X-Goog-SignedHeaders=host&X-Goog-Signature=$5" && echo "$1 $(ffprobe -v error -show_entries format=duration -of csv=p=0 "$1")"
