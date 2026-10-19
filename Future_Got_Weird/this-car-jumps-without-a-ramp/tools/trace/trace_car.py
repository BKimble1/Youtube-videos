#!/usr/bin/env python3
"""Trace the illustrated U9 from one frame of BYD's side-profile shot (the same car the match cut starts from).

  python3 tools/trace/trace_car.py [frame_index]       (default 240 = 8.00 s, the whole car in shot)

Steps: GrabCut separates the car from the buildings (seeded by the red paint); the car is split into flat classes
(red paint in three tones, dark carbon, glass); wheels are removed (drawn as clean vector wheels in the app); every
class is vectorised (contours -> simplified -> smooth cubic paths) in millimetres relative to the mid-wheelbase,
y up from the axle line. Output: source/src/car/traced.json (paths + measured wheel geometry).
The result is an illustration derived from the manufacturer's frame, not a documentary image."""
import cv2, json, os, subprocess, sys
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, 'footage/source/Screen.Recording.2026-10-18.012401.mp4')
N = int(sys.argv[1]) if len(sys.argv) > 1 else 240


def frame(n):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', SRC, '-vf', f'select=eq(n\\,{n})', '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-'], capture_output=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(1080, 1920, 3).copy()


def main():
    img = frame(N)
    cv2.imwrite(os.path.join(ROOT, 'footage/frames/trace_src.png'), img)
    y0, y1 = 102, 960
    roi = img[y0:y1]
    h, w = roi.shape[:2]
    hsv = cv2.cvtColor(roi, cv2.COLOR_BGR2HSV)
    red = ((hsv[..., 0] < 9) | (hsv[..., 0] > 168)) & (hsv[..., 1] > 110) & (hsv[..., 2] > 45)
    red = cv2.morphologyEx(red.astype(np.uint8), cv2.MORPH_CLOSE, np.ones((15, 15), np.uint8))
    mask = np.full((h, w), cv2.GC_PR_BGD, np.uint8)
    mask[:190] = cv2.GC_BGD
    mask[red > 0] = cv2.GC_FGD
    mask[(cv2.dilate(red, np.ones((41, 41), np.uint8)) > 0) & (red == 0)] = cv2.GC_PR_FGD
    mask[h - 60:] = cv2.GC_PR_FGD
    bg = np.zeros((1, 65)); fg = np.zeros((1, 65))
    small = cv2.resize(roi, (w // 2, h // 2)); ms = cv2.resize(mask, (w // 2, h // 2), interpolation=cv2.INTER_NEAREST)
    cv2.grabCut(small, ms, None, bg, fg, 6, cv2.GC_INIT_WITH_MASK)
    car = (((ms == cv2.GC_FGD) | (ms == cv2.GC_PR_FGD)).astype(np.uint8)) * 255
    car = cv2.resize(car, (w, h), interpolation=cv2.INTER_LINEAR)
    car = (car > 127).astype(np.uint8) * 255
    car = cv2.morphologyEx(car, cv2.MORPH_OPEN, np.ones((9, 9), np.uint8))
    cv2.imwrite(os.path.join(ROOT, 'footage/frames/trace_car_mask.png'), car)
    print('mask area', int((car > 0).sum()))


if __name__ == '__main__':
    main()
