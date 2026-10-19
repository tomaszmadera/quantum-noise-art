"""Compare Python output with the TypeScript output hashes from generate.mjs.

Usage: python3 check.py cases.jsonl
"""

import hashlib
import json
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[2] / "packages" / "python" / "src"))

from quantum_noise_art import noise_thumb, orbit_field  # noqa: E402

failures = 0
total = 0
for line in pathlib.Path(sys.argv[1]).read_text(encoding="utf-8").splitlines():
    case = json.loads(line)
    fn = noise_thumb if case["component"] == "NoiseThumb" else orbit_field
    svg = fn(**case["props"])
    total += 1
    if hashlib.sha256(svg.encode("utf-8")).hexdigest() != case["sha256"]:
        failures += 1
        print("MISMATCH", json.dumps(case))
print(f"{total - failures}/{total} cases identical")
sys.exit(1 if failures or total == 0 else 0)
