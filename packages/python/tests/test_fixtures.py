"""Byte-for-byte comparison against the golden SVGs rendered by the original Astro components."""

import json
import pathlib
import sys
import unittest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "src"))

from quantum_noise_art import noise_thumb, orbit_field  # noqa: E402

FIXTURES = pathlib.Path(__file__).resolve().parents[3] / "fixtures"
CASES = json.loads((FIXTURES / "cases.json").read_text(encoding="utf-8"))


def render(case):
    props = dict(case["props"])
    if "class" in props:
        props["class_name"] = props.pop("class")
    fn = noise_thumb if case["component"] == "NoiseThumb" else orbit_field
    return fn(**props)


class FixtureTest(unittest.TestCase):
    def test_all_fixtures(self):
        self.assertGreater(len(CASES), 0)
        for case in CASES:
            with self.subTest(case=case["name"]):
                expected = (FIXTURES / f"{case['name']}.svg").read_bytes().decode("utf-8")
                self.assertEqual(render(case), expected)


if __name__ == "__main__":
    unittest.main()
