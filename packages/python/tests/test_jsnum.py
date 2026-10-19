import pathlib
import sys
import unittest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "src"))

from quantum_noise_art import (  # noqa: E402
    DEFAULT_VARIANT, classic_noise_thumb, dot_path, imul, js_number_to_string, js_round, js_to_fixed,
    list_variants, noise_thumb, orbit_field, pad2, register_variant, rng, to_int32, to_uint32,
)


class JsNumberTest(unittest.TestCase):
    def test_number_to_string(self):
        cases = {
            0.0: "0", -0.0: "0", 146.0: "146", 0.1: "0.1", -2.5: "-2.5", 1e21: "1e+21", 1e20: "100000000000000000000",
            1.5e-7: "1.5e-7", 0.000001: "0.000001", 123456789.125: "123456789.125", 0.30000000000000004: "0.30000000000000004",
            float("inf"): "Infinity", float("nan"): "NaN", 1.7976931348623157e308: "1.7976931348623157e+308", 5e-324: "5e-324",
        }
        for value, text in cases.items():
            self.assertEqual(js_number_to_string(value), text, value)

    def test_round_half_up(self):
        self.assertEqual(js_round(2.5), 3)
        self.assertEqual(js_round(-2.5), -2)
        self.assertEqual(js_round(0.49999999999999994), 0)
        self.assertEqual(str(js_round(-0.3)), "-0.0")

    def test_to_fixed(self):
        self.assertEqual(js_to_fixed(0.25, 1), "0.3")  # Python's "%.1f" gives 0.2
        self.assertEqual(js_to_fixed(-0.25, 1), "-0.3")
        self.assertEqual(js_to_fixed(1.005, 2), "1.00")  # binary value is below the tie
        self.assertEqual(js_to_fixed(-0.0, 1), "0.0")
        self.assertEqual(js_to_fixed(-0.04, 1), "-0.0")

    def test_int32(self):
        self.assertEqual(to_uint32(-1), 4294967295)
        self.assertEqual(to_int32(2147483648), -2147483648)
        self.assertEqual(imul(0xFFFFFFFF, 5), -5)
        self.assertEqual(to_uint32(2.9), 2)

    def test_rng_reference_values(self):
        r = rng(1)
        self.assertEqual(r(), 0.6270739405881613)
        self.assertEqual(r(), 0.002735721180215478)

    def test_helpers(self):
        self.assertEqual(dot_path([(1.25, 2.04), (-0.04, 10)]), "M1.3 2h0M0 10h0")
        self.assertEqual(pad2(3), "03")


class ApiTest(unittest.TestCase):
    def test_variants(self):
        self.assertEqual(DEFAULT_VARIANT, "classic")
        self.assertEqual(noise_thumb(1, variant="classic"), noise_thumb(1))
        register_variant("noise_thumb", "test-inverted", lambda **o: classic_noise_thumb(**o).replace("#fafafa", "#000000"))
        self.assertIn("test-inverted", list_variants("noise_thumb"))
        self.assertNotEqual(noise_thumb(1, variant="test-inverted"), noise_thumb(1))
        with self.assertRaises(ValueError):
            register_variant("noise_thumb", "classic", classic_noise_thumb)
        with self.assertRaises(ValueError):
            noise_thumb(1, variant="nope")

    def test_xmlns(self):
        svg = orbit_field(1, xmlns=True)
        self.assertTrue(svg.startswith('<svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true"'))
        self.assertEqual(svg.replace(' xmlns="http://www.w3.org/2000/svg"', ""), orbit_field(1))


if __name__ == "__main__":
    unittest.main()
