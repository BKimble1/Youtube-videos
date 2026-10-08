"""Restricted loader for the authors' pickled .npy files (ams_U_reconstruction).

The files are numpy object arrays (pickle). We never call np.load(allow_pickle=True);
instead we unpickle with an allow-list that permits only numpy array/dtype
reconstruction (verified with pickletools: the only globals referenced are
numpy.core.multiarray._reconstruct, numpy.ndarray, numpy.dtype).
"""
import io
import pickle
import numpy as np

_ALLOWED = {
    ("numpy.core.multiarray", "_reconstruct"),
    ("numpy._core.multiarray", "_reconstruct"),
    ("numpy", "ndarray"),
    ("numpy", "dtype"),
}


class _Restricted(pickle.Unpickler):
    def find_class(self, module, name):
        if (module, name) in _ALLOWED:
            if name == "_reconstruct":
                from numpy._core import multiarray as ma  # numpy >= 2
                return ma._reconstruct
            return getattr(np, name)
        raise pickle.UnpicklingError(f"blocked global {module}.{name}")


def load_pickled_npy(path):
    with open(path, "rb") as fh:
        raw = fh.read()
    assert raw[:6] == b"\x93NUMPY", "not an npy file"
    major = raw[6]
    if major == 1:
        hl = int.from_bytes(raw[8:10], "little"); start = 10 + hl
    else:
        hl = int.from_bytes(raw[8:12], "little"); start = 12 + hl
    obj = _Restricted(io.BytesIO(raw[start:]), encoding="latin1").load()
    if isinstance(obj, np.ndarray) and obj.dtype == object and obj.shape == ():
        obj = obj.item()
    return obj
