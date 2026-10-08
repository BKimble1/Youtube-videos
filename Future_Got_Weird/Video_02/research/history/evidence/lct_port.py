# Minimal NumPy port of O'Toole et al. 2018 cnlos_reconstruction.m (LCT, Wiener filter)
# Usage: python3 -I lct_port.py <data.mat> <z_offset_4ps_bins> <isdiffuse 0/1> <out.png> <title>
import sys, time, numpy as np
from scipy.io import loadmat
import scipy.sparse as sp
import matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt

path, z_offset, isdiffuse, out, title = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4], sys.argv[5]
d = loadmat(path); rect = d['rect_data'].astype(np.float64); width = float(d['width'].ravel()[0])
c = 3e8; bin_res = 4e-12; K = 2; snr = 0.8; z_trim = 600
if isdiffuse: snr *= 0.1
N = rect.shape[0]; M = rect.shape[2]; rng = M*c*bin_res
for _ in range(K):
    M //= 2; bin_res *= 2
    rect = rect[:, :, 0::2] + rect[:, :, 1::2]
    z_trim = round(z_trim/2); z_offset = round(z_offset/2)
rect[:, :, :z_trim] = 0

def define_psf(U, V, slope):
    x = np.linspace(-1, 1, 2*U); y = np.linspace(-1, 1, 2*U); z = np.linspace(0, 2, 2*V)
    gz, gy, gx = np.meshgrid(z, y, x, indexing='ij')
    psf = np.abs(((4*slope)**2)*(gx**2 + gy**2) - gz)
    psf = (psf == psf.min(axis=0, keepdims=True)).astype(np.float64)
    psf = psf / psf[:, U-1, U-1].sum()   # MATLAB psf(:,U,U) is 1-based
    psf = psf / np.linalg.norm(psf.ravel())
    return np.roll(psf, shift=(0, U, U), axis=(0, 1, 2))

def resampling_operator(M):
    x = np.arange(1, M**2 + 1)
    cols = np.ceil(np.sqrt(x)).astype(int) - 1
    mtx = sp.csr_matrix((1.0/np.sqrt(x), (x-1, cols)), shape=(M**2, M))
    mtxi = mtx.T.tocsr()
    for _ in range(int(round(np.log2(M)))):
        mtx = 0.5*(mtx[0::2, :] + mtx[1::2, :])
        mtxi = 0.5*(mtxi[:, 0::2] + mtxi[:, 1::2])
    return mtx.tocsr(), mtxi.tocsr()

psf = define_psf(N, M, width/rng)
fpsf = np.fft.fftn(psf)
invpsf = np.conj(fpsf)/(np.abs(fpsf)**2 + 1.0/snr)
mtx, mtxi = resampling_operator(M)
data = np.transpose(rect, (2, 1, 0))           # MATLAB permute [3 2 1]
gz = np.linspace(0, 1, M)[:, None, None]
t0 = time.time()
data = data*(gz**4 if isdiffuse else gz**2)
tdata = np.zeros((2*M, 2*N, 2*N))
# MATLAB data(:,:) is column-major; emulate with Fortran-order reshape
tdata[:M, :N, :N] = (mtx @ data.reshape(M, -1, order='F')).reshape(M, N, N, order='F')
tvol = np.fft.ifftn(np.fft.fftn(tdata)*invpsf)[:M, :N, :N]
vol = (mtxi @ np.real(tvol).reshape(M, -1, order='F')).reshape(M, N, N, order='F')
vol = np.maximum(vol, 0)
dt = time.time() - t0
ind = round(M*2*width/(rng/2))
vol = vol[:, :, ::-1]
vol = vol[z_offset:z_offset+ind]
front = vol.max(axis=0)
side_top = vol.max(axis=1)
fig, ax = plt.subplots(1, 2, figsize=(8, 4))
ax[0].imshow(front, cmap='gray', extent=[-width, width, -width, width]); ax[0].set_title('Front view (max proj.)'); ax[0].set_xlabel('x (m)'); ax[0].set_ylabel('y (m)')
ax[1].imshow(side_top, cmap='gray', aspect='auto'); ax[1].set_title('Top view (z vs x, cropped)')
fig.suptitle(title + f'  [LCT, {N}x{N}x{M}, {dt:.2f}s numpy]', fontsize=9)
fig.tight_layout(); fig.savefig(out, dpi=110)
print(path.split('/')[-1], 'N', N, 'M', M, 'width', width, 'range_m', rng, 'recon_s', round(dt, 2))
