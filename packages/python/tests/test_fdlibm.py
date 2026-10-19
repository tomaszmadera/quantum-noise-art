"""The fdlibm ports must agree bit for bit with V8's Math.sin/cos/log/pow.

fixtures/math-vectors.txt was produced by tools/crosscheck/math-vectors.mjs on Node.js.
"""

import math
import pathlib
import struct
import sys
import unittest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "src"))

from quantum_noise_art import fdlibm  # noqa: E402

VECTORS = pathlib.Path(__file__).resolve().parents[3] / "fixtures" / "math-vectors.txt"


def from_hex(h):
    return struct.unpack(">d", bytes.fromhex(h))[0]


class FdlibmTest(unittest.TestCase):
    def test_vectors(self):
        count = 0
        for line in VECTORS.read_text(encoding="utf-8").splitlines():
            name, *args, expected = line.split()
            got = getattr(fdlibm, name)(*map(from_hex, args))
            want = from_hex(expected)
            count += 1
            if math.isnan(want):
                self.assertTrue(math.isnan(got), line)
            else:
                self.assertEqual(struct.pack(">d", got).hex(), expected, line)
        self.assertGreater(count, 1000)


if __name__ == "__main__":
    unittest.main()
