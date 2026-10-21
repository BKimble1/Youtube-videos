#!/usr/bin/env python3
"""V5 phone-size check: overlay an approximate Shorts UI mask (top bar, right action column, bottom title/channel block)
on frames of the V5 final MP4 (one per composition), downscaled to 360x640. Writes qa/v5/phone_ui_sheet.png"""
import os, subprocess, sys
EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MP4 = os.path.join(EP, 'exports/FGW_Hidden_Trigger_V5_Final_1080x1920.mp4')
OUT = os.path.join(EP, 'qa/v5')
times = [float(x) for x in (sys.argv[1:] or ['0.1', '0.3', '0.45', '0.7', '1.2', '2.8', '4.2', '5.6', '7.0', '8.8', '10.6', '12.3', '13.1', '14.4', '15.1', '17.0', '18.95', '19.5', '19.9', '20.85', '21.0', '21.5', '21.8', '24.3'])]
ui = ("drawbox=x=0:y=0:w=1080:h=150:color=white@0.25:t=fill,"
      "drawbox=x=960:y=1000:w=120:h=700:color=white@0.25:t=fill,"
      "drawbox=x=0:y=1640:w=1080:h=280:color=white@0.25:t=fill,"
      "drawbox=x=90:y=240:w=810:h=1080:color=yellow@0.6:t=3,"
      "scale=360:640")
ins, filt = [], []
for i, t in enumerate(times):
    ins += ['-ss', str(t), '-i', MP4]
    filt.append(f"[{i}:v]trim=end_frame=1,{ui},drawtext=text='{t:.1f}s':x=4:y=4:fontsize=16:fontcolor=white:box=1:boxcolor=black@0.6[v{i}]")
n = len(times); cols = 8
lay = '|'.join(f'{(i % cols) * 360}_{(i // cols) * 640}' for i in range(n))
subprocess.run(['ffmpeg', '-v', 'error', '-y', *ins, '-filter_complex', ';'.join(filt) + ';' + ''.join(f'[v{i}]' for i in range(n)) + f'xstack=inputs={n}:layout={lay}[o]', '-map', '[o]', '-frames:v', '1', os.path.join(OUT, 'phone_ui_sheet.png')], check=True)
print('ok')
