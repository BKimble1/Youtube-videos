#!/usr/bin/env bash
cd /home/user/ut/work
until [ -f final1/s15_dorm_home.mp4 ] && ! pgrep -f "Godot_v4.*shot=s15_dorm_home" >/dev/null && [ ! -d final1/tmp_s15_dorm_home ]; do sleep 15; done
echo "s15 done $(date +%T)"
./render_all.sh 1920 1080 30 /home/user/ut/work/final1 s01_dorm_out s13_officer s03_rim_test s04_freeze s11_surface s05_cart s14_door_catch s06_nod s02_rim_foot
./render_all.sh 1920 1080 60 /home/user/ut/work/final1 s08_leap s12_follow s07_wide
echo "QUEUE DONE $(date +%T)"
