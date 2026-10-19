#!/usr/bin/env python3
# usage: fastsheet.py SCRATCH out.png SHOT f0 f1 step cols tw [crop x0,y0,x1,y1] [--regen]
# Node renders each film frame of the EF shot to SVG (no Remotion/Chrome per frame), Chrome rasterises them all in ONE page.
import sys, os, subprocess, math, html
import pathlib
S=sys.argv[1]  # scratch dir holding nframes.cjs (README.md); SVG cache and pages go under S/nf
sys.argv=[sys.argv[0]]+sys.argv[2:]
SRC=str(pathlib.Path(__file__).resolve().parents[4]/'source')
args=[a for a in sys.argv[1:] if not a.startswith('--')]
regen='--regen' in sys.argv
out,shot,f0,f1,step,cols,tw=args[:7]; f0,f1,step,cols,tw=int(f0),int(f1),int(step),int(cols),int(tw)
crop=[float(x) for x in (args[7] if len(args)>7 else '0,0,1,1').split(',')]
tag=os.environ.get('TAG','')
svgdir=f'{S}/nf/svg_{shot}{tag}'
os.makedirs(svgdir,exist_ok=True)
frames=[int(x) for x in os.environ['FRAMES'].split(',')] if os.environ.get('FRAMES') else list(range(f0,f1+1,step))
need=[f for f in frames if regen or not os.path.exists(f'{svgdir}/f{f:05d}.svg')]
if need:
    subprocess.run(['node',f'{S}/nframes.cjs',svgdir,shot,','.join(map(str,need)),'0','1'],cwd=SRC,check=True,stdout=subprocess.DEVNULL)
cw=(crop[2]-crop[0]); ch=(crop[3]-crop[1]); th=round(tw*ch*1080/(cw*1920))
sc=tw/(cw*1920)
rows=math.ceil(len(frames)/cols)
tiles=[]
for i,f in enumerate(frames):
    x=(i%cols)*tw; y=(i//cols)*th
    tiles.append(f'<div style="position:absolute;left:{x}px;top:{y}px;width:{tw}px;height:{th}px;overflow:hidden"><img src="file://{svgdir}/f{f:05d}.svg" style="position:absolute;left:{-crop[0]*1920*sc:.1f}px;top:{-crop[1]*1080*sc:.1f}px;width:{1920*sc:.1f}px;height:{1080*sc:.1f}px"><span style="position:absolute;left:4px;top:3px;color:#ff0;font:13px monospace;background:#000a;padding:0 3px">{f/30:.2f}  f{f}</span></div>')
pagef=f'{S}/nf/page_{os.path.basename(out)}.html'
open(pagef,'w').write(f'<html><body style="margin:0;background:#808080;width:{cols*tw}px;height:{rows*th}px;overflow:hidden">{"".join(tiles)}</body></html>')
subprocess.run(['/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell','--no-sandbox','--disable-gpu','--hide-scrollbars','--allow-file-access-from-files',f'--window-size={cols*tw},{rows*th}','--virtual-time-budget=20000',f'--screenshot={out}',f'file://{pagef}'],check=True,capture_output=True)
print(len(frames),'frames ->',out)
