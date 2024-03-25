import unittest
import sys
from pathlib import Path

# Add the parent directory to sys.path to make the sibling 'src' directory importable
sys.path.append(str(Path(__file__).parent.parent))

from src.query_curve import query_curve, query_encoded_curve, get_encoded_curve_query_function

class TestQueryCurve(unittest.TestCase):

    def test_query_curve(self):
        curve = [1, 1, 0, 0, 0, 0, 0.5, 0, 0.5, 1, 1, 1]

        self.assertEqual(query_curve(curve, 0), 0)
        self.assertAlmostEqual(query_curve(curve, 0.3), 0.16, places=2)
        self.assertEqual(query_curve(curve, 0.5), 0.5)
        self.assertAlmostEqual(query_curve(curve, 0.6), 0.69, places=2)
        self.assertAlmostEqual(query_curve(curve, 0.8), 0.94, places=2)
        self.assertEqual(query_curve(curve, 1), 1)

    def test_query_encoded_curve(self):
        encoded_scaled_chain = 'fxSK-fxSK-0-0-0-0-KyjA-0-KyjA-fxSK-fxSK-fxSK'

        self.assertEqual(query_encoded_curve(encoded_scaled_chain, 0), 0)
        self.assertAlmostEqual(query_encoded_curve(encoded_scaled_chain, 0.3), 0.16, places=2)
        self.assertEqual(query_encoded_curve(encoded_scaled_chain, 0.5), 0.5)
        self.assertAlmostEqual(query_encoded_curve(encoded_scaled_chain, 0.6), 0.69, places=2)
        self.assertAlmostEqual(query_encoded_curve(encoded_scaled_chain, 0.8), 0.94, places=2)
        self.assertEqual(query_encoded_curve(encoded_scaled_chain, 1), 1)

    def test_query_function_for_stored_encoded_chain(self):
        # Test with one encoded chain
        encoded_scaled_chain = 'fxSK-fxSK-0-0-0-0-KyjA-0-KyjA-fxSK-fxSK-fxSK'
        query_my_curve = get_encoded_curve_query_function(encoded_scaled_chain)

        self.assertEqual(query_my_curve(0), 0)
        self.assertAlmostEqual(query_my_curve(0.3), 0.16, places=2)
        self.assertEqual(query_my_curve(0.5), 0.5)
        self.assertAlmostEqual(query_my_curve(0.6), 0.69, places=2)
        self.assertAlmostEqual(query_my_curve(0.8), 0.94, places=2)
        self.assertEqual(query_my_curve(1), 1)

    def test_query_function_for_stored_encoded_chain_with_different_values(self):
        encoded_scaled_chain2 = 'fxSK-fxSK-0-0-0-0-264W-0-AQ1l-0-CW6H-0-KYiG-0-OgWT-fxSK-VkR1-fxSK-XqVX-fxSK-drNo-fxSK-fxSK-fxSK'
        query_my_curve2 = get_encoded_curve_query_function(encoded_scaled_chain2)

        self.assertEqual(query_my_curve2(0), 0)
        self.assertAlmostEqual(query_my_curve2(0.3), 0.00, places=2)
        self.assertAlmostEqual(query_my_curve2(0.5), 0.37, places=2)
        self.assertAlmostEqual(query_my_curve2(0.7), 0.96, places=2)
        self.assertAlmostEqual(query_my_curve2(0.8), 1, places=6)

    def test_query_function_for_stored_encoded_chain_with_negative_values(self):
        chain1 = '-fxSK--fxSK-0-0-0-0-fxSK-fxSK-0-0-fxSK-fxSK'
        query_my_curve1 = get_encoded_curve_query_function(chain1)

        self.assertEqual(query_my_curve1(0), 0)
        self.assertEqual(query_my_curve1(-1), -1)
        self.assertEqual(query_my_curve1(-0.5), -0.5)

    def test_query_function_for_stored_encoded_chain_with_offset_and_scale(self):
        chain1 = '1Luue-2hppI--21sMy-3NnHc-0-0-fxSK-fxSK-0-0-fxSK-fxSK'
        query_my_curve1 = get_encoded_curve_query_function(chain1)

        self.assertEqual(query_my_curve1(-6), 20)
        self.assertEqual(query_my_curve1(-4), 24)
        self.assertEqual(query_my_curve1(-5), 22)


if __name__ == '__main__':
    unittest.main()
